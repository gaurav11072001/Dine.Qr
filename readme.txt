# DineQR: Smart QR Restaurant Menu System Implementation Plan

This project implements a complete, premium, and production-ready full-stack Smart QR Restaurant Menu System. The application consists of a mobile-responsive, black-and-white minimalist customer frontend, a comprehensive admin dashboard, and a Flask REST API connected to MongoDB.

Customers scan a table-specific QR code to access the digital menu, search and filter dishes by category, place orders, view their running bill, and request waiter assistance. Admin users manage categories, dishes (including image uploads), tables, active live orders, and generate table QR codes.

---

## User Review Required

> [!IMPORTANT]
> **Black & White Minimalist Aesthetic**
> The UI will strictly follow a premium, high-contrast black-and-white theme using shades of deep black (`#000000`), crisp white (`#FFFFFF`), and refined grays (slate, zinc, neutral). Typography will be modern (Inter/Poppins) with clean borders, micro-animations, and card layouts.
>
> **Live Ordering and Waiter Service**
> We have included customer ordering (cart, checkout to table, order history) and a waiter calling system to make the product highly premium and fully interactive, rather than a read-only menu.
>
> **Database Host**
> The default MongoDB connection string will be set to `mongodb://localhost:27017/dineqr` via environment variables. Please ensure MongoDB is running locally, or modify the `.env` file to your MongoDB Atlas cluster.

---

## Open Questions

> [!NOTE]
> Please review the proposed components. If you have a specific hosted URL or local port preference, please let us know. The defaults are:
> - Frontend: `http://localhost:5173` (Vite default)
> - Backend: `http://localhost:5000` (Flask default)
> - Redirect URL for QR codes: `http://localhost:5173/menu/table/<table_no>`

---

## Proposed Changes

We will construct the backend first, set up the database seed, then initialize and build the React frontend.

---

### Backend Components

We will create a Flask REST API organized in a clean MVC pattern.

#### [NEW] [requirements.txt](file:///d:/DineQr/backend/requirements.txt)
Python dependencies:
- `flask`
- `flask-cors`
- `pymongo`
- `pyjwt`
- `bcrypt`
- `qrcode[pil]`
- `python-dotenv`
- `werkzeug` (for secure file saving)

#### [NEW] [app.py](file:///d:/DineQr/backend/app.py)
Entrypoint file:
- Initialize Flask, load configuration.
- Register Blueprints.
- Global error handlers.

#### [NEW] [db.py](file:///d:/DineQr/backend/config/db.py)
Database connection:
- Initialize PyMongo client.
- Export db instance and helper collections.

#### [NEW] [auth_middleware.py](file:///d:/DineQr/backend/utils/auth_middleware.py)
JWT authentication decorator:
- Verifies Bearer tokens in headers.
- Attaches the current user to the request.

#### [NEW] [qr_generator.py](file:///d:/DineQr/backend/utils/qr_generator.py)
QR generation utility:
- Generates a QR code image file directed to the table-specific menu URL.
- Saves the QR code image into `static/qrcodes/`.

#### [NEW] [routes & controllers](file:///d:/DineQr/backend/routes/)
Separated routers and controllers:
- **Auth**: `/api/login` and `/api/register` (hashing passwords with `bcrypt`, generating JWTs with expiration).
- **Categories**: CRUD `/api/categories` with authorization check for mutative actions.
- **Dishes**: CRUD `/api/menu` (supporting multipart image file uploads, dynamic availability toggles).
- **Tables & QR**: CRUD `/api/tables` and `/api/qr/:table_no` (checks/registers table numbers, generates QR codes, retrieves URLs).
- **Orders & Service**: POST `/api/orders` (place orders from table), GET `/api/orders` (retrieve active/past orders), PUT `/api/orders/:id` (admin update order status), POST `/api/calls` (call waiter), GET `/api/calls` (admin list active calls), PUT `/api/calls/:id` (resolve waiter call).

#### [NEW] [db_seeder.py](file:///d:/DineQr/backend/db_seeder.py)
A quick seed script to populate a default admin user, demo categories, and sample dishes to start playing immediately.

---

### Frontend Components

The React app will be created using Vite, configured with Tailwind CSS, React Router, and Axios.

#### [NEW] [package.json](file:///d:/DineQr/frontend/package.json)
Frontend packages:
- `react`, `react-dom`
- `react-router-dom`
- `axios`
- `lucide-react` (icons)
- Tailwind CSS styling configuration

