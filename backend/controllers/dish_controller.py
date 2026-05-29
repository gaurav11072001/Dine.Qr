import os
import time
from flask import request, jsonify, g
from bson import ObjectId
from werkzeug.utils import secure_filename
from config.db import get_db

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_dishes():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    # Public endpoint: customer passes ?restaurant_id=
    restaurant_id = request.args.get("restaurant_id")
    # Authenticated owner: use JWT
    if not restaurant_id and hasattr(g, "current_user") and g.current_user:
        restaurant_id = g.current_user.get("restaurant_id")

    query = {}
    if restaurant_id:
        query["restaurant_id"] = restaurant_id

    dishes = list(db.dishes.find(query))
    for dish in dishes:
        dish["_id"] = str(dish["_id"])
    return jsonify(dishes), 200


def get_dish(dish_id):
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500
    try:
        dish = db.dishes.find_one({"_id": ObjectId(dish_id)})
    except Exception:
        return jsonify({"message": "Invalid dish ID!"}), 400
    if not dish:
        return jsonify({"message": "Dish not found!"}), 404
    dish["_id"] = str(dish["_id"])
    return jsonify(dish), 200


def _save_image(file):
    """Helper: save uploaded image, return relative URL."""
    filename = secure_filename(file.filename)
    filename = f"{int(time.time())}_{filename}"
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    upload_dir = os.path.join(base_dir, 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))
    return f"/static/uploads/{filename}"


def _delete_image(image_url):
    """Helper: remove an old local image file."""
    if image_url and image_url.startswith("/static/uploads/"):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(base_dir, image_url.lstrip("/"))
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass


def create_dish():
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    if not restaurant_id:
        return jsonify({"message": "Restaurant context missing from token!"}), 400

    is_form = request.content_type and 'multipart/form-data' in request.content_type

    if is_form:
        name        = request.form.get("name")
        description = request.form.get("description", "")
        price       = request.form.get("price")
        category_id = request.form.get("category_id")
        available   = request.form.get("available", "true").lower() == "true"
        image_url   = ""
        if 'image' in request.files:
            f = request.files['image']
            if f and f.filename and allowed_file(f.filename):
                image_url = _save_image(f)
    else:
        data        = request.get_json() or {}
        name        = data.get("name")
        description = data.get("description", "")
        price       = data.get("price")
        category_id = data.get("category_id")
        available   = data.get("available", True)
        image_url   = data.get("image", "")

    if not name or price is None or not category_id:
        return jsonify({"message": "Name, price, and category_id are required!"}), 400

    try:
        price = float(price)
    except (ValueError, TypeError):
        return jsonify({"message": "Price must be a valid number!"}), 400

    # Verify category belongs to this restaurant
    try:
        cat = db.categories.find_one({"_id": ObjectId(category_id), "restaurant_id": restaurant_id})
        if not cat:
            return jsonify({"message": "Category not found for this restaurant!"}), 400
    except Exception:
        return jsonify({"message": "Invalid category ID!"}), 400

    dish_doc = {
        "name": name,
        "description": description,
        "price": price,
        "image": image_url,
        "category_id": category_id,
        "available": available,
        "restaurant_id": restaurant_id
    }
    result = db.dishes.insert_one(dish_doc)
    dish_doc["_id"] = str(result.inserted_id)
    return jsonify(dish_doc), 201


def update_dish(dish_id):
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    try:
        existing = db.dishes.find_one({"_id": ObjectId(dish_id), "restaurant_id": restaurant_id})
    except Exception:
        return jsonify({"message": "Invalid dish ID!"}), 400
    if not existing:
        return jsonify({"message": "Dish not found!"}), 404

    is_form = request.content_type and 'multipart/form-data' in request.content_type
    update_fields = {}

    if is_form:
        for field in ["name", "description"]:
            val = request.form.get(field)
            if val is not None:
                update_fields[field] = val
        price = request.form.get("price")
        if price is not None:
            try:
                update_fields["price"] = float(price)
            except ValueError:
                return jsonify({"message": "Price must be a valid number!"}), 400
        cat_id = request.form.get("category_id")
        if cat_id:
            update_fields["category_id"] = cat_id
        avail = request.form.get("available")
        if avail is not None:
            update_fields["available"] = avail.lower() == "true"
        if 'image' in request.files:
            f = request.files['image']
            if f and f.filename and allowed_file(f.filename):
                _delete_image(existing.get("image", ""))
                update_fields["image"] = _save_image(f)
    else:
        data = request.get_json() or {}
        for field in ["name", "description", "image"]:
            if field in data:
                update_fields[field] = data[field]
        if "price" in data:
            try:
                update_fields["price"] = float(data["price"])
            except (ValueError, TypeError):
                return jsonify({"message": "Price must be a valid number!"}), 400
        if "category_id" in data:
            update_fields["category_id"] = data["category_id"]
        if "available" in data:
            update_fields["available"] = bool(data["available"])

    if not update_fields:
        return jsonify({"message": "No fields to update!"}), 400

    db.dishes.update_one({"_id": ObjectId(dish_id)}, {"$set": update_fields})
    updated = db.dishes.find_one({"_id": ObjectId(dish_id)})
    updated["_id"] = str(updated["_id"])
    return jsonify(updated), 200


def delete_dish(dish_id):
    db = get_db()
    if db is None:
        return jsonify({"message": "Database connection error!"}), 500

    restaurant_id = g.current_user.get("restaurant_id")
    
    # First check if dish exists at all
    try:
        dish_exists = db.dishes.find_one({"_id": ObjectId(dish_id)})
        if not dish_exists:
            return jsonify({"message": "Dish not found in database!"}), 404
        
        # Check if it belongs to this restaurant
        dish = db.dishes.find_one({"_id": ObjectId(dish_id), "restaurant_id": restaurant_id})
        if not dish:
            return jsonify({
                "message": f"Dish does not belong to your restaurant. Your restaurant_id: {restaurant_id}, Dish restaurant_id: {dish_exists.get('restaurant_id')}"
            }), 403
    except Exception as e:
        return jsonify({"message": f"Invalid dish ID format: {str(e)}"}), 400

    _delete_image(dish.get("image", ""))
    db.dishes.delete_one({"_id": ObjectId(dish_id)})
    return jsonify({"message": "Dish deleted successfully!"}), 200
