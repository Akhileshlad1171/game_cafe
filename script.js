const sessions = {};

function startSession() {
  const device = deviceEl().value;
  if (sessions[device]) return alert("Session already running!");

  sessions[device] = {
    customer: customerEl().value || "Guest",
    players: playersEl().value || 1,
    amount: amountEl().value || 0,
    remaining: parseInt(timeEl().value) * 60,
    running: true,
    paid: false
  };

  renderSession(device);
}

function renderSession(device) {
  const s = sessions[device];

  const div = document.createElement("div");
  div.className = "session";
  div.id = device;

  div.innerHTML = `
    <h3>${device}</h3>
    <p>👤 ${s.customer}</p>
    <p>🎮 Players: ${s.players}</p>
    <p class="time"></p>
    <p>💰 ₹${s.amount}</p>

    <button class="small-btn" onclick="togglePause('${device}')">
      ⏸ Pause / ▶ Resume
    </button>

    <div>
      <button class="small-btn" onclick="extendTime('${device}', 30)">+30m</button>
      <button class="small-btn" onclick="extendTime('${device}', 60)">+1h</button>
      <button class="small-btn" onclick="extendTime('${device}', 120)">+2h</button>
    </div>

    <button class="small-btn" onclick="markPaid('${device}')">
      💰 Mark Paid
    </button>

    <button class="small-btn" onclick="endSession('${device}')">
      ❌ End
    </button>
  `;

  document.getElementById("sessions").appendChild(div);
}

/* 🔥 NEW FUNCTION */
function extendTime(device, minutes) {
  if (!sessions[device]) return;
  sessions[device].remaining += minutes * 60;
}

function togglePause(device) {
  sessions[device].running = !sessions[device].running;
  document.getElementById(device).classList.toggle("paused");
}

function markPaid(device) {
  sessions[device].paid = true;
  document.getElementById(device).classList.add("paid");
}

function endSession(device) {
  delete sessions[device];
  document.getElementById(device).remove();
}

setInterval(() => {
  for (let device in sessions) {
    const s = sessions[device];
    const div = document.getElementById(device);

    if (s.running && s.remaining > 0) {
      s.remaining--;
    }

    const min = Math.floor(s.remaining / 60);
    const sec = s.remaining % 60;

    div.querySelector(".time").innerText =
      s.remaining > 0
        ? `⏳ ${min}m ${sec}s`
        : "⛔ Time Over";

    if (s.remaining <= 0) {
      div.classList.add("expired");
    }
  }
}, 1000);

/* helpers */
const customerEl = () => document.getElementById("customer");
const playersEl = () => document.getElementById("players");
const deviceEl = () => document.getElementById("device");
const timeEl = () => document.getElementById("time");
const amountEl = () => document.getElementById("amount");
