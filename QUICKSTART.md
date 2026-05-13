# 🚀 Quick Start Guide - Medical Claim Approval System

Get your Medical Claim Approval System up and running in minutes!

## 📋 Prerequisites

Before you begin, ensure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ Git installed
- ✅ Docker & Docker Compose (optional, for containerized deployment)

## 🎯 Option 1: Quick Start with Docker (Recommended)

### Step 1: Clone and Navigate
```bash
cd medical-claim-system
```

### Step 2: Start All Services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 5000
- Frontend on port 3000
- Redis cache on port 6379
- Nginx reverse proxy on port 80

### Step 3: Verify Services
```bash
# Check if all containers are running
docker-compose ps

# Check backend health
curl http://localhost:5000/health

# Access frontend
# Open browser: http://localhost:3000
```

### Step 4: View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Step 5: Stop Services
```bash
docker-compose down
```

---

## 🛠️ Option 2: Manual Setup (Development)

### Step 1: Setup Database

```bash
# Create database
createdb medical_claim_db

# Run schema
psql medical_claim_db < database/schema.sql

# Verify tables created
psql medical_claim_db -c "\dt"
```

### Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings
# Update: DB_PASSWORD, JWT_SECRET, etc.

# Start development server
npm run dev

# Backend will run on http://localhost:5000
```

### Step 3: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env
# Set REACT_APP_API_URL=http://localhost:5000/api/v1

# Start development server
npm start

# Frontend will run on http://localhost:3000
```

---

## 🧪 Testing the System

### 1. Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2024-01-15T10:30:00.000Z",
#   "uptime": 123.45,
#   "environment": "development"
# }
```

### 2. Register a User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_customer",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "full_name": "John Doe",
    "role": "CUSTOMER"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Save the token from response
```

### 4. Create a Claim

```bash
curl -X POST http://localhost:5000/api/v1/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "policy_id": 1,
    "claim_amount": 50000,
    "claim_type": "HOSPITALIZATION",
    "hospital_name": "City Hospital",
    "admission_date": "2024-01-10",
    "discharge_date": "2024-01-15",
    "diagnosis": "Appendicitis",
    "claim_description": "Emergency appendectomy surgery"
  }'
```

---

## 👥 Default User Roles

Create users with different roles for testing:

### Customer
```json
{
  "username": "customer1",
  "email": "customer@example.com",
  "password": "Customer123!",
  "full_name": "Customer User",
  "role": "CUSTOMER"
}
```

### Auditor
```json
{
  "username": "auditor1",
  "email": "auditor@example.com",
  "password": "Auditor123!",
  "full_name": "Auditor User",
  "role": "AUDITOR"
}
```

### Cashier
```json
{
  "username": "cashier1",
  "email": "cashier@example.com",
  "password": "Cashier123!",
  "full_name": "Cashier User",
  "role": "CASHIER"
}
```

### Admin
```json
{
  "username": "admin1",
  "email": "admin@example.com",
  "password": "Admin123!",
  "full_name": "Admin User",
  "role": "ADMIN"
}
```

---

## 🔄 Complete Workflow Test

### 1. Customer: Create and Submit Claim
```bash
# Login as customer
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"Customer123!"}' \
  | jq -r '.data.token')

# Create claim
CLAIM_ID=$(curl -s -X POST http://localhost:5000/api/v1/claims \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"policy_id":1,"claim_amount":50000,"claim_type":"HOSPITALIZATION"}' \
  | jq -r '.data.claim_id')

# Submit claim
curl -X POST http://localhost:5000/api/v1/claims/$CLAIM_ID/submit \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Auditor: Review and Approve
```bash
# Login as auditor
AUDITOR_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auditor@example.com","password":"Auditor123!"}' \
  | jq -r '.data.token')

# Review claim
curl -X POST http://localhost:5000/api/v1/claims/$CLAIM_ID/review \
  -H "Authorization: Bearer $AUDITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments":"Reviewing claim documents"}'

# Approve claim
curl -X POST http://localhost:5000/api/v1/claims/$CLAIM_ID/approve \
  -H "Authorization: Bearer $AUDITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved_amount":45000,"comments":"Approved after verification"}'
```

### 3. Cashier: Process Payment
```bash
# Login as cashier
CASHIER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cashier@example.com","password":"Cashier123!"}' \
  | jq -r '.data.token')

# Process payment
curl -X POST http://localhost:5000/api/v1/payments/process \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"claim_id":'$CLAIM_ID',"payment_method":"BANK_TRANSFER"}'
```

---

## 📊 Access Dashboards

### Customer Dashboard
- URL: http://localhost:3000/dashboard
- Login with customer credentials
- View claims, statistics, and submit new claims

### Auditor Dashboard
- URL: http://localhost:3000/auditor/dashboard
- Login with auditor credentials
- Review pending claims, approve/reject

### Cashier Dashboard
- URL: http://localhost:3000/cashier/dashboard
- Login with cashier credentials
- Process payments for approved claims

### Admin Dashboard
- URL: http://localhost:3000/admin/dashboard
- Login with admin credentials
- System overview, user management, reports

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -U postgres -d medical_claim_db -c "SELECT 1"

# Verify credentials in .env file
```

### Backend Won't Start
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -i :5000  # On Mac/Linux
netstat -ano | findstr :5000  # On Windows
```

### Frontend Build Errors
```bash
# Clear cache
rm -rf node_modules .next build
npm install

# Check environment variables
cat .env
```

### Docker Issues
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

---

## 📝 Environment Variables Reference

### Backend (.env)
```env
# Required
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_NAME=medical_claim_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key

# Optional
AWS_ACCESS_KEY_ID=your_aws_key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_ENV=development
```

---

## 🎓 Next Steps

1. **Explore the API**: Check `README.md` for complete API documentation
2. **Customize**: Modify validation rules, add new features
3. **Deploy**: Follow `docs/DEPLOYMENT.md` for production deployment
4. **Test**: Run test suite with `npm test`
5. **Monitor**: Setup logging and monitoring tools

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **API Reference**: See `docs/API.md`
- **Architecture**: See `docs/ARCHITECTURE.md`
- **Project Summary**: See `docs/PROJECT_SUMMARY.md`

---

## 🆘 Getting Help

- **Issues**: Check existing issues or create new one
- **Email**: support@medicalclaim.com
- **Documentation**: Read the full README.md

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] Database is running and schema is loaded
- [ ] Backend API responds to health check
- [ ] Frontend loads in browser
- [ ] Can register a new user
- [ ] Can login and get JWT token
- [ ] Can create a claim
- [ ] Can view dashboard
- [ ] All services are accessible

---

**🎉 Congratulations! Your Medical Claim Approval System is ready!**

Start by creating users with different roles and testing the complete workflow.

For production deployment, refer to the deployment guide and ensure all security configurations are properly set.