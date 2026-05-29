import datetime
from flask import request, jsonify
from bson import ObjectId
from config.db import get_db

def get_all_restaurants():
    """Superadmin-only: list all restaurants with metadata and stats."""
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurants = list(db.restaurants.find())
    results = []

    for r in restaurants:
        r_id = str(r["_id"])
        
        # Calculate stats for each restaurant
        dish_count = db.dishes.count_documents({"restaurant_id": r_id})
        order_count = db.orders.count_documents({"restaurant_id": r_id})
        active_calls = db.calls.count_documents({"restaurant_id": r_id, "status": "Active"})
        
        # Fetch owner email
        owner = db.users.find_one({"restaurant_id": r_id, "role": "restaurant_owner"})
        owner_email = owner["email"] if owner else r.get("owner_email", "N/A")

        created_at_iso = r.get("created_at")
        if isinstance(created_at_iso, datetime.datetime):
            created_at_iso = created_at_iso.isoformat()

        results.append({
            "id": r_id,
            "name": r.get("name", "Unnamed Restaurant"),
            "owner_email": owner_email,
            "created_at": created_at_iso,
            "stats": {
                "dishes": dish_count,
                "orders": order_count,
                "active_calls": active_calls
            }
        })

    return jsonify(results), 200


def get_restaurant_stats(restaurant_id):
    """Superadmin-only: get stats for a specific restaurant."""
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    try:
        restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    except Exception:
        return jsonify({"message": "Invalid restaurant ID format!"}), 400

    if not restaurant:
        return jsonify({"message": "Restaurant not found!"}), 404

    dish_count = db.dishes.count_documents({"restaurant_id": restaurant_id})
    order_count = db.orders.count_documents({"restaurant_id": restaurant_id})
    active_calls = db.calls.count_documents({"restaurant_id": restaurant_id, "status": "Active"})
    resolved_calls = db.calls.count_documents({"restaurant_id": restaurant_id, "status": "Resolved"})

    # Get recent orders
    recent_orders = list(db.orders.find({"restaurant_id": restaurant_id}).sort("created_at", -1).limit(5))
    for o in recent_orders:
        o["_id"] = str(o["_id"])
        if isinstance(o.get("created_at"), datetime.datetime):
            o["created_at"] = o["created_at"].isoformat()

    return jsonify({
        "restaurant_id": restaurant_id,
        "name": restaurant.get("name", "Unnamed Restaurant"),
        "stats": {
            "dishes": dish_count,
            "orders": order_count,
            "active_calls": active_calls,
            "resolved_calls": resolved_calls
        },
        "recent_orders": recent_orders
    }), 200


def get_global_activity():
    """Superadmin-only: returns a live-updating stream of recent orders & calls across all restaurants."""
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    # Fetch last 30 orders
    orders = list(db.orders.find().sort("created_at", -1).limit(30))
    # Fetch last 30 calls
    calls = list(db.calls.find().sort("created_at", -1).limit(30))

    # Pre-fetch restaurant names for lookup
    restaurant_map = {}
    restaurants = list(db.restaurants.find())
    for r in restaurants:
        restaurant_map[str(r["_id"])] = r.get("name", "Unnamed Restaurant")

    feed = []

    for o in orders:
        r_id = o.get("restaurant_id")
        r_name = restaurant_map.get(r_id, "Unknown Restaurant")
        
        created_at = o.get("created_at")
        if isinstance(created_at, datetime.datetime):
            created_at = created_at.isoformat()

        feed.append({
            "id": str(o["_id"]),
            "type": "order",
            "restaurant_id": r_id,
            "restaurant_name": r_name,
            "table_no": o.get("table_no"),
            "total_price": o.get("total_price"),
            "status": o.get("status"),
            "items_count": len(o.get("items", [])),
            "created_at": created_at
        })

    for c in calls:
        r_id = c.get("restaurant_id")
        r_name = restaurant_map.get(r_id, "Unknown Restaurant")

        created_at = c.get("created_at")
        if isinstance(created_at, datetime.datetime):
            created_at = created_at.isoformat()

        feed.append({
            "id": str(c["_id"]),
            "type": "waiter_call",
            "restaurant_id": r_id,
            "restaurant_name": r_name,
            "table_no": c.get("table_no"),
            "status": c.get("status"),
            "created_at": created_at
        })

    # Sort merged feed by time (newest first)
    feed.sort(key=lambda x: x["created_at"], reverse=True)
    return jsonify(feed[:40]), 200


def get_restaurant_public(restaurant_id):
    """Public: returns basic info (like name) for a restaurant."""
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    try:
        restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    except Exception:
        return jsonify({"message": "Invalid restaurant ID format!"}), 400

    if not restaurant:
        return jsonify({"message": "Restaurant not found!"}), 404

    return jsonify({
        "id": str(restaurant["_id"]),
        "name": restaurant.get("name", "Unnamed Restaurant")
    }), 200

