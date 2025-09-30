# Student Performance Prediction SystemStudent_prediction_fullstack_final

-------------------------------

## Overview# Student Performance Prediction System

A full-stack application for predicting student pass/fail outcomes using machine learning. The system analyzes various academic and socioeconomic factors to predict student performance and provide actionable insights.

## Features

## Features- Teacher and student user roles with role-based access control

- Teacher and student user roles with role-based access control- Teacher-only prediction form for individual student outcome forecasting

- Teacher-only prediction form for individual student outcome forecasting- Upload interface for CSV and Excel files (supports files up to 50MB)

- Upload interface for CSV and Excel files (supports files up to 50MB)- Support for large datasets (5000+ records) with optimized processing

- Support for large datasets (5000+ records) with optimized processing- Machine learning model training with RandomForest algorithm

- Machine learning model training with RandomForest algorithm- Interactive visualizations of student data and predictions

- Interactive visualizations of student data and predictions- Comprehensive JWT authentication system

- Comprehensive JWT authentication system- Dockerized deployment option with docker-compose

- Dockerized deployment option with docker-compose

## Latest Enhancements

## Technologies Used- Excel file support (.xlsx, .xls) in addition to CSV

- **Backend**: Flask, pandas, scikit-learn, JWT authentication- Large file uploads up to 50MB (increased from default 16MB limit)

- **Frontend**: React, Material UI, Recharts- Optimized model training for large datasets

- **Data Processing**: pandas, numpy- Improved error handling and validation for file uploads

- **Machine Learning**: scikit-learn (RandomForestClassifier)- Better user feedback during upload and processing

- **Containerization**: Docker, docker-compose- Column validation to ensure required features are present



## How to Run Locally## How to Run Locally



### Backend Setup### Backend Setup

```bash```bash

cd backendcd backend

python -m venv venvpython -m venv venv

# Windows# Windows

venv\Scripts\activatevenv\Scripts\activate

# Linux/Mac# Linux/Mac

# source venv/bin/activate# source venv/bin/activate

pip install -r requirements.txtpip install -r requirements.txt

python app.py# Place your CSV or Excel file into backend/data/ or use the teacher upload interface

```python train_model.py   # trains model and creates model/model.pkl

python app.py

### Frontend Setup```

```bash

cd frontend### Frontend Setup

npm install```bash

npm startcd frontend

```npm install

npm start

## Docker Deployment```

```bash

docker-compose up --build## Docker Deployment

``````bash

docker-compose up --build

## User Login Information```

- **Teacher Login**:

  - Email: `teacher@example.com`## User Login Information

  - Password: `teacher123`- **Teacher Login**:

- **Student Login**:  - Email: `teacher@example.com`

  - ID: Student ID from dataset  - Password: `teacher123`

  - Password: `student123`  - Full access to all features, including prediction form, data upload, and model training



## Dataset Requirements- **Student Login**:

The system expects the following columns:  - ID: Student ID from the dataset (e.g., `1001`)

- `Hours_Studied`, `Attendance`, `Parental_Involvement`, `Access_to_Resources`  - Password: `student123` or the student ID itself

- `Previous_Scores`, `Internet_Access`, `Tutoring_Sessions`, `Family_Income`  - Limited access - only sees their own record

- `Peer_Influence`, `Learning_Disabilities`, `Parental_Education_Level`

- `Distance_from_Home`, `Gender`## Dataset Requirements

The system expects the following columns in your CSV or Excel file:

## Contributing- Required: `Hours_Studied`, `Attendance`, `Parental_Involvement`, `Access_to_Resources`, `Previous_Scores`, `Internet_Access`, `Tutoring_Sessions`, `Family_Income`, `Peer_Influence`, `Learning_Disabilities`, `Parental_Education_Level`, `Distance_from_Home`, `Gender`

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.- Optional: `student_id`, `name`, `result`



## LicenseIf `student_id` is not provided, the system will auto-assign IDs starting from 1001.

[MIT](https://choosealicense.com/licenses/mit/)If `result` is not provided, it will be generated based on Previous_Scores and Hours_Studied.

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
