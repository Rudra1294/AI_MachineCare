import os
import warnings
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA
from qiskit.primitives import StatevectorSampler
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer

# Suppress SciPy sparse matrix warnings for a clean terminal output
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", module="scipy.sparse")

def run_qaoa_scheduler(failed_machine_ids, max_technicians=2):
    """
    Formulates and solves technician routing optimization using QAOA.
    Returns a structured list of scheduling decisions for each machine ID.
    """
    num_machines = len(failed_machine_ids)
    
    # Early return if no machines are failing
    if num_machines == 0:
        return []
        
    # If failing machines are less than or equal to technicians, schedule all immediately
    if num_machines <= max_technicians:
        return [
            {"machine_id": int(mid), "action": "SCHEDULE_TODAY"}
            for mid in failed_machine_ids
        ]

    # 1. Define Quadratic Optimization Problem
    qp = QuadraticProgram(name="Maintenance_Scheduling")

    # Binary variables x_i: 1 if scheduled today, 0 if delayed
    for i in range(num_machines):
        qp.binary_var(name=f"x_{i}")

    # Objective: Maximize total scheduled repairs
    linear_objective = {f"x_{i}": -1.0 for i in range(num_machines)}
    qp.minimize(linear=linear_objective)

    # Constraint: Sum(x_i) <= max_technicians
    constraint_linear = {f"x_{i}": 1.0 for i in range(num_machines)}
    qp.linear_constraint(
        linear=constraint_linear,
        sense="<=",
        rhs=max_technicians,
        name="tech_capacity"
    )

    # 2. Configure Quantum Sampler & COBYLA Optimizer
    sampler = StatevectorSampler()
    optimizer = COBYLA(maxiter=100)

    # 3. Initialize QAOA Variational Circuit (p=2 layers)
    qaoa = QAOA(sampler=sampler, optimizer=optimizer, reps=2)
    optimizer_wrapper = MinimumEigenOptimizer(qaoa)

    # 4. Solve Optimization Problem
    result = optimizer_wrapper.solve(qp)
    optimal_decisions = result.x

    # 5. Build Structured Result List
    schedule_results = []
    for idx, decision in enumerate(optimal_decisions):
        machine_id = failed_machine_ids[idx]
        action = "SCHEDULE_TODAY" if decision == 1.0 else "DELAY_REPAIR"

        schedule_results.append({
            "machine_id": int(machine_id),
            "action": action
        })

    return schedule_results

if __name__ == "__main__":
    # Test script standalone using mock predicted machine IDs
    mock_failed_machines = [104, 209, 511]
    schedule = run_qaoa_scheduler(mock_failed_machines, max_technicians=2)
    
    print("\n--- QAOA Optimal Maintenance Schedule Output ---")
    for item in schedule:
        print(f"Machine ID {item['machine_id']}: {item['action']}")