import os
import datetime
import bcrypt
from dotenv import load_dotenv
from config.db import get_db
from utils.qr_generator import generate_table_qr

load_dotenv()

def seed_database():
    db = get_db()
    if db is None:
        print("Cannot seed: MongoDB connection is offline.")
        return

    print("Cleaning existing database collections...")
    db.users.delete_many({})
    db.restaurants.delete_many({})
    db.categories.delete_many({})
    db.dishes.delete_many({})
    db.tables.delete_many({})
    db.orders.delete_many({})
    db.calls.delete_many({})

    # 1. Create Superadmin
    print("Creating default superadmin account...")
    super_pw = "superadminpass"
    super_hashed = bcrypt.hashpw(super_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    super_user = {
        "name": "DineQR Super Admin",
        "email": "superadmin@dineqr.com",
        "password": super_hashed,
        "role": "superadmin",
        "created_at": datetime.datetime.utcnow()
    }
    db.users.insert_one(super_user)
    print("Superadmin created: superadmin@dineqr.com / superadminpass")

    # 2. Create Restaurant Owner and Restaurant
    print("Creating sample restaurant owner account...")
    owner_pw = "ownerpassword"
    owner_hashed = bcrypt.hashpw(owner_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Insert restaurant document
    rest_doc = {
        "name": "Bistro House",
        "owner_email": "owner@bistrohouse.com",
        "created_at": datetime.datetime.utcnow()
    }
    rest_result = db.restaurants.insert_one(rest_doc)
    restaurant_id = str(rest_result.inserted_id)
    print(f"Restaurant 'Bistro House' created with ID: {restaurant_id}")

    # Insert owner user doc
    owner_user = {
        "name": "Bistro Owner",
        "email": "owner@bistrohouse.com",
        "password": owner_hashed,
        "role": "restaurant_owner",
        "restaurant_id": restaurant_id,
        "created_at": datetime.datetime.utcnow()
    }
    db.users.insert_one(owner_user)
    print("Restaurant Owner created: owner@bistrohouse.com / ownerpassword")

    # 3. Create Categories for the restaurant
    print("Creating standard categories for Bistro House...")
    starter_id = str(db.categories.insert_one({
        "name": "Starters",
        "restaurant_id": restaurant_id,
        "created_at": datetime.datetime.utcnow()
    }).inserted_id)
    
    main_id = str(db.categories.insert_one({
        "name": "Main Course",
        "restaurant_id": restaurant_id,
        "created_at": datetime.datetime.utcnow()
    }).inserted_id)
    
    dessert_id = str(db.categories.insert_one({
        "name": "Desserts",
        "restaurant_id": restaurant_id,
        "created_at": datetime.datetime.utcnow()
    }).inserted_id)
    
    drink_id = str(db.categories.insert_one({
        "name": "Beverages",
        "restaurant_id": restaurant_id,
        "created_at": datetime.datetime.utcnow()
    }).inserted_id)

    # 4. Create Dishes for the restaurant
    print("Creating sample dishes...")
    dishes = [
        # Starters
        {
            "name": "Truffle Parmesan Fries",
            "description": "Crispy golden French fries tossed in white truffle oil, grated parmesan cheese, and fresh parsley.",
            "price": 8.50,
            "image": "",
            "category_id": starter_id,
            "available": True,
            "restaurant_id": restaurant_id
        },
        {
            "name": "Avocado Tomato Bruschetta",
            "description": "Toasted sourdough slices topped with diced tomatoes, fresh avocado, garlic, basil, and a balsamic reduction drizzle.",
            "price": 10.00,
            "image": "",
            "category_id": starter_id,
            "available": True,
            "restaurant_id": restaurant_id
        },
        # Main Course
        {
            "name": "Classic Margherita Pizza",
            "description": "Stone-baked wood-fired pizza with San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil leaves, and extra virgin olive oil.",
            "price": 14.50,
            "image": "",
            "category_id": main_id,
            "available": True,
            "restaurant_id": restaurant_id
        },
        {
            "name": "Wild Mushroom Risotto",
            "description": "Creamy arborio rice simmered with wild chanterelle and porcini mushrooms, finished with butter, white wine, and aged parmesan.",
            "price": 18.00,
            "image": "",
            "category_id": main_id,
            "available": True,
            "restaurant_id": restaurant_id
        },
        # Desserts
        {
            "name": "Molten Chocolate Lava Cake",
            "description": "Rich dark chocolate cake with a warm flowing liquid chocolate center, served with a scoop of vanilla bean gelato.",
            "price": 9.50,
            "image": "",
            "category_id": dessert_id,
            "available": True,
            "restaurant_id": restaurant_id
        },
        # Beverages
        {
            "name": "Organic Mint Lemonade",
            "description": "Freshly squeezed lemons, organic cane syrup, and crushed fresh garden mint leaves, served ice cold.",
            "price": 5.00,
            "image": "",
            "category_id": drink_id,
            "available": True,
            "restaurant_id": restaurant_id
        }
    ]
    db.dishes.insert_many(dishes)
    print(f"Inserted {len(dishes)} dishes.")

    # 5. Create Tables for the restaurant
    print("Creating initial tables & generating QRs...")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    for i in range(1, 4):
        qr_url, redirect_url = generate_table_qr(str(i), frontend_url, restaurant_id=restaurant_id)
        db.tables.insert_one({
            "table_no": str(i),
            "restaurant_id": restaurant_id,
            "qr_url": qr_url,
            "redirect_url": redirect_url
        })
    print("Generated QR codes and registered Tables 1, 2, and 3 for Bistro House.")
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
