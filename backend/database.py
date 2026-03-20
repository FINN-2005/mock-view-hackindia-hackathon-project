import sqlite3
import json
from datetime import datetime, timezone

DB_PATH = "mockinterview.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            uuid TEXT PRIMARY KEY,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS profiles (
            user_uuid TEXT PRIMARY KEY,
            profile_json TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_uuid) REFERENCES users(uuid)
        );

        CREATE TABLE IF NOT EXISTS interview_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_uuid TEXT NOT NULL,
            role TEXT,
            difficulty TEXT,
            config_json TEXT,
            growth_score INTEGER DEFAULT 0,
            notes_json TEXT,
            date TEXT,
            summary TEXT,
            job_likelihood INTEGER DEFAULT 0,
            FOREIGN KEY (user_uuid) REFERENCES users(uuid)
        );

        CREATE TABLE IF NOT EXISTS interview_states (
            user_uuid TEXT PRIMARY KEY,
            state_json TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            updated_at TEXT NOT NULL,
            last_config_json TEXT,
            last_results_json TEXT,
            FOREIGN KEY (user_uuid) REFERENCES users(uuid)
        );
    """)

    conn.commit()
    conn.close()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── users ─────────────────────────────────────────────────────────────────────

def user_exists(uuid: str) -> bool:
    conn = get_conn()
    row = conn.execute("SELECT 1 FROM users WHERE uuid=?", (uuid,)).fetchone()
    conn.close()
    return row is not None


def create_user(uuid: str):
    conn = get_conn()
    conn.execute("INSERT OR IGNORE INTO users (uuid, created_at) VALUES (?,?)", (uuid, now_iso()))
    conn.commit()
    conn.close()


# ── profiles ──────────────────────────────────────────────────────────────────

def get_profile(user_uuid: str) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT profile_json FROM profiles WHERE user_uuid=?", (user_uuid,)).fetchone()
    conn.close()
    return json.loads(row["profile_json"]) if row else None


def save_profile(user_uuid: str, profile: dict):
    conn = get_conn()
    conn.execute(
        "INSERT OR REPLACE INTO profiles (user_uuid, profile_json, updated_at) VALUES (?,?,?)",
        (user_uuid, json.dumps(profile), now_iso()),
    )
    conn.commit()
    conn.close()


# ── interview history ─────────────────────────────────────────────────────────

def get_history(user_uuid: str) -> list:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM interview_history WHERE user_uuid=? ORDER BY id DESC",
        (user_uuid,),
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "role": r["role"],
            "difficulty": r["difficulty"],
            "config": json.loads(r["config_json"]) if r["config_json"] else {},
            "growth_score": r["growth_score"],
            "notes": json.loads(r["notes_json"]) if r["notes_json"] else [],
            "date": r["date"],
            "summary": r["summary"],
            "job_likelihood": r["job_likelihood"],
        })
    return result


def append_history(user_uuid: str, entry: dict):
    conn = get_conn()
    conn.execute(
        """INSERT INTO interview_history
           (user_uuid, role, difficulty, config_json, growth_score, notes_json, date, summary, job_likelihood)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (
            user_uuid,
            entry.get("role"),
            entry.get("difficulty"),
            json.dumps(entry.get("config", {})),
            entry.get("growth_score", 0),
            json.dumps(entry.get("notes", [])),
            entry.get("date", now_iso()),
            entry.get("summary", ""),
            entry.get("job_likelihood", 0),
        ),
    )
    conn.commit()
    conn.close()


# ── interview states ──────────────────────────────────────────────────────────

def get_state(user_uuid: str) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT state_json FROM interview_states WHERE user_uuid=?", (user_uuid,)).fetchone()
    conn.close()
    return json.loads(row["state_json"]) if row else None


def save_state(user_uuid: str, state: dict):
    conn = get_conn()
    conn.execute(
        """INSERT OR REPLACE INTO interview_states
           (user_uuid, state_json, active, updated_at)
           VALUES (?,?,?,?)""",
        (user_uuid, json.dumps(state), 1 if state.get("active") else 0, now_iso()),
    )
    conn.commit()
    conn.close()


def clear_state(user_uuid: str):
    conn = get_conn()
    conn.execute("DELETE FROM interview_states WHERE user_uuid=?", (user_uuid,))
    conn.commit()
    conn.close()


def save_last_results(user_uuid: str, results: dict, config: dict):
    conn = get_conn()
    conn.execute(
        """INSERT OR REPLACE INTO interview_states
           (user_uuid, state_json, active, updated_at, last_config_json, last_results_json)
           VALUES (?,?,0,?,?,?)""",
        (
            user_uuid,
            json.dumps({"active": False}),
            now_iso(),
            json.dumps(config),
            json.dumps(results),
        ),
    )
    conn.commit()
    conn.close()


def get_last_results(user_uuid: str) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        "SELECT last_results_json, last_config_json FROM interview_states WHERE user_uuid=?",
        (user_uuid,),
    ).fetchone()
    conn.close()
    if row and row["last_results_json"]:
        return {
            "results": json.loads(row["last_results_json"]),
            "config": json.loads(row["last_config_json"]) if row["last_config_json"] else {},
        }
    return None
