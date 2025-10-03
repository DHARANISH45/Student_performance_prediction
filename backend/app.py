import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import jwt
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
# Increase maximum file size to 50MB
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
CORS(app)

SECRET = os.environ.get('JWT_SECRET', 'CHANGE_THIS_SECRET')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'model.pkl')
UPLOAD_FOLDER = DATA_DIR
ALLOWED_EXT = {'csv', 'xlsx', 'xls'}

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), 'model'), exist_ok=True)

# load model if exists
model = None
try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
except Exception as e:
    print('Could not load model:', e)
    model = None

# demo users
USERS = {'teacher@example.com': {'password':'teacher123','role':'teacher'}}

def create_token(payload):
    import time
    return jwt.encode({**payload, 'exp': int(time.time()) + (8 * 3600)}, SECRET, algorithm='HS256')

def decode_token(token):
    try:
        return jwt.decode(token, SECRET, algorithms=['HS256'])
    except Exception:
        return None

@app.route('/api/login', methods=['POST'])
def login():
    print("Login request received:", request.json)
    data = request.json or {}
    role = data.get('role')
    
    print(f"Login role: {role}, Data received: {data}")
    
    if role=='teacher':
        email = data.get('email'); pw = data.get('password')
        u = USERS.get(email)
        if u and u.get('password')==pw:
            token = create_token({'email':email,'role':'teacher'})
            return jsonify({'ok':True,'token':token,'role':'teacher'})
        return jsonify({'ok':False,'message':'Invalid teacher credentials'}),401
    else:
        # Handle student login
        print(f"Full student login request data: {data}")
        
        # Get student ID from either id or email field (backward compatibility)
        sid = data.get('id')
        if sid is None:
            # Try to get ID from email field (older form submissions might use this)
            sid = data.get('email')
            print(f"No 'id' field found, using 'email' field instead: {sid}")
        
        print(f"Raw student ID from request: {sid}, Type: {type(sid)}")
        
        # Check if ID is missing or None
        if sid is None:
            print("Student ID is None/missing in request")
            return jsonify({'ok':False,'message':'Student ID is required'}),400
        
        # Convert to string and clean up
        sid = str(sid).strip()
        pw = str(data.get('password', '')).strip()
        print(f"Processed student login attempt - ID: '{sid}', Password: '{pw}'")
        
        # Check if ID is empty after processing
        if not sid:
            print("Student ID is empty after processing")
            return jsonify({'ok':False,'message':'Student ID is required'}),400
            
        # Check if password is empty
        if not pw:
            print("Password is empty")
            return jsonify({'ok':False,'message':'Password is required'}),400
            
        # check student id exists in any CSV in data/
        df = None
        for f in os.listdir(DATA_DIR):
            if f.lower().endswith('.csv'):
                try:
                    df = pd.read_csv(os.path.join(DATA_DIR,f))
                    print(f"Found data file: {f} with {len(df)} records")
                    break
                except Exception as e:
                    print(f"Error reading file {f}: {str(e)}")
                    continue
        if df is None:
            return jsonify({'ok':False,'message':'No student data available on server'}),400
            
        # assume student_id column exists or assign by index
        if 'student_id' not in df.columns:
            # create student_id sequential starting at 1001
            df = df.copy()
            df.insert(0, 'student_id', range(1001, 1001 + len(df)))
            print("Added student_id column")
        
        # Convert student_id column to string for proper comparison
        df['student_id'] = df['student_id'].astype(str).str.strip()
        
        # Print all student IDs for debugging
        student_ids = df['student_id'].tolist()
        print(f"First 5 student IDs in data: {student_ids[:5]}")
        print(f"Looking for student ID: '{sid}' in database")
        
        # Check if student ID exists using explicit comparison
        exists = False
        for db_id in student_ids:
            if str(db_id).strip() == sid:
                exists = True
                print(f"Found matching ID: '{db_id}' == '{sid}'")
                break
        
        print(f"Student ID '{sid}' exists in data: {exists}")
        
        # Check password (only student123 is valid)
        valid_pw = (pw == 'student123')
        print(f"Password valid: {valid_pw}")
        
        # Handle error cases
        if not exists:
            print(f"Login failed: Student ID '{sid}' not found in database")
            return jsonify({'ok':False,'message':f'Student ID {sid} not found in database'}),401
            
        if not valid_pw:
            print(f"Login failed: Incorrect password for Student ID '{sid}'")
            return jsonify({'ok':False,'message':'Incorrect password'}),401
            
        # Success case
        token = create_token({'id':sid,'role':'student'})
        print(f"Student login successful for ID: {sid}")
        return jsonify({'ok':True,'token':token,'role':'student','id':sid})

