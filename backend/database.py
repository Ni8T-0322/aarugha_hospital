# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# This creates a local SQLite file named aarugha.db inside your backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./aarugha.db"

# check_same_thread=False is required for SQLite when used with FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to inject the database session into our routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()