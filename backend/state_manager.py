import os
import pickle
import joblib
import pandas as pd
from tensorflow.keras.models import load_model

STORE_DIR = os.path.join(os.path.dirname(__file__), 'store')
os.makedirs(STORE_DIR, exist_ok=True)

# Define the sequential chain of artifacts.
# Saving an artifact early in the chain invalidates all downstream artifacts.
ARTIFACT_CHAIN = [
    ("raw_df", "parquet"),
    ("clean_df", "parquet"),
    ("selected_features", "pkl"),
    ("scaler_X", "joblib"),
    ("scaler_y", "joblib"),
    ("X_train_seq", "pkl"),
    ("y_train_seq", "pkl"),
    ("X_test_seq", "pkl"),
    ("y_test_seq", "pkl"),
    ("test_df", "parquet"),
    ("model", "keras"),
]

def _get_path(key, ext):
    return os.path.join(STORE_DIR, f"{key}.{ext}")

def delete_artifact(key, ext="pkl"):
    path = _get_path(key, ext)
    if os.path.exists(path):
        os.remove(path)

def clear_downstream_artifacts(current_key):
    start_deleting = False
    for key, ext in ARTIFACT_CHAIN:
        if start_deleting:
            delete_artifact(key, ext)
        if key == current_key:
            start_deleting = True

def save_artifact(key, obj, ext="pkl"):
    # Immediately invalidate downstream state so the frontend flowchart dims appropriately
    clear_downstream_artifacts(key)
    
    path = _get_path(key, ext)
    if ext == "pkl":
        with open(path, "wb") as f:
            pickle.dump(obj, f)
    elif ext == "joblib":
        joblib.dump(obj, path)
    elif ext == "keras":
        # .keras might be a folder in some older TF versions, but in TF 2.13+ it's a zip file.
        # Ensure we delete it first just in case
        if os.path.exists(path):
            if os.path.isdir(path):
                import shutil
                shutil.rmtree(path)
            else:
                os.remove(path)
        obj.save(path)
    elif ext == "parquet":
        obj.to_parquet(path)

def load_artifact(key, ext="pkl"):
    path = _get_path(key, ext)
    if not os.path.exists(path):
        return None
        
    if ext == "pkl":
        with open(path, "rb") as f:
            return pickle.load(f)
    elif ext == "joblib":
        return joblib.load(path)
    elif ext == "keras":
        return load_model(path)
    elif ext == "parquet":
        return pd.read_parquet(path)
    return None

def clear_store():
    for f in os.listdir(STORE_DIR):
        file_path = os.path.join(STORE_DIR, f)
        if os.path.isfile(file_path):
            os.remove(file_path)
