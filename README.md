# HOSPITRAX BY AARUGHA 🏥✨
**An Enterprise-Grade, Multi-Role Hospital Management System**

Hospitrax is a full-stack, real-time clinical and administrative platform built to handle the complex, multi-department workflows of a modern hospital. 

## 🚀 Tech Stack
* **Frontend:** React.js (Vite), CSS3, Lucide React Icons
* **Backend:** Python (FastAPI), Uvicorn
* **Database:** MongoDB Atlas (Cloud NoSQL)
* **Routing:** React Router DOM (Role-Based Protected Routes)

## 🔐 Role-Based Access Control (RBAC)
The system features strict routing bouncers. Users are automatically redirected to their specific operational dashboards upon login:

1. **Master Admin:** Total hospital control. Manages HR staff generation, Ward/Bed statuses (Available/Cleaning/Occupied), live Queue oversight, Billing checks, and Pharmacy restock approvals.
2. **Front Desk (Receptionist):** Handles patient intake (capturing vitals like Blood Group & Age), manages the 5-Level priority triage queue, and executes the final Discharge & Invoicing pipeline.
3. **Doctor (Clinical Portal):** Real-time queue fetching, historical medical chart lookups, and one-click submission of Diagnoses, Prescriptions, and Lab/Scan orders.
4. **Pharmacist:** Live inventory tracking with automatic **Critical Low Stock** alerts (<20 units), direct restock requests to Admin, and prescription pricing/dispensing.
5. **Billing Department:** Centralized revenue dashboard that automatically pulls patients with pending dues (Medical, Pharmacy, or Facility/Bed charges) for payment confirmation.
6. **Display Monitor:** A read-only, real-time "Airport Departure" style dashboard meant for lobby TVs, showing the live waitlist, active doctors, and total bed availability.

## ⚙️ How to Run Locally

**Prerequisites:** Node.js and Python 3.x installed. 

**The Quick Start (Windows):**
Simply run the `start.bat` file located in the root directory. This will automatically boot both the frontend and backend servers simultaneously.

**Manual Start:**
1. **Backend:** ```bash
   cd backend
   source venv/Scripts/activate  # (or .\venv\Scripts\activate on Windows)
   uvicorn main:app --reload

2. **Frontend:** ```bash
cd frontend
npm run dev

3. **Access the Hospital:**  http://localhost:5173/login

**Developed and Engineered by Team AARUGHA.**