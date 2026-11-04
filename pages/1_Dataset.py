# pages/1_Dataset.py
import altair as alt
import pandas as pd
import streamlit as st

from ui import page_setup, show_table

# Loaded before page_setup so the sidebar progress already counts this stage
if "raw_df" not in st.session_state:
    st.session_state.raw_df = (
        pd.read_csv("data/tourist_arrivals.csv", parse_dates=["date"])
        .sort_values("date")
        .reset_index(drop=True)
    )

page_setup(1)

df = st.session_state.raw_df

expected = pd.date_range(df["date"].min(), df["date"].max(), freq="MS")
missing_months = expected.difference(df["date"])

c1, c2, c3, c4 = st.columns(4)
c1.metric("Rows", f"{len(df):,}", border=True)
c2.metric("Columns", len(df.columns), border=True)
c3.metric("First month", f"{df['date'].min():%Y-%m}", border=True)
c4.metric("Last month", f"{df['date'].max():%Y-%m}", border=True)

if len(missing_months):
    st.warning(f"Missing months: {', '.join(f'{m:%Y-%m}' for m in missing_months)}", icon=":material/warning:")
else:
    st.success("No gaps in the monthly sequence.", icon=":material/check_circle:")

preview_tab, chart_tab, dictionary_tab = st.tabs(["Preview", "Arrivals over time", "Data dictionary"])

with preview_tab:
    st.caption("First five rows of the raw CSV")
    show_table(df.head())

with chart_tab:
    chart = (
        alt.Chart(df)
        .mark_line(color="#059669")
        .encode(
            x=alt.X("date:T", title="Month"),
            y=alt.Y("arrivals:Q", title="Tourist arrivals", axis=alt.Axis(format="~s")),
            tooltip=[alt.Tooltip("date:T", format="%Y-%m"), alt.Tooltip("arrivals:Q", format=",.0f")],
        )
        .properties(height=320)
    )
    st.altair_chart(chart, width="stretch")

with dictionary_tab:
    show_table(pd.DataFrame([
        ("date", "First day of the month (YYYY-MM-01)"),
        ("year / month / quarter", "Calendar year, month number (1–12) and quarter (1–4)"),
        ("season", "Dry, Wet or Transition"),
        ("monsoon", "Amihan (northeast), Habagat (southwest) or Transition"),
        ("is_holiday_peak", "1 if a major holiday or peak-travel month, else 0"),
        ("temp_mean_c / min / max", "Mean, mean-minimum and mean-maximum air temperature (°C)"),
        ("rainfall_mm / rainy_days", "Total monthly rainfall (mm) and number of rainy days"),
        ("humidity_pct", "Mean relative humidity (%)"),
        ("typhoon_count / max_wind", "Tropical cyclones affecting the area, and the strongest one's max wind (kt)"),
        ("storm_signal_days", "Days that month under a public storm warning signal"),
        ("pm25_ugm3", "Mean fine particulate air quality (µg/m³)"),
        ("wave_height_m", "Mean significant wave height (m)"),
        ("arrivals", "Total tourist arrivals that month — the forecasting target"),
    ], columns=["Column", "Meaning"]))
