import json
import re
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

# Use gemini-2.5-flash as per spec
MODEL = "gemini-2.5-flash"


# ── JSON extraction ───────────────────────────────────────────────────────────

def extract_json(text: str) -> dict | None:
    """Robustly extract JSON from Gemini response, handling markdown wrappers."""
    if not text:
        return None
    # Direct parse
    try:
        return json.loads(text.strip())
    except Exception:
        pass
    # Markdown code blocks
    for pattern in [r"```json\s*([\s\S]*?)\s*```", r"```\s*([\s\S]*?)\s*```"]:
        m = re.search(pattern, text)
        if m:
            try:
                return json.loads(m.group(1).strip())
            except Exception:
                pass
    # Raw JSON object extraction
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except Exception:
            pass
    return None


async def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    model = genai.GenerativeModel(
        model_name=MODEL,
        system_instruction=system_prompt,
    )
    response = model.generate_content(user_prompt)
    return response.text


async def call_gemini_json(
    system_prompt: str,
    user_prompt: str,
    max_retries: int = 3,
) -> dict:
    """Call Gemini and retry until valid JSON is returned."""
    prompt = user_prompt
    for attempt in range(max_retries):
        try:
            text = await _call_gemini(system_prompt, prompt)
            result = extract_json(text)
            if result is not None:
                return result
        except Exception as e:
            if attempt == max_retries - 1:
                raise
        # Strengthen JSON instruction on retry
        prompt = (
            user_prompt
            + "\n\nCRITICAL: Your previous response was not valid JSON. "
            "Return ONLY a raw JSON object. No markdown. No explanation. No code blocks. "
            "Start your response with { and end with }."
        )
    raise ValueError(f"Gemini failed to return valid JSON after {max_retries} retries")


# ── Profile maker ─────────────────────────────────────────────────────────────

PROFILE_SCHEMA_REMINDER = """
The profile JSON must have EXACTLY this structure:
{
  "name": "string",
  "resume_text": "string",
  "portfolio_text": "string",
  "skills": ["string"],
  "projects": ["string"],
  "experience": [{"role": "string", "duration": "string"}],
  "education": ["string"],
  "ai_remark": "string",
  "strengths": ["string"],
  "weaknesses": ["string"]
}
Return ONLY the JSON object. No markdown. No explanation.
"""

NEW_USER_SYSTEM = (
    "You are a professional profile builder for a mock interview platform. "
    "Given resume and/or portfolio text, extract information and create a structured JSON profile. "
    "Be thorough in extracting skills, projects, experience, and education. "
    "Write a genuine, insightful ai_remark (2-3 sentences) assessing the candidate professionally. "
    "List real strengths and honest weaknesses based on what you see. "
    + PROFILE_SCHEMA_REMINDER
)

RETURNING_USER_SYSTEM = (
    "You are a professional profile updater for a mock interview platform. "
    "Given an existing profile JSON and new resume/portfolio text, intelligently merge them. "
    "Preserve valid existing data unless contradicted. Add new information. "
    "Update ai_remark, strengths, and weaknesses to reflect the most current state. "
    + PROFILE_SCHEMA_REMINDER
)

MANUAL_PROFILE_SYSTEM = (
    "You are a professional profile builder. Given basic user-provided info, "
    "create a complete profile JSON. Fill all fields as best you can from the given data. "
    "Leave resume_text and portfolio_text as empty strings. "
    "Write a genuine ai_remark based on the provided info. "
    + PROFILE_SCHEMA_REMINDER
)

AI_EDIT_SYSTEM = (
    "You are a profile editor for a mock interview platform. "
    "Given a current profile JSON and a user's change request, apply the requested changes and return the updated profile. "
    "Preserve all other fields exactly. Only modify what was requested. "
    + PROFILE_SCHEMA_REMINDER
)


