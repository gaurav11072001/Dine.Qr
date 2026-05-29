from flask import Blueprint
from controllers.table_controller import (
    get_tables, create_table, get_table_qr, delete_table
)
from utils.auth_middleware import admin_required

table_bp = Blueprint("table_bp", __name__)

table_bp.route("/tables", methods=["GET"])(admin_required(get_tables))
table_bp.route("/tables", methods=["POST"])(admin_required(create_table))
table_bp.route("/tables/<table_id>", methods=["DELETE"])(admin_required(delete_table))
table_bp.route("/qr/<table_no>", methods=["GET"])(get_table_qr)
