# Home.py
import streamlit as st

from ui import STAGES, is_done, reset_session, sidebar_progress

st.set_page_config(page_title="Arrivals Lab", page_icon=":material/flight_land:", layout="wide")
sidebar_progress()

st.caption("LSTM FORECASTING PIPELINE")
st.title("Philippine Tourist Arrivals — Forecasting Lab")
st.markdown(
    "Work through the stages in order. Each one depends on the stage before it having run in this "
    "session, and re-running a stage clears the results of every stage after it."
)

done = sum(is_done(s) for s in STAGES)
next_stage = next((s for s in STAGES if not is_done(s)), None)

left, right = st.columns([3, 1], vertical_alignment="center")
with left:
    st.progress(done / len(STAGES), text=f"{done} of {len(STAGES)} stages complete")
with right:
    if next_stage:
        st.page_link(next_stage.page, label=f"Continue: {next_stage.name}", icon=":material/arrow_forward:")
    else:
        st.success("Pipeline complete", icon=":material/check_circle:")

st.subheader("Stages")
for row in (STAGES[:4], STAGES[4:]):
    for col, stage in zip(st.columns(4), row):
        with col, st.container(border=True):
            prev_done = stage.step == 1 or is_done(STAGES[stage.step - 2])
            if is_done(stage):
                status = ":green[:material/check_circle: Done]"
            elif prev_done:
                status = ":blue[:material/play_circle: Ready]"
            else:
                status = f":gray[:material/lock: Complete {STAGES[stage.step - 2].name} first]"
            st.markdown(f"**{stage.step:02d} · {stage.name}**")
            st.caption(stage.description)
            st.markdown(status)
            st.page_link(stage.page, label="Open", icon=stage.icon, disabled=not prev_done)

if done:
    st.divider()
    if st.button("Reset session", icon=":material/restart_alt:", help="Clears every stage's results from this session"):
        reset_session()
        st.rerun()