def require_auth_role(req, role=None):
    auth = req.headers.get('Authorization','')
    print(f"DEBUG: Authorization header: {auth}")
    if not auth.startswith('Bearer '): 
        print("DEBUG: No Bearer token found")
        return None
    token = auth.split(' ',1)[1]
    print(f"DEBUG: Token: {token}")
    payload = decode_token(token)
    print(f"DEBUG: Decoded payload: {payload}")
    if not payload: 
        print("DEBUG: Failed to decode token")
        return None
    if role and payload.get('role')!=role: 
        print(f"DEBUG: Role mismatch. Expected: {role}, Got: {payload.get('role')}")
        return None
    return payload

@app.route('/api/students', methods=['GET'])
def students():
    # protected endpoint: teacher sees all, student sees their record
    auth = require_auth_role(request)
    if not auth: return jsonify({'ok':False,'message':'Unauthorized'}),401
    # find first csv
    df = None
    for f in os.listdir(DATA_DIR):
        if f.lower().endswith('.csv'):
            try:
                df = pd.read_csv(os.path.join(DATA_DIR,f))
                break
            except:
                continue
    if df is None:
        return jsonify([])
    if 'student_id' not in df.columns:
        df = df.copy()
        df.insert(0, 'student_id', range(1001, 1001 + len(df)))
    if auth.get('role')=='teacher':
        return jsonify(df.to_dict(orient='records'))
    else:
        sid = str(auth.get('id'))
        rec = df[df['student_id'].astype(str)==sid]
        if rec.empty: return jsonify({}),404
        return jsonify(rec.iloc[0].to_dict())

