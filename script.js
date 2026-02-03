const sessions = {};

function startTimer() {
  const device = document.getElementById("device").value;
  const minutes = parseInt(document.getElementById("time").value);

  if (sessions[device]) return alert("Timer already running!");

  const endTime = Date.now() + minutes * 60000;
  sessions[device] = endTime;

  const div = document.createElement("div");
  div.className = "session";
  div.id = device;
  div.innerHTML = `
    <h3>${device}</h3>
    <p class="time">Loading...</p>
    <button onclick="stopTimer('${device}')">Stop</button>
  `;

  document.getElementById("sessions").appendChild(div);
}

function stopTimer(device) {
  delete sessions[device];
  document.getElementById(device).remove();
}

setInterval(() => {
  for (let device in sessions) {
    const remaining = sessions[device] - Date.now();
    const div = document.getElementById(device);

    if (remaining <= 0) {
      div.classList.add("expired");
      div.querySelector(".time").innerText = "Time Over!";
    } else {
      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      div.querySelector(".time").innerText =
        `${min}m ${sec}s remaining`;
    }
  }
}, 1000);
