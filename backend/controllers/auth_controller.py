import os
import datetime
import jwt
import bcrypt
from flask import request, jsonify
from bson import ObjectId
from config.db import get_db

JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_key_dineqr_2026_modern_qr_menu_system")

def register():
    """Restaurant self-registration. Creates a restaurant doc + owner user."""
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided!"}), 400

    name        = data.get("name", "").strip()
    email       = data.get("email", "").strip().lower()
    password    = data.get("password", "")
    restaurant_name = data.get("restaurant_name", "").strip()

    if not name or not email or not password or not restaurant_name:
        return jsonify({"message": "name, email, password, and restaurant_name are all required!"}), 400

    if db.users.find_one({"email": email}):
        return jsonify({"message": "An account with this email already exists!"}), 400

    # 1. Create restaurant document
    restaurant_doc = {
        "name": restaurant_name,
        "owner_email": email,
        "created_at": datetime.datetime.utcnow()
    }
    restaurant_result = db.restaurants.insert_one(restaurant_doc)
    restaurant_id = str(restaurant_result.inserted_id)

    # 2. Create owner user
    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_doc = {
        "name": name,
        "email": email,
        "password": hashed_pw,
        "role": "restaurant_owner",
        "restaurant_id": restaurant_id,
        "created_at": datetime.datetime.utcnow()
    }
    user_result = db.users.insert_one(user_doc)
    user_id = str(user_result.inserted_id)

    token = jwt.encode({
        "user_id": user_id,
        "role": "restaurant_owner",
        "restaurant_id": restaurant_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "message": "Restaurant registered successfully!",
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": "restaurant_owner",
            "restaurant_id": restaurant_id,
            "restaurant_name": restaurant_name
        }
    }), 201


def login():
    """Unified login for superadmin and restaurant_owner."""
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"message": "Please provide email and password!"}), 400

    email    = data.get("email").strip().lower()
    password = data.get("password")

    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"message": "Invalid email or password!"}), 401

    try:
        pw_matched = bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8"))
    except Exception:
        pw_matched = False

    if not pw_matched:
        return jsonify({"message": "Invalid email or password!"}), 401

    role          = user.get("role", "restaurant_owner")
    restaurant_id = user.get("restaurant_id")

    # Fetch restaurant name if owner
    restaurant_name = None
    if role == "restaurant_owner" and restaurant_id:
        try:
            rest = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
            if rest:
                restaurant_name = rest.get("name")
        except Exception:
            pass

    token_payload = {
        "user_id": str(user["_id"]),
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    if restaurant_id:
        token_payload["restaurant_id"] = restaurant_id

    token = jwt.encode(token_payload, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": role,
            "restaurant_id": restaurant_id,
            "restaurant_name": restaurant_name
        }
    }), 200
