# backend/main.py
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import security
import datetime
from bson import ObjectId

# IMPORT FIX: Properly importing the 'database' object alongside the specific collections
from database import database, user_collection, patient_collection, record_collection

app = FastAPI(title="AARUGHA Master API")

# CORS Middleware (Allows your React frontend to talk to this Python backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# SCHEMAS
# ==========================================
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
    age: int
    gender: str

class BedCreate(BaseModel):
    bed_number: str
    ward: str
class PatientCreate(BaseModel):
    name: str
    phone: str
    age: int          # <-- NEW
    gender: str       # <-- NEW
    blood_group: str  # <-- NEW

class MedicalRecord(BaseModel):
    patient_id: str
    doctor_email: str
    diagnosis: str
    prescription: str
    notes: str
    status: str = "Completed"
    type: str = "Consultation"

class BedUpdate(BaseModel):
    bed_id: str
    status: str
    patient_id: str = None

class QueueEntry(BaseModel):
    patient_id: str
    priority: int
    doctor_email: str

class StockRequest(BaseModel):
    medicine_name: str
    quantity: int

# ==========================================
# STARTUP SCRIPT
# ==========================================
@app.on_event("startup")
async def create_master_admin():
    master_email = "unagasairao+admin@gmail.com"
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

# ==========================================
# AUTHENTICATION & ADMIN ROUTES
# ==========================================
@app.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = await user_collection.find_one({"email": request.username})
    if user:
        if not security.verify_password(request.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Incorrect password.")
        token = security.create_access_token(data={"sub": user["email"], "role": user["role"]})
        return {"access_token": token, "token_type": "bearer", "role": user["role"]}
        
    patient = await patient_collection.find_one({"patient_id": request.username.upper()})
    if patient:
        if not security.verify_password(request.password, patient["default_password"]):
            raise HTTPException(status_code=401, detail="Incorrect patient password.")
        token = security.create_access_token(data={"sub": patient["patient_id"], "role": "Patient"})
        return {"access_token": token, "token_type": "bearer", "role": "Patient"}

    raise HTTPException(status_code=404, detail="User not found in system.")

@app.post("/register-staff")
async def register_staff(request: StaffCreate):
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

@app.get("/staff")
async def get_all_staff():
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
    result = await user_collection.delete_one({"email": email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    return {"message": f"Successfully deleted {email} from cloud."}

# ==========================================
# RECEPTIONIST & QUEUE ROUTES
# ==========================================
@app.post("/register-patient")
async def register_patient(request: PatientCreate):
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
        "age": request.age,                # <-- NEW
        "gender": request.gender,          # <-- NEW
        "blood_group": request.blood_group,# <-- NEW
        "default_password": hashed_pw
    }
    
    await patient_collection.insert_one(new_patient)
    return {"message": "Patient Successfully Registered!", "patient_id": new_id, "password": request.phone}
@app.post("/add-to-queue")
async def add_to_queue(payload: dict):
    patient_id = payload.get("patient_id").upper()
    priority = int(payload.get("priority", 1))
    
    patient = await patient_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient ID not found in system.")
        
    queue_entry = {
        "patient_id": patient_id,
        "patient_name": patient["name"],
        "priority": priority, 
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    await database.get_collection("queue").insert_one(queue_entry)
    return {"message": f"Patient {patient_id} successfully added to the waiting queue."}

@app.get("/hospital-live-status")
async def get_hospital_status():
    # 1. Tally up the beds
    beds_cursor = database.get_collection("beds").find()
    total_beds = 0
    occupied_beds = 0
    cleaning_beds = 0
    
    async for bed in beds_cursor:
        total_beds += 1
        if bed.get("status") == "Cleaning":
            cleaning_beds += 1
        elif bed.get("status") != "Available":
            occupied_beds += 1

    # 2. Find the registered Doctors
    staff_cursor = database.get_collection("staff").find({"role": "Doctor"})
    doctors = []
    async for doc in staff_cursor:
        email = doc.get("email", "")
        name = "Doctor"
        if "+" in email and "@" in email:
            # Converts "unagasairao+daya.lal@gmail.com" to "Daya Lal"
            name = email.split("+")[1].split("@")[0].replace(".", " ").title()
        doctors.append({"name": name, "status": "Available"})

    return {
        "doctor_list": doctors,
        "beds": {
            "total": total_beds,
            "occupied": occupied_beds,
            "cleaning": cleaning_beds
        }
    }

@app.get("/live-queue")
async def get_live_queue():
    cursor = database.get_collection("queue").find().sort([("priority", -1), ("timestamp", 1)])
    queue = []
    async for doc in cursor:
        queue.append({
            "queue_id": str(doc["_id"]),
            "patient_id": doc["patient_id"],
            "patient_name": doc["patient_name"],
            "priority": doc["priority"],
            "timestamp": doc["timestamp"]
        })
    return queue

# ==========================================
# DOCTOR & CLINICAL ROUTES
# ==========================================
@app.get("/patient/{patient_id}")
async def get_patient(patient_id: str):
    patient = await patient_collection.find_one({"patient_id": patient_id.upper()})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient ID not found.")
    
    cursor = record_collection.find({"patient_id": patient_id.upper()}).sort("date", 1)
    history = []
    async for record in cursor:
        history.append({
            "date": record.get("date"),
            "doctor_email": record.get("doctor_email"),
            "diagnosis": record.get("diagnosis"),
            "prescription": record.get("prescription"),
            "notes": record.get("notes"),
            "lab_result": record.get("lab_result", "N/A")
        })
        
    # We added the new fields to the return dictionary here!
    return {
        "patient_name": patient["name"], 
        "patient_phone": patient["phone"],
        "age": patient.get("age", "N/A"),
        "gender": patient.get("gender", "N/A"),
        "blood_group": patient.get("blood_group", "N/A"),
        "history": history
    }

@app.post("/add-medical-record")
async def add_record(record: MedicalRecord):
    new_record = {
        "patient_id": record.patient_id.upper(),
        "doctor_email": record.doctor_email,
        "diagnosis": record.diagnosis,
        "prescription": record.prescription,
        "notes": record.notes,
        "status": record.status,
        "type": record.type,
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    
    await record_collection.insert_one(new_record)
    await database.get_collection("queue").delete_one({"patient_id": record.patient_id.upper()})
    return {"message": "Medical record successfully signed and saved."}

# ==========================================
# PHARMACY & BILLING ROUTES
# ==========================================
@app.get("/pending-prescriptions")
async def get_pending_prescriptions():
    cursor = record_collection.find({"type": "Consultation/Pharmacy"}).sort("date", -1)
    prescriptions = []
    async for doc in cursor:
        prescriptions.append({
            "id": str(doc["_id"]),
            "patient_id": doc["patient_id"],
            "prescription": doc["prescription"],
            "doctor": doc["doctor_email"],
            "status": doc.get("status", "Pending Price"),
            "price": doc.get("price", 0)
        })
    return prescriptions

@app.post("/set-medication-price")
async def set_medication_price(payload: dict):
    record_id = payload.get("record_id")
    price = float(payload.get("price", 0))
    
    await record_collection.update_one(
        {"_id": ObjectId(record_id)},
        {"$set": {"price": price, "status": "Waiting Payment"}}
    )
    return {"message": f"Price set to ₹{price}. Sent to Billing."}

@app.get("/patient-billing/{patient_id}")
async def get_patient_billing(patient_id: str):
    cursor = record_collection.find({"patient_id": patient_id.upper(), "status": "Waiting Payment"})
    unpaid_items = []
    async for doc in cursor:
        unpaid_items.append({
            "record_id": str(doc["_id"]),
            "item": f"{doc.get('type', 'Charge')}: {doc.get('diagnosis', 'General')}",
            "amount": doc.get("price", 0),
            "type": doc.get("type", "Unknown")
        })
    return unpaid_items

@app.get("/billing/pending-patients")
async def get_pending_billing_patients():
    cursor = record_collection.find({"status": "Waiting Payment"})
    patients = set()
    async for doc in cursor:
        patients.add(doc["patient_id"])
    # Returns a clean, sorted list of patient IDs who owe money
    return sorted(list(patients))

@app.post("/confirm-payment")
async def confirm_payment(payload: dict):
    record_id = payload.get("record_id")
    
    await record_collection.update_one(
        {"_id": ObjectId(record_id)},
        {"$set": {"status": "Paid", "payment_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}}
    )
    return {"message": "Payment Successful. Green signal sent to department."}

@app.post("/dispense-medication")
async def dispense_medication(payload: dict):
    record_id = payload.get("record_id")
    
    await record_collection.update_one(
        {"_id": ObjectId(record_id)},
        {"$set": {"status": "Dispensed"}}
    )
    return {"message": "Medication successfully handed to patient."}

# ==========================================
# ADMIN V2 ROUTES (Beds & Inventory)
# ==========================================
@app.post("/admin/add-bed")
async def add_bed(request: BedCreate):
    new_bed = {
        "bed_number": request.bed_number,
        "ward": request.ward,
        "status": "Available",
        "patient_id": None
    }
    await database.get_collection("beds").insert_one(new_bed)
    return {"message": f"Bed {request.bed_number} added to {request.ward}"}

@app.get("/admin/beds")
async def get_beds():
    cursor = database.get_collection("beds").find()
    beds = []
    async for bed in cursor:
        beds.append({
            "bed_id": str(bed["_id"]),
            "bed_number": bed["bed_number"],
            "ward": bed["ward"],
            "status": bed["status"],
            "patient_id": bed.get("patient_id")
        })
    return beds

@app.post("/admin/update-bed")
async def update_bed(payload: dict):
    bed_id = payload.get("bed_id")
    status = payload.get("status")
    await database.get_collection("beds").update_one(
        {"_id": ObjectId(bed_id)},
        {"$set": {"status": status}}
    )
    return {"message": f"Bed status updated to {status}"}

@app.get("/admin/stock-requests")
async def get_stock_requests():
    cursor = database.get_collection("inventory_requests").find({"status": "Pending"})
    requests = []
    async for req in cursor:
        requests.append({
            "request_id": str(req["_id"]),
            "medicine_name": req["medicine_name"],
            "quantity": req["quantity"],
            "requested_by": req.get("requested_by", "Pharmacy"),
            "date": req.get("date", "")
        })
    return requests

@app.post("/admin/approve-stock")
async def approve_stock(payload: dict):
    request_id = payload.get("request_id")
    medicine_name = payload.get("medicine_name")
    quantity = int(payload.get("quantity"))
    
    # 1. Mark request as Approved
    await database.get_collection("inventory_requests").update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "Approved"}}
    )
    
    # 2. Add to actual Inventory Database!
    existing_item = await database.get_collection("inventory").find_one({"medicine_name": medicine_name})
    if existing_item:
        await database.get_collection("inventory").update_one(
            {"medicine_name": medicine_name},
            {"$inc": {"stock": quantity}}
        )
    else:
        await database.get_collection("inventory").insert_one({
            "medicine_name": medicine_name,
            "stock": quantity
        })
    return {"message": f"Approved {quantity}x {medicine_name}. Added to Inventory!"}

# OVERWRITE the old /request-stock route to use the new inventory_requests collection
@app.post("/request-stock")
async def request_stock(request: StockRequest):
    log_entry = {
        "medicine_name": request.medicine_name,
        "quantity": request.quantity,
        "requested_by": "Pharmacy",
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "status": "Pending"
    }
    await database.get_collection("inventory_requests").insert_one(log_entry)
    return {"message": "Restock request sent directly to Admin."}

@app.get("/inventory")
async def get_inventory():
    cursor = database.get_collection("inventory").find().sort("medicine_name", 1)
    inventory = []
    async for item in cursor:
        inventory.append({
            "item_id": str(item["_id"]),
            "medicine_name": item["medicine_name"],
            "stock": item.get("stock", 0)
        })
    return inventory

# ==========================================
# PATIENT PORTAL
# ==========================================
@app.get("/patient-portal-full/{patient_id}")
async def get_patient_portal_full(patient_id: str):
    patient = await patient_collection.find_one({"patient_id": patient_id.upper()})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found.")
    
    cursor = record_collection.find({"patient_id": patient_id.upper()}).sort("date", -1)
    history = []
    async for doc in cursor:
        history.append({
            "date": doc.get("date"),
            "diagnosis": doc.get("diagnosis"),
            "prescription": doc.get("prescription"),
            "status": doc.get("status"), 
            "price": doc.get("price", 0),
            "doctor": doc.get("doctor_email", "").split('+')[1].split('@')[0] if '+' in doc.get("doctor_email", "") else "Doctor"
        })
        
    return {
        "profile": {"name": patient["name"], "id": patient["patient_id"], "phone": patient["phone"]},
        "history": history
    }


class FacilityBill(BaseModel):
    patient_id: str
    amount: int
    description: str

@app.post("/discharge/add-bill")
async def add_facility_bill(request: FacilityBill):
    # This automatically sends the final bed cost directly to the Billing Dept!
    record = {
        "patient_id": request.patient_id.upper(),
        "doctor_email": "Administration",
        "diagnosis": "Facility & Bed Charges",
        "prescription": request.description,
        "notes": "Final Discharge Billing",
        "status": "Waiting Payment",
        "type": "Discharge/Facility",
        "price": request.amount,
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    await database.get_collection("records").insert_one(record)
    return {"message": "Facility bill generated and sent to Billing Department."}

@app.post("/discharge/finalize")
async def finalize_discharge(payload: dict):
    patient_id = payload.get("patient_id").upper()
    
    # 1. Fetch all records to build the final invoice
    cursor = database.get_collection("records").find({"patient_id": patient_id})
    history = []
    total = 0
    
    async for doc in cursor:
        price = doc.get("price", 0)
        # Clean the price data
        if isinstance(price, str) and price.isdigit():
            price = int(price)
        elif not isinstance(price, (int, float)):
            price = 0
            
        history.append({
            "item": doc.get("diagnosis", "Charge"),
            "desc": doc.get("prescription", ""),
            "amount": price,
            "status": doc.get("status", "Unknown"),
            "date": doc.get("date", "")
        })
        if doc.get("status") == "Paid":
            total += price
            
    # 2. Clear them from the live medical queue
    await database.get_collection("queue").delete_one({"patient_id": patient_id})

    return {"message": "Patient Discharged", "receipt": history, "total": total}