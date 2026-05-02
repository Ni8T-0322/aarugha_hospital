# backend/database.py
import motor.motor_asyncio

# REPLACE THIS STRING with your actual MongoDB Atlas connection string!
# Make sure to swap out <db_password> with your database user's password.
MONGO_DETAILS = "mongodb+srv://unagasairao_db_user:dFED7gj7d95gemHR@cluster0.kgjfrqj.mongodb.net/?appName=Cluster0"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)

# This creates a database named 'aarugha_hospital' in your cloud
database = client.aarugha_hospital

# These are the collections your main.py is trying to import
user_collection = database.get_collection("users")
patient_collection = database.get_collection("patients")
record_collection = database.get_collection("medical_records")
# Add to the bottom of database.py
inventory_collection = database.get_collection("inventory")