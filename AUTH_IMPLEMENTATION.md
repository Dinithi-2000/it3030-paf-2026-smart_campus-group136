# Smart Campus - Authentication & Role Management Guide

## Overview
This implementation adds a complete authentication and role-based access system to the Smart Campus application. As Member 4, you've built:

1. **Role Management System** - Create, read, update, delete custom roles
2. **User Authentication** - Login and register endpoints
3. **Role-Based Access Control** - Protect routes and endpoints by role
4. **Responsive Auth UI** - Modern login and register pages with role displays

---

## Architecture

### Backend Components

#### 1. User Management
- **Model**: `User` document with roles array
- **Repository**: `UserRepository` for MongoDB queries
- **Controller**: `UserController` with login/register/me endpoints

#### 2. Role Management  
- **Model**: `Role` document with name, description, permissions
- **Service**: `RoleService` for CRUD operations
- **Repository**: `RoleRepository` for MongoDB queries
- **Controller**: `RoleController` with admin-protected CRUD endpoints

#### 3. Security
- **SecurityConfig**: Enables method-level security, basic auth, CORS
- **DataInitializer**: Seeds default roles and demo users at startup

### Frontend Components

#### 1. Authentication
- **AuthContext**: Centralized auth state management with login/register/logout
- **authService**: API communication layer
- **ProtectedRoute**: Wrapper for role-based route protection

#### 2. Pages
- **LoginPage**: User login with demo credentials
- **RegisterPage**: New user registration (defaults to USER role)
- **UnauthorizedPage**: 403 message for insufficient permissions

#### 3. Navigation
- **TopNav**: Enhanced with user profile and logout button

---

## Getting Started

### Start the Backend
```bash
cd backend
.\mvnw.cmd spring-boot:run
```

Server runs at `http://localhost:8080`

### Start the Frontend  
```bash
cd frontend
npm run dev
```

App runs at `http://localhost:5173`

---

## Demo Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | adminpass | ADMIN |
| user | userpass | USER |
| tech | techpass | TECHNICIAN |

**New registrations get USER role by default.**

---

## API Endpoints

### Public Endpoints
- `POST /api/users/register` - Register new user
  ```json
  {
    "username": "john",
    "displayName": "John Doe",
    "email": "john@example.com"
  }
  ```

- `POST /api/users/login` - Login user (uses basic auth)
  ```bash
  curl -u username:password http://localhost:8080/api/users/login
  ```

### Protected Endpoints (Requires Authentication)
- `GET /api/users/me` - Get current authenticated user

- `GET /api/roles` - List all roles
- `GET /api/roles/{id}` - Get role by ID
- `POST /api/roles` - Create role (ADMIN only)
  ```json
  {
    "name": "MANAGER",
    "description": "Manager role",
    "permissions": ["bookings:manage", "tickets:review"]
  }
  ```
- `PUT /api/roles/{id}` - Update role (ADMIN only)
- `DELETE /api/roles/{id}` - Delete role (ADMIN only)

---

## Flow Diagrams

### Login Flow
```
User visits /login
    ↓
Enters credentials
    ↓
Submit to POST /api/users/login (basic auth)
    ↓
Server validates credentials, returns user + roles
    ↓
AuthContext stores in localStorage
    ↓
Redirect to / dashboard (ProtectedRoute validates)
    ↓
User can now access routes based on roles
```

### Protected Route Check
```
User navigates to /admin
    ↓
ProtectedRoute component checks:
  - Is user authenticated? NO → redirect to /login
  - Does user have requiredRole? NO → redirect to /unauthorized
    ↓
Route allowed, render AdminPage
```

---

## Key Features

### ✅ Implemented
- [x] Login/register system with demo accounts
- [x] Role-based route protection (/admin requires ADMIN)
- [x] Persistent auth state in localStorage
- [x] Custom role management (create/edit/delete roles)
- [x] User profile display in navbar
- [x] Logout functionality
- [x] Modern, responsive auth UI
- [x] Automatic redirects for unauthenticated users
- [x] CORS enabled for frontend communication

### 🎯 Next Steps (Optional)
- Add OAuth 2.0 (Google sign-in) integration
- Role assignment UI (admin assigns users to roles)
- Permission-based access (not just role-based)
- User management page (admin can create/disable users)
- Audit logging for role changes
- Email verification for new registrations

