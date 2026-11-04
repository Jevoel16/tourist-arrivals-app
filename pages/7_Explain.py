# pages/7_Explain.py
import altair as alt
import numpy as np
import pandas as pd
import shap
import streamlit as st

from ui import bar_chart, invalidate_downstream, page_setup, refresh_progress, require

page_setup(7)
require("model", 5)

if st.button("Compute SHAP values", type="primary", icon=":material/lightbulb:"):
    invalidate_downstream(7)
    with st.spinner("Running KernelSHAP on 20 test windows… this can take a minute or two."):
        X_train_seq = st.session_state.X_train_seq
        X_test_seq = st.session_state.X_test_seq
        features = st.session_state.selected_features
        model = st.session_state.model
        lookback, n_features = X_train_seq.shape[1], X_train_seq.shape[2]

        # DeepExplainer/GradientExplainer need custom TF gradients that this
        # TensorFlow version doesn't register for LSTM's internal ops (raises
        # "gradient registry has no entry for: shap_TensorListStack"), so we
        # treat the model as a black box instead.
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

        st.session_state.explain_report = {
            "global_importance": dict(zip(features, mean_abs.tolist())),
            "one_forecast": dict(zip(features, shap_values[0].sum(axis=0).tolist())),
            "top_feature": features[top_idx],
            "dependence": {
                "value": [float(X_test_seq[i, -1, top_idx]) for i in range(len(shap_values))],
                "shap": [float(shap_values[i][-1, top_idx]) for i in range(len(shap_values))],
            },
        }

refresh_progress()

# Displayed outside the button block, so the result is still here if you
# leave this page and come back.
if "explain_report" in st.session_state:
    r = st.session_state.explain_report
    st.caption("SHAP shows what the model leaned on, not proven real-world cause and effect.")

    left, right = st.columns(2)
    with left, st.container(border=True):
        st.subheader("Global feature importance")
        st.caption("Mean |SHAP| across 20 test windows and all 12 lookback months")
        st.altair_chart(bar_chart(r["global_importance"], "mean |SHAP|").properties(height=300), width="stretch")
    with right, st.container(border=True):
        st.subheader("One forecast — feature contributions")
        st.caption("SHAP for the first test window, summed over its 12 months")
        st.altair_chart(bar_chart(r["one_forecast"], "SHAP contribution", signed=True).properties(height=300), width="stretch")

    with st.container(border=True):
        st.subheader(f"Dependence plot — {r['top_feature']}")
        st.caption("Each point is one test window: its latest value (scaled 0–1) against that value's SHAP contribution")
        dep = pd.DataFrame(r["dependence"])
        chart = (
            alt.Chart(dep)
            .mark_circle(size=70, color="#7c3aed", opacity=0.8)
            .encode(
                x=alt.X("value:Q", title=f"{r['top_feature']} (scaled 0–1)"),
                y=alt.Y("shap:Q", title="SHAP value"),
                tooltip=[alt.Tooltip("value:Q", format=".3f"), alt.Tooltip("shap:Q", format=".5f")],
            )
            .properties(height=300)
        )
        zero = alt.Chart(pd.DataFrame({"y": [0]})).mark_rule(strokeDash=[4, 4], color="gray").encode(y="y:Q")
        st.altair_chart(chart + zero, width="stretch")
else:
    st.info('Click "Compute SHAP values" to explain the trained model\'s predictions.', icon=":material/info:")
