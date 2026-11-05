"""
Fitness Buddy – Flask backend
Uses IBM watsonx.ai (Granite model) as the AI engine.
"""

import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("FLASK_SECRET_KEY", "fitness-buddy-dev-key")
CORS(app)

# ── IBM watsonx.ai setup ──────────────────────────────────────────────────────
_IBM_API_KEY    = os.getenv("IBM_API_KEY")
_IBM_PROJECT_ID = os.getenv("IBM_PROJECT_ID")
_IBM_URL        = os.getenv("IBM_WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
_MODEL_ID       = os.getenv("IBM_MODEL_ID", "ibm/granite-4-h-small")

def _get_model() -> ModelInference:
    credentials = Credentials(url=_IBM_URL, api_key=_IBM_API_KEY)
    params = {
        GenParams.MAX_NEW_TOKENS: 600,
        GenParams.MIN_NEW_TOKENS: 20,
        GenParams.TEMPERATURE:    0.7,
        GenParams.TOP_P:          0.9,
        GenParams.REPETITION_PENALTY: 1.1,
        GenParams.STOP_SEQUENCES: ["User:", "\n\nUser"],
    }
    return ModelInference(
        model_id=_MODEL_ID,
        params=params,
        credentials=credentials,
        project_id=_IBM_PROJECT_ID,
    )


# ── System persona ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Fitness Buddy, a friendly, encouraging, and knowledgeable AI health and fitness coach.
Your role is to:
- Recommend safe home workouts and exercise routines tailored to the user's fitness level and goals.
- Provide motivational tips and daily fitness inspiration to keep users consistent.
- Suggest simple, nutritious, and affordable meal ideas based on goals (weight loss, muscle gain, endurance).
- Encourage healthy habit-building, hydration, sleep, and stress management.
- Always ask clarifying questions when needed (e.g., fitness level, equipment, dietary restrictions).
- Be warm, positive, and non-judgmental.
- Never diagnose medical conditions; always advise consulting a doctor for medical concerns.
Keep responses concise, practical, and actionable."""


def build_prompt(history: list[dict], user_message: str) -> str:
    """Convert chat history + new message into a single prompt string."""
    prompt = SYSTEM_PROMPT + "\n\n"
    for turn in history[-6:]:          # keep last 6 turns for context window
        role = turn.get("role", "user")
        text = turn.get("content", "")
        if role == "user":
            prompt += f"User: {text}\n"
        else:
            prompt += f"Fitness Buddy: {text}\n"
    prompt += f"User: {user_message}\nFitness Buddy:"
    return prompt


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory("templates", "index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()
    history      = data.get("history") or []

    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400

    if not _IBM_API_KEY or _IBM_API_KEY == "your_ibm_api_key_here":
        return jsonify({
            "error": "IBM API key not configured. Please update your .env file."
        }), 503

    try:
        model  = _get_model()
        prompt = build_prompt(history, user_message)
        result = model.generate_text(prompt=prompt)
        reply  = result.strip() if isinstance(result, str) else result
        return jsonify({"reply": reply})

    except Exception as exc:           # noqa: BLE001
        app.logger.error("watsonx error: %s", exc)
        return jsonify({"error": f"AI service error: {exc}"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    configured = bool(_IBM_API_KEY and _IBM_API_KEY != "your_ibm_api_key_here")
    return jsonify({
        "status":     "ok",
        "configured": configured,
        "model":      _MODEL_ID,
    })


@app.route("/api/suggestions", methods=["GET"])
def suggestions():
    """Return starter prompts shown in the UI."""
    return jsonify([
        "Give me a 20-minute home workout for beginners.",
        "What should I eat before and after a workout?",
        "How do I build a habit of exercising daily?",
        "Suggest a simple high-protein meal plan for weight loss.",
        "I feel unmotivated today. Can you inspire me?",
        "Create a 7-day fitness challenge for me.",
    ])


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port  = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
