import datetime
from flask import request, jsonify, g
from bson import ObjectId
from config.db import get_db


def get_categories():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    # Public: allow ?restaurant_id= query param for customer access
    restaurant_id = request.args.get("restaurant_id") or (
        g.current_user.get("restaurant_id") if hasattr(g, "current_user") and g.current_user else None
    )

    query = {}
    if restaurant_id:
        query["restaurant_id"] = restaurant_id

    categories = list(db.categories.find(query))
    for cat in categories:
        cat["_id"] = str(cat["_id"])
    return jsonify(categories), 200


def create_category():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    if not restaurant_id:
        return jsonify({"message": "Restaurant context missing from token!"}), 400

    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"message": "Category name is required!"}), 400

    name = data.get("name").strip()

    if db.categories.find_one({
        "name": {"$regex": f"^{name}$", "$options": "i"},
        "restaurant_id": restaurant_id
    }):
        return jsonify({"message": "Category already exists for this restaurant!"}), 400

    category_doc = {
        "name": name,
        "restaurant_id": restaurant_id,
        "created_at": datetime.datetime.utcnow()
    }
    result = db.categories.insert_one(category_doc)
    category_doc["_id"] = str(result.inserted_id)
    category_doc["created_at"] = category_doc["created_at"].isoformat()
    return jsonify(category_doc), 201


def update_category(category_id):
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"message": "Category name is required!"}), 400

    name = data.get("name").strip()

    existing = db.categories.find_one({
        "name": {"$regex": f"^{name}$", "$options": "i"},
        "restaurant_id": restaurant_id
    })
    if existing and str(existing["_id"]) != category_id:
        return jsonify({"message": "Another category with this name already exists!"}), 400

    try:
        result = db.categories.update_one(
            {"_id": ObjectId(category_id), "restaurant_id": restaurant_id},
            {"$set": {"name": name}}
        )
    except Exception:
        return jsonify({"message": "Invalid category ID!"}), 400

    if result.matched_count == 0:
        return jsonify({"message": "Category not found!"}), 404

    return jsonify({"message": "Category updated!", "_id": category_id, "name": name}), 200


def delete_category(category_id):
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    try:
        result = db.categories.delete_one({"_id": ObjectId(category_id), "restaurant_id": restaurant_id})
    except Exception:
        return jsonify({"message": "Invalid category ID!"}), 400

    if result.deleted_count == 0:
        return jsonify({"message": "Category not found!"}), 404

    db.dishes.delete_many({"category_id": category_id, "restaurant_id": restaurant_id})
    return jsonify({"message": "Category and its dishes deleted!"}), 200
