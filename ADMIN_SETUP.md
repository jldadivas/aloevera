# Admin User Setup Guide

## ✓ What Has Been Created

### 1. **Admin Routes** (`backend/routes/admin.js`)
   - `GET /api/v1/admin/users` - Get all users
   - `GET /api/v1/admin/users/:id` - Get single user
   - `PUT /api/v1/admin/users/:id` - Update user
   - `DELETE /api/v1/admin/users/:id` - Delete user
   - `POST /api/v1/admin/create-admin` - Create new admin user

### 2. **Admin Controller** (`backend/controllers/adminController.js`)
   - Added `createAdmin` function to create new admin users
   - All admin routes are protected (require authentication & admin role)

### 3. **Admin Seeder** (`backend/seeders/adminSeeder.js`)
   - Automatically creates default admin users
   - Can be run anytime without deleting existing admins

## 📝 Default Admin Credentials

| Email | Password |
|-------|----------|
| admin@vera.com | Admin@123456 |
| superadmin@vera.com | SuperAdmin@123456 |

## 🚀 How to Use

### 1. **Seed Initial Admin Users** (Already Done)
```bash
npm run seed:admin
```

### 2. **Create New Admin User** (Via API)
**Endpoint:** `POST /api/v1/admin/create-admin`

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "newadmin@vera.com",
  "password": "SecurePassword@123",
  "full_name": "New Admin",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "newadmin@vera.com",
    "full_name": "New Admin",
    "role": "admin",
    "message": "Admin user created successfully"
  }
}
```

### 3. **Login as Admin**
**Endpoint:** `POST /api/v1/auth/login`

**Body:**
```json
{
  "email": "admin@vera.com",
  "password": "Admin@123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "admin@vera.com",
      "full_name": "Admin User",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
}
```

### 4. **Admin Operations** (Protected Routes)
Use the returned JWT token in the Authorization header for all admin operations.

**Get All Users:**
```
GET /api/v1/admin/users
```

**Get Specific User:**
```
GET /api/v1/admin/users/{user_id}
```

**Update User:**
```
PUT /api/v1/admin/users/{user_id}
Body: { "full_name": "...", "role": "...", "is_active": true/false }
```

**Delete User:**
```
DELETE /api/v1/admin/users/{user_id}
```

## 🔐 Security Features

- ✓ All admin routes protected by JWT authentication
- ✓ Role-based access control (admin role required)
- ✓ Passwords are hashed using bcrypt
- ✓ Admin creation requires existing admin authentication
- ✓ Email validation and uniqueness enforcement

## 📋 Next Steps

1. Change default passwords for security
2. Create additional admins as needed using the API
3. Implement password reset functionality if desired
4. Add admin dashboard in frontend to manage users
