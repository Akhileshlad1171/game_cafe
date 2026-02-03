const sessions = {};
let logs = JSON.parse(localStorage.getItem("levelUpLogs")) || [];

/* ================= LIVE CLOCK ================= */
function updateLiveClock() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const day = now.toLocaleDateString([], { weekday: 'long' });
  const date = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

  document.getElementById("liveClock").innerText =
    `🕒 ${time} | ${day} | ${date}`;
}

setInterval(updateLiveClock, 1000);
updateLiveClock();

/* ================= SESSIONS ================= */

function startSession() {
  const device = deviceEl().value;
  if (sessions[device]) return alert("Session already running!");

  sessions[device] = {
    customer: customerEl().value || "Guest",
    players: playersEl().value || 1,
    amount: amountEl().value || 0,
    remaining: parseInt(timeEl().value) * 60,
    totalSeconds: parseInt(timeEl().value) * 60,
    running: true,
    paid: false,
    startTime: new Date()
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
    <p class="endTime"></p>

    <p>💰 ₹${s.amount}</p>

    <button class="small-btn" onclick="togglePause('${device}')">
      ⏸ Pause / ▶ Resume
    </button>

    <div>
      <button class="small-btn" onclick="extendTime('${device}', 30)">+30m</button>
      <button class="small-btn" onclick="extendTime('${device}', 60)">+1h</button>
      <button class="small-btn" onclick="extendTime('${device}', 120)">+2h</button>
    </div>

    <button class="small-btn" onclick="markPaid('${device}')">💰 Mark Paid</button>
    <button class="small-btn" onclick="endSession('${device}')">❌ End</button>
  `;

  document.getElementById("sessions").appendChild(div);
}

/* ================= HELPERS ================= */

function formatEndTime(secondsRemaining) {
  const end = new Date(Date.now() + secondsRemaining * 1000);
  return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function extendTime(device, minutes) {
  if (!sessions[device]) return;
  sessions[device].remaining += minutes * 60;
  sessions[device].totalSeconds += minutes * 60;
}

function togglePause(device) {
  sessions[device].running = !sessions[device].running;
  document.getElementById(device).classList.toggle("paused");
}

function markPaid(device) {
  sessions[device].paid = true;
  document.getElementById(device).classList.add("paid");
}

/* ================= END SESSION + LOG ================= */

function endSession(device) {
  const s = sessions[device];
  if (!s) return;

  const endTime = new Date();
  const playedMinutes = Math.round((s.totalSeconds - s.remaining) / 60);

  const log = {
    date: endTime.toLocaleDateString(),
    device: device,
    customer: s.customer,
    players: s.players,
    startTime: s.startTime.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    endTime: endTime.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    minutes: playedMinutes,
    amount: s.amount,
    paid: s.paid ? "Yes" : "No"
  };

  logs.push(log);
  localStorage.setItem("levelUpLogs", JSON.stringify(logs));

  delete sessions[device];
  document.getElementById(device).remove();
}

/* ================= TIMER LOOP ================= */

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
        ? `⏳ ${min}m ${sec}s remaining`
        : "⛔ Time Over";

    div.querySelector(".endTime").innerText =
      s.remaining > 0
        ? `⏰ Ends at: ${formatEndTime(s.remaining)}`
        : "";

    if (s.remaining <= 0) {
      div.classList.add("expired");
    }
  }
}, 1000);

/* ================= DAILY LOG ================= */

function showTodayLog() {
  const today = new Date().toLocaleDateString();
  const todayLogs = logs.filter(l => l.date === today);

  let total = 0;
  let html = `
    <h3>📜 Today’s Log</h3>
    <table border="1" cellpadding="5" style="margin:auto;">
      <tr>
        <th>Device</th>
        <th>Customer</th>
        <th>Players</th>
        <th>Start</th>
        <th>End</th>
        <th>Minutes</th>
        <th>Amount</th>
        <th>Paid</th>
      </tr>
  `;

  todayLogs.forEach(l => {
    total += Number(l.amount);
    html += `
      <tr>
        <td>${l.device}</td>
        <td>${l.customer}</td>
        <td>${l.players}</td>
        <td>${l.startTime}</td>
        <td>${l.endTime}</td>
        <td>${l.minutes}</td>
        <td>₹${l.amount}</td>
        <td>${l.paid}</td>
      </tr>
    `;
  });

  html += `
    </table>
    <h4>💰 Total: ₹${total}</h4>
  `;

  document.getElementById("logArea").innerHTML = html;
  document.getElementById("logArea").style.display = "block";
}

function downloadLog() {
  if (logs.length === 0) {
    alert("No logs available");
    return;
  }

  let csv = "Date,Device,Customer,Players,Start,End,Minutes,Amount,Paid\n";

  logs.forEach(l => {
    csv += `${l.date},${l.device},${l.customer},${l.players},${l.startTime},${l.endTime},${l.minutes},${l.amount},${l.paid}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "LevelUpGaming_DailyLog.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/* ================= DOM SHORTCUTS ================= */
const customerEl = () => document.getElementById("customer");
const playersEl = () => document.getElementById("players");
const deviceEl = () => document.getElementById("device");
const timeEl = () => document.getElementById("time");
const amountEl = () => document.getElementById("amount");