async def make_profile_new(resume_text: str, portfolio_text: str) -> dict:
    prompt = f"Resume text:\n{resume_text}\n\nPortfolio text:\n{portfolio_text or 'N/A'}"
    return await call_gemini_json(NEW_USER_SYSTEM, prompt)


async def make_profile_returning(old_profile: dict, resume_text: str, portfolio_text: str) -> dict:
    prompt = (
        f"Existing profile:\n{json.dumps(old_profile, indent=2)}\n\n"
        f"New resume text:\n{resume_text}\n\n"
        f"New portfolio text:\n{portfolio_text or 'N/A'}"
    )
    return await call_gemini_json(RETURNING_USER_SYSTEM, prompt)


async def make_profile_manual(name: str, roles: list, experience: str, skills: list) -> dict:
    prompt = (
        f"Name: {name}\n"
        f"Target roles: {', '.join(roles)}\n"
        f"Experience level: {experience}\n"
        f"Skills: {', '.join(skills)}"
    )
    return await call_gemini_json(MANUAL_PROFILE_SYSTEM, prompt)


async def edit_profile_ai(current_profile: dict, change_request: str) -> dict:
    prompt = (
        f"Current profile:\n{json.dumps(current_profile, indent=2)}\n\n"
        f"Change request: {change_request}"
    )
    return await call_gemini_json(AI_EDIT_SYSTEM, prompt)


# ── Interview ─────────────────────────────────────────────────────────────────

INTERVIEW_OUTPUT_SCHEMA = """
Return ONLY this JSON structure:
{
  "question": "your next question or closing statement",
  "feedback": "feedback on the candidate's answer (empty string for the opening question)",
  "new_notes": ["brief key observation about this exchange"],
  "interview_ended": false
}
Set interview_ended to true only when the interview is naturally complete.
Return ONLY the JSON. No markdown. No explanation.
"""

DIFFICULTY_CONFIGS = {
    "easy": {
        "persona": (
            "You are a warm, supportive, and encouraging mock interviewer. "
            "You guide candidates with hints when they struggle. "
            "You give positive, constructive feedback after each answer. "
            "Keep the tone friendly and reassuring. "
            "End the interview after 5–7 exchanges."
        )
    },
    "medium": {
        "persona": (
            "You are a professional, balanced mock interviewer. "
            "You ask challenging but fair questions. You occasionally offer gentle guidance. "
            "You give honest, measured feedback. Maintain professional standards. "
            "End the interview after 7–9 exchanges."
        )
    },
    "hard": {
        "persona": (
            "You are a strict, demanding, no-nonsense mock interviewer. "
            "You ask tough, probing questions and challenge vague or weak answers. "
            "You give no hints. You hold high standards. "
            "If an answer is incomplete, follow up aggressively. "
            "End the interview after 9–12 exchanges or if performance is clearly inadequate."
        )
    },
}


def build_interview_system_prompt(config: dict) -> str:
    difficulty = config.get("difficulty", "medium")
    persona = DIFFICULTY_CONFIGS.get(difficulty, DIFFICULTY_CONFIGS["medium"])["persona"]

    return (
        f"{persona}\n\n"
        f"Role: {config.get('role', 'Software Engineer')}\n"
        f"Company: {config.get('company', 'Not specified')}\n"
        f"Salary: {config.get('salary', 'not specified')}\n"
        f"Experience required: {config.get('experience', 'not specified')} years\n"
        f"Location: {config.get('location', 'not specified')}\n"
        f"Found via: {config.get('source', 'not specified')}\n"
        f"Round type: {config.get('round_type', 'technical rounds')}\n\n"
        "CRITICAL: Evaluate candidates primarily on their ANSWERS and RESPONSES during the interview. "
        "Do NOT award high scores based on resume alone. The candidate should be graded on:\n"
        "1. Quality of their answers to your questions (PRIMARY)\n"
        "2. Depth of technical knowledge demonstrated through discussion\n"
        "3. Communication clarity and problem-solving approach\n"
        "4. Their resume/background should only inform context, not inflate scores\n\n"
        "You have the candidate's profile and accumulated interview notes. "
        "Ask relevant, personalised questions based on the candidate's background. "
        "DO NOT send full resume — use only the provided profile summary and notes.\n\n"
        + INTERVIEW_OUTPUT_SCHEMA
    )


