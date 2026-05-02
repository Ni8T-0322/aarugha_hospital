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

class StaffCreate(BaseModel):
    email: str
    password: str
    role: str

class PatientCreate(BaseModel):
    name: str
    phone: str

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

@app.post("/register-staff")
def register_staff(request: StaffCreate, db: Session = Depends(database.get_db)):
    # 1. Check if the staff member already exists
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Staff email already registered.")
        
    # 2. Hash their temporary password
    hashed_pw = security.hash_password(request.password)
    
    # 3. Create the user and save to database
    new_user = models.User(
        email=request.email,
        hashed_password=hashed_pw,
        role=request.role
    )
    db.add(new_user)
    db.commit()
    
    return {"message": f"Successfully registered {request.role}: {request.email}"}

@app.post("/register-patient")
def register_patient(request: PatientCreate, db: Session = Depends(database.get_db)):
    # Auto-generate the next Patient ID
    last_patient = db.query(models.Patient).order_by(models.Patient.patient_id.desc()).first()
    
    if last_patient and last_patient.patient_id.startswith("PAT-"):
        last_num = int(last_patient.patient_id.split("-")[1])
        new_id = f"PAT-{last_num + 1}"
    else:
        new_id = "PAT-1000"

    # Phone number as temporary password
    hashed_pw = security.hash_password(request.phone)
    
    new_patient = models.Patient(
        patient_id=new_id,
        name=request.name,
        phone=request.phone,
        default_password=hashed_pw
    )
    db.add(new_patient)
    db.commit()
    
    return {
        "message": "Patient Successfully Registered!", 
        "patient_id": new_id,
        "password": request.phone
    }

@app.delete("/delete-staff/{email}")
def delete_staff(email: str, db: Session = Depends(database.get_db)):
    # Find the user
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found in database.")
        
    # Nuke them from the vault
    db.delete(user)
    db.commit()
    
    return {"message": f"Successfully terminated access for {email}"}
@app.get("/staff")
def get_all_staff(db: Session = Depends(database.get_db)):
    # Grab everyone from the database
    users = db.query(models.User).all()
    
    # Return a safe list (Emails and Roles only, NEVER send the hashed passwords to the frontend!)
    staff_list = [{"email": user.email, "role": user.role} for user in users]
    return staff_list