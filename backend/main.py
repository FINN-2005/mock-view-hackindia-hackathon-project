from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database as db
from routers import progress, profile_router, interview, results, tts

app = FastAPI(title="MockInterview API", version="1.0.0")

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "127.0.0.1:5173", "127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db.init_db()
    print("✅ Database initialised")


app.include_router(progress.router)
app.include_router(profile_router.router)
app.include_router(interview.router)
app.include_router(results.router)
app.include_router(tts.router)


@app.get("/")
def root():
    return {"status": "MockInterview API running"}
