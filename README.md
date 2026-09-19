# ⚡ VoltSense Pro Platform

Autonomous IoT Micro-Grid Energy Intelligence & Watchdog System.

## 🏗️ Architecture & Directory Structure

This project follows a decoupled architecture, separating the real-time backend service from the client dashboard.

```text
voltsense-platform/
│
├── ⚙️ BACKEND
│   ├── package.json      # Node.js dependencies & scripts
│   └── server.js         # Express REST API & Socket.IO real-time gateway
│
└── 🎨 FRONTEND
    └── public/           # Client-side static assets
        ├── index.html    # Main dashboard UI structure
        ├── styles.css    # Responsive styles & theme
        └── app.js        # Client logic & telemetry handling
```

---

## 🚀 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git)
   cd YOUR_REPOSITORY_NAME
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Access the Application:**
   Open your browser and navigate to `http://localhost:3000`.