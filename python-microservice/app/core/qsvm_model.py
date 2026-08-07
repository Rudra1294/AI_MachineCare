import sys
import os
import time
from sklearn.utils import shuffle
from qiskit.circuit.library import zz_feature_map 
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit_machine_learning.algorithms import QSVC
from sklearn.metrics import classification_report
import joblib

# Add the parent directory to the path so we can import from the data folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from data.preprocess import prepare_quantum_data

def build_and_train_qsvm(X_train, y_train, X_test, y_test):
    print("\n--- Phase 2: Quantum Support Vector Machine ---")
    
    # 1. The Quantum Feature Map (Reverted to simpler, smoother circuit)
    print("Initializing zz_feature_map with reps=2 and linear entanglement...")
    feature_map = zz_feature_map(feature_dimension=4, reps=2, entanglement='linear')

    # 2. The Quantum Kernel
    print("Building Fidelity Quantum Kernel...")
    qkernel = FidelityQuantumKernel(feature_map=feature_map)

    # 3. The QSVM Classifier (Using default C=1.0 for better generalization)
    print("Configuring QSVC...")
    qsvc = QSVC(quantum_kernel=qkernel)

    # 4. Shuffle the SMOTE-balanced data so failures are mixed evenly
    X_train_shuffled, y_train_shuffled = shuffle(X_train, y_train, random_state=42)

    # 5. Training
    sample_size = 1000 
    print(f"\n[WARNING] Training QSVM on {sample_size} samples.")
    print("This requires calculating a 1,000 x 1,000 Quantum Kernel matrix.")
    print("This will likely take 1 to 1.5 hours. Please leave the script running...\n")
    
    start_time = time.time()
    
    # Fit the model on the 1000 samples
    qsvc.fit(X_train_shuffled[:sample_size], y_train_shuffled[:sample_size])
    
    elapsed_time = time.time() - start_time
    print(f"Training completed in {elapsed_time:.2f} seconds.")

    # 6. Evaluation
    print("Evaluating model accuracy on the test set...")
    # Test on a larger sample to get a more accurate evaluation of real-world performance
    test_sample_size = 500
    y_pred = qsvc.predict(X_test[:test_sample_size])
    
    print("\n--- QSVM Classification Report ---")
    print(classification_report(y_test[:test_sample_size], y_pred, zero_division=0))
    
    return qsvc
def predict_new_data(processed_features):
    """
    This function will be called by FastAPI for live inference.
    It loads the saved model and predicts failures on new incoming data.
    """
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trained_qsvm.joblib')
    
    if not os.path.exists(model_path):
        raise FileNotFoundError("Trained QSVM model not found. Please run training first.")
        
    # Load the saved quantum model
    loaded_qsvc = joblib.load(model_path)
    
    # Run the prediction
    predictions = loaded_qsvc.predict(processed_features)
    
    # Convert numpy array to standard Python list for JSON serialization
    return predictions.tolist()

if __name__ == "__main__":
    # Point to the dataset we set up in Step 1
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, '..', 'data', 'ai4i2020_dataset.csv')
    
    print("Fetching preprocessed data...")
    X_train, X_test, y_train, y_test = prepare_quantum_data(dataset_path)
    
    # Run the quantum model
    trained_model = build_and_train_qsvm(X_train, y_train, X_test, y_test)
    
    # NEW CODE: Save the trained model to a file
    model_save_path = os.path.join(current_dir, 'trained_qsvm.joblib')
    joblib.dump(trained_model, model_save_path)
    print(f"\n✅ Model successfully saved to: {model_save_path}")