import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environments
load_dotenv()

app = Flask(__name__)

# Configure CORS globally for all endpoints and origins to make development easy
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Register blueprints
from routes.auth_routes import auth_bp
from routes.category_routes import category_bp
from routes.dish_routes import dish_bp
from routes.table_routes import table_bp
from routes.order_routes import order_bp
from routes.restaurant_routes import restaurant_bp
from debug_token import debug_bp

app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(category_bp, url_prefix="/api")
app.register_blueprint(dish_bp, url_prefix="/api")
app.register_blueprint(table_bp, url_prefix="/api")
app.register_blueprint(order_bp, url_prefix="/api")
app.register_blueprint(restaurant_bp, url_prefix="/api")
app.register_blueprint(debug_bp, url_prefix="/api")

# Ensure static directories exist for file storage
base_dir = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(base_dir, 'static', 'uploads'), exist_ok=True)
os.makedirs(os.path.join(base_dir, 'static', 'qrcodes'), exist_ok=True)

@app.route("/")
def index():
    return jsonify({
        "app": "DineQR REST API",
        "version": "1.0.0",
        "status": "Online"
    }), 200

# Error Handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({"message": "Resource not found!"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"message": f"Internal server error: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
