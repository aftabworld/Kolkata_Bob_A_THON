# Medical Claim Approval System

A comprehensive web-based medical claim processing system with role-based access control, document management, workflow automation, and AI-powered fraud detection.

## 🎯 Overview

This system enables efficient processing of medical insurance claims through a structured workflow involving Customers, Auditors, and Cashiers. It includes automated validations, document verification, audit trails, and payment processing.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Customer  │  │ Auditor  │  │ Cashier  │  │  Admin   │   │
│  │Dashboard │  │Dashboard │  │Dashboard │  │Dashboard │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Services (Node.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │  Claim   │  │Document  │  │ Payment  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │Validation│  │  Fraud   │  │Notification│                 │
│  │  Engine  │  │Detection │  │  Service │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│  PostgreSQL Database │    │  AWS S3 / Azure Blob │
│  - User Data         │    │  - Document Storage  │
│  - Claims            │    │  - File Management   │
│  - Policies          │    │                      │
│  - Audit Logs        │    │                      │
└──────────────────────┘    └──────────────────────┘
```

## 🚀 Features

### Core Features
- ✅ **Multi-Role Access Control**: Customer, Auditor, Cashier, Admin
- ✅ **Complete Claim Lifecycle Management**: Draft → Submit → Review → Approve/Reject → Payment
- ✅ **Document Management**: Upload, verify, and track medical documents
- ✅ **Workflow Automation**: Automated status transitions and notifications
- ✅ **Audit Trail**: Complete history of all claim changes
- ✅ **Version Control**: Track claim resubmissions with version history
- ✅ **Real-time Notifications**: Email/SMS alerts for status changes
- ✅ **Dashboard Analytics**: Role-specific statistics and insights

### Advanced Features
- 🤖 **AI-Powered Fraud Detection**: Risk scoring and anomaly detection
- 📊 **Business Rules Engine**: Configurable validation rules
- 🔒 **Security**: JWT authentication, role-based authorization, data encryption
- 📱 **Responsive Design**: Mobile-friendly interface
- 🔍 **Advanced Search & Filters**: Find claims quickly
- 📈 **Reporting**: Generate claim reports and analytics

## 📋 User Roles & Permissions

### 1. Customer
- Create and submit claims
- Upload required documents
- View claim status and history
- Resubmit rejected claims
- Receive notifications

### 2. Auditor
- Review submitted claims
- Verify documents
- Approve or reject claims
- Add comments and feedback
- Request additional information

### 3. Cashier
- Process approved claims
- Initiate payments
- Update payment status
- Generate payment receipts

### 4. Admin
- Manage users and roles
- Configure system settings
- View all claims and reports
- Manage validation rules
- System monitoring

## 🔄 Claim Workflow

```
┌─────────┐
│  DRAFT  │ ◄─── Customer creates claim
└────┬────┘
     │ Submit
     ▼
┌──────────┐
│SUBMITTED │ ◄─── Sent to Auditor
└────┬─────┘
     │ Review
     ▼
┌─────────────┐
│UNDER_REVIEW │ ◄─── Auditor reviewing
└──────┬──────┘
       │
   ┌───┴───┐
   ▼       ▼
┌────────┐ ┌─────────┐
│APPROVED│ │REJECTED │
└───┬────┘ └────┬────┘
    │           │ Resubmit
    │           ▼
    │      ┌────────────┐
    │      │RESUBMITTED │
    │      └─────┬──────┘
    │            │
    │            └──────► Back to SUBMITTED
    │
    ▼
┌──────────────────┐
│PAYMENT_PROCESSING│ ◄─── Cashier processes
└────────┬─────────┘
         │
         ▼
┌─────────────┐
│PAYMENT_DONE │
└──────┬──────┘
       │
       ▼
┌────────┐
│ CLOSED │
└────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit / Context API
- **UI Library**: Material-UI / Ant Design
- **Form Handling**: React Hook Form
- **HTTP Client**: Axios
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi / Express Validator
- **File Upload**: Multer
- **Email**: Nodemailer
- **Logging**: Winston

### Database
- **Primary DB**: PostgreSQL 14+
- **Caching**: Redis (optional)
- **Search**: Elasticsearch (optional)

### Cloud & DevOps
- **Cloud Provider**: AWS / Azure / GCP
- **Storage**: AWS S3 / Azure Blob Storage
- **Container**: Docker
- **Orchestration**: Kubernetes (optional)
- **CI/CD**: GitHub Actions / Jenkins
- **Monitoring**: Prometheus + Grafana

### AI/ML (Optional)
- **Framework**: TensorFlow / PyTorch
- **NLP**: spaCy / Hugging Face Transformers
- **Fraud Detection**: Scikit-learn

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### Backend Setup

```bash
# Clone repository
git clone <repository-url>
cd medical-claim-system/backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
createdb medical_claim_db
psql medical_claim_db < ../database/schema.sql

# Run migrations (if using Sequelize migrations)
npm run migrate

# Start development server
npm run dev

# Start production server
npm start
```

### Frontend Setup

```bash
cd medical-claim-system/frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with backend API URL

# Start development server
npm start

# Build for production
npm run build
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medical_claim_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=medical-claim-documents
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_ENV=development
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "role": "CUSTOMER"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Claim Endpoints

#### Create Claim
```http
POST /api/v1/claims
Authorization: Bearer <token>
Content-Type: application/json

{
  "policy_id": 1,
  "claim_amount": 50000,
  "claim_type": "HOSPITALIZATION",
  "hospital_name": "City Hospital",
  "admission_date": "2024-01-15",
  "discharge_date": "2024-01-20",
  "diagnosis": "Appendicitis",
  "claim_description": "Emergency appendectomy surgery"
}
```

#### Get All Claims
```http
GET /api/v1/claims?status=SUBMITTED&page=1&limit=10
Authorization: Bearer <token>
```

#### Submit Claim
```http
POST /api/v1/claims/:claimId/submit
Authorization: Bearer <token>
```

#### Approve Claim (Auditor)
```http
POST /api/v1/claims/:claimId/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "approved_amount": 45000,
  "comments": "Approved after document verification"
}
```

#### Reject Claim (Auditor)
```http
POST /api/v1/claims/:claimId/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Incomplete documentation",
  "comments": "Please submit original bills"
}
```

### Document Endpoints

#### Upload Document
```http
POST /api/v1/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

