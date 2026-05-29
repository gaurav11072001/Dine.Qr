from flask import Blueprint
from controllers.dish_controller import (
    get_dishes, get_dish, create_dish, update_dish, delete_dish
)
from utils.auth_middleware import admin_required, optional_token

dish_bp = Blueprint("dish_bp", __name__)

dish_bp.route("/menu", methods=["GET"])(optional_token(get_dishes))
dish_bp.route("/menu/<dish_id>", methods=["GET"])(optional_token(get_dish))
dish_bp.route("/menu", methods=["POST"])(admin_required(create_dish))
dish_bp.route("/menu/<dish_id>", methods=["PUT"])(admin_required(update_dish))
dish_bp.route("/menu/<dish_id>", methods=["DELETE"])(admin_required(delete_dish))