#### [NEW] [tailwind.config.js](file:///d:/DineQr/frontend/tailwind.config.js)
Tailwind configurations for fonts, animations, and the black-and-white theme palette.

#### [NEW] [api.js](file:///d:/DineQr/frontend/src/api/api.js)
Centralized Axios instance configuration with automatic authorization headers (JWT storage in `localStorage`).

#### [NEW] [AuthContext.jsx](file:///d:/DineQr/frontend/src/context/AuthContext.jsx)
State provider for admin login, logout, and authenticated state check.

#### [NEW] [CartContext.jsx](file:///d:/DineQr/frontend/src/context/CartContext.jsx)
State provider for the customer's cart: adding items, removing, updating quantities, calculation of totals, and order tracking.

#### [NEW] [Pages](file:///d:/DineQr/frontend/src/pages/)
Frontend views:
- **Customer Pages**:
  - `LandingPage`: Friendly desktop/mobile entry point or table scanner simulator.
  - `MenuPage`: Category scroll bar, searchable menu grid, item count badges, "Add to Cart", and a sticky bottom cart bar.
  - `DishDetailsPage`: Clean modal/overlay view for an individual dish with descriptions and full-res image.
  - `OrderHistoryPage`: Running list of items ordered at this table and their current preparation status.
- **Admin Pages**:
  - `AdminLogin`: Refined login page.
  - `AdminDashboard`: Multi-pane hub containing:
    - *Live Orders Panel*: View incoming table orders in real-time, update status (Pending -> Preparing -> Served -> Paid), and view waiter call notifications.
    - *Dishes Management*: Create/Edit/Delete dishes with image upload forms.
    - *Categories Management*: Add/Edit/Delete categories.
    - *Tables / QR Management*: Add new table, generate QR code, print/download QR.

---

## Verification Plan

### Automated Tests
1. **API Endpoints Test**: Use a Python test script or Curl/Powershell requests to hit `/api/register`, `/api/login`, `/api/menu`, `/api/categories`, and `/api/tables` to verify CORS headers and status responses.
2. **Compile and Build Checks**: Run `npm run build` on the frontend to verify there are no compilation errors, unused imports, or bad syntax.

### Manual Verification
1. **Customer Menu Simulation**:
   - Navigate to `http://localhost:5173/menu/table/1`.
   - Verify category filters and search bar filter dishes smoothly.
   - Add items to the cart, specify notes, and check out.
   - Verify order status shifts from "Pending" to "Preparing" upon admin update.
   - Trigger a "Call Waiter" request and check the alert system.
2. **Admin Operations**:
   - Access `/admin/login` and authenticate.
   - Create a category and insert a new dish (uploading a test image). Check that the image is served properly on the client.
   - Generate a QR code for a new table (e.g. Table 5) and verify it creates the correct URL target image in `backend/static/qrcodes/`.
# DineQR: Multi-Tenant SaaS Restaurant Platform Walkthrough

I have successfully designed, built, and verified the complete migration of **DineQR** from a single-restaurant configuration into a **multi-tenant SaaS platform**. The architecture enforces strict data isolation per restaurant, introduces root platform administration, and presents a beautiful black-and-white minimalist design.

---

## ⚡ What was Upgraded & Built

### 1. Multi-Tenant Flask Backend (`/backend`)
- **JWT Tenant Scoping** (`utils/auth_middleware.py`): Modified authentication decorators to decode and inject `restaurant_id` and `role` properties into the flask request context (`g.current_user`). Added a `@superadmin_required` guard for global platform monitors.
- **Tenant-Scoped Controllers** (`/controllers`):
  - **Auth**: Modified `register` to handle restaurant self-registration (inserts a new tenant document in `restaurants`, then generates an owner profile user with `role: restaurant_owner` linked to that `restaurant_id`). Modified `login` to carry `restaurant_id` and `role`.
  - **Categories & Dishes**: Scoped all CRUD operations to `restaurant_id`. Made category verification cross-check ownership when registering new dishes.
  - **Tables & QRs**: Scoped table creations and lookups. Generated QR codes dynamically referencing the scoped URL format: `/menu/restaurant/:restaurantId/table/:tableNo`.
  - **Orders & Calls**: Configured kitchen tickets and waiter buzzer logs to carry a `restaurant_id` property. All query operations filter by tenant ID.
