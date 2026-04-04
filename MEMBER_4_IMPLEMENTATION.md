# Member 4 - Authentication & Role Management Implementation

## Overview
As Member 4, you have implemented a complete authentication and role-based access control system for the Smart Campus Operations Hub. This includes login/register functionality, custom role management, and protected routes.

---

## REST API Endpoints Implemented (Member 4)

### 1. User Registration
- **Endpoint**: `POST /api/users/register`
- **Access**: Public (no authentication required)
- **HTTP Method**: POST
- **Request Body**:
  ```json
  {
    "username": "john",
    "displayName": "John Doe",
    "email": "john@example.com"
  }
  ```
- **Response**: User object + 201 Created
- **Error Cases**: 400 if username already exists

### 2. User Login
- **Endpoint**: `POST /api/users/login`
- **Access**: Public (uses HTTP Basic Auth)
- **HTTP Method**: POST
- **Authentication**: Basic Auth (username:password)
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "adminpass"
  }
  ```
- **Response**: 
  ```json
  {
    "user": { "id": "...", "username": "admin", "displayName": "Administrator", "email": "admin@smartcampus.local", "roles": ["ADMIN"] },
    "roles": ["ADMIN"]
  }
  ```

### 3. Get Current Authenticated User
- **Endpoint**: `GET /api/users/me`
- **Access**: Authenticated users only
- **HTTP Method**: GET
- **Response**: Current user object + roles array
- **Error Cases**: 401 if not authenticated

### 4. List All Roles
- **Endpoint**: `GET /api/roles`
- **Access**: Authenticated users only
- **HTTP Method**: GET
- **Response**: Array of Role objects
- **Filtering**: None (returns all)

### 5. Get Role by ID
- **Endpoint**: `GET /api/roles/{id}`
- **Access**: Authenticated users only
- **HTTP Method**: GET
- **Path Parameter**: id (MongoDB ObjectId)
- **Response**: Single Role object
- **Error Cases**: 404 if role not found

### 6. Create New Role
- **Endpoint**: `POST /api/roles`
- **Access**: ADMIN role only (method security)
- **HTTP Method**: POST
- **Request Body**:
  ```json
  {
    "name": "MANAGER",
    "description": "Manager with supervisory permissions",
    "permissions": ["bookings:manage", "tickets:review", "reports:view"]
  }
  ```
- **Response**: Created Role object + 201 Created
- **Authorization**: @PreAuthorize("hasRole('ADMIN')")

### 7. Update Existing Role
- **Endpoint**: `PUT /api/roles/{id}`
- **Access**: ADMIN role only (method security)
- **HTTP Method**: PUT
- **Path Parameter**: id (MongoDB ObjectId)
- **Request Body**:
  ```json
  {
    "name": "MANAGER",
    "description": "Updated manager role",
    "permissions": ["bookings:manage", "tickets:review", "reports:view", "users:manage"]
  }
  ```
- **Response**: Updated Role object
- **Error Cases**: 404 if role not found
- **Authorization**: @PreAuthorize("hasRole('ADMIN')")

### 8. Delete Role
- **Endpoint**: `DELETE /api/roles/{id}`
- **Access**: ADMIN role only (method security)
- **HTTP Method**: DELETE
- **Path Parameter**: id (MongoDB ObjectId)
- **Response**: 204 No Content
- **Authorization**: @PreAuthorize("hasRole('ADMIN')")

---

## HTTP Methods Used
- ✅ **GET** - List roles, get single role, get current user
- ✅ **POST** - Register user, login user, create role
- ✅ **PUT** - Update role
- ✅ **DELETE** - Delete role

---

## Frontend Components / Routes Implemented

### Protected Routes
- `/login` - Public login page (redirects to dashboard if already authenticated)
- `/register` - Public registration page (redirects to dashboard if already authenticated)
- `/` - Dashboard (requires authentication)
- `/facilities` - Facilities page (requires authentication)
- `/bookings` - Bookings page (requires authentication)
- `/tickets` - Tickets page (requires authentication)
- `/notifications` - Notifications page (requires authentication)
- `/admin` - Admin/Analytics page (requires authentication + ADMIN role)
- `/unauthorized` - 403 Access Denied page

### React Components Created
1. **AuthContext** - State management for authentication
2. **ProtectedRoute** - Wrapper for protected routes with role checking
3. **PublicRoute** - Wrapper for public routes (redirects authenticated users)
4. **LoginPage** - Login form with demo credentials display
5. **RegisterPage** - User registration form
6. **UnauthorizedPage** - 403 error page
7. **Top Navigation Enhanced** - User profile and logout button

### UI/UX Features
- Modern gradient-based auth pages
- Responsive design for mobile/desktop
- Error and success message alerts
- Demo credentials displayed on login page
- User profile in navbar showing display name and role
- Logout button with redirect to login
- Loading states during auth operations
- Automatic redirects based on authentication state

---

## Database Schema (MongoDB)

### User Document
```json
{
  "_id": ObjectId,
  "username": "string (unique)",
  "displayName": "string",
  "email": "string",
  "roles": ["string"] // e.g., ["ADMIN"], ["USER"], ["TECHNICIAN"]
}
```

### Role Document
```json
{
  "_id": ObjectId,
  "name": "string (unique)", // e.g., "ADMIN", "USER", "TECHNICIAN", "MANAGER"
  "description": "string",
  "permissions": ["string"] // e.g., ["roles:manage", "bookings:create"]
}
```

---

## Authentication Flow

1. **Registration**: User fills form → POST /api/users/register → User created with USER role
2. **Login**: User enters credentials → POST /api/users/login (basic auth) → Returns user + roles
3. **Session**: Frontend stores user and roles in localStorage
4. **Protected Routes**: ProtectedRoute checks localStorage before rendering
5. **Authorization**: Backend uses @PreAuthorize for method-level security
6. **Logout**: User clicks logout → Clear localStorage → Redirect to login

---

## Security Implementation

### Backend Security
- ✅ Spring Security enabled
- ✅ Method-level security with @PreAuthorize
- ✅ CSRF protection disabled (for API usage)
- ✅ CORS enabled for frontend communication
- ✅ Basic Authentication for API access
- ✅ Public/Protected endpoint separation
- ✅ Admin-only endpoints for role management

### Frontend Security
- ✅ Protected routes with authentication checks
- ✅ Role-based route access control
- ✅ Automatic logout redirects
- ✅ Persistent session in localStorage
- ✅ No sensitive data exposed in URLs

---

## Demo Users

| Username | Password | Role | Access |
|----------|----------|------|--------|
| admin | adminpass | ADMIN | All routes + admin panel |
| user | userpass | USER | All routes except /admin |
| tech | techpass | TECHNICIAN | All routes except /admin |

New users registered via `/register` get **USER** role by default.

---

## Testing Instructions

### Prerequisite: Start Services
```bash
# Terminal 1: Backend
cd backend
.\mvnw.cmd spring-boot:run

