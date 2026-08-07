# OptiMaintain: Quantum-Powered Predictive Maintenance System

A full-stack, microservices-based enterprise application that bridges classical web architecture with Quantum Machine Learning (QML). This system monitors factory machine telemetry, predicts failure risks, and optimizes technician dispatch schedules using hybrid classical-quantum algorithms.

## 🚀 Architecture Overview

The project is decoupled into three robust microservices:
1. **Frontend (React.js):** An enterprise dashboard for monitoring live telemetry, managing technician rosters, and manually auditing AI dispatch recommendations.
2. **Backend API (Node.js/Express):** Handles MongoDB database operations, state management for technician availability, and asynchronous ticket scheduling.
3. **AI Engine (Python/FastAPI):** A predictive pipeline evaluating sensor data against physical guardrails and machine learning models.

---

## ⚛️ Hybrid AI Engine (Classical vs. Quantum)

This system is designed to easily toggle between classical machine learning and next-generation quantum algorithms.

### 1. The Predictor (XGBoost vs. QSVM)
Analyzes incoming machine telemetry (Air/Process Temperature, Rotational Speed, Torque, Tool Wear).
* **Classical:** Uses a trained **XGBoost** model to classify failure risk.
* **Quantum:** Uses a **Quantum Support Vector Machine (QSVM)** via Qiskit for high-dimensional risk classification.

### 2. The Optimizer (MILP vs. QAOA)
When failures are detected, the optimizer matches broken machines with available technicians.
* **Classical:** Uses **Mixed-Integer Linear Programming (MILP)** to calculate the most efficient dispatch route.
* **Quantum:** Uses the **Quantum Approximate Optimization Algorithm (QAOA)** to solve the Quadratic Unconstrained Binary Optimization (QUBO) problem on a quantum simulator.

**How to switch engines:**
* **For Quantum Execution:** Run the FastAPI server using `main.py`.
* **For Classical Execution:** Run the FastAPI server using `classic_algo_main.py`.
* Metadata badges automatically update on the React frontend to show which engines were used for the computation!

---

## 💻 System Features & Workflow

### 🔍 Live Prediction
Select a registered machine and input its current sensor telemetry (Temperature, RPM, Torque, Wear). The data is sent to the Python AI microservice. If a failure risk is detected, the AI generates a specific diagnostic cause (e.g., "Motor Strain") and automatically creates a maintenance ticket.

### 🧑‍🔧 Technician Management
Manage your factory workforce dynamically. 
* Add new technicians with specific specialties (Electrical, Mechanical, PLC).
* Technicians exist in three states: **🟢 Available**, **🔴 Busy (Assigned to Task)**, or **⚪ Off-Shift**.
* The system strictly prevents double-booking and automatically frees up technicians when their assigned task is resolved.

### 📅 Dispatch Schedule
The central hub for active maintenance.
* Machines flagged with a "Failure Risk" enter the queue as **Action Required**.
* Admins can assign an available technician and dispatch them. The task moves to **In Progress**.
* **Post-Maintenance Audit:** To mark a task as **Resolved**, the admin must input the machine's *new* post-repair sensor readings. The AI evaluates the new data and will only allow the ticket to close if the machine is verified as "Healthy".

### 📖 History & 📊 Analytics
* **Prediction History:** A read-only archive logging every prediction made, the diagnostic cause, the assigned technician, and the timestamp.
* **Analytics Dashboard:** Visualizes factory health, historical failure rates, technician utilization, and algorithm performance over time.

---

## 📂 Project Structure

```text
MACHINE_MAINTENANCE_PREDICTION/
├── backend/                        # Node.js & Express API
│   ├── src/
│   │   ├── config/                 # DB connections
│   │   ├── controllers/            # Logic for Machines, Maintenance, Technicians
│   │   ├── models/                 # Mongoose Schemas (MachineLog, Technician, etc.)
│   │   ├── routes/                 # Express API endpoints
│   │   ├── services/               
│   │   └── server.js               # Node entry point
│   ├── seed.js                     # DB Seeding script
│   └── sync-machines.js            
│
├── frontend/                       # React.js SPA
│   ├── public/                     
│   └── src/
│       ├── api/                    # Axios instances
│       ├── components/             # Reusable UI & Layouts (Sidebar, Header)
│       ├── pages/                  
│       │   ├── Analytics.jsx       # Data visualization
│       │   ├── Dashboard.jsx       # Main overview
│       │   ├── LivePrediction.jsx  # AI Telemetry input
│       │   ├── MachinesList.jsx    # Inventory management
│       │   ├── MaintenanceSchedule.jsx # Dispatch & Audit Hub
│       │   ├── PredictionHistory.jsx   # Archive
│       │   └── TechnicianManager.jsx   # Workforce roster
│       └── App.js                  # React Router setup
│
└── python-microservice/            # FastAPI & AI Models
    ├── app/
    │   ├── core/                   # Algorithm definitions
    │   │   ├── milp_model.py       # Classical Optimizer
    │   │   ├── qaoa_model.py       # Quantum Optimizer
    │   │   ├── qsvm_model.py       # Quantum Predictor
    │   │   ├── xgboost_model.py    # Classical Predictor
    │   │   ├── saved_xgb_model.joblib
    │   │   └── trained_qsvm.joblib
    │   └── data/                   # Data preprocessing logic
    ├── classic_algo_main.py        # Classical API Entry Point
    ├── main.py                     # Quantum API Entry Point
    └── requirements.txt            # Python dependencies
