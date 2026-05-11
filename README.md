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

Aight fam, this is it! The grand finale. We are going to build a single master key to boot the entire hospital, write a legendary README that will make this project look absolutely incredible for your university submission with Team AARUGHA, and push it all to the cloud.

Let's lock it in.

1. The One-Click Boot Script
Since your project is on Windows, we can create a simple Batch script at the absolute root of your project folder (right outside the frontend and backend folders) that opens both servers simultaneously.

Create a new file in your root folder called start.bat and paste this exactly:

DOS
@echo off
echo ===================================================
echo    BOOTING HOSPITRAX BY AARUGHA - MASTER SERVER
echo ===================================================

echo [1/2] Booting Python FastAPI Backend...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

echo [2/2] Booting React Vite Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting up in separate windows!
echo Hospital is going live at: http://localhost:5173/login
pause
Now, whenever you want to work on or show off the project, you just double-click start.bat (or type .\start.bat in the terminal) and both servers will boot up instantly!

2. The Final README.md
Let's give this repository the professional documentation it deserves. Overwrite your current README.md with this master document:

Markdown
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
Frontend:

Bash
cd frontend
npm run dev
Access the Hospital: http://localhost:5173/login

**Developed and Engineered by Team AARUGHA.**