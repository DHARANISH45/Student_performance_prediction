Backend (Flask)
- Place your dataset CSV inside backend/data/ (any .csv). The upload UI will create students.csv and assign student_id starting at 1001 if not present.
- To train: POST /api/train (teacher) or run: python train_model.py
- To upload via API: POST /api/upload with 'file' form-data (teacher only)
- To predict: POST /api/predict (teacher only) with 13 fields JSON
- To get students: GET /api/students (teacher gets all; student gets own record)
- JWT secret: set env JWT_SECRET to change default secret
