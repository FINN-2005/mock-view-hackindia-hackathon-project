from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio

import database as db
from services.gemini_service import interview_turn, evaluate_interview
from database import now_iso

router = APIRouter(prefix="/api/interview", tags=["interview"])

# In-memory state cache (keyed by user_uuid) for fast access
_state_cache: dict[str, dict] = {}

# Lock per user to prevent simultaneous /next-turn calls
_locks: dict[str, asyncio.Lock] = {}


def _get_lock(user_uuid: str) -> asyncio.Lock:
    if user_uuid not in _locks:
        _locks[user_uuid] = asyncio.Lock()
    return _locks[user_uuid]


# ── Start Interview ───────────────────────────────────────────────────────────

class StartBody(BaseModel):
    user_uuid: str
    interview_config: dict


@router.post("/start")
async def start_interview(body: StartBody):
    profile = db.get_profile(body.user_uuid)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Complete the progress page first.")

    config = body.interview_config

    # Initialize state
    state = {
        "config": config,
        "conversation": [],
        "notes": [],
        "active": True,
    }

    # First Gemini call
    result = await interview_turn(
        config=config,
        profile_summary=profile,
        notes=[],
        user_answer="start interview",
    )

    state["notes"] = result.get("new_notes", [])

    # Persist state
    _state_cache[body.user_uuid] = state
    db.save_state(body.user_uuid, state)

    return {
        "question": result["question"],
        "feedback": result.get("feedback", ""),
        "interview_ended": False,
    }


# ── Next Turn ─────────────────────────────────────────────────────────────────

class NextTurnBody(BaseModel):
    user_uuid: str
    answer: str
    code_editor_content: Optional[str] = ""
    scratch_pad_content: Optional[str] = ""


@router.post("/next-turn")
async def next_turn(body: NextTurnBody):
    lock = _get_lock(body.user_uuid)
    if lock.locked():
        raise HTTPException(status_code=429, detail="Previous turn still processing")

    async with lock:
        # Fetch state
        state = _state_cache.get(body.user_uuid) or db.get_state(body.user_uuid)
        if not state:
            raise HTTPException(status_code=404, detail="No active interview found")
        if not state.get("active"):
            raise HTTPException(status_code=400, detail="Interview is not active")

        profile = db.get_profile(body.user_uuid)
        config = state["config"]

        result = await interview_turn(
            config=config,
            profile_summary=profile,
            notes=state["notes"],
            user_answer=body.answer,
            code_content=body.code_editor_content or "",
            scratch_content=body.scratch_pad_content or "",
        )

        # Update state
        state["conversation"].append({
            "question": result["question"],
            "answer": body.answer,
            "feedback": result.get("feedback", ""),
        })
        state["notes"] = state["notes"] + result.get("new_notes", [])

        interview_ended = result.get("interview_ended", False)
        if interview_ended:
            state["active"] = False

        _state_cache[body.user_uuid] = state
        db.save_state(body.user_uuid, state)

        return {
            "question": result["question"],
            "feedback": result.get("feedback", ""),
            "interview_ended": interview_ended,
        }


# ── End Interview ─────────────────────────────────────────────────────────────

class EndBody(BaseModel):
    user_uuid: str


@router.post("/end")
async def end_interview(body: EndBody):
    state = _state_cache.get(body.user_uuid) or db.get_state(body.user_uuid)
    if not state:
        raise HTTPException(status_code=404, detail="No interview state found")

    state["active"] = False
    config = state.get("config", {})
    notes = state.get("notes", [])

    profile = db.get_profile(body.user_uuid)

    # Run evaluation
    try:
        eval_result = await evaluate_interview(profile, notes, config)
    except Exception as e:
        eval_result = {
            "updated_profile": profile,
            "growth_score": 0,
            "job_likelihood": 0,
            "summary": "Evaluation could not be completed.",
        }

    # Overwrite profile
    db.save_profile(body.user_uuid, eval_result["updated_profile"])

    # Append to history
    history_entry = {
        "role": config.get("role", "Unknown"),
        "difficulty": config.get("difficulty", "medium"),
        "config": config,
        "growth_score": eval_result["growth_score"],
        "notes": notes,
        "date": now_iso(),
        "summary": eval_result["summary"],
        "job_likelihood": eval_result["job_likelihood"],
    }
    db.append_history(body.user_uuid, history_entry)

    results_payload = {
        "growth_score": eval_result["growth_score"],
        "job_likelihood": eval_result["job_likelihood"],
        "summary": eval_result["summary"],
        "notes": notes,
    }

    # Store last results for the results page
    db.save_last_results(body.user_uuid, results_payload, config)

    # Clear in-memory state
    _state_cache.pop(body.user_uuid, None)

    return {"success": True, "results": results_payload}