claim_id: 123
document_type_id: 1
file: <binary>
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test claim.controller.test.js
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t medical-claim-backend .

# Run container
docker run -p 5000:5000 --env-file .env medical-claim-backend
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down
```

### Kubernetes Deployment

```bash
# Apply configurations
kubectl apply -f k8s/

# Check status
kubectl get pods
kubectl get services
```

## 📊 Database Schema

Key tables:
- `users` - User authentication and profiles
- `customer_master` - Customer details
- `insurance_policy` - Insurance policies
- `claim_request` - Claim records
- `claim_history` - Version history
- `claim_documents` - Document metadata
- `claim_comments` - Comments and feedback
- `claim_workflow` - Workflow transitions
- `payment_details` - Payment information
- `audit_logs` - System audit trail

See `database/schema.sql` for complete schema.

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Helmet.js security headers
- File upload restrictions
- Audit logging

## 📈 Performance Optimization

- Database indexing
- Query optimization
- Connection pooling
- Response compression
- Caching (Redis)
- CDN for static assets
- Lazy loading
- Pagination
- Background jobs for heavy tasks

## 🐛 Troubleshooting

### Docker Desktop Issues

**⚠️ ERROR: "Docker Desktop is unable to start"**

This error occurs when WSL 2 (Windows Subsystem for Linux) is not installed.

**Quick Fix:**
```powershell
# Run as Administrator
wsl --install
# Then restart your computer
```

**Automated Fix:**
```powershell
# Navigate to project directory
cd medical-claim-system

# Run the fix script as Administrator
.\fix-docker-desktop.ps1
```

**Detailed Troubleshooting:**
- See [Docker Desktop Troubleshooting Guide](./docs/DOCKER_DESKTOP_TROUBLESHOOTING.md)
- See [Docker Installation Guide](./docs/DOCKER_INSTALLATION_WINDOWS.md)

### Common Issues

1. **Database connection failed**
   - Check PostgreSQL is running
   - Verify credentials in .env
   - Ensure database exists

2. **JWT token expired**
   - Re-login to get new token
   - Check JWT_EXPIRE setting

3. **File upload fails**
   - Check file size limits
   - Verify AWS S3 credentials
   - Check file type restrictions

4. **Docker containers won't start**
   - Ensure Docker Desktop is running (green icon in system tray)
   - Check WSL 2 is installed: `wsl --status`
   - Restart Docker Desktop
   - Run: `docker-compose down && docker-compose up -d`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

- **Project Lead**: Your Name
- **Backend Developer**: Team Member
- **Frontend Developer**: Team Member
- **DevOps Engineer**: Team Member

## 📞 Support

For support, email support@medicalclaim.com or join our Slack channel.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with hospital systems
- [ ] Blockchain for claim verification
- [ ] Multi-language support
- [ ] Voice-based claim submission
- [ ] Chatbot for customer support

## 📚 Additional Resources

- [API Documentation](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [User Manual](./docs/USER_MANUAL.md)

---

**Built with ❤️ for efficient medical claim processing**