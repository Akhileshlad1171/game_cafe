document.addEventListener("DOMContentLoaded", () => {

/* ================= DOM HELPERS ================= */
function customerEl() { return document.getElementById("customer"); }
function playersEl() { return document.getElementById("players"); }
function deviceEl()  { return document.getElementById("device"); }
function timeEl()    { return document.getElementById("time"); }
function amountEl()  { return document.getElementById("amount"); }

const sessions = {};
let logs = JSON.parse(localStorage.getItem("levelUpLogs")) || [];

/* ================= AUTO CLEAR OLD LOGS ================= */
const todayDate = new Date().toLocaleDateString();
logs = logs.filter(log => log.date === todayDate);
localStorage.setItem("levelUpLogs", JSON.stringify(logs));

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

window.startSession = function () {
  const device = deviceEl().value;
  if (sessions[device]) return alert("Session already running!");

  sessions[device] = {
    customer: customerEl().value || "Guest",
    players: playersEl().value || 1,
    amount: Number(amountEl().value) || 0,
    remaining: parseInt(timeEl().value) * 60,
    totalSeconds: parseInt(timeEl().value) * 60,
    running: true,
    paid: false,
    warned: false, // 🔔 warning flag
    startTime: new Date()
  };

  renderSession(device);
};

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

    <p class="amount">💰 ₹${s.amount}</p>
    <button class="small-btn" onclick="editAmount('${device}')">✏️ Edit Amount</button>

    <button class="small-btn" onclick="togglePause('${device}')">⏸ Pause / ▶ Resume</button>

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

window.editAmount = function (device) {
  const s = sessions[device];
  if (!s) return;

  const input = prompt("Enter updated amount (₹):", s.amount);
  if (input === null) return;

  const value = Number(input);
  if (isNaN(value) || value < 0) {
    alert("Please enter a valid amount");
    return;
  }

  s.amount = value;
  document.querySelector(`#${device} .amount`).innerText = `💰 ₹${s.amount}`;
};

window.extendTime = function (device, minutes) {
  const s = sessions[device];
  if (!s) return;

  s.remaining += minutes * 60;
  s.totalSeconds += minutes * 60;

  const extra = prompt(`Extended by ${minutes} min.\nAdd amount (₹):`, 0);
  if (extra !== null) {
    const val = Number(extra);
    if (!isNaN(val) && val >= 0) {
      s.amount += val;
      document.querySelector(`#${device} .amount`).innerText = `💰 ₹${s.amount}`;
    }
  }
};

window.togglePause = function (device) {
  sessions[device].running = !sessions[device].running;
  document.getElementById(device).classList.toggle("paused");
};

window.markPaid = function (device) {
  sessions[device].paid = true;
  document.getElementById(device).classList.add("paid");
};

window.endSession = function (device) {
  const s = sessions[device];
  const endTime = new Date();

  logs.push({
    date: endTime.toLocaleDateString(),
    device,
    customer: s.customer,
    players: s.players,
    startTime: s.startTime.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    endTime: endTime.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    minutes: Math.round((s.totalSeconds - s.remaining) / 60),
    amount: s.amount,
    paid: s.paid ? "Yes" : "No"
  });

  localStorage.setItem("levelUpLogs", JSON.stringify(logs));
  delete sessions[device];
  document.getElementById(device).remove();
};

/* ================= TIMER + WARNING ================= */

setInterval(() => {
  for (let d in sessions) {
    const s = sessions[d];
    const div = document.getElementById(d);

    if (s.running && s.remaining > 0) s.remaining--;

    const min = Math.floor(s.remaining / 60);
    const sec = s.remaining % 60;

    div.querySelector(".time").innerText =
      s.remaining > 0 ? `⏳ ${min}m ${sec}s` : "⛔ Time Over";

    div.querySelector(".endTime").innerText =
      s.remaining > 0
        ? `⏰ Ends at: ${new Date(Date.now()+s.remaining*1000)
            .toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`
        : "";

    // 🔔 5 MIN WARNING
    if (s.remaining <= 300 && s.remaining > 0 && !s.warned) {
      s.warned = true;
      div.classList.add("warning");
      alert(`⚠️ ${d} has only 5 minutes left`);
    }
  }
}, 1000);

/* ================= LOG UI ================= */

window.showTodayLog = function () {
  const today = new Date().toLocaleDateString();
  const todayLogs = logs.filter(l => l.date === today);

  let total = 0;
  let html = `<h3 style="text-align:center;">📜 Today’s Log</h3>
  <table style="margin:0 auto; width:95%; text-align:center;">
    <tr>
      <th>Device</th><th>Customer</th><th>Players</th>
      <th>Start</th><th>End</th><th>Min</th><th>₹</th><th>Paid</th>
    </tr>`;

  todayLogs.forEach(l => {
    total += Number(l.amount);
    html += `<tr>
      <td>${l.device}</td>
      <td>${l.customer}</td>
      <td>${l.players}</td>
      <td>${l.startTime}</td>
      <td>${l.endTime}</td>
      <td>${l.minutes}</td>
      <td>${l.amount}</td>
      <td>${l.paid}</td>
    </tr>`;
  });

  html += `</table><h4 style="text-align:center;">💰 Total: ₹${total}</h4>`;
  logArea.innerHTML = html;
  logArea.style.display = "block";
};

/* ================= DOWNLOAD ================= */

window.downloadLog = function () {
  if (logs.length === 0) {
    alert("No logs available");
    return;
  }

  let csv = "Date,Device,Customer,Players,Start,End,Minutes,Amount,Paid\n";
  logs.forEach(l => csv += Object.values(l).join(",") + "\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
  a.download = "LevelUpGaming_Log.csv";
  a.click();
};

window.clearLog = function () {
  if (!confirm("Are you sure you want to clear ALL today's logs?")) return;
  logs = [];
  localStorage.setItem("levelUpLogs", JSON.stringify([]));
  logArea.innerHTML = "<h3>🧹 Logs Cleared</h3>";
  logArea.style.display = "block";
};

window.closeLog = function () {
  logArea.style.display = "none";
  logArea.innerHTML = "";
};

});
