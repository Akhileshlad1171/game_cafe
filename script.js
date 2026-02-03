document.addEventListener("DOMContentLoaded", () => {

/* ================= DOM HELPERS ================= */
const customerEl = () => document.getElementById("customer");
const playersEl  = () => document.getElementById("players");
const deviceEl   = () => document.getElementById("device");
const timeEl     = () => document.getElementById("time");
const amountEl   = () => document.getElementById("amount");

/* ================= UTILS ================= */
function makeSafeId(name) {
  return name.toLowerCase().replace(/\s+/g, "_");
}

const sessions = {};
let logs = JSON.parse(localStorage.getItem("levelUpLogs")) || [];

/* ================= AUTO CLEAR OLD LOGS ================= */
const today = new Date().toLocaleDateString();
logs = logs.filter(l => l.date === today);
localStorage.setItem("levelUpLogs", JSON.stringify(logs));

/* ================= LIVE CLOCK ================= */
function updateLiveClock() {
  const now = new Date();
  document.getElementById("liveClock").innerText =
    `🕒 ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} | 
     ${now.toLocaleDateString([], {weekday:'long'})} | 
     ${now.toLocaleDateString([], {day:'2-digit',month:'short',year:'numeric'})}`;
}
setInterval(updateLiveClock, 1000);
updateLiveClock();

/* ================= START SESSION ================= */

window.startSession = function () {
  const deviceName = deviceEl().value;
  const id = makeSafeId(deviceName);

  if (sessions[id]) {
    alert("Session already running!");
    return;
  }

  sessions[id] = {
    id,
    device: deviceName,
    customer: customerEl().value || "Guest",
    players: Number(playersEl().value) || 1,
    amount: Number(amountEl().value) || 0,
    remaining: Number(timeEl().value) * 60,
    totalSeconds: Number(timeEl().value) * 60,
    running: true,
    paid: false,
    warned: false,
    startTime: new Date()
  };

  renderSession(id);
};

function renderSession(id) {
  const s = sessions[id];

  const div = document.createElement("div");
  div.className = "session";
  div.id = id;

  div.innerHTML = `
    <h3>${s.device}</h3>
    <p>👤 ${s.customer}</p>
    <p>🎮 Players: ${s.players}</p>
    <p class="time"></p>
    <p class="endTime"></p>

    <p class="amount">💰 ₹${s.amount}</p>
    <button class="small-btn" onclick="editAmount('${id}')">✏️ Edit Amount</button>

    <button class="small-btn" onclick="togglePause('${id}')">⏸ Pause / ▶ Resume</button>

    <div>
      <button class="small-btn" onclick="extendTime('${id}',30)">+30m</button>
      <button class="small-btn" onclick="extendTime('${id}',60)">+1h</button>
      <button class="small-btn" onclick="extendTime('${id}',120)">+2h</button>
    </div>

    <button class="small-btn" onclick="markPaid('${id}')">💰 Mark Paid</button>
    <button class="small-btn" onclick="endSession('${id}')">❌ End</button>
  `;

  document.getElementById("sessions").appendChild(div);
}

/* ================= AMOUNT ================= */

window.editAmount = function (id) {
  const s = sessions[id];
  const val = prompt("Enter updated amount ₹", s.amount);
  if (val === null) return;

  const num = Number(val);
  if (isNaN(num) || num < 0) return alert("Invalid amount");

  s.amount = num;
  document.getElementById(id).querySelector(".amount").innerText = `💰 ₹${num}`;
};

window.extendTime = function (id, min) {
  const s = sessions[id];
  s.remaining += min * 60;
  s.totalSeconds += min * 60;

  const extra = prompt(`Add amount for ${min} min`, 0);
  if (extra !== null) {
    const num = Number(extra);
    if (!isNaN(num) && num >= 0) {
      s.amount += num;
      document.getElementById(id).querySelector(".amount").innerText = `💰 ₹${s.amount}`;
    }
  }
};

/* ================= CONTROLS ================= */

window.togglePause = id => {
  sessions[id].running = !sessions[id].running;
  document.getElementById(id).classList.toggle("paused");
};

window.markPaid = id => {
  sessions[id].paid = true;
  document.getElementById(id).classList.add("paid");
};

window.endSession = function (id) {
  const s = sessions[id];
  const end = new Date();

  logs.push({
    date: today,
    device: s.device,
    customer: s.customer,
    players: s.players,
    startTime: s.startTime.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
    endTime: end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
    minutes: Math.round((s.totalSeconds - s.remaining)/60),
    amount: s.amount,
    paid: s.paid ? "Yes" : "No"
  });

  localStorage.setItem("levelUpLogs", JSON.stringify(logs));
  delete sessions[id];
  document.getElementById(id).remove();
};

/* ================= TIMER + WARNING ================= */

setInterval(() => {
  Object.values(sessions).forEach(s => {
    if (!s.running || s.remaining <= 0) return;

    s.remaining--;

    const div = document.getElementById(s.id);
    div.querySelector(".time").innerText =
      `⏳ ${Math.floor(s.remaining/60)}m ${s.remaining%60}s`;

    div.querySelector(".endTime").innerText =
      `⏰ Ends at: ${new Date(Date.now()+s.remaining*1000)
        .toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;

    if (s.remaining <= 300 && !s.warned) {
      s.warned = true;
      div.classList.add("warning");
      alert(`⚠️ ${s.device} has only 5 minutes left`);
    }
  });
}, 1000);

});
