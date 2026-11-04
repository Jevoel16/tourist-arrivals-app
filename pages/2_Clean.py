# pages/2_Clean.py
import pandas as pd
import streamlit as st

from ui import invalidate_downstream, page_setup, refresh_progress, require, show_table

page_setup(2)
require("raw_df", 1)

with st.container(border=True):
    st.markdown(
        "**Duplicates** are identified on the `date` column. The data keeps its original order and uses "
        "`keep='first'`, so the earliest record for a duplicated date stays and later ones are removed."
    )
    impute_nulls = st.checkbox("Impute missing values (replace with the same date last year)", value=False)
    st.caption(
        "When enabled, each missing value takes the value from the exact same date one year earlier. "
        "Feature selection needs complete data, so leave this on unless you're exploring the raw gaps."
    )
    run = st.button("Run cleaning", type="primary", icon=":material/cleaning_services:")

if run:
    invalidate_downstream(2)
    df = st.session_state.raw_df.copy()

    # --- Duplicates Table Logic ---
    dup_mask_all = df.duplicated(subset="date", keep=False)
    if dup_mask_all.any():
        dup_df = df[dup_mask_all].copy()
        removed_mask = df.duplicated(subset="date", keep="first")

        dup_df["status"] = "retained"
        removed_indices = df[removed_mask].index
        dup_df.loc[removed_indices, "status"] = "removed"

        # New concatenation logic instead of melting
        data_cols = [c for c in dup_df.columns if c not in ["date", "status"]]

        dup_df["column_name"] = ", ".join(data_cols)
        dup_df["value"] = dup_df[data_cols].apply(lambda row: ", ".join(row.astype(str)), axis=1)

        dup_display = dup_df[["date", "column_name", "value", "status"]]
        dup_display = dup_display.sort_values(["date", "status"], ascending=[True, False])
    else:
        dup_display = pd.DataFrame(columns=["date", "column_name", "value", "status"])

    df = df.drop_duplicates(subset="date", keep="first")

    if impute_nulls:
        for col in df.columns:
            if col != "date":
                missing_mask = df[col].isna()
                for idx, row in df[missing_mask].iterrows():
                    last_year_date = row["date"] - pd.DateOffset(years=1)
                    last_year_row = df[df["date"] == last_year_date]

                    if not last_year_row.empty and not pd.isna(last_year_row.iloc[0][col]):
                        df.loc[idx, col] = last_year_row.iloc[0][col]
                    else:
                        st.warning(f"Could not impute '{col}' for {row['date'].date()}: No valid data found for {last_year_date.date()}")

    missing_info = []
    for col in df.columns:
        null_count = df[col].isna().sum()
        if null_count > 0:
            null_dates = df[df[col].isna()]["date"].dt.date.astype(str).tolist()
            missing_info.append({
                "Column Name": col,
                "Null Count": null_count,
                "Dates with Nulls": ", ".join(null_dates)
            })
    missing_df = pd.DataFrame(missing_info)

    q1, q3 = df["arrivals"].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    flagged = df[(df["arrivals"] < lower) | (df["arrivals"] > upper)]

    #outliers
    # Note: Use .values[0] when assigning from another row to prevent NaN due to index misalignment.
    # Guarded so a dataset without the 2000-02-01 row doesn't crash with an IndexError.
    source = df.loc[df["date"] == "2000-02-01", "arrivals"]
    if not source.empty:
        df.loc[df["date"] == "2001-02-01", "arrivals"] = source.values[0]
    else:
        st.warning("2000-02-01 is missing, so the 2001-02-01 outlier was left unchanged.")

    st.session_state.clean_df = df  # used by every later page
    st.session_state.clean_report = {
        "dup_display": dup_display,
        "missing_df": missing_df,
        "flagged": flagged[["date", "arrivals"]],
    }

refresh_progress()

# Displayed outside the button block, so the result is still here if you
# leave this page and come back.
if "clean_report" in st.session_state:
    report = st.session_state.clean_report

    c1, c2, c3 = st.columns(3)
    c1.metric("Duplicate rows", len(report["dup_display"]), border=True)
    c2.metric("Columns with gaps", len(report["missing_df"]), border=True)
    c3.metric("Flagged outliers", len(report["flagged"]), border=True)

    dup_tab, missing_tab, outlier_tab = st.tabs(["Duplicates", "Missing values", "Outliers"])
    with dup_tab:
        if not report["dup_display"].empty:
            show_table(report["dup_display"])
        else:
            st.info("No duplicates found.", icon=":material/check_circle:")
    with missing_tab:
        if not report["missing_df"].empty:
            st.caption("Values still missing after cleaning")
            show_table(report["missing_df"])
        else:
            st.success("No missing values remain.", icon=":material/check_circle:")
    with outlier_tab:
        st.caption("Months outside 1.5 × IQR of arrivals")
        show_table(report["flagged"], formats={"arrivals": "localized"})
        st.info(
            "**Outlier handling.** The 900k–1M+ arrivals around December–February are kept: they fall within the "
            "expected range for the peak season and follow the previous year's pattern. 2001-02-01 is replaced with "
            "the 2000-02-01 value because it clearly breaks from the rest of the series.",
            icon=":material/info:",
        )
else:
    st.info('Click "Run cleaning" to process the dataset loaded on the Dataset page.', icon=":material/info:")