async def interview_turn(
    config: dict,
    profile_summary: dict,
    notes: list,
    user_answer: str,
    code_content: str = "",
    scratch_content: str = "",
) -> dict:
    system_prompt = build_interview_system_prompt(config)

    profile_snippet = {
        "name": profile_summary.get("name"),
        "skills": profile_summary.get("skills", []),
        "experience": profile_summary.get("experience", []),
        "strengths": profile_summary.get("strengths", []),
        "weaknesses": profile_summary.get("weaknesses", []),
        "ai_remark": profile_summary.get("ai_remark", ""),
    }

    parts = [
        f"CANDIDATE PROFILE SUMMARY:\n{json.dumps(profile_snippet, indent=2)}",
        f"\nACCUMULATED INTERVIEW NOTES:\n{json.dumps(notes, indent=2)}",
        f"\nCANDIDATE ANSWER:\n{user_answer or '(no answer provided)'}",
    ]
    if code_content:
        parts.append(f"\nCANDIDATE CODE SUBMISSION:\n{code_content}")
    if scratch_content:
        parts.append(f"\nCANDIDATE SCRATCH PAD:\n{scratch_content}")

    result = await call_gemini_json(system_prompt, "\n".join(parts))

    # Validate required keys
    for key in ["question", "feedback", "new_notes", "interview_ended"]:
        if key not in result:
            result.setdefault("question", "Could you tell me more about your experience?")
            result.setdefault("feedback", "")
            result.setdefault("new_notes", [])
            result.setdefault("interview_ended", False)
            break

    return result


# ── Evaluation ────────────────────────────────────────────────────────────────

EVAL_SYSTEM = (
    "You are an expert interview evaluator for a mock interview platform. "
    "Given the interview notes, candidate profile, and interview configuration, provide a comprehensive evaluation.\n\n"
    "CRITICAL GRADING CRITERIA:\n"
    "1. PRIMARY: Evaluate based on the candidate's ANSWERS and RESPONSES during the interview\n"
    "2. SECONDARY: Use resume/profile background only as context, not to inflate scores\n"
    "3. A good resume does NOT guarantee a high score if interview performance is weak\n"
    "4. Questions answered poorly even with a strong resume = lower score\n"
    "5. Strong answers despite modest resume = higher score\n\n"
    "Tasks:\n"
    "1. Update the candidate's profile: update strengths, weaknesses, and ai_remark based PRIMARILY on interview performance.\n"
    "2. Preserve existing valid profile data unless directly contradicted by the interview.\n"
    "3. Generate a growth_score (0–1000): "
    "1–100 = needs significant work, 100–300 = early stage, 300–500 = developing, "
    "500–700 = decently hirable, 700–900 = strong candidate, 900–1000 = elite. "
    "Score should reflect interview performance (answers, clarity, technical depth), NOT resume quality alone.\n"
    "4. Generate job_likelihood (0–100): realistic % chance for this specific role based PRIMARILY on interview performance.\n"
    "5. Generate confidence_score (0–100): how confident the evaluator is in the assessment (70-100 = very confident, 40-70 = somewhat confident, <40 = not confident).\n"
    "6. Write a summary (2–3 sentence paragraph) of overall interview performance.\n\n"
    "Return ONLY this JSON structure:\n"
    "{\n"
    '  "updated_profile": { ...full profile.json structure... },\n'
    '  "growth_score": number,\n'
    '  "job_likelihood": number,\n'
    '  "confidence_score": number,\n'
    '  "summary": "string"\n'
    "}\n"
    "Return ONLY the JSON. No markdown. No explanation."
)


