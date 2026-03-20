import io
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from gtts import gTTS

router = APIRouter(prefix="/api/tts", tags=["tts"])

class TTSBody(BaseModel):
    text: str

@router.post("")
async def synthesise(body: TTSBody):
    if not body.text or not body.text.strip():
        return StreamingResponse(io.BytesIO(b""), media_type="audio/mpeg")

    tts = gTTS(text=body.text.strip(), lang="en", tld="co.uk")
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)
    return StreamingResponse(buf, media_type="audio/mpeg")