# Terminal 2: Frontend
cd frontend
npm run dev
```

The backend runs at `http://localhost:8080` and frontend at `http://localhost:5173`.

### Test Case 1: Login as Admin
1. Navigate to `http://localhost:5173/login`
2. Enter: username=`admin`, password=`adminpass`
3. Click "Login"
4. Expected: Redirect to dashboard, navbar shows "Administrator" with "ADMIN" role

### Test Case 2: Access Admin Route
1. Click "Analytics" in navbar (goes to `/admin`)
2. Expected: Admin page loads (ADMIN users only)
3. Logout and login as `user`
4. Try to access `/admin` directly
5. Expected: Redirect to 403 "Access Denied" page

### Test Case 3: Register New User
1. Click "Register here" link on login page
2. Fill in: username, display name, email
3. Submit form
4. Expected: Success message, redirect to login after 2 seconds
5. Login with new credentials
6. Expected: User created with USER role

### Test Case 4: Create Custom Role (Admin)
```bash
# Use curl or Postman
curl -u admin:adminpass -H "Content-Type: application/json" \
  -d '{"name":"MANAGER","description":"Manager","permissions":["reports:view"]}' \
  http://localhost:8080/api/roles
```
Expected: 201 Created with role object

### Test Case 5: Access Control
1. Login as regular user
2. Try to POST to `/api/roles` directly (use curl)
3. Expected: 403 Forbidden (only ADMIN can create roles)

---

## Postman Collection
A ready-to-use Postman collection is included: `postman_auth_collection.json`
Import this in Postman for quick testing of all endpoints.

**Note**: Update the `Authorization` header with valid Basic Auth credentials.

---

## Code Quality & Best Practices

### Backend
- ✅ Layered architecture (Controller → Service → Repository)
- ✅ DTOs for request/response objects
- ✅ Proper HTTP status codes (200, 201, 400, 401, 403, 404)
- ✅ Exception handling with meaningful error messages
- ✅ Method-level security annotations
- ✅ CORS configuration for production
- ✅ Database persistence (MongoDB)

### Frontend
- ✅ React Hooks (useState, useContext, useEffect)
- ✅ Context API for state management
- ✅ Protected route components
- ✅ Error boundary considerations
- ✅ Responsive CSS design
- ✅ LocalStorage for session persistence
- ✅ Proper cleanup on logout

---

## Commit History Example

```
commit abc123
Author: Member 4
Date: 2026-04-04

    feat: Add authentication & role-based access control
    
    - Implement user login/register with HTTP Basic Auth
    - Add custom role management (CRUD operations)
    - Create role-based route protection
    - Implement modern auth UI with responsive design
    - Add user profile display and logout in navbar
    - Admin-only route (/admin) with role checking
    - Seed default roles and demo users at startup
    
    Endpoints (8 total, 4 different HTTP methods):
    - POST   /api/users/register
    - POST   /api/users/login
    - GET    /api/users/me
    - GET    /api/roles
    - GET    /api/roles/{id}
    - POST   /api/roles (ADMIN)
    - PUT    /api/roles/{id} (ADMIN)
    - DELETE /api/roles/{id} (ADMIN)
```

---

## Next Steps (Member 4's Main Focus)

As Member 4, your primary responsibilities after this are:
1. **Notifications Module** - Core feature for ticketing and booking approvals
2. **OAuth 2.0 Integration** - Google sign-in support
3. **Role Enhancements** - Additional custom roles beyond the basic 3

The authentication and role management foundation is now ready for these features!