@app.route('/api/upload', methods=['POST'])
def upload_csv():
    # only teacher
    auth = require_auth_role(request, role='teacher')
    if not auth: return jsonify({'ok':False,'message':'Unauthorized'}),401
    if 'file' not in request.files:
        return jsonify({'ok':False,'message':'No file part'}),400
    f = request.files['file']
    
    # Check if the file is empty
    if f.filename == '':
        return jsonify({'ok':False,'message':'No file selected'}),400
        
    filename = secure_filename(f.filename)
    file_ext = filename.rsplit('.',1)[1].lower() if '.' in filename else ''
    
    if file_ext not in ALLOWED_EXT:
        return jsonify({'ok':False,'message':f'File type not allowed. Please upload .csv, .xlsx or .xls files'}),400
    
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    f.save(save_path)
    
    # Process the file based on extension
    try:
        # Read the file based on its extension
        if file_ext in ['xlsx', 'xls']:
            df = pd.read_excel(save_path)
        else:  # csv
            df = pd.read_csv(save_path)
        
        # Validate required columns
        required_columns = [
            'Hours_Studied', 'Attendance', 'Parental_Involvement', 'Access_to_Resources',
            'Previous_Scores', 'Internet_Access', 'Tutoring_Sessions', 'Family_Income',
            'Peer_Influence', 'Learning_Disabilities', 'Parental_Education_Level',
            'Distance_from_Home', 'Gender'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({
                'ok': False, 
                'message': f'Missing required columns: {", ".join(missing_columns)}'
            }), 400
        
            # Add student_id if it doesn't exist
        if 'student_id' not in df.columns:
            df.insert(0, 'student_id', range(1001, 1001 + len(df)))
            
        # Add Student_Name if it doesn't exist
        if 'Student_Name' not in df.columns:
            # Generate placeholder names
            df.insert(1, 'Student_Name', [f'Student_{i}' for i in range(len(df))])        # Generate predictions for all students if model exists
        global model
        if model is not None:
            try:
                print(f"Generating predictions for {len(df)} students...")
                
                # Prepare data for prediction by ensuring all required columns exist with appropriate types
                numeric_fields = ['Hours_Studied', 'Attendance', 'Previous_Scores', 'Tutoring_Sessions', 'Family_Income', 'Distance_from_Home']
                categorical_fields = ['Parental_Involvement', 'Access_to_Resources', 'Internet_Access', 'Peer_Influence', 'Learning_Disabilities', 'Parental_Education_Level', 'Gender']
                
                # Handle missing numeric fields
                for col in numeric_fields:
                    if col not in df.columns:
                        df[col] = 0
                    else:
                        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                
                # Handle missing categorical fields
                for col in categorical_fields:
                    if col not in df.columns:
                        # Set default values
                        if col == 'Parental_Involvement': df[col] = 'Medium'
                        elif col == 'Access_to_Resources': df[col] = 'Yes'
                        elif col == 'Internet_Access': df[col] = 'Yes'
                        elif col == 'Peer_Influence': df[col] = 'Neutral'
                        elif col == 'Learning_Disabilities': df[col] = 'No'
                        elif col == 'Parental_Education_Level': df[col] = 'Secondary'
                        elif col == 'Gender': df[col] = 'Other'
                    else:
                        # Fill missing values with mode or default
                        mode_value = df[col].mode().iloc[0] if not df[col].isna().all() else 'Unknown'
                        df[col] = df[col].fillna(mode_value)
                
                # Select only the required features in the correct order
                X_pred = df[required_columns]
                
                # Make predictions using the model pipeline (which applies the preprocessing)
                predictions = model.predict(X_pred)
                
                # Safely handle probabilities with error handling
                probabilities = None
                try:
                    if hasattr(model, 'predict_proba'):
                        proba_result = model.predict_proba(X_pred)
                        
                        # Handle different shapes of probability results
                        if proba_result.ndim > 1 and proba_result.shape[1] >= 2:
                            # Standard case - get probability of positive class (usually index 1)
                            probabilities = proba_result[:, 1]
                        elif proba_result.ndim > 0 and proba_result.size > 0:
                            # Single probability value
                            probabilities = proba_result.flatten()
                        else:
                            # Fallback if shape is unexpected
                            probabilities = np.array([1.0 if pred == 1 else 0.0 for pred in predictions])
                except Exception as e:
                    print(f"Error calculating probabilities: {str(e)}")
                    probabilities = np.array([1.0 if pred == 1 else 0.0 for pred in predictions])
                
                # Add predictions to dataframe
                df['result'] = ['Pass' if pred == 1 else 'Fail' for pred in predictions]
                if probabilities is not None:
                    df['prediction_probability'] = probabilities
                
                # Log the feature importance if available
                if hasattr(model, 'named_steps') and hasattr(model.named_steps.get('clf', None), 'feature_importances_'):
                    importances = model.named_steps['clf'].feature_importances_
                    print("Top 5 important features:")
                    feature_importance = [(i, col) for i, col in zip(importances, required_columns)]
                    feature_importance.sort(reverse=True)
                    for i, (imp, col) in enumerate(feature_importance[:5]):
                        print(f"{i+1}. {col}: {imp:.4f}")
                    
                print(f"Predictions generated: {sum(predictions)} Pass, {len(predictions) - sum(predictions)} Fail")
            except Exception as e:
                print(f"Error generating predictions: {str(e)}")
        else:
            # If no model exists yet, generate default results based on scores and hours
            if 'result' not in df.columns:
                print("No model available. Generating default results based on scores and hours.")
                scores_mask = pd.notna(df.get('Previous_Scores', pd.Series([np.nan] * len(df)))) & (df.get('Previous_Scores', 0) >= 50)
                hours_mask = pd.notna(df.get('Hours_Studied', pd.Series([np.nan] * len(df)))) & (df.get('Hours_Studied', 0) >= 5)
                df['result'] = np.where(scores_mask | hours_mask, 'Pass', 'Fail')
            
        # Save as canonical CSV
        output_path = os.path.join(UPLOAD_FOLDER, 'students.csv')
        df.to_csv(output_path, index=False)
        
        row_count = len(df)
        pass_count = len(df[df['result'] == 'Pass'])
        fail_count = row_count - pass_count
        
        return jsonify({
            'ok': True, 
            'message': f'Successfully processed {row_count} student records ({pass_count} Pass, {fail_count} Fail). File saved as students.csv.'
        })
        
    except Exception as e:
        return jsonify({'ok':False,'message':'Error processing file: '+str(e)}),500

@app.route('/api/train', methods=['POST'])
def train():
    # teacher only
    auth = require_auth_role(request, role='teacher')
    if not auth: return jsonify({'ok':False,'message':'Unauthorized'}),401
    # run training script (train_model.py) if present in backend; else train here if scikit-learn available
    try:
        train_script = os.path.join(os.path.dirname(__file__), 'train_model.py')
        if os.path.exists(train_script):
            # execute train script in subprocess to avoid dependency issues
            import subprocess, sys
            res = subprocess.run([sys.executable, train_script], capture_output=True, text=True)
            if res.returncode!=0:
                return jsonify({'ok':False,'message':'Train failed','stdout':res.stdout,'stderr':res.stderr}),500
            return jsonify({'ok':True,'message':'Retrain finished','stdout':res.stdout})
        else:
            return jsonify({'ok':False,'message':'No train_model.py found on server'}),500
    except Exception as e:
        return jsonify({'ok':False,'message':str(e)}),500

@app.route('/api/predict', methods=['POST'])
def predict():
    auth = require_auth_role(request)
    if not auth: return jsonify({'ok':False,'message':'Unauthorized'}),401
    # Only teachers can use form-based prediction per requirement
    if auth.get('role')!='teacher':
        return jsonify({'ok':False,'message':'Only teachers can predict via form'}),403
    payload = request.json or {}
    # find model
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            try:
                model = joblib.load(MODEL_PATH)
            except Exception as e:
                return jsonify({'ok':False,'message':'Model load error: '+str(e)}),500
        else:
            return jsonify({'ok':False,'message':'Model not available. Please train first.'}),400
    # expected features: client should send the 13 fields (Student_Name is not used for prediction)
    expected = ['Hours_Studied','Attendance','Parental_Involvement','Access_to_Resources','Previous_Scores','Internet_Access','Tutoring_Sessions','Family_Income','Peer_Influence','Learning_Disabilities','Parental_Education_Level','Distance_from_Home','Gender']
    try:
        # Create a dataframe from payload but ensure Student_Name is not used in prediction
        if 'Student_Name' in payload:
            student_name = payload.pop('Student_Name')  # Remove but save it
            df = pd.DataFrame([payload])
            # Add it back after prediction if needed
            payload['Student_Name'] = student_name
        else:
            df = pd.DataFrame([payload])
        
        # Handle missing fields with appropriate defaults
        numeric_fields = ['Hours_Studied', 'Attendance', 'Previous_Scores', 'Tutoring_Sessions', 'Family_Income', 'Distance_from_Home']
        categorical_fields = ['Parental_Involvement', 'Access_to_Resources', 'Internet_Access', 'Peer_Influence', 'Learning_Disabilities', 'Parental_Education_Level', 'Gender']
        
        # Set default values for missing fields
        for c in numeric_fields:
            if c not in df.columns or pd.isna(df[c]).any():
                df[c] = 0
        
        for c in categorical_fields:
            if c not in df.columns or pd.isna(df[c]).any():
                # Set appropriate defaults for categorical fields
                if c == 'Parental_Involvement': df[c] = 'Medium'
                elif c == 'Access_to_Resources': df[c] = 'Yes'
                elif c == 'Internet_Access': df[c] = 'Yes'
                elif c == 'Peer_Influence': df[c] = 'Neutral'
                elif c == 'Learning_Disabilities': df[c] = 'No'
                elif c == 'Parental_Education_Level': df[c] = 'Secondary'
                elif c == 'Gender': df[c] = 'Other'
        
        # Convert numeric fields to proper type
        for c in numeric_fields:
            df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)
        
        # Ensure we use the exact expected columns in the right order
        df = df[expected]
        
        # Use model's predict method - it will apply the same preprocessing as during training
        pred = model.predict(df)[0]
        
        # Handle predict_proba safely with error catching
        try:
            if hasattr(model, 'predict_proba'):
                proba_result = model.predict_proba(df)
                
                # Debug information
                print(f"Prediction result: {pred}")
                print(f"Probability shape: {proba_result.shape}")
                
                # Handle different shapes of probability results
                if proba_result.ndim > 1 and proba_result.shape[1] >= 2:
                    # If we have a probability for each class (standard case)
                    prob = float(proba_result[0][1])
                    print(f"Using probability from array: {prob}")
                elif proba_result.ndim > 0 and proba_result.size > 0:
                    # If we have a single probability value
                    prob = float(proba_result[0])
                    print(f"Using single probability value: {prob}")
                else:
                    # Fallback
                    prob = 1.0 if int(pred) == 1 else 0.0
                    print(f"Using fallback probability: {prob}")
            else:
                prob = 1.0 if int(pred) == 1 else 0.0
                print(f"Model has no predict_proba method, using fallback: {prob}")
        except Exception as e:
            print(f"Error calculating probability: {str(e)}")
            prob = 1.0 if int(pred) == 1 else 0.0
        
        # Return detailed information about the prediction
        return jsonify({
            'prediction': 'Pass' if int(pred)==1 else 'Fail',
            'probability': prob,
            'input_features': payload
        })
    except Exception as e:
        return jsonify({'ok':False,'message':str(e)}),500

# serve frontend build
@app.route('/', defaults={'path':''})
@app.route('/<path:path>')
def serve(path):
    build_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')
    if path != "" and os.path.exists(os.path.join(build_dir, path)):
        return send_from_directory(build_dir, path)
    else:
        index = os.path.join(build_dir, 'index.html')
        if os.path.exists(index):
            return send_from_directory(build_dir, 'index.html')
        return jsonify({'message':'Backend running. Frontend not built.'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT',5000)), debug=True)
