import logging
import numpy as np
from scipy.optimize import milp, LinearConstraint, Bounds
from typing import List, Dict, Any

# Set up industry-standard logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_smart_milp_scheduler(at_risk_machines: List[Dict[str, Any]], max_technicians: int = 2) -> List[Dict[str, Any]]:
    """
    Optimizes maintenance scheduling based on failure probabilities.
    
    Args:
        at_risk_machines: List of dicts containing 'id' and 'probability'.
        max_technicians: Int representing available maintenance staff.
        
    Returns:
        List of dicts with the final scheduling decision for each machine.
    """
    num_machines = len(at_risk_machines)
    
    # Edge Case 1: No machines are at risk
    if num_machines == 0:
        logger.info("No machines flagged for failure. Returning empty schedule.")
        return []

    # Edge Case 2: No technicians available
    if max_technicians <= 0:
        logger.warning("max_technicians is 0. Returning schedule with all delays.")
        return [
            {'machine_id': m['id'], 'failure_risk': m['probability'], 'scheduled': False} 
            for m in at_risk_machines
        ]

    logger.info(f"Running MILP optimization for {num_machines} machines with {max_technicians} technicians.")

    # Objective: Maximize mitigated risk (minimize negative probabilities)
    probabilities = [machine['probability'] for machine in at_risk_machines]
    c = -np.array(probabilities)

    # Constraints: Decision variables must be binary (0 or 1)
    integrality = np.ones(num_machines)
    bounds = Bounds(0, 1)

    # Constraints: Total scheduled machines cannot exceed max_technicians
    constraint_matrix = np.ones((1, num_machines))
    constraints = LinearConstraint(constraint_matrix, lb=0, ub=max_technicians)

    # Run the SciPy MILP Solver
    res = milp(c=c, integrality=integrality, bounds=bounds, constraints=constraints)
    
    # Error Handling: Check if the solver actually found a valid solution
    if not res.success:
        logger.error(f"MILP Solver failed to converge: {res.message}")
        raise RuntimeError("Optimization solver failed to find a maintenance schedule.")

    # Package the results nicely to return to the pipeline/API layer
    schedule_results = []
    scheduled_count = 0
    
    for idx, decision in enumerate(res.x):
        machine = at_risk_machines[idx]
        is_scheduled = bool(round(decision) == 1)
        
        if is_scheduled:
            scheduled_count += 1
            
        schedule_results.append({
            'machine_id': machine['id'],
            'failure_risk': float(machine['probability']), # Explicit cast to float for JSON serialization
            'scheduled': is_scheduled
        })
        
    logger.info(f"Optimization complete. Allocated {scheduled_count}/{max_technicians} technicians.")
    
    return schedule_results