- **Superadmin Telemetry & Registry** (`controllers/restaurant_controller.py` & `routes/restaurant_routes.py`):
  - `GET /api/restaurants` → Lists all registered restaurants on the platform with aggregate statistics (total dishes, active service calls, orders).
  - `GET /api/restaurants/:id/stats` → Detailed analytics panel query for a single restaurant (order history, live table telemetry).
  - `GET /api/activity` → Returns a merged, time-sorted real-time telemetry stream of all orders and waiter requests across all tenants for platform-wide live activity monitoring.
  - `GET /api/restaurants/:id` → Public endpoint to retrieve basic details (e.g. restaurant name) for customer-facing views.
- **Database Seeding Schema** (`db_seeder.py`): Completely re-wrote seeder logic to populate the SaaS database layout with:
  - Root Superadmin: `superadmin@dineqr.com` / `superadminpass`
  - Seed Restaurant: "Bistro House" with Owner `owner@bistrohouse.com` / `ownerpassword`
  - Fully populated Bistro House categories, dishes, and 3 QR-enabled table modules.

### 2. Tenant-Aware Vite React Frontend (`/frontend`)
- **State contexts** (`/context`):
  - `AuthContext.jsx`: Upgraded state tracking to capture user roles and restaurant names. Added a `register` function to allow restaurant self-registration.
  - `CartContext.jsx`: Configured order context to capture and store the active `restaurantId` session state, submitting orders and pings scoped to the tenant.
- **Multi-Tenant Pages** (`/pages`):
  - `LandingPage.jsx`: Upgraded Staff Portal entry to provide a dual sign-in selection. Set up simulated table entries to redirect automatically to the Bistro House tenant for instant demonstration.
  - `MenuPage.jsx` & `OrderHistoryPage.jsx`: Upgraded to capture `restaurantId` from route params (`/menu/restaurant/:restaurantId/table/:tableNo`), query only the corresponding restaurant categories, dishes, and orders, and fetch the restaurant's customized name to render in the header. Added backwards-compatibility parameters mapping legacy QR codes to the Bistro House default.
  - `RestaurantLogin.jsx`: Built a beautiful minimalist portal enabling both Owner logins and full self-serve Restaurant registration.
  - `SuperAdminLogin.jsx`: Created a premium dark-themed authentication screen for root administrators.
  - `RestaurantDashboard.jsx`: Ported the operations board to dynamically show the restaurant name and handle scoped catalog operations.
  - `SuperAdminDashboard.jsx` [NEW]: Created a professional, interactive read-only console featuring:
    - **Directory Tab**: All tenant metrics, registry details, and emails.
    - **Live Activity Tab**: A scrolling, live-polling list of telemetry pings showing orders and calls across all locations.
    - **Performance Tab**: Aggregated platform totals.

---

## 🛠️ Verification & Compile Checks

1. **Database Seeding Success**:
   Executing `python db_seeder.py` connected to MongoDB, wiped collections, and created:
   - Root Superadmin profile.
   - bistro House restaurant profile with ID: `6a18893d192fd2f387686af0`.
   - Bistro Owner credentials, menus, dishes, and QR codes.

2. **Vite Production Bundling Success**:
   Executing `npm run build` compiled all React pages, contexts, routing hooks, and v4 Tailwind files with **zero errors**:
   - `dist/assets/index-DU3kn-yt.css` (28.17 kB)
   - `dist/assets/index-Bmd9xE-W.js` (367.29 kB)

---

## 📂 Key Code Locations

- **Root Router**: [App.jsx](file:///d:/DineQr/frontend/src/App.jsx)
- **Superadmin Panel**: [SuperAdminDashboard.jsx](file:///d:/DineQr/frontend/src/pages/SuperAdminDashboard.jsx)
- **Restaurant Board**: [RestaurantDashboard.jsx](file:///d:/DineQr/frontend/src/pages/RestaurantDashboard.jsx)
- **Menu Viewer**: [MenuPage.jsx](file:///d:/DineQr/frontend/src/pages/MenuPage.jsx)
- **Tenant Analytics Controller**: [restaurant_controller.py](file:///d:/DineQr/backend/controllers/restaurant_controller.py)
- **Order Scoper**: [order_controller.py](file:///d:/DineQr/backend/controllers/order_controller.py)
- **Database Seeding Script**: [db_seeder.py](file:///d:/DineQr/backend/db_seeder.py)
