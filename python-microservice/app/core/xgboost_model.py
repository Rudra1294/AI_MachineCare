import sys
import os
import time
import joblib
from xgboost import XGBClassifier
from sklearn.svm import SVC
from sklearn.metrics import classification_report

# Add the parent directory to the path so we can import from the data folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from data.preprocess import prepare_quantum_data

def train_and_predict_xgboost(X_train, y_train, X_test):
    """
    Trains XGBoost and returns the failure probability for each test sample.
    Uses .joblib for model persistence.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "saved_xgb_model.joblib")
    
    # 1. Check if we already have a trained model saved on disk
    if os.path.exists(model_path):
        print(f"Loading pre-trained XGBoost model from '{model_path}'...")
        xgb = joblib.load(model_path)
    else:
        print("No saved model found. Training XGBoost from scratch...")
        xgb = XGBClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42,
            eval_metric='logloss'
        )
        xgb.fit(X_train, y_train)
        
        # Save the model using joblib
        print(f"✅ Saving trained model to '{model_path}'...")
        joblib.dump(xgb, model_path)
    
    # 2. Return the probabilities instantly using the model
    probabilities = xgb.predict_proba(X_test)[:, 1]
    
    return probabilities

def run_classical_benchmarks(X_train, y_train, X_test, y_test):
    # Benchmark 1: XGBoost (Tree-based Gradient Boosting)
    print("\n" + "="*50)
    print(" BENCHMARK 1: XGBoost (Full SMOTE Dataset)")
    print("="*50)
    
    xgb = XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42,
        eval_metric='logloss'
    )
    
    start_time = time.time()
    xgb.fit(X_train, y_train)
    xgb_time = time.time() - start_time
    
    print(f"XGBoost Training Time: {xgb_time:.3f} seconds (on {len(y_train)} samples)")
    
    xgb_preds = xgb.predict(X_test)
    print("\n--- XGBoost Classification Report ---")
    print(classification_report(y_test, xgb_preds))

    # Benchmark 2: Classical SVM (RBF Kernel)
    print("\n" + "="*50)
    print(" BENCHMARK 2: Classical SVM (RBF Kernel) (Full SMOTE)")
    print("="*50)
    
    csvm = SVC(kernel='rbf', C=1.0, random_state=42)
    
    start_time = time.time()
    csvm.fit(X_train, y_train)
    csvm_time = time.time() - start_time
    
    print(f"Classical SVM Training Time: {csvm_time:.3f} seconds (on {len(y_train)} samples)")
    
    csvm_preds = csvm.predict(X_test)
    print("\n--- Classical SVM Classification Report ---")
    print(classification_report(y_test, csvm_preds))

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, '..', 'data', 'ai4i2020_dataset.csv')
    
    print("Fetching preprocessed data...")
    X_train, X_test, y_train, y_test = prepare_quantum_data(dataset_path)
    
    print("\n--- Generating Saved Model for API ---")
    # THIS is the missing line! It forces the script to run the saving logic.
    train_and_predict_xgboost(X_train, y_train, X_test)
    
    print("\n--- Running Model Benchmarks ---")
    run_classical_benchmarks(X_train, y_train, X_test, y_test)