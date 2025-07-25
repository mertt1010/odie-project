# ODIE Project

**Organization Directory Integration Engine** - A comprehensive LDAP/Active Directory management system with modern web interface.

## 🌟 Overview

ODIE is a full-stack application designed to simplify LDAP/Active Directory management through a modern web interface. It provides seamless integration between LDAP servers (Microsoft Active Directory and Samba) and a PostgreSQL database, enabling administrators to manage users, domains, and departments efficiently.

## ✨ Key Features

### 🏢 **Multi-Domain Management**

- Support for multiple LDAP domains (Microsoft AD & Samba)
- Add, edit, delete, and list domains
- Domain-specific user and department management
- Secure LDAP connection handling

### 👥 **User Management**

- Create users in LDAP with automatic database synchronization
- Enable/disable user accounts across LDAP and database
- Delete users with complete cleanup
- Role-based access control (Admin, User, Guest)
- Department assignment and management
- Secure password hashing with bcrypt

### 🏬 **Department Management**

- Create and manage departments within domains
- Assign users to departments
- Department-based user organization
- Edit and delete departments with user reassignment

### 🔐 **Authentication & Security**

- Supabase authentication integration
- Protected routes with role-based access
- Secure password storage and validation
- LDAP connection security

### 🎨 **Modern Web Interface**

- React + Vite frontend with Tailwind CSS
- Responsive design for all devices
- Intuitive navigation with sidebar and navbar
- Real-time data updates
- Protected routes and authentication flow

### 📋 **Comprehensive Logging System**

- Automatic API operation logging for audit trails
- Real-time tracking of all CRUD operations
- Categorized logging by operation type (domain, user, department)
- Advanced filtering and pagination for log analysis
- Error tracking and debugging support
- Database-stored logs with JSON data preservation

## 🏗️ Architecture

### **Frontend** (`/frontend`)

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM v7
- **Authentication**: Supabase Auth
- **State Management**: React Context API

### **Backend** (`/backend`)

- **API Framework**: FastAPI
- **LDAP Integration**: ldap3 library
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: bcrypt for password hashing
- **Database ORM**: psycopg2 for PostgreSQL

## 📁 Project Structure

```
odie-project/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── navbar/         # Navigation bar
│   │   │   ├── side-bar/       # Sidebar navigation
│   │   │   └── protected-route/ # Route protection
│   │   ├── pages/              # Application pages
│   │   │   ├── auth/           # Login/Signup pages
│   │   │   ├── domains/        # Domain management
│   │   │   ├── users/          # User management
│   │   │   └── departments/    # Department management
│   │   ├── context/            # React context providers
│   │   ├── services/           # API service layers
│   │   └── route/              # Route configurations
│   └── package.json            # Frontend dependencies
└── backend/                     # Python backend API
    └── backend/
        ├── main.py             # CLI interface (optional)
        ├── server.py           # FastAPI server & endpoints
        ├── domain_api.py       # Domain management API
        ├── user_ops.py         # User operations & LDAP
        ├── ldap_handler.py     # LDAP connection management
        ├── db_ops.py           # Database operations
        ├── log_system.py       # API logging system
        ├── test_log_system.py  # Logging system tests
        ├── update_logs.py      # Log update utilities
        └── requirements.txt    # Python dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **PostgreSQL** database (Supabase recommended)
- **LDAP Server** (Active Directory or Samba)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd odie-project
```

### 2. Backend Setup

```bash
cd backend/backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file with your database credentials
cat << EOF > .env
user=your_db_user
password=your_db_password
host=your_db_host
port=5432
dbname=your_db_name
EOF

# Start the FastAPI server
uvicorn server:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create Supabase configuration
# Edit src/supabase/SupabaseClient.jsx with your Supabase credentials

# Start development server
npm run dev
```

## 📚 API Documentation

### Domain Endpoints

| Method | Endpoint                     | Description                 |
| ------ | ---------------------------- | --------------------------- |
| GET    | `/list_domains`              | List all domains for a user |
| POST   | `/add_domain`                | Add a new domain            |
| PUT    | `/update_domain/{domain_id}` | Update domain information   |
| DELETE | `/delete_domain/{domain_id}` | Delete a domain             |

### User Endpoints

| Method | Endpoint                              | Description             |
| ------ | ------------------------------------- | ----------------------- |
| GET    | `/list_users_by_domain/{domain_id}`   | List users in a domain  |
| POST   | `/add_user`                           | Add a new user          |
| PUT    | `/update_user/{domain_id}/{username}` | Update user information |
| POST   | `/disable_user`                       | Disable a user account  |
| POST   | `/enable_user`                        | Enable a user account   |
| DELETE | `/delete_user`                        | Delete a user           |

### Department Endpoints

| Method | Endpoint                                         | Description                  |
| ------ | ------------------------------------------------ | ---------------------------- |
| GET    | `/list_departments_by_domain/{domain_id}`        | List departments in a domain |
| POST   | `/add_department`                                | Add a new department         |
| PUT    | `/update_department/{domain_id}/{department_id}` | Update department            |
| DELETE | `/delete_department/{domain_id}/{department_id}` | Delete department            |

