Student_prediction_fullstack_final
-------------------------------
# Student Performance Prediction System

## Features
- Teacher and student user roles with role-based access control
- Teacher-only prediction form for individual student outcome forecasting
- Upload interface for CSV and Excel files (supports files up to 50MB)
- Support for large datasets (5000+ records) with optimized processing
- Machine learning model training with RandomForest algorithm
- Interactive visualizations of student data and predictions
- Comprehensive JWT authentication system
- Dockerized deployment option with docker-compose

## Latest Enhancements
- Excel file support (.xlsx, .xls) in addition to CSV
- Large file uploads up to 50MB (increased from default 16MB limit)
- Optimized model training for large datasets
- Improved error handling and validation for file uploads
- Better user feedback during upload and processing
- Column validation to ensure required features are present

## How to Run Locally

### Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate
pip install -r requirements.txt
# Place your CSV or Excel file into backend/data/ or use the teacher upload interface
python train_model.py   # trains model and creates model/model.pkl
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Docker Deployment
```bash
docker-compose up --build
```

## User Login Information
- **Teacher Login**:
  - Email: `teacher@example.com`
  - Password: `teacher123`
  - Full access to all features, including prediction form, data upload, and model training

- **Student Login**:
  - ID: Student ID from the dataset (e.g., `1001`)
  - Password: `student123` or the student ID itself
  - Limited access - only sees their own record

## Dataset Requirements
The system expects the following columns in your CSV or Excel file:
- Required: `Hours_Studied`, `Attendance`, `Parental_Involvement`, `Access_to_Resources`, `Previous_Scores`, `Internet_Access`, `Tutoring_Sessions`, `Family_Income`, `Peer_Influence`, `Learning_Disabilities`, `Parental_Education_Level`, `Distance_from_Home`, `Gender`
- Optional: `student_id`, `name`, `result`

If `student_id` is not provided, the system will auto-assign IDs starting from 1001.
If `result` is not provided, it will be generated based on Previous_Scores and Hours_Studied.

## File Upload Guidelines
- Supported formats: CSV (.csv), Excel (.xlsx, .xls)
- Maximum file size: 50MB
- For optimal performance with large datasets (5000+ records):
  - Ensure all required columns are present
  - Use consistent data formatting
  - For very large files, consider uploading in smaller batches

## API Endpoints
- `/api/login` - Authentication endpoint
- `/api/students` - Get student records
- `/api/upload` - Upload student data files
- `/api/train` - Trigger model retraining
- `/api/predict` - Make predictions (teacher only)
