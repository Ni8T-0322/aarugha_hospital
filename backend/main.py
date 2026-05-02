# backend/main.py
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import security
import datetime


# Import your MongoDB collections from the updated database.py
from database import user_collection, patient_collection, record_collection

app = FastAPI(title="AARUGHA Master API")

# CORS Middleware (Allows your React frontend to talk to this Python backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SCHEMAS ---
class LoginRequest(BaseModel):
    username: str 
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class StaffCreate(BaseModel):
    email: str
    password: str
    role: str
    age: int      # Cloud persistent!
    gender: str   # Cloud persistent!

class PatientCreate(BaseModel):
    name: str
    phone: str
class MedicalRecord(BaseModel):
    patient_id: str
    doctor_email: str
    diagnosis: str
    prescription: str
    notes: str
# --- STARTUP SCRIPT ---
@app.on_event("startup")
async def create_master_admin():
    """Silently creates the master admin account in MongoDB the first time the server boots."""
    master_email = "unagasairao+admin@gmail.com"
    
    # Check if the master admin already exists in the cloud
    admin = await user_collection.find_one({"email": master_email})
    if not admin:
        hashed_pw = security.hash_password("admin123") 
        new_admin = {
            "email": master_email,
            "hashed_password": hashed_pw,
            "role": "Admin",
            "age": 20,         
            "gender": "Male"   
        }
        await user_collection.insert_one(new_admin)
        print("👑 Master Admin account automatically generated in MongoDB Atlas!")

# --- ROUTES ---
@app.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    # First, try to find a Staff Member
    user = await user_collection.find_one({"email": request.username})
    
    if user:
        if not security.verify_password(request.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Incorrect password.")
        
        token = security.create_access_token(data={"sub": user["email"], "role": user["role"]})
        return {"access_token": token, "token_type": "bearer", "role": user["role"]}
        
    # If not staff, try to find a Patient
    patient = await patient_collection.find_one({"patient_id": request.username})
    
    if patient:
        if not security.verify_password(request.password, patient["default_password"]):
            raise HTTPException(status_code=401, detail="Incorrect patient password.")
            
        token = security.create_access_token(data={"sub": patient["patient_id"], "role": "Patient"})
        return {"access_token": token, "token_type": "bearer", "role": "Patient"}

    raise HTTPException(status_code=404, detail="User not found in system.")


@app.post("/register-staff")
async def register_staff(request: StaffCreate):
    # Check cloud for existing user
    existing_user = await user_collection.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Staff email already registered.")
        
    hashed_pw = security.hash_password(request.password)
    
    new_user = {
        "email": request.email,
        "hashed_password": hashed_pw,
        "role": request.role,
        "age": request.age,
        "gender": request.gender
    }
    
    await user_collection.insert_one(new_user)
    return {"message": f"Successfully registered {request.role} to MongoDB Atlas!"}


@app.post("/register-patient")
async def register_patient(request: PatientCreate):
    # Auto-generate the next Patient ID in MongoDB
    # Sorts by patient_id descending to find the highest existing number
    last_patient = await patient_collection.find_one(sort=[("patient_id", -1)])
    
    if last_patient and last_patient.get("patient_id", "").startswith("PAT-"):
        last_num = int(last_patient["patient_id"].split("-")[1])
        new_id = f"PAT-{last_num + 1}"
    else:
        new_id = "PAT-1000"

    hashed_pw = security.hash_password(request.phone)
    
    new_patient = {
        "patient_id": new_id,
        "name": request.name,
        "phone": request.phone,
        "default_password": hashed_pw
    }
    
    await patient_collection.insert_one(new_patient)
    return {
        "message": "Patient Successfully Registered!", 
        "patient_id": new_id,
        "password": request.phone
    }


@app.get("/staff")
async def get_all_staff():
    # Fetch all from cloud
    cursor = user_collection.find({})
    staff_list = []
    
    async for user in cursor:
        staff_list.append({
            "email": user["email"], 
            "role": user["role"],
            "age": user.get("age"),
            "gender": user.get("gender")
        })
        
    return staff_list


@app.delete("/delete-staff/{email}")
async def delete_staff(email: str):
    # Delete directly from the cloud collection
    result = await user_collection.delete_one({"email": email})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found.")
        
    return {"message": f"Successfully deleted {email} from cloud."}
import datetime # Make sure to import this at the top of your file if you haven't!

@app.get("/patient/{patient_id}")
async def get_patient(patient_id: str):
    # 1. Find the patient details
    patient = await patient_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient ID not found.")
    
    # 2. Find all their past medical records
    cursor = record_collection.find({"patient_id": patient_id})
    history = []
    async for record in cursor:
        history.append({
            "date": record.get("date"),
            "doctor_email": record.get("doctor_email"),
            "diagnosis": record.get("diagnosis"),
            "prescription": record.get("prescription"),
            "notes": record.get("notes")
        })
        
    return {
        "patient_name": patient["name"],
        "patient_phone": patient["phone"],
        "history": history
    }

@app.post("/add-medical-record")
async def add_record(record: MedicalRecord):
    # Create the timestamped record
    new_record = {
        "patient_id": record.patient_id,
        "doctor_email": record.doctor_email,
        "diagnosis": record.diagnosis,
        "prescription": record.prescription,
        "notes": record.notes,
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M") # Stamps the exact time
    }
    
    # Save to MongoDB Atlas
    await record_collection.insert_one(new_record)
    return {"message": "Medical record successfully signed and saved to cloud."}