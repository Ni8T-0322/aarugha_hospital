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
# New Schemas for your specific roles
class BedUpdate(BaseModel):
    bed_id: str
    status: str  # Available, Occupied, Cleaning

class QueueEntry(BaseModel):
    patient_id: str
    priority: int  # 1-5
    doctor_email: str
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

@app.get("/hospital-status")
async def get_hospital_status():
    # Count available beds
    total_beds = await database.get_collection("beds").count_documents({})
    available_beds = await database.get_collection("beds").count_documents({"status": "Available"})
    
    # Get active queue count
    queue_count = await database.get_collection("queue").count_documents({})
    
    # Get available doctors
    active_doctors = await user_collection.find({"role": "Doctor", "status": "Available"}).to_list(100)
    
    return {
        "beds_summary": f"{available_beds}/{total_beds} Available",
        "queue_size": queue_count,
        "doctors_online": len(active_doctors)
    }


# Schema for stock requests
class StockRequest(BaseModel):
    medicine_name: str
    quantity: int

@app.get("/pending-prescriptions")
async def get_pending_prescriptions():
    # Finds records where a prescription exists but hasn't been "cleared" by pharmacy yet
    # For now, we'll fetch the latest medical records
    cursor = record_collection.find().sort("date", -1).limit(20)
    prescriptions = []
    async for doc in cursor:
        prescriptions.append({
            "id": str(doc["_id"]),
            "patient_id": doc["patient_id"],
            "prescription": doc["prescription"],
            "doctor": doc["doctor_email"],
            "status": doc.get("status", "Pending Price") # Pending Price, Waiting Payment, Dispensed
        })
    return prescriptions

@app.post("/request-stock")
async def request_stock(request: StockRequest):
    # This sends a "notification" to the admin (via the audit_logs)
    log_entry = {
        "event": "Stock Request",
        "detail": f"Pharmacist requested {request.quantity} units of {request.medicine_name}",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    await database.get_collection("audit_logs").insert_one(log_entry)
    return {"message": "Request sent to Admin."}

@app.get("/patient-billing/{patient_id}")
async def get_patient_billing(patient_id: str):
    # This searches for any record related to this patient that has a price but isn't paid
    # Checking medical_records for medications that were priced by the pharmacist
    cursor = record_collection.find({"patient_id": patient_id, "status": "Waiting Payment"})
    unpaid_items = []
    async for doc in cursor:
        unpaid_items.append({
            "record_id": str(doc["_id"]),
            "item": f"Medication: {doc['prescription']}",
            "amount": doc.get("price", 0),
            "type": "Pharmacy"
        })
    return unpaid_items

@app.post("/confirm-payment")
async def confirm_payment(payload: dict):
    # Updates the status to 'Paid' so the Pharmacist/Lab Guy gets the green light
    record_id = payload.get("record_id")
    from bson import ObjectId
    
    await record_collection.update_one(
        {"_id": ObjectId(record_id)},
        {"$set": {"status": "Paid", "payment_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}}
    )
    
    # Log the transaction for the Admin's audit logs
    await database.get_collection("audit_logs").insert_one({
        "event": "Payment Confirmed",
        "detail": f"Bill Guy cleared payment for record {record_id}",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    })
    
    return {"message": "Payment Successful. Green signal sent to department."}

@app.get("/pending-lab-tests")
async def get_pending_tests():
    # Looks for records where a doctor assigned a 'scan' or 'test'
    # We filter for items that are 'Paid' so the lab guy knows they have the green light
    cursor = record_collection.find({"status": "Paid", "type": "Lab/Scan"})
    tests = []
    async for doc in cursor:
        tests.append({
            "record_id": str(doc["_id"]),
            "patient_id": doc["patient_id"],
            "test_required": doc.get("diagnosis"), # The 'scan' name is stored here
            "doctor": doc["doctor_email"]
        })
    return tests

@app.post("/upload-lab-result")
async def upload_result(payload: dict):
    from bson import ObjectId
    record_id = payload.get("record_id")
    result_data = payload.get("result_data") # This could be text or a file link
    
    await record_collection.update_one(
        {"_id": ObjectId(record_id)},
        {"$set": {
            "status": "Completed", 
            "lab_result": result_data,
            "completed_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        }}
    )
    return {"message": "Results uploaded and attached to Patient EMR."}

@app.get("/patient-portal-full/{patient_id}")
async def get_patient_portal_full(patient_id: str):
    # 1. Fetch Profile
    patient = await patient_collection.find_one({"patient_id": patient_id.upper()})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found.")
    
    # 2. Fetch All Interactions (Medical, Lab, Pharmacy)
    # We sort by date descending so the newest health events appear first
    cursor = record_collection.find({"patient_id": patient_id.upper()}).sort("date", -1)
    history = []
    async for doc in cursor:
        history.append({
            "date": doc.get("date"),
            "diagnosis": doc.get("diagnosis"),
            "prescription": doc.get("prescription"),
            "status": doc.get("status"), # e.g., 'Paid', 'Waiting Payment', 'Completed'
            "lab_result": doc.get("lab_result", "N/A"),
            "price": doc.get("price", 0),
            "doctor": doc.get("doctor_email", "").split('+')[1].split('@')[0] if '+' in doc.get("doctor_email", "") else "Doctor"
        })
        
    return {
        "profile": {
            "name": patient["name"],
            "id": patient["patient_id"],
            "phone": patient["phone"]
        },
        "history": history
    }

@app.get("/hospital-live-status")
async def get_live_status():
    # 1. Fetch available vs occupied beds
    total_beds = await database.get_collection("beds").count_documents({})
    occupied_beds = await database.get_collection("beds").count_documents({"status": "Occupied"})
    cleaning_beds = await database.get_collection("beds").count_documents({"status": "Cleaning"})
    
    # 2. Fetch Doctor Statuses
    # We find all staff with role 'Doctor'
    doctors_cursor = user_collection.find({"role": "Doctor"})
    doctor_list = []
    async for doc in doctors_cursor:
        doctor_list.append({
            "name": doc["name"],
            "status": doc.get("status", "Available") # Available, Busy, Away
        })

    # 3. Queue Count
    queue_size = await database.get_collection("queue").count_documents({})

    return {
        "beds": {
            "total": total_beds,
            "occupied": occupied_beds,
            "cleaning": cleaning_beds,
            "available": total_beds - occupied_beds - cleaning_beds
        },
        "doctors": doctor_list,
        "queue": queue_size,
        "time": datetime.datetime.now().strftime("%I:%M %p")
    }