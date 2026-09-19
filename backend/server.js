const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// In-Memory Database State
const state = {
  cutoffsCount: 14,
  avoidedKwh: 6.2,
  circuitBreakerLimit: 3500,
  rooms: [
    {
      id: "101",
      name: "Hostel Q-Block 101 (6-Bed)",
      blockId: "qblock",
      presence: "occupied",
      capacity: 6,
      occupants: 6,
      unitType: "Bed",
      unattendedMinutes: 0,
      maxApplianceSlots: 6,
      appliances: [
        {
          id: "q_geyser",
          name: "Instant Water Geyser",
          icon: "♨️",
          baseWatts: 1800,
          standbyWatts: 26,
          ghostDetected: false,
          on: true,
          type: "hazard",
          health: 81,
          healthStatus: "Scale Formation",
          fingerprint: { pf: 0.99, inrush: "1.0x", thd: "2.2%" }
        },
        {
          id: "q_ac",
          name: "Split Inverter AC (1.5T)",
          icon: "❄️",
          baseWatts: 720,
          standbyWatts: 34,
          ghostDetected: false,
          on: true,
          type: "ac",
          health: 95,
          healthStatus: "Optimal",
          fingerprint: { pf: 0.86, inrush: "3.5x", thd: "7.8%" }
        },
        {
          id: "q_fan",
          name: "BLDC Fan & LED Array",
          icon: "💡",
          baseWatts: 90,
          standbyWatts: 6,
          ghostDetected: false,
          on: true,
          type: "ambient",
          health: 98,
          healthStatus: "Optimal",
          fingerprint: { pf: 0.95, inrush: "1.2x", thd: "3.5%" }
        }
      ]
    },
    {
      id: "204",
      name: "Electronics Lab 204 (TT Block)",
      blockId: "tt",
      presence: "occupied",
      capacity: 20,
      occupants: 10,
      unitType: "Seat",
      unattendedMinutes: 0,
      maxApplianceSlots: 6,
      appliances: [
        {
          id: "tt_solder",
          name: "Soldering Station & DC PSU",
          icon: "🔥",
          baseWatts: 950,
          standbyWatts: 42,
          ghostDetected: false,
          on: true,
          type: "hazard",
          health: 68,
          healthStatus: "Thermal Drift Warning",
          fingerprint: { pf: 0.79, inrush: "2.2x", thd: "13.8%" }
        },
        {
          id: "tt_ac",
          name: "Climate AC Sub-Unit",
          icon: "❄️",
          baseWatts: 580,
          standbyWatts: 28,
          ghostDetected: false,
          on: true,
          type: "ac",
          health: 91,
          healthStatus: "Optimal",
          fingerprint: { pf: 0.88, inrush: "3.2x", thd: "6.9%" }
        },
        {
          id: "tt_lights",
          name: "High-CRI Lab Lights",
          icon: "💡",
          baseWatts: 50,
          standbyWatts: 5,
          ghostDetected: false,
          on: true,
          type: "ambient",
          health: 99,
          healthStatus: "Optimal",
          fingerprint: { pf: 0.97, inrush: "1.1x", thd: "2.8%" }
        }
      ]
    },
    {
      id: "302",
      name: "Classroom 302 (SJT Block)",
      blockId: "sjt",
      presence: "occupied",
      capacity: 20,
      occupants: 14,
      unitType: "Seat",
      unattendedMinutes: 0,
      maxApplianceSlots: 6,
      appliances: [
        {
          id: "sjt_lights",
          name: "Fluorescent/LED Bay",
          icon: "💡",
          baseWatts: 160,
          standbyWatts: 8,
          ghostDetected: false,
          on: true,
          type: "ambient",
          health: 94,
          healthStatus: "Optimal",
          fingerprint: { pf: 0.94, inrush: "1.4x", thd: "4.5%" }
        },
        {
          id: "sjt_ac",
          name: "Ductable HVAC Unit",
          icon: "❄️",
          baseWatts: 1300,
          standbyWatts: 45,
          ghostDetected: false,
          on: true,
          type: "ac",
          health: 84,
          healthStatus: "Capacitor Wear",
          fingerprint: { pf: 0.82, inrush: "4.1x", thd: "10.8%" }
        },
        {
          id: "sjt_proj",
          name: "Laser Projector & Sound",
          icon: "📽️",
          baseWatts: 290,
          standbyWatts: 22,
          ghostDetected: false,
          on: true,
          type: "ambient",
          health: 92,
          healthStatus: "Optimal",
          fingerprint: { pf: 0.91, inrush: "1.8x", thd: "5.2%" }
        }
      ]
    }
  ],
  leaderboard: [
    { id: "qblock", name: "Men's Hostel Q-Block", rawScore: 97.2, avoidedKwh: 142.4 },
    { id: "tt", name: "Technology Tower (TT)", rawScore: 94.8, avoidedKwh: 118.6 },
    { id: "sjt", name: "Silver Jubilee Tower (SJT)", rawScore: 92.4, avoidedKwh: 98.2 }
  ]
};

// REST API Routes
app.get('/api/v1/state', (req, res) => {
  res.json({ success: true, data: state });
});

app.post('/api/v1/rooms/:roomId/relays/:applianceId', (req, res) => {
  const { roomId, applianceId } = req.params;
  const { state: targetState } = req.body;
  
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ success: false, error: "Room not found" });
  
  const appItem = room.appliances.find(a => a.id === applianceId);
  if (!appItem) return res.status(404).json({ success: false, error: "Appliance not found" });

  appItem.on = targetState === "ENGAGED";
  io.emit('stateUpdate', state);
  res.json({ success: true, room, appliance: appItem });
});

app.post('/api/v1/rooms/:roomId/cutoff', (req, res) => {
  const { roomId } = req.params;
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ success: false, error: "Room not found" });

  room.appliances.forEach(a => { a.on = false; });
  state.cutoffsCount++;
  io.emit('stateUpdate', state);
  res.json({ success: true, message: `Emergency cutoff executed for room ${roomId}` });
});

app.post('/api/v1/telemetry/ingest', (req, res) => {
  const telemetry = req.body;
  io.emit('telemetryData', telemetry);
  res.json({ success: true, timestamp: Date.now() });
});

// Socket.IO Gateway
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client Connected: ${socket.id}`);
  socket.emit('stateUpdate', state);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`⚡ VoltSense Pro Server running on http://localhost:${PORT}`);
});