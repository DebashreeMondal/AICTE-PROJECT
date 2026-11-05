# Fitness Buddy 🏋️ — AI Health & Fitness Coach

An AI-powered conversational fitness coach built with **Python (Flask)** and **IBM watsonx.ai (Granite model)**.

---

## Features

| Capability | Details |
|---|---|
| 🏋️ Home Workouts | Personalized routines based on fitness level & goals |
| 🥗 Nutrition Tips | Simple, healthy meal ideas and macros guidance |
| 💪 Motivation | Daily inspiration and habit-building advice |
| 📅 Habit Tracking | Consistency tips and 7-day challenges |
| 🤖 IBM Granite AI | Powered by `ibm/granite-13b-chat-v2` via watsonx.ai |

---

## Tech Stack

- **Backend**: Python 3.10+, Flask 3.x
- **AI**: IBM watsonx.ai — `ibm/granite-13b-chat-v2` (Lite tier, free)
- **Frontend**: Vanilla HTML / CSS / JavaScript (no framework)
- **Cloud**: IBM Cloud Lite (no credit card required)

---

## Project Structure

```
fitness_buddy/
├── app.py                  # Flask backend & IBM Granite integration
├── requirements.txt        # Python dependencies
├── .env                    # 🔑 Your IBM credentials (DO NOT commit)
├── templates/
│   └── index.html          # Chat UI
└── static/
    ├── style.css           # Dark-mode styles
    └── app.js              # Frontend logic
```

---

## Setup Guide

### 1 — Get IBM Cloud Credentials (Free Lite tier)

1. Create a free account at <https://cloud.ibm.com> (no credit card needed).
2. Go to **IBM Cloud → Catalog → AI/Machine Learning → Watson Studio** → create an instance.
3. Open **watsonx.ai** at <https://dataplatform.cloud.ibm.com/> and create a **Project**.
4. Go to **IBM Cloud → Manage → Access (IAM) → API Keys** → create an API key and copy it.
5. From your watsonx.ai project → **Manage** tab → copy the **Project ID**.

### 2 — Configure `.env`

Open `fitness_buddy/.env` and replace the placeholder values:

```env
IBM_API_KEY=your_actual_api_key
IBM_PROJECT_ID=your_actual_project_id
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com   # match your region
IBM_MODEL_ID=ibm/granite-13b-chat-v2
```

### 3 — Install dependencies

```bash
cd fitness_buddy
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 4 — Run the app

```bash
python app.py
```

Open <http://localhost:5000> in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the chat UI |
| `POST` | `/api/chat` | Send a message, receive AI reply |
| `GET` | `/api/health` | Health check + config status |
| `GET` | `/api/suggestions` | Starter prompts for the sidebar |

### POST `/api/chat` — Request body

```json
{
  "message": "Give me a 20-minute beginner workout",
  "history": [
    { "role": "user",      "content": "Hello" },
    { "role": "assistant", "content": "Hi! I'm Fitness Buddy..." }
  ]
}
```

---

## Deployment (optional)

```bash
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

---

## Disclaimer

Fitness Buddy provides general wellness information only. It is **not** a substitute for professional medical advice. Always consult a qualified healthcare provider before starting any new fitness programme.
