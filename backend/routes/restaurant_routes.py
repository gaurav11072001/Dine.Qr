from flask import Blueprint
from controllers.restaurant_controller import (
    get_all_restaurants, get_restaurant_stats, get_global_activity,
    get_restaurant_public
)
from utils.auth_middleware import superadmin_required

restaurant_bp = Blueprint("restaurant_bp", __name__)

restaurant_bp.route("/restaurants", methods=["GET"])(superadmin_required(get_all_restaurants))
restaurant_bp.route("/restaurants/<restaurant_id>/stats", methods=["GET"])(superadmin_required(get_restaurant_stats))
restaurant_bp.route("/restaurants/<restaurant_id>", methods=["GET"])(get_restaurant_public)
restaurant_bp.route("/activity", methods=["GET"])(superadmin_required(get_global_activity))
