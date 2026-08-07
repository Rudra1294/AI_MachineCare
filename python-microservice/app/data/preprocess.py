import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
from imblearn.over_sampling import SMOTE
import joblib
import os

# Define file paths to persist scaler and PCA artifacts
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
SCALER_PATH = os.path.join(DATA_DIR, 'scaler.joblib')
PCA_PATH = os.path.join(DATA_DIR, 'pca.joblib')

def load_and_clean_data(file_path):
    print("Loading AI4I 2020 Predictive Maintenance Dataset...")
    df = pd.read_csv(file_path)

    # 1. Drop non-predictive identifiers
    df = df.drop(['UDI', 'Product ID'], axis=1)

    # 2. Encode categorical 'Type' column
    le = LabelEncoder()
    df['Type'] = le.fit_transform(df['Type'])

    # 3. Separate features (X) and target variable (y)
    X = df.drop(['Machine failure', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF'], axis=1)
    y = df['Machine failure'].values

    return X, y

def fit_and_save_transformers(X, n_components=4):
    """
    Fits StandardScaler and PCA on the dataset, then saves them to disk
    so live API data can be transformed using identical weights.
    """
    print("Scaling features and fitting PCA...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    pca = PCA(n_components=n_components)
    X_pca = pca.fit_transform(X_scaled)

    # Save artifacts for live API inference
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(pca, PCA_PATH)
    print(f"✅ Saved scaler artifact to: {SCALER_PATH}")
    print(f"✅ Saved PCA transformer artifact to: {PCA_PATH}")

    explained_variance = np.sum(pca.explained_variance_ratio_) * 100
    print(f"PCA preserved {explained_variance:.2f}% of original variance using {n_components} components.")

    return X_pca

def prepare_quantum_data(file_path, test_size=0.2, random_state=42):
    """
    Offline Pipeline: Prepares balanced training and test data for QSVM training.
    """
    X, y = load_and_clean_data(file_path)
    X_processed = fit_and_save_transformers(X, n_components=4)

    # Train-Test Split (Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X_processed, y, test_size=test_size, random_state=random_state, stratify=y
    )

    # Apply SMOTE ONLY to training set to prevent data leakage
    print("Applying SMOTE to balance healthy vs. failure classes...")
    smote = SMOTE(random_state=random_state)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)

    print(f"Original training distribution: Healthy={np.sum(y_train==0)}, Failure={np.sum(y_train==1)}")
    print(f"Balanced training distribution: Healthy={np.sum(y_train_resampled==0)}, Failure={np.sum(y_train_resampled==1)}")

    return X_train_resampled, X_test, y_train_resampled, y_test

def transform_raw_data_for_inference(raw_df):
    """
    Online Pipeline: Used by FastAPI during live inference.
    Transforms incoming raw sensor data using saved scaler and PCA models.
    """
    if not os.path.exists(SCALER_PATH) or not os.path.exists(PCA_PATH):
        raise FileNotFoundError("Scaler or PCA model missing. Please run offline training first.")

    scaler = joblib.load(SCALER_PATH)
    pca = joblib.load(PCA_PATH)

    # Preprocess categorical encoding if 'Type' is string ('L', 'M', 'H')
    if 'Type' in raw_df.columns and raw_df['Type'].dtype == object:
        type_mapping = {'L': 0, 'M': 1, 'H': 2}
        raw_df['Type'] = raw_df['Type'].map(type_mapping).fillna(0)

    # Drop non-predictive or target columns if present in payload
    cols_to_drop = ['UDI', 'Product ID', 'Machine failure', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    df_cleaned = raw_df.drop(columns=[c for c in cols_to_drop if c in raw_df.columns])

    # Apply saved scaler and PCA
    X_scaled = scaler.transform(df_cleaned)
    X_pca = pca.transform(X_scaled)

    return X_pca

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, 'ai4i2020.csv')
    
    if os.path.exists(dataset_path):
        prepare_quantum_data(dataset_path)
    else:
        print(f"Error: Could not find dataset at {dataset_path}.")