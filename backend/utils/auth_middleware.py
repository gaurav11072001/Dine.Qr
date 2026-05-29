import jwt
import os
from functools import wraps
from flask import request, jsonify, g
from bson import ObjectId
from config.db import get_db

JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_key_dineqr_2026_modern_qr_menu_system")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"].split(" ")
            if len(auth_header) == 2 and auth_header[0].lower() == "bearer":
                token = auth_header[1]

        if not token:
            return jsonify({"message": "Access denied. Token is missing!"}), 401

        try:
            db = get_db()
            if db is None:
                return jsonify({"message": "Database connection error!"}), 500

            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user = db.users.find_one({"_id": ObjectId(data["user_id"])})
            if not user:
                return jsonify({"message": "User not found!"}), 401

            user["_id"] = str(user["_id"])
            if "password" in user:
                del user["password"]

            # Attach role and restaurant_id from JWT payload
            user["role"] = data.get("role", user.get("role"))
            user["restaurant_id"] = data.get("restaurant_id", user.get("restaurant_id"))

            g.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token is invalid!"}), 401
        except Exception as e:
            return jsonify({"message": f"Authentication failed: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated


def restaurant_required(f):
    """Decorator: requires restaurant_owner role."""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if g.current_user.get("role") != "restaurant_owner":
            return jsonify({"message": "Forbidden. Restaurant owner privileges required!"}), 403
        return f(*args, **kwargs)
    return decorated


def superadmin_required(f):
    """Decorator: requires superadmin role."""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if g.current_user.get("role") != "superadmin":
            return jsonify({"message": "Forbidden. Super Admin privileges required!"}), 403
        return f(*args, **kwargs)
    return decorated


# Keep admin_required as alias for backward compatibility
admin_required = restaurant_required


def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"].split(" ")
            if len(auth_header) == 2 and auth_header[0].lower() == "bearer":
                token = auth_header[1]

        if token:
            try:
                db = get_db()
                if db:
                    data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                    user = db.users.find_one({"_id": ObjectId(data["user_id"])})
                    if user:
                        user["_id"] = str(user["_id"])
                        if "password" in user:
                            del user["password"]
                        user["role"] = data.get("role", user.get("role"))
                        user["restaurant_id"] = data.get("restaurant_id", user.get("restaurant_id"))
                        g.current_user = user
            except Exception:
                pass

        return f(*args, **kwargs)
    return decorated
