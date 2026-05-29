# DineQR — Smart QR Restaurant Menu System

DineQR is a complete, full-stack, production-ready digital dining platform designed to replace traditional printed menu cards with a contactless, mobile-first QR menu. 

The system provides a customer ordering interface (accessible directly on mobile browsers without installing any apps) and a staff control terminal (dashboard) for managing active tables, live orders, waiter calls, categories, dishes, and table-specific QR codes.

---

## 🖤 Tech Stack

- **Frontend**: React JS, Tailwind CSS, Axios, React Router DOM, Lucide Icons
- **Backend**: Python Flask, PyMongo, PyJWT, Bcrypt, QR Code Generator (Pillow)
- **Database**: MongoDB (Local or Atlas)
- **Theme**: Strict Premium High-Contrast Black & White

---

## 📦 Folder Structure

### Backend
```
backend/
├── app.py                  # Server entry point
├── db_seeder.py            # Database bootstrapping script
├── requirements.txt        # Python package manifests
├── config/
│   └── db.py               # MongoDB database initialization client
├── controllers/
│   ├── auth_controller.py      # Registration & Login endpoints
│   ├── category_controller.py  # Menu categories CRUD handlers
│   ├── dish_controller.py      # Food menu CRUD & image files uploading
│   ├── order_controller.py     # Live table ordering & service calls
│   └── table_controller.py     # Table registration & QR generators
├── routes/
│   ├── auth_routes.py          # /api/register, /api/login mappings
│   ├── category_routes.py      # /api/categories CRUD mappings
│   ├── dish_routes.py          # /api/menu CRUD mappings
│   ├── order_routes.py         # /api/orders, /api/calls mappings
│   └── table_routes.py         # /api/tables, /api/qr mappings
├── utils/
│   ├── auth_middleware.py      # JWT authentication decorators
│   └── qr_generator.py         # Table QR code PNG image generators
└── static/
    ├── qrcodes/            # Table generated QR code image files
    └── uploads/            # Dish photo image uploads
```

### Frontend
```
frontend/
├── index.html              # HTML main layout file
├── package.json            # NPM package manifests
├── tailwind.config.js      # Styling overrides & colors
├── postcss.config.js       # CSS compilations setup
├── src/
│   ├── App.jsx             # React Routes mapping
│   ├── index.css           # Styling directives (fonts & variables)
│   ├── main.jsx            # React root mount bootloader
│   ├── api/
│   │   └── api.js          # Centralized Axios base helper & JWT interceptor
│   ├── context/
│   │   ├── AuthContext.jsx # Admin sessions context provider
│   │   └── CartContext.jsx # Customer carts & service pager provider
│   ├── components/
│   │   ├── LiveOrders.jsx  # Active kitchen monitor & waiter alert panel
│   │   ├── ManageCategories.jsx # Category CRUD panel
│   │   ├── ManageDishes.jsx # Dishes CRUD & upload panel
│   │   └── ManageTables.jsx # Tables QR print & download panel
│   └── pages/
│       ├── AdminDashboard.jsx # Admin command center wrapper
│       ├── AdminLogin.jsx     # Staff portal login screen
│       ├── LandingPage.jsx    # Table scanner simulator entry point
│       ├── MenuPage.jsx       # Customer interactive menu list
│       └── OrderHistoryPage.jsx # Kitchen status board & bill calculator
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Python** (version 3.8 or higher)
- **Node.js** (version 18 or higher)
- **MongoDB** (Ensure local instance is running on `mongodb://localhost:27017` or prepare your Atlas connection URL)
- **Git** (for cloning the repository)

---

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd DineQr
```

### Step 2: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create environment file:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your configuration:
   - Set `MONGO_URI` to your MongoDB connection string
   - Set `JWT_SECRET` to a secure random string
   - Set `FRONTEND_URL` to your frontend URL (for production or network access)
   
5. Run the database seed script to populate default data:
   ```bash
   python db_seeder.py
   ```
6. Launch the Flask API server:
   ```bash
   python app.py
   ```
   *The backend will boot on `http://localhost:5000`.*

---

### Step 3: Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Update API URLs in `src/api/api.js` if needed (default is `http://localhost:5000`)

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will boot on `http://localhost:5173`.*

---

## 🌐 Network Access (Mobile Devices)

To access the app from mobile devices on the same WiFi network:

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Update `backend/.env`:
   ```
   FRONTEND_URL=http://YOUR_IP:5173
   ```

3. Update `frontend/src/api/api.js`:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP:5000/api';
   export const STATIC_BASE_URL = 'http://YOUR_IP:5000';
   ```

4. Update `frontend/vite.config.js` to listen on all interfaces:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     server: {
       host: '0.0.0.0',
       port: 5173,
     },
   })
   ```

5. Regenerate QR codes:
   ```bash
   cd backend
   python regenerate_qr.py
   ```

6. Allow firewall (Windows):
   - Run `allow_firewall.bat` as Administrator
   - Or manually allow ports 5000 and 5173

---

## 🎯 Default Credentials (Staff Control Panel)
- **Staff Email**: `admin@dineqr.com`
- **Security Password**: `adminpassword`

---

## 🔄 User Workflows

### 🍽️ Customer Flow
1. **Enter Table**: Access the app via simulated entry or by visiting `http://localhost:5173/menu/table/1`.
2. **Browse & Search**: Filter items by categories, search for dishes, read descriptions and view item images.
3. **Checkout**: Add dishes to the cart, add chef instructions, and click **Place Order** to send it directly to the kitchen.
4. **Kitchen Status**: Click **My Orders** to monitor the ticket status (*Pending -> Preparing -> Served*).
5. **Call Waiter**: Click the floating Bell icon at any time to page staff.
6. **Billing**: View cumulative order totals and request the final bill.

### 💼 Admin / Staff Flow
1. **Login**: Authenticate at `/admin/login` using `admin@dineqr.com` / `adminpassword`.
2. **Kitchen Feed**: See incoming orders live (includes Web Audio synth alerts for new orders). Transition ticket states as dishes cook and are served.
3. **Service Pager**: View waiter paging notifications and dismiss them once tables are assisted.
4. **Catalog CRUD**: Add, edit, or delete categories and menu dishes (supports image upload and quick availability stock toggles).
5. **QR Generator**: Register new tables. View, print, or download table-specific QR code PNG tags.
