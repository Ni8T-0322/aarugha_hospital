# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
import database
import security

# 1. Create the actual database tables on the hard drive
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AARUGHA Master API")

# 2. CORS Middleware (Allows your React frontend to talk to this Python backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your Vite frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SCHEMAS (Data validation for the login request) ---
class LoginRequest(BaseModel):
    username: str # This will be the email or the Patient ID
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

# --- STARTUP SCRIPT ---
@app.on_event("startup")
def create_master_admin():
    """Silently creates the master admin account the first time the server boots."""
    db = database.SessionLocal()
    master_email = "unagasairao+admin@gmail.com"
    
    # Check if the master admin already exists
    admin = db.query(models.User).filter(models.User.email == master_email).first()
    if not admin:
        hashed_pw = security.hash_password("admin123") # Default testing password
        new_admin = models.User(
            email=master_email,
            hashed_password=hashed_pw,
            role="Admin"
        )
        db.add(new_admin)
        db.commit()
        print("👑 Master Admin account automatically generated!")
    db.close()

# --- ROUTES ---
@app.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(database.get_db)):
    # First, try to find a Staff Member (using email)
    user = db.query(models.User).filter(models.User.email == request.username).first()
    
    if user:
        if not security.verify_password(request.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect password.")
        
        # Success! Generate the 8-hour JWT Token
        token = security.create_access_token(data={"sub": user.email, "role": user.role})
        return {"access_token": token, "token_type": "bearer", "role": user.role}
        
    # If not staff, try to find a Patient (using Patient ID)
    patient = db.query(models.Patient).filter(models.Patient.patient_id == request.username).first()
    
    if patient:
        if not security.verify_password(request.password, patient.default_password):
            raise HTTPException(status_code=401, detail="Incorrect patient password.")
            
        token = security.create_access_token(data={"sub": patient.patient_id, "role": "Patient"})
        return {"access_token": token, "token_type": "bearer", "role": "Patient"}

    # If neither exists
    raise HTTPException(status_code=404, detail="User not found in system.")