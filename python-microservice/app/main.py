from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import joblib
import os
import sys

# Add directory paths for internal module imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(CURRENT_DIR)

from data.preprocess import transform_raw_data_for_inference
from core.qaoa_model import run_qaoa_scheduler

# Global model variable
qsvm_model = None
MODEL_PATH = os.path.join(CURRENT_DIR, 'core', 'trained_qsvm.joblib')

# Modern FastAPI Lifespan Context Manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Logic ---
    global qsvm_model
    if os.path.exists(MODEL_PATH):
        qsvm_model = joblib.load(MODEL_PATH)
        print(f"✅ Loaded trained QSVM model from {MODEL_PATH}")
    else:
        print(f"⚠️ Warning: Model not found at {MODEL_PATH}. Run training first!")
    
    yield
    
    # --- Shutdown Logic ---
    print("🛑 Shutting down predictive maintenance microservice.")

app = FastAPI(
    title="Quantum Predictive Maintenance Microservice",
    description="API Gateway bridging QSVM failure predictions with QAOA maintenance scheduling.",
    version="2.0.0",
    lifespan=lifespan
)

# --- UPDATED SCHEMAS TO MATCH NODE.JS ---
class MachineSensorData(BaseModel):
    machine_id: str
    type: int
    air_temperature: float
    process_temperature: float
    rotational_speed: float
    torque: float
    tool_wear: float

class TechnicianData(BaseModel):
    technician_id: str
    specialty: str

class MaintenanceRequest(BaseModel):
    available_technicians: List[TechnicianData] = [] 
    machines: List[MachineSensorData]


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "Quantum Predictive Maintenance Microservice",
        "model_loaded": qsvm_model is not None
    }

# --- ROUTE UPDATED TO MATCH NODE.JS AXIOS CALL ---
@app.post("/api/predict_and_schedule")
def predict_and_schedule(payload: MaintenanceRequest):
    if qsvm_model is None:
        raise HTTPException(status_code=500, detail="QSVM model is not loaded on the server.")
    if not payload.machines:
        raise HTTPException(status_code=400, detail="Telemetry data list cannot be empty.")

    try:
        # Extract available tech IDs pool for assignment later
        tech_pool = [tech.technician_id for tech in payload.available_technicians]

        records = [item.dict() for item in payload.machines]
        df_raw = pd.DataFrame(records)

        # Rename Node.js schema keys back to QSVM training column names
        rename_mapping = {
            "type": "Type",
            "air_temperature": "Air temperature [K]",
            "process_temperature": "Process temperature [K]",
            "rotational_speed": "Rotational speed [rpm]",
            "torque": "Torque [Nm]",
            "tool_wear": "Tool wear [min]"
        }
        df_raw = df_raw.rename(columns=rename_mapping)

        machine_ids = df_raw["machine_id"].tolist()
        df_features = df_raw.drop(columns=["machine_id"])

        # 1. Preprocess through saved Scaler and PCA
        X_pca = transform_raw_data_for_inference(df_features)

        # 2. QSVM Live Inference
        predictions = qsvm_model.predict(X_pca)

        # 3. Identify Failing Machines & Add XAI Root Cause Logic
        failing_machines = []
        detailed_predictions = []

        for idx, pred in enumerate(predictions):
            mid = machine_ids[idx]
            is_risk = int(pred) == 1
            status = "FAILURE_RISK" if is_risk else "HEALTHY"
            
            # Fetch raw row to run diagnostic rules
            raw_row = df_raw.iloc[idx]
            
            # Re-integrated Explainable AI (XAI) Diagnostic Logic
            cause = "System Normal"
            if is_risk:
                if raw_row["Tool wear [min]"] > 200:
                    cause = "Critical Tool Wear Limit Exceeded"
                elif raw_row["Torque [Nm]"] > 60 or raw_row["Rotational speed [rpm]"] < 1380:
                    cause = "Motor Strain / High Torque Anomaly"
                elif raw_row["Process temperature [K]"] > 315:
                    cause = "Overheating (Process Temp Warning)"
                else:
                    cause = "Complex Multi-Sensor Anomaly"

            detailed_predictions.append({
                "machine_id": str(mid),
                "prediction": int(pred),
                "status": status,
                "failure_cause": cause # Passes the diagnostic back to React
            })

            if is_risk:
                failing_machines.append(str(mid))

        # 4. QAOA Schedule Optimization
        formatted_schedule = []

        if failing_machines:
            # Pass the failure list and the max length of our technician pool to QAOA
            optimal_schedule = run_qaoa_scheduler(
                failed_machine_ids=failing_machines,
                max_technicians=len(tech_pool)
            )

            # Map the returned QAOA schedule to real technician DB IDs
            for item in optimal_schedule:
                if item.get("scheduled") is True and len(tech_pool) > 0:
                    assigned_tech = tech_pool.pop(0) 
                    formatted_schedule.append({
                        "machine_id": item["machine_id"],
                        "assigned_technician": assigned_tech, 
                        "action": "SCHEDULE_TODAY"
                    })

        return {
            "status": "success",
            "total_scanned": len(machine_ids),
            "total_failures_detected": len(failing_machines),
            "predictions": detailed_predictions,
            "milp_schedule": formatted_schedule, # Name kept as milp_schedule so Node doesn't break
            "compute_engine": "Quantum QAOA",    # NEW: Flag the scheduler
            "prediction_model": "QSVM"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)