### Logging Endpoints

| Method | Endpoint | Description                 |
| ------ | -------- | --------------------------- |
| GET    | `/logs`  | Retrieve API operation logs |

## 📋 Logging System

ODIE project includes a comprehensive logging system that automatically tracks all API operations. This system records critical operations in the database for security, audit, and debugging purposes.

### 🎯 Logging Features

- **Automatic Logging**: POST, PUT, DELETE operations are automatically logged
- **Comprehensive Recording**: Request/response data, user information, and timestamps
- **Categorized Operations**: Domain, user, department, login, and other operation types
- **Error Tracking**: Failed operations and error messages
- **Filtering**: User, endpoint, operation type, and time-based filtering
- **Pagination**: Pagination support for large log records

### 📊 Log Structure

Each log record contains the following information:

```json
{
  "id": 1,
  "endpoint": "/add_user",
  "method": "POST",
  "operation_type": "user",
  "user_id": "user-uuid-123",
  "domain_id": 1,
  "request_data": {
    "username": "john.doe",
    "first_name": "John",
    "role_id": 2
  },
  "response_data": {
    "success": true,
    "status": "User successfully created"
  },
  "success": true,
  "error_message": null,
  "created_at": "2024-01-15T10:30:45"
}
```

### 📂 Operation Types

- **`domain`**: Domain add, update, delete operations
- **`user`**: User management operations
- **`department`**: Department management operations
- **`login`**: Authentication operations
- **`other`**: Other general operations

### 🔍 Log Querying

#### Get All Logs

```bash
GET /logs?limit=50&offset=0
```

#### Specific User's Logs

```bash
GET /logs?user_id=user-uuid-123&limit=20
```

#### Endpoint-Based Filtering

```bash
GET /logs?endpoint=add_user&limit=10
```

#### Operation Type-Based Filtering

```bash
GET /logs?operation_type=domain&limit=25
```

#### Combination Filters

```bash
GET /logs?user_id=user-uuid&operation_type=user&limit=15&offset=30
```

### 🧪 Testing the Logging System

To test if the logging system is working:

```bash
# Call the test endpoint
curl -X GET "http://localhost:8000/api/test-log"

# Run the test script
cd backend/backend
python test_log_system.py
```

### 📈 Log Analysis Examples

```bash
# All failed operations in the last 24 hours
GET /logs?success=false&limit=100

# All user operations in a specific domain
GET /logs?operation_type=user&domain_id=1

# Most active users in the system
GET /logs?limit=1000  # Then group by user_id
```

### ⚙️ Logging Configuration

The logging system can be configured in `log_system.py`:

- **Automatic Operation Type Detection**: Automatic categorization based on endpoint
- **Change-Only Logs**: GET operations are not logged (for performance)
- **JSON Serialization**: Request/response data in secure JSON format
- **Error Handling**: Logging errors do not affect main operations

### 🔧 Database Schema

```sql
CREATE TABLE api_logs (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    operation_type VARCHAR(50),
    user_id VARCHAR(255),
    domain_id INTEGER,
    request_data JSONB,
    response_data JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Usage Examples

### Adding a Domain via API

```bash
curl -X POST "http://localhost:8000/add_domain" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_name": "example.com",
    "domain_ip": "192.168.1.10",
    "domain_port": 389,
    "domain_component": "dc=example,dc=com",
    "ldap_user": "admin@example.com",
    "ldap_password": "SecurePassword123",
    "domain_type": "ms",
    "created_by": "user-uuid"
  }'
```

### Creating a User

```bash
curl -X POST "http://localhost:8000/add_user" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123",
    "role_id": 2,
    "department_id": 1,
    "domain_id": 1
  }'
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `backend/backend/`:

```env
# Database Configuration
user=your_supabase_user
password=your_supabase_password
host=your_supabase_host
port=5432
dbname=your_database_name
```

### Supabase Configuration

Edit `frontend/src/supabase/SupabaseClient.jsx`:

```javascript
const supabaseUrl = "your-supabase-url";
const supabaseKey = "your-supabase-anon-key";
```

## 🛡️ Security Features

- **Password Encryption**: bcrypt hashing with salt rounds
- **LDAP Security**: Secure LDAP connections with TLS support
- **Authentication**: Supabase-based user authentication
- **Input Validation**: Comprehensive input validation using Pydantic
- **SQL Injection Protection**: Parameterized queries throughout

## 🌐 Supported LDAP Servers

- **Microsoft Active Directory**: Full support with auto-bind
- **Samba AD**: Support with TLS handshake
- **Custom Ports**: Configurable LDAP ports (default: 389)

## 🔮 Future Enhancements

- [ ] Bulk user operations
- [ ] Advanced search and filtering
- [ ] Audit logging and user activity tracking
- [ ] Group management for LDAP
- [ ] Multi-language support
- [ ] Advanced role-based permissions
- [ ] Email notifications
- [ ] Data export/import functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please create an issue in the GitHub repository or contact the development team.

---

**ODIE Project** - Simplifying LDAP management through modern web technology.
