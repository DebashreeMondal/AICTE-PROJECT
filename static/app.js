/**
 * Fitness Buddy – frontend logic
 */

const messagesEl  = document.getElementById("messages");
const inputEl     = document.getElementById("user-input");
const sendBtn     = document.getElementById("send-btn");
const clearBtn    = document.getElementById("clear-btn");
const charCount   = document.getElementById("char-count");
const statusDot   = document.getElementById("status-dot");
const statusText  = document.getElementById("status-text");
const chipsList   = document.getElementById("suggestions-list");

let chatHistory = [];   // [{role:"user"|"assistant", content:"..."}]
let isLoading   = false;

// ── Status helpers ───────────────────────────────────────────────────────────
function setStatus(state, label) {
  statusDot.className  = "status-dot " + (state || "");
  statusText.textContent = label;
}

// ── Fetch starter suggestions ────────────────────────────────────────────────
async function loadSuggestions() {
  try {
    const res  = await fetch("/api/suggestions");
    const data = await res.json();
    data.forEach(text => {
      const btn = document.createElement("button");
      btn.className   = "chip";
      btn.textContent = text;
      btn.addEventListener("click", () => sendMessage(text));
      chipsList.appendChild(btn);
    });
  } catch (_) { /* silently skip */ }
}

// ── Health check ─────────────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const res  = await fetch("/api/health");
    const data = await res.json();
    if (data.configured) {
      setStatus("online", "Ready · IBM Granite");
    } else {
      setStatus("error", "API key not configured");
    }
  } catch (_) {
    setStatus("error", "Cannot reach server");
  }
}

// ── Render a message bubble ───────────────────────────────────────────────────
function renderMessage(role, text, isError = false) {
  // Remove welcome card on first real message
  const welcome = messagesEl.querySelector(".welcome-card");
  if (welcome) welcome.remove();

  const wrap   = document.createElement("div");
  wrap.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "U" : "💪";

  const bubble = document.createElement("div");
  bubble.className = "bubble" + (isError ? " error" : "");
  bubble.textContent = text;

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function showTyping() {
  const wrap   = document.createElement("div");
  wrap.className = "message bot";
  wrap.id = "typing-indicator";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "💪";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const dots = document.createElement("div");
  dots.className = "typing-dots";
  dots.innerHTML = "<span></span><span></span><span></span>";
  bubble.appendChild(dots);

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

// ── Core send function ────────────────────────────────────────────────────────
async function sendMessage(text) {
  const msg = (text || inputEl.value).trim();
  if (!msg || isLoading) return;

  // Reset input
  inputEl.value = "";
  charCount.textContent = "0 / 1000";
  autoResize();

  // Render user bubble
  renderMessage("user", msg);

  // Add to history
  chatHistory.push({ role: "user", content: msg });

  // Lock UI
  isLoading = true;
  sendBtn.disabled = true;
  setStatus("online", "Thinking…");
  showTyping();

  try {
    const res  = await fetch("/api/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: msg, history: chatHistory.slice(0, -1) }),
    });
    const data = await res.json();
    hideTyping();

    if (data.error) {
      renderMessage("bot", "⚠️ " + data.error, true);
    } else {
      const reply = data.reply || "(no response)";
      renderMessage("bot", reply);
      chatHistory.push({ role: "assistant", content: reply });
    }
    setStatus("online", "Ready · IBM Granite");

  } catch (err) {
    hideTyping();
    renderMessage("bot", "⚠️ Network error. Please check your connection.", true);
    setStatus("error", "Connection error");
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

// ── Textarea auto-resize ──────────────────────────────────────────────────────
function autoResize() {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + "px";
}

// ── Event listeners ───────────────────────────────────────────────────────────
inputEl.addEventListener("input", () => {
  autoResize();
  charCount.textContent = `${inputEl.value.length} / 1000`;
});

inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", () => sendMessage());

clearBtn.addEventListener("click", () => {
  chatHistory = [];
  messagesEl.innerHTML = "";
  // Re-add welcome card
  const card = `
    <div class="welcome-card">
      <div class="welcome-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#4ade80" stroke-width="2" fill="#4ade8010"/>
          <path d="M14 24 Q17 14 24 14 Q31 14 34 24 Q31 34 24 34 Q17 34 14 24Z" fill="#4ade80" opacity="0.15"/>
          <path d="M17 24 L21 19 L25 25 L29 16" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2>Chat cleared!</h2>
      <p>Start a new conversation whenever you're ready.</p>
    </div>`;
  messagesEl.innerHTML = card;
});

// ── Init ──────────────────────────────────────────────────────────────────────
checkHealth();
loadSuggestions();
inputEl.focus();
