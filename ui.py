"""Shared UI helpers for the Streamlit pages.

Only presentation and session bookkeeping live here; each page keeps its own
pipeline logic inline.
"""
from dataclasses import dataclass, field

import altair as alt
import pandas as pd
import streamlit as st

PRIMARY = "#059669"
POSITIVE = "#e11d48"  # SHAP pushing the forecast up
NEGATIVE = "#2563eb"  # SHAP pulling the forecast down


@dataclass(frozen=True)
class Stage:
    step: int
    name: str
    title: str
    page: str
    icon: str
    description: str
    # session_state keys this stage writes; cleared when an earlier stage re-runs
    keys: tuple = field(default_factory=tuple)


STAGES = [
    Stage(1, "Dataset", "Dataset summary", "pages/1_Dataset.py", ":material/database:",
          "Load the monthly arrivals dataset, preview it and scan for gaps.", ("raw_df",)),
    Stage(2, "Clean", "Clean the data", "pages/2_Clean.py", ":material/cleaning_services:",
          "Remove duplicate dates, optionally impute missing values and flag outliers with the IQR rule.",
          ("clean_df", "clean_report")),
    Stage(3, "Features", "Feature selection", "pages/3_Features.py", ":material/filter_list:",
          "Keep features with Spearman |rho| > 0.10 and p < 0.05, then drop multicollinear ones until every VIF < 5.",
          ("selected_features", "feature_report")),
    Stage(4, "Prepare", "Prevent leakage and prepare sequences", "pages/4_Prepare.py", ":material/build:",
          "Split chronologically, fit the scalers on training data only and build 12-month windows.",
          ("scaler_X", "scaler_y", "X_train_seq", "y_train_seq", "X_test_seq", "y_test_seq", "test_df", "prepare_report")),
    Stage(5, "Train", "Train and tune the LSTM", "pages/5_Train.py", ":material/neurology:",
          "Grid search over units, dropout and batch size with early stopping.", ("model", "train_report")),
    Stage(6, "Evaluate", "Evaluate honestly", "pages/6_Evaluate.py", ":material/monitoring:",
          "Score the LSTM on the held-out test set against naive and seasonal-naive baselines.", ("evaluate_report",)),
    Stage(7, "Explain", "Explain with SHAP", "pages/7_Explain.py", ":material/lightbulb:",
          "Use KernelSHAP to see which features the model leaned on.", ("explain_report",)),
    Stage(8, "Forecast", "Forecast", "pages/8_Forecast.py", ":material/trending_up:",
          "Edit the last 12 months of readings and predict next month's arrivals.", ("forecast_report",)),
]


def is_done(stage: Stage) -> bool:
    return stage.keys[0] in st.session_state


def page_setup(step: int) -> Stage:
    """Page config, sidebar progress and a consistent header for a stage page."""
    stage = STAGES[step - 1]
    st.set_page_config(page_title=f"{stage.name} · Arrivals Lab", page_icon=stage.icon, layout="wide")
    sidebar_progress(current=step)
    st.caption(f"STAGE {stage.step} OF {len(STAGES)}")
    st.title(stage.title)
    st.markdown(stage.description)
    return stage


def sidebar_progress(current: int | None = None) -> None:
    """Draws stage progress in the sidebar. Call refresh_progress() after a stage runs."""
    st.session_state["_progress_current"] = current
    with st.sidebar:
        # Placeholder so refresh_progress() can redraw it once the page's work is done
        st.session_state["_progress_slot"] = st.empty()
        st.divider()
        st.caption("Based on Tourist Arrivals Forecasting Lab by [Sprucetrap](https://github.com/Jevoel16)")
    refresh_progress()


def refresh_progress() -> None:
    slot = st.session_state.get("_progress_slot")
    if slot is None:
        return
    current = st.session_state.get("_progress_current")
    done = sum(is_done(s) for s in STAGES)
    with slot.container():
        st.markdown("**Pipeline progress**")
        st.progress(done / len(STAGES), text=f"{done} of {len(STAGES)} stages complete")
        for s in STAGES:
            mark = ":green[:material/check_circle:]" if is_done(s) else ":gray[:material/radio_button_unchecked:]"
            label = f"**{s.step}. {s.name}**" if s.step == current else f"{s.step}. {s.name}"
            st.markdown(f"{mark} {label}")


def require(key: str, step: int) -> None:
    """Stop the page with a link to the stage that produces `key` if it hasn't run yet."""
    if key in st.session_state:
        return
    prev = STAGES[step - 1]
    st.warning(f"Complete the **{prev.name}** stage first. Stages run in order so every result uses up-to-date data.",
               icon=":material/lock:")
    st.page_link(prev.page, label=f"Go to {prev.name}", icon=prev.icon)
    st.stop()


def invalidate_downstream(step: int) -> None:
    """Re-running a stage clears every later stage's results, like the FastAPI artifact chain."""
    for stage in STAGES[step:]:
        for key in stage.keys:
            st.session_state.pop(key, None)


def reset_session() -> None:
    for stage in STAGES:
        for key in stage.keys:
            st.session_state.pop(key, None)


def show_table(data, formats: dict | None = None, height: int | str = "auto", **kwargs) -> None:
    """st.dataframe with number formats, no index and full width."""
    config = {col: st.column_config.NumberColumn(format=fmt) for col, fmt in (formats or {}).items()}
    if isinstance(data, pd.DataFrame):
        # Monthly data: show dates without the midnight time part
        for col in data.select_dtypes(include="datetime").columns:
            config.setdefault(col, st.column_config.DateColumn(format="YYYY-MM-DD"))
    st.dataframe(data, column_config=config, hide_index=True, width="stretch", height=height, **kwargs)


def badges(items, color: str = "green") -> str:
    """Markdown badge row, e.g. for selected feature names."""
    return " ".join(f":{color}-badge[{item}]" for item in items)


def bar_chart(values: dict, x_title: str, signed: bool = False) -> alt.Chart:
    """Horizontal bar chart sorted by magnitude; `signed` colours bars by direction."""
    df = pd.DataFrame({"feature": list(values.keys()), "value": list(values.values())})
    df["direction"] = df["value"].apply(lambda v: "pushes up" if v >= 0 else "pulls down")
    color = (
        alt.Color("direction:N", scale=alt.Scale(domain=["pushes up", "pulls down"], range=[POSITIVE, NEGATIVE]),
                  legend=alt.Legend(title=None, orient="top"))
        if signed else alt.value(NEGATIVE)
    )
    return (
        alt.Chart(df)
        .mark_bar(cornerRadiusEnd=4)
        .encode(
            x=alt.X("value:Q", title=x_title),
            y=alt.Y("feature:N", sort=alt.EncodingSortField(field="value", op="max", order="descending") if not signed
                    else alt.SortField("value", order="ascending"), title=None),
            color=color,
            tooltip=[alt.Tooltip("feature:N"), alt.Tooltip("value:Q", format=".5f")],
        )
    )
