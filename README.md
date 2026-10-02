# 🏥 Hospitrax: Web-Based Smart Hospital Queue & Bed Management System

> **Conference Supplementary Material Repository**

Welcome to the source code for **Hospitrax**, an enterprise-grade, multi-tier Hospital Management System designed to eliminate operational bottlenecks, prevent concurrent bed overbooking, and provide real-time departmental synchronization.

This system was built to address critical gaps in healthcare IT by providing a unified platform with strict Role-Based Access Control (RBAC) across 8 distinct departmental dashboards.

---

## 🏗️ Architecture Overview

- **Frontend:** React 19 + Vite (Port: 5173)
- **Backend:** Python 3 + FastAPI + Uvicorn (Port: 8000)
- **Database:** MongoDB Atlas (Cloud NoSQL)
- **Security:** JWT Authentication (HS256) + bcrypt password hashing

---

## 🚀 Getting Started (Beginner-Friendly Setup)

Follow these step-by-step instructions to get the entire hospital system running on your local machine.

### Step 1: Prerequisites
Before you begin, ensure you have the following installed on your computer:
1. **[Node.js](https://nodejs.org/)** (v18 or higher) - *Required for the frontend.*
2. **[Python](https://www.python.org/downloads/)** (v3.10 or higher) - *Required for the backend.*
3. **[Git](https://git-scm.com/)** - *To clone this repository.*
4. **A MongoDB Atlas Account** - *You will need a free cloud database cluster (instructions below).*

### Step 2: Clone the Repository
Open your terminal or command prompt and run:
```bash
git clone https://github.com/Ni8T-0322/aarugha_hospital.git
cd aarugha_hospital
```

---

### Step 3: Database Configuration (MongoDB)
For security, the database connection string is not included in the code. You must provide your own:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account/cluster.
2. In your Atlas dashboard, go to **Database Access** and create a user (e.g., username: `admin`, password: `adminpassword`).
3. Go to **Network Access** and add IP Address `0.0.0.0/0` (Allows access from anywhere).
4. Click **Connect** on your cluster, choose "Drivers", and copy your connection string. It will look like this: `mongodb+srv://<username>:<password>@cluster0...`
5. Open the project code in your editor. Go to `backend/database.py`.
6. On **line 7**, replace the placeholder with your actual connection string:
   ```python
   # Change this:
   MONGO_DETAILS = "mongodb+srv://<USERNAME>:<PASSWORD>@cluster0.kgjfrqj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
   
   # To this (using your actual username and password):
   MONGO_DETAILS = "mongodb+srv://admin:adminpassword@cluster0.kgjfrqj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
   ```

---

### Step 4: Start the Backend (FastAPI)
Open a new terminal window, navigate to the cloned folder, and run:
```bash
cd backend

# Install the required Python libraries
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload
```
✅ *If successful, you will see `Application startup complete.` The backend is now running at `http://127.0.0.1:8000`.*

---

### Step 5: Start the Frontend (React)
Open a **second** terminal window, navigate to the cloned folder, and run:
```bash
cd frontend

# Install the required Node packages
npm install

# Start the frontend server
npm run dev
```
✅ *If successful, your terminal will show a local URL (usually `http://localhost:5173`). Open this URL in your web browser!*

---

## 🔑 Default Login Credentials

When the backend starts for the very first time, it automatically creates a Master Admin account. Use this to log in to the web interface:

- **Role:** Admin
- **Email:** admin@hospitrax.com
- **Password:** admin123

*(Note: You can easily change this default admin email to whatever you prefer by editing the master_email variable on line 65 in backend/main.py)*

Once logged in, you can use the Admin Dashboard to create Receptionists, Doctors, Pharmacists, etc.

**Example Staff Emails:**
When the Admin creates new staff accounts, we recommend following a clear domain structure based on your chosen universal email. For example:
- **Doctor:** dr.smith@hospitrax.com
- **Pharmacist:** pharmacy.lead@hospitrax.com
- **Receptionist:** frontdesk@hospitrax.com

---

## 🧪 Reproducing the 500-Concurrent-User Load Test

To verify the system's structural safety against bed overbooking (as mentioned in the paper), you can run the provided stress test.

1. Ensure your backend server is currently running.
2. Open a new terminal and navigate to the `backend` folder.
3. Run the load test script:
   ```bash
   python load_test.py
   ```
4. The script will simulate 500 simultaneous requests trying to book beds. You will see the results print in your terminal, demonstrating the atomic transactional locking and 0.0% overbooking error rate.

---

## 📂 Project Structure Snapshot
```text
aarugha_hospital/
├── backend/
│   ├── main.py          # All 30+ REST API endpoints
│   ├── database.py      # MongoDB connection logic
│   ├── security.py      # JWT Auth and password hashing
│   ├── load_test.py     # Concurrent bed allocation stress test
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/  # The 8 Role-Based Dashboards
│   │   ├── App.jsx      # React Router and RBAC Wrapper
│   │   └── index.css    # Global styling
│   └── package.json     # Node dependencies
└── README.md
```
