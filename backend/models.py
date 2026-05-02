# backend/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

# --- 1. STAFF & USERS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True) # e.g., unagasairao+admin@gmail.com
    hashed_password = Column(String)
    role = Column(String) # Admin, Receptionist, Doctor, Pharmacist, Lab, Billing, Display
    is_active = Column(Boolean, default=True)

# --- 2. PATIENTS ---
class Patient(Base):
    __tablename__ = "patients"
    patient_id = Column(String, primary_key=True, index=True) # e.g., PAT-1001
    name = Column(String)
    phone = Column(String)
    default_password = Column(String) # Hashed default pass (usually their phone number)
    
    # Relationships
    consultations = relationship("Consultation", back_populates="patient")
    bills = relationship("Bill", back_populates="patient")

# --- 3. QUEUE & RECEPTION ---
class Bed(Base):
    __tablename__ = "beds"
    id = Column(Integer, primary_key=True, index=True)
    serial_number = Column(String, unique=True)
    status = Column(String, default="Available") # Available, Occupied, Cleaning
    current_patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=True)

class Queue(Base):
    __tablename__ = "queue"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"))
    priority = Column(Integer) # 1 (Lowest) to 5 (Highest)
    status = Column(String, default="Waiting") # Waiting, Consulting, Finished, Admitted
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

# --- 4. DOCTOR CONSULTATIONS ---
class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(String, nullable=True)
    status = Column(String, default="Open") # Open, Closed
    
    patient = relationship("Patient", back_populates="consultations")
    prescriptions = relationship("Prescription", back_populates="consultation")
    lab_tests = relationship("LabTest", back_populates="consultation")

# --- 5. PHARMACY & INVENTORY ---
class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String, unique=True)
    stock_quantity = Column(Integer, default=0)
    reorder_threshold = Column(Integer, default=50)

class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"))
    medicine_id = Column(Integer, ForeignKey("inventory.id"))
    quantity = Column(Integer)
    price = Column(Float, nullable=True) # Pharmacist fills this
    status = Column(String, default="Requested") # Requested, Priced, Paid, Dispensed
    
    consultation = relationship("Consultation", back_populates="prescriptions")

class StockRequest(Base):
    __tablename__ = "stock_requests"
    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("inventory.id"))
    requested_quantity = Column(Integer)
    status = Column(String, default="Pending") # Pending, Approved

# --- 6. LAB & SCANS ---
class LabTest(Base):
    __tablename__ = "lab_tests"
    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"))
    test_name = Column(String)
    price = Column(Float, nullable=True) # Lab Guy fills this
    status = Column(String, default="Requested") # Requested, Priced, Paid, Completed
    document_url = Column(String, nullable=True) # Link to digital attachment
    
    consultation = relationship("Consultation", back_populates="lab_tests")

# --- 7. BILLING (ATOMIC DESIGN) ---
class Bill(Base):
    __tablename__ = "bills"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"))
    bill_type = Column(String) # "Consultation", "Pharmacy", "Lab"
    reference_id = Column(Integer) # Links to the specific Prescription ID or Lab Test ID
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="Pending") # Pending, Paid
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="bills")

# --- 8. ADMIN AUDIT LOGS ---
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String) # e.g., "Admin unagasairao+admin@gmail.com approved 500 Paracetamol"