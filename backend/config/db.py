import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env variables from .env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "dineqr")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Ping the server to verify connection
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    client = None

db = client[MONGO_DB_NAME] if client is not None else None

def get_db():
    return db
