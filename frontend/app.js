const API_CONFIG = {
  BASE_URL: "http://localhost:3000/api/v1"
};

const state = {
  currentView: "admin",
  selectedSpatialRoomId: "101",
  chartMode: "watts",
  cutoffsCount: 14,
  circuitBreakerLimit: 3500,
  rooms: [],
  leaderboard: []
};

const datasetStore = {
  watts: [3800, 3950, 4100, 4050, 4200, 4120, 4180, 4090, 4120, 4150, 4200, 4120, 4160, 4120],
  ghost: [82, 84, 84, 90, 88, 84, 84, 78, 84, 84, 86, 84, 84, 84],
  pf: [0.93, 0.92, 0.94, 0.93, 0.92, 0.94, 0.93, 0.94, 0.93, 0.92, 0.93, 0.94, 0.93, 0.94]
};

let chartInstance = null;

function showToast(message, type = "primary") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<div><strong>${type.toUpperCase()}:</strong><div>${message}</div></div><button style="background:none; border:none; color:var(--text-dim); cursor:pointer;" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 4000);
}

function initStreamingChart() {
  const ctx = document.getElementById("liveStreamingChart");
  if (!ctx) return;
  chartInstance = new Chart(ctx.getContext("2d"), {
    type: "line",
    data: {
      labels: Array.from({length: 14}, (_, i) => `${14 - i}s ago`).reverse(),
      datasets: [{
        label: "Active Mains Draw (Watts)",
        data: datasetStore.watts,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.08)",
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "#162032" }, ticks: { color: "#64748b" } },
        y: { grid: { color: "#162032" }, ticks: { color: "#64748b" } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function pushDataToChart(wattValue) {
  datasetStore.watts.shift();
  datasetStore.watts.push(wattValue);
  if (chartInstance) chartInstance.update('none');
}

async function fetchServerState() {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/state`);
    const resData = await res.json();
    if (resData.success) {
      state.rooms = resData.data.rooms;
      state.leaderboard = resData.data.leaderboard;
      renderAdminRooms();
      renderStudentPortal();
      renderLeaderboard();
      renderSpatialTabs();
      renderSpatialFloorplan();
    }
  } catch (err) {
    console.warn("Backend offline, running in mock mode.");
  }
}

function renderAdminRooms() {
  const container = document.getElementById("adminZoneGrid");
  if (!container || !state.rooms.length) return;
  container.innerHTML = "";

  state.rooms.forEach(room => {
    const activeW = room.appliances.reduce((acc, a) => acc + (a.on ? a.baseWatts : 0), 0);
    const loadRatio = Math.min(100, Math.round((activeW / state.circuitBreakerLimit) * 100));

    const card = document.createElement("div");
    card.className = "room-box";

    const appRows = room.appliances.map(app => `
      <div class="appliance-row">
        <div class="appliance-top">
          <div class="appliance-name">${app.icon} ${app.name}</div>
          <label class="switch">
            <input type="checkbox" ${app.on ? 'checked' : ''} onchange="toggleAppliance('${room.id}', '${app.id}')">
            <span class="slider"></span>
          </label>
        </div>
        <div class="appliance-meta">
          <span class="health-badge health-good">● Health ${app.health}%</span>
          <strong style="color:#fff;">${app.on ? app.baseWatts + ' W' : '0 W'}</strong>
        </div>
      </div>
    `).join("");

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div><div style="font-size:15px; font-weight:800;">${room.name}</div></div>
        <span class="badge-tag tag-occupied">${room.presence}</span>
      </div>
      <div class="breaker-meter">
        <div class="breaker-info"><span>Load: ${activeW} W</span><span>${loadRatio}%</span></div>
        <div class="breaker-track"><div class="breaker-fill" style="width:${loadRatio}%; background:var(--primary);"></div></div>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">${appRows}</div>
    `;
    container.appendChild(card);
  });
}

function renderStudentPortal() {
  const room = state.rooms.find(r => r.id === "204");
  const container = document.getElementById("studentApplianceList");
  if (!container || !room) return;

  container.innerHTML = room.appliances.map(app => `
    <div class="appliance-row">
      <div class="appliance-top">
        <div class="appliance-name">${app.icon} ${app.name}</div>
        <label class="switch">
          <input type="checkbox" ${app.on ? 'checked' : ''} onchange="toggleAppliance('${room.id}', '${app.id}')">
          <span class="slider"></span>
        </label>
      </div>
    </div>
  `).join("");
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboardList");
  if (!container) return;
  container.innerHTML = state.leaderboard.map((item, idx) => `
    <div style="display:flex; justify-content:space-between; background:#090e18; padding:10px; border-radius:8px;">
      <span>#${idx + 1} ${item.name}</span>
      <strong style="color:var(--success);">${item.rawScore}%</strong>
    </div>
  `).join("");
}

function renderSpatialTabs() {
  const container = document.getElementById("spatialRoomTabs");
  if (!container) return;
  container.innerHTML = state.rooms.map(r => `
    <button class="btn btn-ghost" style="padding:4px 10px; font-size:11px;" onclick="selectSpatialRoom('${r.id}')">${r.name.split(" (")[0]}</button>
  `).join("");
}

function renderSpatialFloorplan() {
  const grid = document.getElementById("spatialSeatingGrid");
  const room = state.rooms.find(r => r.id === state.selectedSpatialRoomId) || state.rooms[0];
  if (!grid || !room) return;
  grid.innerHTML = "";

  for (let i = 1; i <= room.capacity; i++) {
    const node = document.createElement("div");
    node.className = `seat-node ${i <= room.occupants ? 'occupied' : ''}`;
    node.innerHTML = `<div class="seat-icon"></div><span class="seat-label">S-${i}</span>`;
    grid.appendChild(node);
  }
}

function selectSpatialRoom(id) { state.selectedSpatialRoomId = id; renderSpatialFloorplan(); }
function shiftOccupantCount(delta) {
  const room = state.rooms.find(r => r.id === state.selectedSpatialRoomId);
  if (!room) return;
  room.occupants = Math.max(0, Math.min(room.capacity, room.occupants + delta));
  renderSpatialFloorplan();
}

async function toggleAppliance(roomId, applianceId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  const app = room.appliances.find(a => a.id === applianceId);
  if (!app) return;
  app.on = !app.on;
  renderAdminRooms();
  renderStudentPortal();

  try {
    await fetch(`${API_CONFIG.BASE_URL}/rooms/${roomId}/relays/${applianceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: app.on ? "ENGAGED" : "OPENED" })
    });
  } catch (e) {
    console.log("Local optimistic toggle update executed.");
  }
}

function switchAppTab(view) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".view-pane").forEach(v => v.classList.remove("active"));
  if (view === "admin") {
    document.getElementById("viewAdmin").classList.add("active");
  } else {
    document.getElementById("viewUser").classList.add("active");
  }
}

function openDataStudio() { document.getElementById("modalDataStudio").classList.add("open"); }
function closeDataStudio() { document.getElementById("modalDataStudio").classList.remove("open"); }
function openAddApplianceModal() {
  const select = document.getElementById("formNewRoomSelect");
  select.innerHTML = state.rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
  document.getElementById("modalAddAppliance").classList.add("open");
}
function closeAddApplianceModal() { document.getElementById("modalAddAppliance").classList.remove("open"); }

function injectSingleDataPoint() {
  const val = parseInt(document.getElementById("customWattInput").value);
  if (isNaN(val)) return;
  document.getElementById("metricLiveWatts").innerText = val.toLocaleString();
  pushDataToChart(val);
  showToast(`Injected value ${val} W`, "success");
  closeDataStudio();
}

function injectBatchDataPoints() {
  const raw = document.getElementById("batchWattInput").value;
  const values = raw.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
  closeDataStudio();
  values.forEach((v, idx) => {
    setTimeout(() => {
      document.getElementById("metricLiveWatts").innerText = v.toLocaleString();
      pushDataToChart(v);
    }, (idx + 1) * 600);
  });
}

function submitNewAppliance() {
  const roomId = document.getElementById("formNewRoomSelect").value;
  const name = document.getElementById("formNewAppName").value || "New Device";
  const baseWatts = parseInt(document.getElementById("formNewAppWatts").value) || 300;
  const room = state.rooms.find(r => r.id === roomId);

  if (room) {
    room.appliances.push({
      id: `app_${Date.now()}`,
      name,
      icon: document.getElementById("formNewAppIcon").value || "🔌",
      baseWatts,
      standbyWatts: 10,
      on: true,
      health: 100
    });
    renderAdminRooms();
    closeAddApplianceModal();
    showToast(`Added ${name} to ${room.name}`, "success");
  }
}

function killAllGhostLoads() {
  showToast("Isolated phantom standby loads.", "purple");
}

function setChartDataset(mode) {
  document.querySelectorAll(".chart-filter-btn").forEach(b => b.classList.remove("active"));
  if (mode === 'watts') document.getElementById("filterWatts").classList.add("active");
}

function exportDataJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `voltsense_telemetry.json`);
  dlAnchor.click();
}

window.addEventListener("DOMContentLoaded", () => {
  initStreamingChart();
  fetchServerState();
});