import numpy as np
from fastapi import HTTPException
import shap
from state_manager import load_artifact

def explain_model():
    report = load_artifact("explain_report", "pkl")
    if report:
        return report

    model = load_artifact("model", "keras")
    X_train_seq = load_artifact("X_train_seq", "pkl")
    X_test_seq = load_artifact("X_test_seq", "pkl")
    features = load_artifact("selected_features", "pkl")
    
    if model is None or X_train_seq is None or X_test_seq is None or features is None:
        raise HTTPException(status_code=400, detail="Run previous endpoints first")

    lookback, n_features = X_train_seq.shape[1], X_train_seq.shape[2]

    def predict_flat(flat_x):
        seq = flat_x.reshape(-1, lookback, n_features)
        return model.predict(seq, verbose=0).reshape(-1)

    background = X_train_seq[np.random.choice(len(X_train_seq), 50, replace=False)]
    background_summary = shap.kmeans(background.reshape(len(background), -1), 10)

    test_sample = X_test_seq[:20]
    explainer = shap.KernelExplainer(predict_flat, background_summary)
    shap_values = explainer.shap_values(
        test_sample.reshape(len(test_sample), -1), nsamples=100
    ).reshape(len(test_sample), lookback, n_features)

    mean_abs = np.abs(shap_values).mean(axis=(0, 1))
    top_idx = int(np.argmax(mean_abs))

    result = {
        "global_importance": dict(zip(features, mean_abs.tolist())),
        "one_forecast": dict(zip(features, shap_values[0].sum(axis=0).tolist())),
        "top_feature": features[top_idx],
        "dependence": {
            "value": [float(X_test_seq[i, -1, top_idx]) for i in range(len(shap_values))],
            "shap": [float(shap_values[i][-1, top_idx]) for i in range(len(shap_values))],
        },
    }
    from state_manager import save_artifact
    save_artifact("explain_report", result, "pkl")
    return result