async def evaluate_interview(
    profile: dict,
    notes: list,
    config: dict,
) -> dict:
    prompt = (
        f"CANDIDATE PROFILE:\n{json.dumps(profile, indent=2)}\n\n"
        f"INTERVIEW NOTES:\n{json.dumps(notes, indent=2)}\n\n"
        f"INTERVIEW CONFIG:\n{json.dumps(config, indent=2)}"
    )
    result = await call_gemini_json(EVAL_SYSTEM, prompt)

    # Validate output
    for key in ["updated_profile", "growth_score", "job_likelihood", "summary"]:
        if key not in result:
            raise ValueError(f"Evaluation result missing key: {key}")

    return result


# ── Detailed Evaluation (for enhanced results screen) ──────────────────────────

DETAILED_EVAL_SYSTEM = (
    "You are an expert career coach and interview analyst for a mock interview platform. "
    "Given the interview notes, candidate profile, and interview configuration, provide a DETAILED "
    "analysis that will help the candidate improve.\n\n"
    "Provide a JSON object with the following comprehensive breakdown:\n"
    "1. score_breakdown: Analysis of how the final score was calculated (e.g., 'Technical Q&A: 65/100 (strong concepts, but struggled with edge cases); Communication: 75/100 (clear but occasionally vague); Problem-solving: 60/100 (good approach but slow execution)')\n"
    "2. confidence_analysis: Detailed explanation of the evaluator's confidence in the assessment (e.g., 'Strong confidence due to consistent performance across multiple rounds and clear technical depth demonstrated')\n"
    "3. confidence_tips: Specific, actionable tips to improve confidence in future interviews (list of 3-4 targeted tips)\n"
    "4. top_strengths: List of 3-5 key strengths demonstrated during the interview\n"
    "5. critical_gaps: List of 3-5 areas that need immediate improvement based on interview performance\n"
    "6. improvement_plan: A structured, actionable 30-day improvement plan tailored to the role and gaps identified\n"
    "7. next_suggested_plan: What the candidate should do next (e.g., 'Practice system design interviews focusing on scalability', 'Build a project using Technology X', etc.)\n\n"
    "Return ONLY this JSON structure:\n"
    "{\n"
    '  "score_breakdown": "string",\n'
    '  "confidence_analysis": "string",\n'
    '  "confidence_tips": ["string", "string", "string"],\n'
    '  "top_strengths": ["string", "string", "string"],\n'
    '  "critical_gaps": ["string", "string", "string"],\n'
    '  "improvement_plan": "string",\n'
    '  "next_suggested_plan": "string"\n'
    "}\n"
    "Return ONLY the JSON. No markdown. No explanation."
)


async def get_detailed_evaluation(
    profile: dict,
    notes: list,
    config: dict,
    growth_score: int,
) -> dict:
    """Generate detailed evaluation analysis for results screen."""
    prompt = (
        f"CANDIDATE PROFILE:\n{json.dumps(profile, indent=2)}\n\n"
        f"INTERVIEW NOTES:\n{json.dumps(notes, indent=2)}\n\n"
        f"INTERVIEW CONFIG:\n{json.dumps(config, indent=2)}\n\n"
        f"GROWTH SCORE: {growth_score}/1000\n\n"
        "Generate a comprehensive, detailed analysis to help this candidate improve their interview skills."
    )
    result = await call_gemini_json(DETAILED_EVAL_SYSTEM, prompt)

    # Validate output
    required_keys = [
        "score_breakdown",
        "confidence_analysis",
        "confidence_tips",
        "top_strengths",
        "critical_gaps",
        "improvement_plan",
        "next_suggested_plan",
    ]
    for key in required_keys:
        if key not in result:
            result.setdefault(key, [] if key in ["confidence_tips", "top_strengths", "critical_gaps"] else "")

    return result
