from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
import pandas as pd
import joblib
import os

from app.core.milp_model import run_smart_milp_scheduler

app = FastAPI(title="Factory Maintenance AI", description="Real-time predictive maintenance API")

# --- 1. SCHEMAS (Updated to match Node.js) ---
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
    # Expect an array of objects from Node.js, not an integer
    available_technicians: List[TechnicianData] = [] 
    machines: List[MachineSensorData]

# --- 2. LOAD MODELS ---
current_dir = os.path.dirname(os.path.abspath(__file__))
core_dir = os.path.join(current_dir, "core")
data_dir = os.path.join(current_dir, "data")

model = None
scaler = None
pca = None

# Hide the scikit-learn warning
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

try:
    model = joblib.load(os.path.join(core_dir, "saved_xgb_model.joblib"))
    scaler = joblib.load(os.path.join(data_dir, "scaler.joblib"))
    pca = joblib.load(os.path.join(data_dir, "pca.joblib"))
    print("✅ All AI models and preprocessing artifacts loaded successfully.")
except Exception as e:
    print(f"⚠️ Warning: Could not load models/artifacts. Error: {e}")

# --- 3. API ENDPOINT ---
@app.post("/api/predict_and_schedule")
def predict_and_schedule(request: MaintenanceRequest):
    if not request.machines:
        raise HTTPException(status_code=400, detail="No machine data provided")
    if model is None or scaler is None or pca is None:
        raise HTTPException(status_code=500, detail="AI artifacts not loaded on server.")

    at_risk_machines = []
    all_predictions = []
    
    # Extract the pool of available technician IDs from the request
    tech_pool = [tech.technician_id for tech in request.available_technicians]
    
    for machine in request.machines:
        # Re-added the Pandas DataFrame fix for 100% accuracy!
        raw_features_df = pd.DataFrame([{
            'Type': machine.type, 
            'Air temperature [K]': machine.air_temperature, 
            'Process temperature [K]': machine.process_temperature, 
            'Rotational speed [rpm]': machine.rotational_speed, 
            'Torque [Nm]': machine.torque, 
            'Tool wear [min]': machine.tool_wear
        }])
        
        scaled_features = scaler.transform(raw_features_df)
        pca_features = pca.transform(scaled_features)
        
        failure_prob = float(model.predict_proba(pca_features)[0][1])
        is_risk = failure_prob > 0.50
        
        cause = "System Normal"
        if is_risk:
            if machine.tool_wear > 200:
                cause = "Critical Tool Wear Limit Exceeded"
            elif machine.torque > 60 or machine.rotational_speed < 1380:
                cause = "Motor Strain / High Torque Anomaly"
            elif machine.process_temperature > 315:
                cause = "Overheating (Process Temp Warning)"
            else:
                cause = "Complex Multi-Sensor Anomaly"
        
        all_predictions.append({
            "machine_id": machine.machine_id,
            "prediction": 1 if is_risk else 0,
            "status": "FAILURE_RISK" if is_risk else "HEALTHY",
            "failure_cause": cause # Send the exact cause back!
        })
        
        if is_risk:
            at_risk_machines.append({
                'id': machine.machine_id,
                'probability': failure_prob
            })

    formatted_schedule = []
    
    if at_risk_machines:
        # Pass the length of the tech pool to the scheduler
        milp_schedule_raw = run_smart_milp_scheduler(
            at_risk_machines=at_risk_machines, 
            max_technicians=len(tech_pool) 
        )
        
        for item in milp_schedule_raw:
            if item.get("scheduled") is True and len(tech_pool) > 0:
                # Assign a REAL technician ID so Node can update MongoDB
                assigned_tech = tech_pool.pop(0) 
                formatted_schedule.append({
                    "machine_id": item["machine_id"],
                    "assigned_technician": assigned_tech, 
                    "action": "SCHEDULE_TODAY"
                })
    
    return {
        "status": "success",
        "total_scanned": len(request.machines),
        "total_failures_detected": len(at_risk_machines),
        "predictions": all_predictions,
        "milp_schedule": formatted_schedule,
        "compute_engine": "Classical MILP",
        "prediction_model": "XGBoost"
    }