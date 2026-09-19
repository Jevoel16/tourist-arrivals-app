# pages/2_Clean.py
import streamlit as st
import pandas as pd

st.title("2. Clean the data")

if "raw_df" not in st.session_state:
    st.warning("Run the Dataset page first.")
    st.stop()

st.info("Duplicates removal: Duplicates are identified based on the 'date' column. Since the data is kept in its original order and we use `keep='first'`, the earliest occurring record for any duplicated date remains, while subsequent duplicates are removed.")

impute_nulls = st.checkbox("Impute missing values (replace with same date last year)", value=False)
st.caption("Imputation strategy: When enabled, missing values are replaced with the value from the exact same date in the previous year.")

if st.button("Run cleaning"):
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
    # Note: Use .values[0] when assigning from another row to prevent NaN due to index misalignment
    df.loc[df["date"] == "2001-02-01", "arrivals"] = df.loc[df["date"] == "2000-02-01", "arrivals"].values[0]

    st.session_state.clean_df = df  # used by every later page
    st.session_state.clean_report = {
        "dup_display": dup_display,
        "missing_df": missing_df,
        "flagged": flagged[["date", "arrivals"]],
    }

# Displayed outside the button block, so the result is still here if you
# leave this page and come back.
if "clean_report" in st.session_state:
    report = st.session_state.clean_report
    st.write("Duplicates Report:")
    if not report["dup_display"].empty:
        st.dataframe(report["dup_display"])
    else:
        st.write("No duplicates found.")
        
    if not report["missing_df"].empty:
        st.dataframe(report["missing_df"])
        
    st.write("Flagged outliers:")
    st.dataframe(report["flagged"])
    
    # Outlier Rationale Description
    st.markdown("""
**Outlier Handling Rationale:**
*(Retained 900k-1m+ arrivals as this is within the expected range for a Dec-Feb period; Replaced 2001-02-01 arrivals with the value from 2000-02-01, as this shows a clear outlier)*
- **Retained:** Why certain flagged dates were kept (e.g., true holiday spikes).
- **Modified:** Why certain dates were hardcoded/smoothed.
    """)
else:
    st.info('Click "Run cleaning" to process the dataset loaded on the Dataset page.')