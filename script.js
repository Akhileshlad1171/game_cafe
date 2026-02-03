document.addEventListener("DOMContentLoaded", () => {

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
    amount: amountEl().value || 0,
    remaining: parseInt(timeEl().value) * 60,
    totalSeconds: parseInt(timeEl().value) * 60,
    running: true,
    paid: false,
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
    <p>💰 ₹${s.amount}</p>

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

window.extendTime = function (device, minutes) {
  sessions[device].remaining += minutes * 60;
  sessions[device].totalSeconds += minutes * 60;
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

/* ================= TIMER ================= */

setInterval(() => {
  for (let d in sessions) {
    const s = sessions[d];
    const div = document.getElementById(d);

    if (s.running && s.remaining > 0) s.remaining--;

    div.querySelector(".time").innerText =
      s.remaining > 0 ? `⏳ ${Math.floor(s.remaining/60)}m ${s.remaining%60}s` : "⛔ Time Over";

    div.querySelector(".endTime").innerText =
      s.remaining > 0 ? `⏰ Ends at: ${new Date(Date.now()+s.remaining*1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}` : "";
  }
}, 1000);

/* ================= LOG UI ================= */

window.showTodayLog = function () {
  const today = new Date().toLocaleDateString();
  const todayLogs = logs.filter(l => l.date === today);

  let total = 0;
  let html = `<h3>📜 Today’s Log</h3><table><tr>
  <th>Device</th><th>Customer</th><th>Players</th><th>Start</th><th>End</th><th>Min</th><th>₹</th><th>Paid</th></tr>`;

  todayLogs.forEach(l => {
    total += Number(l.amount);
    html += `<tr><td>${l.device}</td><td>${l.customer}</td><td>${l.players}</td>
    <td>${l.startTime}</td><td>${l.endTime}</td><td>${l.minutes}</td><td>${l.amount}</td><td>${l.paid}</td></tr>`;
  });

  html += `</table><h4>Total: ₹${total}</h4>`;
  document.getElementById("logArea").innerHTML = html;
  document.getElementById("logArea").style.display = "block";
};

window.downloadLog = function () {
  let csv = "Date,Device,Customer,Players,Start,End,Minutes,Amount,Paid\n";
  logs.forEach(l => csv += Object.values(l).join(",") + "\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
  a.download = "LevelUpGaming_Log.csv";
  a.click();
};

});
