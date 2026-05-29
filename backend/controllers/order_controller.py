import datetime
from flask import request, jsonify, g
from bson import ObjectId
from config.db import get_db

# --- Orders Management ---

def create_order():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    data = request.get_json()
    if not data or not data.get("table_no") or not data.get("items"):
        return jsonify({"message": "Table number and order items are required!"}), 400

    restaurant_id = data.get("restaurant_id")
    if not restaurant_id:
        return jsonify({"message": "restaurant_id is required!"}), 400

    table_no = str(data.get("table_no")).strip()
    items = data.get("items")
    notes = data.get("notes", "")

    if not isinstance(items, list) or len(items) == 0:
        return jsonify({"message": "Items list cannot be empty!"}), 400

    formatted_items = []
    total_price = 0.0

    for item in items:
        dish_id = item.get("dish_id")
        name = item.get("name")
        quantity = item.get("quantity")
        price = item.get("price")

        if not dish_id or not name or quantity is None or price is None:
            return jsonify({"message": "Invalid item fields!"}), 400

        try:
            quantity = int(quantity)
            price = float(price)
        except ValueError:
            return jsonify({"message": "Quantity and price must be numbers!"}), 400

        item_total = price * quantity
        total_price += item_total

        formatted_items.append({
            "dish_id": dish_id,
            "name": name,
            "quantity": quantity,
            "price": price,
            "total": item_total
        })

    order_doc = {
        "restaurant_id": restaurant_id,
        "table_no": table_no,
        "items": formatted_items,
        "total_price": round(total_price, 2),
        "status": "Pending",  # Pending -> Preparing -> Served -> Completed
        "notes": notes,
        "created_at": datetime.datetime.utcnow()
    }

    result = db.orders.insert_one(order_doc)
    order_doc["_id"] = str(result.inserted_id)
    order_doc["created_at"] = order_doc["created_at"].isoformat()

    return jsonify(order_doc), 201

def get_orders():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    table_no = request.args.get("table_no")
    status = request.args.get("status")
    restaurant_id = request.args.get("restaurant_id")

    query = {}
    if hasattr(g, "current_user") and g.current_user:
        if g.current_user.get("role") == "restaurant_owner":
            restaurant_id = g.current_user.get("restaurant_id")
            query["restaurant_id"] = restaurant_id
        elif g.current_user.get("role") == "superadmin":
            if restaurant_id:
                query["restaurant_id"] = restaurant_id
    else:
        if restaurant_id:
            query["restaurant_id"] = restaurant_id

    if table_no:
        query["table_no"] = str(table_no)
    if status:
        query["status"] = status

    # Return sorted by date (newest first)
    orders = list(db.orders.find(query).sort("created_at", -1))
    for order in orders:
        order["_id"] = str(order["_id"])
        order["created_at"] = order["created_at"].isoformat()

    return jsonify(orders), 200

def update_order_status(order_id):
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    data = request.get_json()
    if not data or not data.get("status"):
        return jsonify({"message": "Status is required!"}), 400

    status = data.get("status")
    valid_statuses = ["Pending", "Preparing", "Served", "Completed", "Cancelled"]
    if status not in valid_statuses:
        return jsonify({"message": f"Invalid status! Choose from: {', '.join(valid_statuses)}"}), 400

    try:
        result = db.orders.update_one(
            {"_id": ObjectId(order_id), "restaurant_id": restaurant_id},
            {"$set": {"status": status}}
        )
    except Exception:
        return jsonify({"message": "Invalid order ID format!"}), 400

    if result.matched_count == 0:
        return jsonify({"message": "Order not found!"}), 404

    return jsonify({"message": "Order status updated successfully!", "order_id": order_id, "status": status}), 200

# --- Waiter Call Paging ---

def call_waiter():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    data = request.get_json()
    if not data or not data.get("table_no"):
        return jsonify({"message": "Table number is required!"}), 400

    restaurant_id = data.get("restaurant_id")
    if not restaurant_id:
        return jsonify({"message": "restaurant_id is required!"}), 400

    table_no = str(data.get("table_no")).strip()

    # Avoid duplicate waiter requests for the same table and restaurant
    existing = db.calls.find_one({"table_no": table_no, "restaurant_id": restaurant_id, "status": "Active"})
    if existing:
        existing["_id"] = str(existing["_id"])
        existing["created_at"] = existing["created_at"].isoformat()
        return jsonify({"message": "Waiter call already active!", "call": existing}), 200

    call_doc = {
        "restaurant_id": restaurant_id,
        "table_no": table_no,
        "status": "Active",
        "created_at": datetime.datetime.utcnow()
    }

    result = db.calls.insert_one(call_doc)
    call_doc["_id"] = str(result.inserted_id)
    call_doc["created_at"] = call_doc["created_at"].isoformat()

    return jsonify(call_doc), 201

def get_calls():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    if not hasattr(g, "current_user") or not g.current_user:
        return jsonify({"message": "Authentication required!"}), 401

    restaurant_id = g.current_user.get("restaurant_id")
    if not restaurant_id:
        return jsonify({"message": "Restaurant context missing from token!"}), 400

    # Show active/unserved calls first
    calls = list(db.calls.find({"restaurant_id": restaurant_id}).sort([("status", 1), ("created_at", -1)]))
    for call in calls:
        call["_id"] = str(call["_id"])
        call["created_at"] = call["created_at"].isoformat()

    return jsonify(calls), 200

def resolve_call(call_id):
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    try:
        result = db.calls.update_one(
            {"_id": ObjectId(call_id), "restaurant_id": restaurant_id},
            {"$set": {"status": "Resolved"}}
        )
    except Exception:
        return jsonify({"message": "Invalid call ID format!"}), 400

    if result.matched_count == 0:
        return jsonify({"message": "Call log not found!"}), 404

    return jsonify({"message": "Waiter call resolved successfully!", "call_id": call_id}), 200

