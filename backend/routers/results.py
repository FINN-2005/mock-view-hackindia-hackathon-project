from fastapi import APIRouter, HTTPException

import database as db

router = APIRouter(prefix="/api/results", tags=["results"])


@router.get("/{user_uuid}")
async def get_results(user_uuid: str):
    data = db.get_last_results(user_uuid)
    if not data:
        raise HTTPException(status_code=404, detail="No results found. Complete an interview first.")
    return data
