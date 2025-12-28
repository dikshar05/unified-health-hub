# Hospital Management System - Backend API

A production-ready Node.js/Express/MongoDB backend for the Hospital Management System.

## Prerequisites

- Node.js 18+ 
- MongoDB 6+ (local or Atlas)
- npm or yarn

## Setup

1. **Clone and navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your MongoDB connection string and JWT secret:
   ```
   MONGODB_URI=mongodb://localhost:27017/hospital_management
   JWT_SECRET=your-super-secret-key-change-this
   JWT_EXPIRES_IN=24h
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Run the server:**
   ```bash
   # Development (with hot reload)
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login with user_id, password, portal | No |
| GET | `/api/auth/verify` | Verify JWT token | Yes |

### Patients (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all patients |
| POST | `/api/patients` | Create patient |
| GET | `/api/patients/:id` | Get patient by ID |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient |

### Doctors (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List all doctors |
| POST | `/api/doctors` | Create doctor |
| GET | `/api/doctors/:id` | Get doctor by ID |
| PUT | `/api/doctors/:id` | Update doctor |
| DELETE | `/api/doctors/:id` | Delete doctor |

### Visits
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/visits` | List visits | Admin: all, Doctor: own |
| POST | `/api/visits` | Create visit | Admin |
| GET | `/api/visits/:id` | Get visit | Admin/Doctor |
| PUT | `/api/visits/:id` | Update visit | Admin |
| DELETE | `/api/visits/:id` | Delete visit | Admin |
| GET | `/api/visits/severity-trend/:patientId` | Severity trend | Admin/Doctor |

### Prescriptions (Doctor only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prescriptions` | List own prescriptions |
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/prescriptions/:id` | Get prescription |
| PUT | `/api/prescriptions/:id` | Update prescription |
| DELETE | `/api/prescriptions/:id` | Delete prescription |

### CSV Uploads
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/upload/patients` | Upload patients CSV | Admin |
| POST | `/api/upload/visits` | Upload visits CSV | Admin |
| POST | `/api/upload/prescriptions` | Upload prescriptions CSV | Doctor |

## Demo Credentials

| Role | User ID | Password |
|------|---------|----------|
| Admin | admin_hospital | admin123 |
| Doctor | dr_cardiology | doctor123 |
| Doctor | dr_neuro | doctor123 |

## Error Response Format

All errors follow this format:
```json
{
  "error": true,
  "message": "Human readable message",
  "details": ["Array of specific error details"]
}
```

## CSV Upload Format

### patients.csv
```csv
patient_id,full_name,age,gender,blood_group,phone_number,email,emergency_contact,hospital_location,bmi,smoker_status,alcohol_use,chronic_conditions,registration_date,insurance_type
PAT-001,John Doe,45,Male,A+,555-1234,john@email.com,555-5678,Main Campus,24.5,No,No,"Diabetes,Hypertension",2024-01-15,Premium
```

### visits.csv
```csv
visit_id,patient_id,doctor_id,visit_date,severity_score,visit_type,length_of_stay,lab_result_glucose,lab_result_bp,previous_visit_gap_days,readmitted_within_30_days,visit_cost
VIS-001,PAT-001,DOC-CARDIO-001,2024-01-20,3,IP,5,110.5,120/80,30,No,5000.00
```

### prescriptions.csv
```csv
prescription_id,visit_id,patient_id,diagnosis_id,diagnosis_description,drug_name,drug_category,dosage,quantity,days_supply,prescribed_date,cost
PRE-001,VIS-001,PAT-001,DX-001,Hypertension,Lisinopril,ACE Inhibitor,10mg,30,30,2024-01-20,45.00
```

## Connecting Frontend

Update your frontend to point API calls to this backend:

1. Set the API base URL in your frontend config:
   ```javascript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

2. Include the JWT token in Authorization header:
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
   }
   ```

## Deployment

For production deployment:

1. Use a proper MongoDB Atlas cluster
2. Set strong JWT_SECRET
3. Configure CORS_ORIGIN to your frontend domain
4. Use HTTPS
5. Deploy to Render, Railway, DigitalOcean, or similar

## License

MIT
