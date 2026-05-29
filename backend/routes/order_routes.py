from flask import Blueprint
from controllers.order_controller import (
    create_order, get_orders, update_order_status,
    call_waiter, get_calls, resolve_call
)
from utils.auth_middleware import admin_required

order_bp = Blueprint("order_bp", __name__)

# Customer & Admin Orders
order_bp.route("/orders", methods=["POST"])(create_order)
order_bp.route("/orders", methods=["GET"])(get_orders)
order_bp.route("/orders/<order_id>", methods=["PUT"])(admin_required(update_order_status))

# Customer Waiter Pager Services
order_bp.route("/calls", methods=["POST"])(call_waiter)
order_bp.route("/calls", methods=["GET"])(admin_required(get_calls))
order_bp.route("/calls/<call_id>", methods=["PUT"])(admin_required(resolve_call))
