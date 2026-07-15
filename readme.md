# PT Takura Manufacturing Backend API

Backend application for monitoring production cycles and manufacturing warehousing at PT Takura.

## Tech Stack
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma v7
- **Auth:** JWT & bcryptjs

---

## Getting Started

### 1. Prerequisites
- Node.js installed
- PostgreSQL database (or Neon account)

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
PORT=3000
JWT_SECRET="your_secret_key"
```

### 4. Database Migration & Seeding
```bash
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed initial data (Admin & Materials)
npx prisma db seed
```

### 5. Running the App
```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## BASE URL

## API Documentation

All endpoints are prefixed with `/api`. Success responses follow the format: `{ "success": true, "data": ... }`.

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Register a new Admin | No |
| POST | `/login` | Login and get JWT token | No |
| GET | `/me` | Get current admin profile | Yes (Bearer) |

**Login Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

---

### 2. Material Management (`/api/materials`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/` | Get all materials + recent logs | Yes |
| POST | `/` | Create new material | Yes |
| POST | `/:id/stock` | Update stock (IN/OUT) | Yes |
| GET | `/:id/logs` | Get all logs for a material | Yes |

**Stock Update Body:**
```json
{
  "type": "IN", // or "OUT"
  "quantity": 50,
  "supplier": "Vendor Name",
  "notes": "Restocking"
}
```

---

### 3. PPIC - Production Planning (`/api/ppic`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/` | Get all production plans | Yes |
| POST | `/` | Create new production plan | Yes |

**Create Plan Body:**
```json
{
  "planNumber": "PROD-001",
  "productName": "Gear Box A1",
  "targetQuantity": 10,
  "materialId": 1
}
```

---

### 4. Production (Output)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| PATCH | `/api/production/status/:id` | Update plan status (mark COMPLETED) | Yes |

**Status Update Body:**
```json
{
  "status": "COMPLETED",
  "actualQuantity": 10
}
```
*Note: Setting status to COMPLETED automatically increases FinishedGood stock.*

---

### 5. Shipping (Surat Jalan)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/api/shipping` | Get all shippings | Yes |
| POST | `/api/shipping` | Create new shipping (NEW / REPAIR) | Yes |
| PUT | `/api/shipping/:id` | Update status / reject info | Yes |

**Shipping Request Body:**
```json
{
  "finishedGoodId": 1,
  "customerName": "PT Maju Jaya",
  "quantity": 5,
  "deliveryNoteNumber": "SJ-001",
  "type": "NEW"
}
```
*Note: Automatically reduces FinishedGood stock.*

---

### 6. Quality Control (QC)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/api/qc` | Get all QC logs | Yes |
| POST | `/api/qc` | Submit QC inspection on a Shipping | Yes |

**Submit QC Body:**
```json
{
  "shippingId": 1,
  "quantityOk": 4,
  "quantityNg": 1,
  "defectNotes": "1 unit minor scratch"
}
```
*Note: If `quantityNg > 0`, automatically creates an entry in Repair Workshop.*

---

### 7. Repair Workshop

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/api/repair` | Get all repair queue | Yes |
| PUT | `/api/repair/:id` | Update repair status and fixed quantity | Yes |

**Update Repair Body:**
```json
{
  "status": "Selesai Diperbaiki",
  "fixedQuantity": 1,
  "damageNotes": "Scratched",
  "repairNotes": "Polished"
}
```
*Note: If status is Selesai Diperbaiki, automatically increases FinishedGood stock back.*

---

### 8. AI Forecasting (`/api/ai`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/forecast?materialId=1` | Get raw material forecast | Yes |

**Response Example:**
```json
{
  "success": true,
  "data": {
    "materialId": 1,
    "algorithm": "Simple Moving Average (SMA-3)",
    "forecastNextMonth": 45.5,
    "unit": "pcs/unit"
  }
}
```
