import os, sys
import pandas as pd
import numpy as np
import joblib
import time
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Set pandas options for better memory usage
pd.options.mode.chained_assignment = None  # default='warn'

BASE = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE, 'data')
MODEL_PATH = os.path.join(BASE, 'model', 'model.pkl')

print(f"[{time.strftime('%H:%M:%S')}] Starting model training...")

# find a data file in data/ (either CSV or Excel)
data_file = None
for f in os.listdir(DATA_DIR):
    if f.lower().endswith(('.csv', '.xlsx', '.xls')):
        data_file = os.path.join(DATA_DIR, f)
        break

if data_file is None:
    print('No data file (CSV or Excel) found in data/ to train on. Place a data file and retry.')
    sys.exit(1)

print(f"[{time.strftime('%H:%M:%S')}] Training on {data_file}")

# Read data file based on extension
file_ext = os.path.splitext(data_file)[1].lower()
try:
    if file_ext in ['.xlsx', '.xls']:
        print(f"[{time.strftime('%H:%M:%S')}] Reading Excel file...")
        df = pd.read_excel(data_file)
    else:  # .csv
        print(f"[{time.strftime('%H:%M:%S')}] Reading CSV file...")
        df = pd.read_csv(data_file)
    
    print(f"[{time.strftime('%H:%M:%S')}] Successfully loaded dataset with {len(df)} records")
except Exception as e:
    print(f"Error loading data file: {str(e)}")
    sys.exit(1)

expected = [
    'Hours_Studied', 'Attendance', 'Parental_Involvement', 'Access_to_Resources', 
    'Previous_Scores', 'Internet_Access', 'Tutoring_Sessions', 'Family_Income', 
    'Peer_Influence', 'Learning_Disabilities', 'Parental_Education_Level', 
    'Distance_from_Home', 'Gender'
]

print(f"[{time.strftime('%H:%M:%S')}] Preprocessing data...")

# Ensure we have all the columns we need
missing_columns = [col for col in expected if col not in df.columns]
if missing_columns:
    print(f"Warning: Missing expected columns: {missing_columns}")

# Create a copy only if needed
needs_copy = False
if 'student_id' in df.columns:
    needs_copy = True

# Handle result column
if 'result' not in df.columns:
    if 'Result' in df.columns:
        # Rename Result to result for consistency
        df.rename(columns={'Result': 'result'}, inplace=True)
    else:
        print(f"[{time.strftime('%H:%M:%S')}] No result column found. Generating results based on previous scores and study hours...")
        needs_copy = True

if needs_copy:
    df = df.copy()

# Generate result if it's still missing
if 'result' not in df.columns:
    # More efficient way to create result column (vectorized)
    scores_mask = pd.notna(df.get('Previous_Scores', pd.Series([np.nan] * len(df)))) & (df.get('Previous_Scores', 0) >= 50)
    hours_mask = pd.notna(df.get('Hours_Studied', pd.Series([np.nan] * len(df)))) & (df.get('Hours_Studied', 0) >= 5)
    df['result'] = np.where(scores_mask | hours_mask, 'Pass', 'Fail')

# Ensure expected columns exist with appropriate default values
print(f"[{time.strftime('%H:%M:%S')}] Ensuring all required columns exist...")
for c in expected:
    if c not in df.columns:
        if c in ['Hours_Studied', 'Attendance', 'Previous_Scores', 'Tutoring_Sessions', 'Family_Income', 'Distance_from_Home']:
            df[c] = 0
        else:
            df[c] = 'Unknown'

# Convert data types for better memory usage
print(f"[{time.strftime('%H:%M:%S')}] Optimizing memory usage...")
numeric_cols = ['Hours_Studied', 'Attendance', 'Previous_Scores', 'Tutoring_Sessions', 'Family_Income', 'Distance_from_Home']
for col in numeric_cols:
    if col in df.columns:
        # Convert to appropriate numeric type
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

# Prepare X, y more efficiently
print(f"[{time.strftime('%H:%M:%S')}] Preparing training data...")
X = df[expected].copy()
y = (df['result'].astype(str).str.lower() == 'pass').astype(np.int8)  # Use int8 for memory efficiency

# Identify numeric vs categorical columns
print(f"[{time.strftime('%H:%M:%S')}] Setting up model pipeline...")
numeric = [c for c in expected if X[c].dtype.kind in 'biufc']
categorical = [c for c in expected if c not in numeric]

numeric_transformer = Pipeline([
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline([
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))  # Non-sparse for better compatibility
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric),
        ('cat', categorical_transformer, categorical)
    ]
)

# Set n_jobs=-1 to use all cores for training
print(f"[{time.strftime('%H:%M:%S')}] Training RandomForest model using all CPU cores...")
clf = Pipeline([
    ('pre', preprocessor),
    ('clf', RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        n_jobs=-1,  # Use all available cores
        verbose=1    # Show progress
    ))
])

# Train the model
training_start = time.time()
clf.fit(X, y)
training_time = time.time() - training_start

# Save the model
print(f"[{time.strftime('%H:%M:%S')}] Training completed in {training_time:.2f} seconds. Saving model...")
joblib.dump(clf, MODEL_PATH)
print(f"[{time.strftime('%H:%M:%S')}] Model saved to {MODEL_PATH}")

# Print some stats
print(f"\nTraining Statistics:")
print(f"- Records processed: {len(df)}")
print(f"- Pass/Fail distribution: {df['result'].value_counts().to_dict()}")
print(f"- Features used: {len(expected)}")
print(f"- Training time: {training_time:.2f} seconds")
