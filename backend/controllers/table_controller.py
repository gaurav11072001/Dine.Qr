import os
from flask import request, jsonify, g
from bson import ObjectId
from config.db import get_db
from utils.qr_generator import generate_table_qr


def get_tables():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    tables = list(db.tables.find({"restaurant_id": restaurant_id}))
    for t in tables:
        t["_id"] = str(t["_id"])
    return jsonify(tables), 200


def create_table():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    if not restaurant_id:
        return jsonify({"message": "Restaurant context missing from token!"}), 400

    data = request.get_json()
    if not data or not data.get("table_no"):
        return jsonify({"message": "Table number is required!"}), 400

    table_no = str(data.get("table_no")).strip()

    if db.tables.find_one({"table_no": table_no, "restaurant_id": restaurant_id}):
        return jsonify({"message": f"Table {table_no} already exists for this restaurant!"}), 400

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    try:
        qr_url, redirect_url = generate_table_qr(
            table_no, frontend_url, restaurant_id=restaurant_id
        )
    except Exception as e:
        return jsonify({"message": f"Failed to generate QR code: {str(e)}"}), 500

    table_doc = {
        "table_no": table_no,
        "restaurant_id": restaurant_id,
        "qr_url": qr_url,
        "redirect_url": redirect_url
    }
    result = db.tables.insert_one(table_doc)
    table_doc["_id"] = str(result.inserted_id)
    return jsonify(table_doc), 201


def get_table_qr(table_no):
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = request.args.get("restaurant_id")
    query = {"table_no": str(table_no)}
    if restaurant_id:
        query["restaurant_id"] = restaurant_id

    table = db.tables.find_one(query)
    if not table:
        return jsonify({"message": "Table not found!"}), 404

    table["_id"] = str(table["_id"])
    return jsonify(table), 200


def delete_table(table_id):
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    try:
        table = db.tables.find_one({"_id": ObjectId(table_id), "restaurant_id": restaurant_id})
    except Exception:
        return jsonify({"message": "Invalid table ID!"}), 400

    if not table:
        return jsonify({"message": "Table not found!"}), 404

    qr_url = table.get("qr_url", "")
    if qr_url and qr_url.startswith("/static/qrcodes/"):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        filepath = os.path.join(base_dir, qr_url.lstrip("/"))
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass

    db.tables.delete_one({"_id": ObjectId(table_id)})
    return jsonify({"message": f"Table {table.get('table_no')} deleted!"}), 200
