from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import database as db
from services.gemini_service import edit_profile_ai

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/{user_uuid}")
async def get_profile(user_uuid: str):
    profile = db.get_profile(user_uuid)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"profile": profile}


@router.get("/{user_uuid}/history")
async def get_history(user_uuid: str):
    history = db.get_history(user_uuid)
    return {"history": history}


class AIEditBody(BaseModel):
    message: str


@router.post("/{user_uuid}/edit-ai")
async def ai_edit_profile(user_uuid: str, body: AIEditBody):
    current = db.get_profile(user_uuid)
    if not current:
        raise HTTPException(status_code=404, detail="Profile not found")

    updated = await edit_profile_ai(current, body.message)

    # Preserve non-negotiable fields if Gemini drops them
    updated.setdefault("resume_text", current.get("resume_text", ""))
    updated.setdefault("portfolio_text", current.get("portfolio_text", ""))

    db.save_profile(user_uuid, updated)
    return {"profile": updated}


@router.put("/{user_uuid}")
async def update_profile(user_uuid: str, profile: dict):
    if not db.user_exists(user_uuid):
        raise HTTPException(status_code=404, detail="User not found")
    db.save_profile(user_uuid, profile)
    return {"profile": profile}
