from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid as uuid_lib

import database as db
from services.file_extractor import extract_file
from services.gemini_service import make_profile_new, make_profile_returning, make_profile_manual

router = APIRouter(prefix="/api/progress", tags=["progress"])


# ── Check user ─────────────────────────────────────────────────────────────────

@router.get("/check/{user_uuid}")
async def check_user(user_uuid: str):
    """Returns whether user exists and has a profile."""
    exists = db.user_exists(user_uuid)
    profile = db.get_profile(user_uuid) if exists else None
    return {
        "exists": exists,
        "has_profile": profile is not None,
        "is_new": not exists or profile is None,
    }


# ── Upload resume / portfolio ─────────────────────────────────────────────────

@router.post("/upload")
async def upload_files(
    user_uuid: Optional[str] = Form(default=None),
    resume: Optional[UploadFile] = File(default=None),
    portfolio: Optional[UploadFile] = File(default=None),
):
    """
    Accepts:
      - resume.pdf / resume.html
      - portfolio.html / portfolio.pdf
      - both resume + portfolio (any combo of pdf/html)
    """
    if not resume and not portfolio:
        raise HTTPException(status_code=400, detail="At least one file is required")

    resume_text = ""
    portfolio_text = ""

    if resume:
        resume_bytes = await resume.read()
        resume_text = extract_file(resume.filename, resume_bytes)

    if portfolio:
        portfolio_bytes = await portfolio.read()
        portfolio_text = extract_file(portfolio.filename, portfolio_bytes)

    # Generate UUID if new user
    if not user_uuid:
        user_uuid = str(uuid_lib.uuid4())

    db.create_user(user_uuid)
    old_profile = db.get_profile(user_uuid)

    if old_profile:
        profile = await make_profile_returning(old_profile, resume_text, portfolio_text)
    else:
        profile = await make_profile_new(resume_text, portfolio_text)

    # Ensure required fields exist
    profile["resume_text"] = resume_text or profile.get("resume_text", "")
    profile["portfolio_text"] = portfolio_text or profile.get("portfolio_text", "")

    db.save_profile(user_uuid, profile)

    return {"user_uuid": user_uuid, "profile": profile}


# ── Manual profile creation ────────────────────────────────────────────────────

class ManualProfileBody(BaseModel):
    user_uuid: Optional[str] = None
    name: str
    roles: list[str]
    experience: str
    skills: list[str]


@router.post("/manual")
async def create_manual_profile(body: ManualProfileBody):
    user_uuid = body.user_uuid or str(uuid_lib.uuid4())
    db.create_user(user_uuid)

    profile = await make_profile_manual(body.name, body.roles, body.experience, body.skills)

    # Inject manual data to make sure fields are correct
    profile["name"] = body.name
    profile.setdefault("skills", body.skills)
    profile.setdefault("resume_text", "")
    profile.setdefault("portfolio_text", "")

    db.save_profile(user_uuid, profile)
    return {"user_uuid": user_uuid, "profile": profile}
