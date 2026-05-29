from flask import Blueprint
from controllers.category_controller import (
    get_categories, create_category, update_category, delete_category
)
from utils.auth_middleware import admin_required, optional_token

category_bp = Blueprint("category_bp", __name__)

category_bp.route("/categories", methods=["GET"])(optional_token(get_categories))
category_bp.route("/categories", methods=["POST"])(admin_required(create_category))
category_bp.route("/categories/<category_id>", methods=["PUT"])(admin_required(update_category))
category_bp.route("/categories/<category_id>", methods=["DELETE"])(admin_required(delete_category))