---

## Testing Your Work

### Test 1: Basic Login
1. Open http://localhost:5173/login
2. Enter `admin` / `adminpass`
3. Should redirect to dashboard
4. Navbar should show "Administrator" with "ADMIN" role

### Test 2: Admin-Only Access
1. Login as `user` / `userpass`
2. Navigate to /admin (Analytics link)
3. Should see 403 "Access Denied"
4. Click "Go to Dashboard" to return

### Test 3: New Registration
1. Open http://localhost:5173/register
2. Fill form and submit
3. Should redirect to login after success
4. Login with new credentials
5. Should have USER role only

### Test 4: Create Custom Role
1. Login as admin
2. Use curl or Postman:
   ```bash
   curl -u admin:adminpass -H "Content-Type: application/json" \
     -d '{"name":"MANAGER","description":"Custom Manager","permissions":["reports:view"]}' \
     http://localhost:8080/api/roles
   ```
3. Manually assign in database (future UI work)

---

## Files Created/Modified

### Backend
```
backend/src/main/java/com/sliit/smartcampus/
├── model/
│   ├── Role.java (NEW)
│   └── User.java (NEW)
├── repository/
│   ├── RoleRepository.java (NEW)
│   └── UserRepository.java (NEW)
├── service/
│   └── RoleService.java (NEW)
├── controller/
│   ├── RoleController.java (NEW)
│   └── UserController.java (NEW)
└── config/
    ├── SecurityConfig.java (UPDATED)
    └── DataInitializer.java (UPDATED)
```

### Frontend
```
frontend/src/
├── api/
│   └── authService.js (NEW)
├── auth/
│   └── AuthContext.jsx (UPDATED)
├── components/
│   ├── ProtectedRoute.jsx (NEW)
│   └── layout/
│       ├── TopNav.jsx (UPDATED)
│       └── TopNav.css (NEW)
├── pages/
│   ├── LoginPage.jsx (NEW)
│   ├── RegisterPage.jsx (NEW)
│   ├── UnauthorizedPage.jsx (NEW)
│   └── AuthPages.css (NEW)
└── App.jsx (UPDATED)
```

---

## Commit Message Suggestions

After testing, commit your work:

```bash
git add .
git commit -m "feat: Add authentication & role-based access control

- Implement user login/register endpoints with basic auth
- Add custom role management system (create/edit/delete roles)
- Create protected routes with role-based access checks
- Add modern login and register pages with responsive UI
- Implement user profile display and logout in navbar
- Add role-based route guards (/admin requires ADMIN role)
- Seed default roles (ADMIN, USER, TECHNICIAN) and demo users
- Enable method-level security for admin endpoints

Member 4 endpoints:
- POST   /api/users/register (register new user)
- POST   /api/users/login (authenticate user)
- GET    /api/users/me (get current user)
- GET    /api/roles (list roles)
- GET    /api/roles/{id} (get role by ID)
- POST   /api/roles (create role - ADMIN only)
- PUT    /api/roles/{id} (update role - ADMIN only)
- DELETE /api/roles/{id} (delete role - ADMIN only)
"
```

---

## Troubleshooting

### Can't login
- Verify backend is running: `http://localhost:8080/api/roles` should respond
- Check demo credentials: admin/adminpass, user/userpass, tech/techpass
- Check browser console for CORS errors

### Roles not showing
- Ensure backend seeded data (check logs for DataInitializer output)
- Login again after backend restart (data may have been cleared in earlier runs)

### Protected routes not working
- Clear localStorage: `localStorage.clear()` in browser console
- Hard refresh: `Ctrl+Shift+R` (Windows)
- Check AuthProvider wraps entire app in main.jsx

### CORS errors
- SecurityConfig disables CSRF and enables CORS for all origins
- If still issues, backend logs should show the error

---

## Next: Notifications Integration

As Member 4's main focus, next implement:
1. **Notification Model** - content, type, read status, recipient
2. **NotificationService** - CRUD and push logic
3. **NotificationController** - User and admin endpoints
4. **Notification Preferences** - User can toggle notification types
5. **Real-time Notifications** - WebSocket for live updates (optional)
6. **Notification UI** - Panel in dashboard, email notifications
