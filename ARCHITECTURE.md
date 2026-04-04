# Smart Campus - Authentication Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                   http://localhost:5173                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐        ┌────────────────┐   ┌──────────────┐  │
│  │ LoginPage   │ ──────→│  AuthService   │──→│   API Client │  │
│  └─────────────┘        └────────────────┘   └──────────────┘  │
│        │                        ▲                     │           │
│        │                        │                     │           │
│  ┌─────────────┐        ┌────────────────┐   ┌───────┴────────┐ │
│  │RegisterPage │ ──────→│  AuthContext   │◄──│ HTTP Request   │ │
│  └─────────────┘        │  (useAuth)     │   │ (axios instance)
│        │                └────────────────┘   └────────────────┘ │
│        │                        ▲                                 │
│  ┌─────────────────────────────┘                                │
│  │                                                               │
│  ├─→ ProtectedRoute                                             │
│  │   (checks isAuthenticated + requiredRole)                    │
│  │                                                               │
│  └─→ Renders Dashboard, Admin, etc. based on role              │
│                                                                   │
│  ┌────────────────────────────────────────────┐                │
│  │          localStorage                       │                │
│  │  - user (User object)                      │                │
│  │  - roles (["ADMIN"], ["USER"], etc.)       │                │
│  │  - authToken (Basic Auth credentials)      │                │
│  └────────────────────────────────────────────┘                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │ (Basic Auth or Bearer Token)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Spring Boot)                       │
│                   http://localhost:8080                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────┐                │
│  │      SecurityConfig                         │                │
│  │  - Basic Auth enabled                      │                │
│  │  - CORS enabled                            │                │
│  │  - Method-level @PreAuthorize              │                │
│  │  - Public/Protected routes                 │                │
│  └────────────────────────────────────────────┘                │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  Controller Layer (REST API)                │               │
│  │                                              │               │
│  │  UserController:                           │               │
│  │  - POST   /api/users/register              │               │
│  │  - POST   /api/users/login                 │               │
│  │  - GET    /api/users/me                    │               │
│  │                                              │               │
│  │  RoleController:                           │               │
│  │  - GET    /api/roles                       │               │
│  │  - GET    /api/roles/{id}                  │               │
│  │  - POST   /api/roles (ADMIN)               │               │
│  │  - PUT    /api/roles/{id} (ADMIN)          │               │
│  │  - DELETE /api/roles/{id} (ADMIN)          │               │
│  └─────────────────────────────────────────────┘               │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  Service Layer (Business Logic)             │               │
│  │                                              │               │
│  │  RoleService:                              │               │
│  │  - listAll()                               │               │
│  │  - findById()                              │               │
│  │  - create()                                │               │
│  │  - update()                                │               │
│  │  - delete()                                │               │
│  │                                              │               │
│  │  (UserController uses UserRepository      │               │
│  │   directly for simplicity)                 │               │
│  └─────────────────────────────────────────────┘               │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  Repository Layer (Data Access)             │               │
│  │                                              │               │
│  │  UserRepository:                           │               │
│  │  - findByUsername(String)                  │               │
│  │                                              │               │
│  │  RoleRepository:                           │               │
│  │  - findByName(String)                      │               │
│  └─────────────────────────────────────────────┘               │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │  Model Layer (Entities)                     │               │
│  │                                              │               │
│  │  User Document:                            │               │
│  │  - id (ObjectId)                           │               │
│  │  - username (unique)                       │               │
│  │  - displayName                             │               │
│  │  - email                                   │               │
│  │  - roles (array)                           │               │
│  │                                              │               │
│  │  Role Document:                            │               │
│  │  - id (ObjectId)                           │               │
│  │  - name (unique)                           │               │
│  │  - description                             │               │
│  │  - permissions (array)                     │               │
│  └─────────────────────────────────────────────┘               │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────┐               │
│  │      Database (MongoDB)                     │               │
│  │      Collections:                           │               │
│  │      - users                                │               │
│  │      - roles                                │               │
│  └─────────────────────────────────────────────┘               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow Sequence

```
User                    Frontend              Backend
 │                         │                     │
 │ 1. Visit /login          │                     │
 ├────────────────────────→ │                     │
 │                          │ (Not authenticated) │
 │                          │ Show LoginPage      │
 │                          │                     │
 │ 2. Enter username/pwd    │                     │
 ├────────────────────────→ │                     │
 │                          │ 3. POST /users/login│
 │                          │ (Basic Auth)        │
 │                          ├────────────────────→│
 │                          │                     │ 4. Validate credentials
 │                          │                     │ 5. Look up user in DB
 │                          │                     │ 6. Get user roles
 │                          │                     │
 │                          │← 200 OK + user+roles
 │                          │ {user, roles}      │
 │                          │                     │
 │                          │ 7. Store in localStorage
 │                          │ - user             │
 │                          │ - roles            │
 │                          │ - authToken        │
 │                          │                     │
 │ 8. Redirect to /         │                     │
 ├────────────────────────→ │                     │
 │                          │ 9. ProtectedRoute  │
 │                          │ checks localStorage│
 │                          │ ✓ Authenticated    │
 │                          │ ✓ Has required role│
 │                          │ Render Dashboard   │
 │                          │                     │
 │ 10. See dashboard        │                     │
 │ + navbar with username   │                     │
 │ + role badge             │                     │
 │                          │                     │
 │ 11. Click /admin         │                     │
 │ (if ADMIN role)          │                     │
 ├────────────────────────→ │                     │
 │                          │ ProtectedRoute     │
 │                          │ checks:            │
 │                          │ - authenticated? ✓ │
 │                          │ - has ADMIN? ✓     │
 │                          │ Render AdminPage   │
 │                          │                     │
 │ 12. Click Logout         │                     │
 ├────────────────────────→ │                     │
 │                          │ Clear localStorage │
 │                          │ Redirect to /login │
 │                          │                     │
```

---

## Role-Based Access Decision Tree

```
┌─────────────────────────────────────────┐
│  User tries to access a route           │
│  (e.g., /admin)                         │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ Is user in app?  │
        │ (check localStorage
        │        or state) │
        └────┬────────┬────┘
             │        │
          NO│        │ YES
            │        │
            ▼        ▼
        /login   ┌─────────────────────┐
                 │ ProtectedRoute?     │
                 │ (required routing)  │
                 └────┬────────┬───────┘
                      │        │
                    NO│        │ YES
                      │        │
                      ▼        ▼
                  /public   ┌──────────────────┐
                            │ has Required     │
                            │ Role?            │
                            │ (e.g., ADMIN)    │
                            └────┬────────┬────┘
                                 │        │
                              NO│        │ YES
                                │        │
                                ▼        ▼
                         /unauthorized  Render
                              403    Component
```

---

## Data Flow: Login to Protected Route

```
1. USER VISITS /login
   └─→ PublicRoute checks: isAuthenticated?
       └─→ NO: Show LoginPage
       └─→ YES: Redirect to /

2. USER ENTERS CREDENTIALS & CLICKS LOGIN
   └─→ LoginPage calls useAuth().login(username, password)
       └─→ AuthContext.login() calls AuthService.login()
           └─→ AuthService.login() sends: POST /api/users/login (Basic Auth)
               └─→ Backend validates credentials
               └─→ Backend returns: { user: {...}, roles: ["ADMIN"] }

3. AUTHCONTEXT RECEIVES RESPONSE
   └─→ setUser({ username, displayName, email, roles })
   └─→ setRoles(["ADMIN"])
   └─→ localStorage.setItem("user", JSON.stringify(user))
   └─→ localStorage.setItem("roles", JSON.stringify(["ADMIN"]))

4. COMPONENT REDIRECTS TO /
   └─→ App.jsx routes to / path
   └─→ ProtectedRoute component checks:
       ├─→ loading? (NO, ready)
       ├─→ isAuthenticated? (YES, user in state)
       └─→ hasRole(requiredRole)? (YES for /)
   └─→ Render Dashboard inside AppLayout

5. APPBAR/TOPNAV RENDERS
   └─→ TopNav reads useAuth() context
       ├─→ user.displayName → "Administrator"
       ├─→ roles[0] → "ADMIN" (badge)
       └─→ logout button available

6. USER VISITS /admin
   └─→ ProtectedRoute component checks:
       ├─→ isAuthenticated? (YES)
       ├─→ requiredRole = "ADMIN"
       ├─→ hasRole("ADMIN")? (YES)
   └─→ Render AdminPage

7. USER VISITS /admin AS REGULAR USER
   └─→ ProtectedRoute component checks:
       ├─→ isAuthenticated? (YES)
       ├─→ requiredRole = "ADMIN"
       ├─→ hasRole("ADMIN")? (NO, user has ["USER"])
   └─→ Redirect to /unauthorized
   └─→ Show 403 page
```

---

## Security Layers

```
┌──────────────────────────────────────────────────┐
│                   FRONTEND                        │
├──────────────────────────────────────────────────┤
│ Layer 1: Route Protection (ProtectedRoute)       │
│ - Check localStorage for user                     │
│ - Verify authentication status                    │
│ - Check for required roles                        │
│ - Redirect if not authorized                      │
└──────────────────────────────────────────────────┘
                       │
                       │ HTTP Request
                       │ (credentials in Authorization header)
                       ▼
┌──────────────────────────────────────────────────┐
│                    BACKEND                        │
├──────────────────────────────────────────────────┤
│ Layer 2: Spring Security                         │
│ - Validate Basic Auth credentials                │
│ - Extract user from in-memory store              │
│ - Build SecurityContext with authorities         │
│ - Load user from MongoDB for additional info     │
└──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│ Layer 3: Method-Level Security                   │
│ @PreAuthorize("hasRole('ADMIN')")                │
│ - Evaluated before method execution              │
│ - Checks granted authorities                     │
│ - Returns 403 Forbidden if insufficient          │
└──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│ Layer 4: Business Logic                          │
│ - Service layer processes request                │
│ - Validates input parameters                     │
│ - Checks database permissions                    │
│ - Returns result or error                        │
└──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│ Layer 5: Database (MongoDB)                      │
│ - Persists user and role data                    │
│ - Enforces unique constraints (username)         │
│ - Indexes for quick lookups                      │
└──────────────────────────────────────────────────┘
```

---

## File Structure

```
smart-campus/
├── backend/
│   └── src/main/java/com/sliit/smartcampus/
│       ├── model/
│       │   ├── User.java (NEW)
│       │   └── Role.java (NEW)
│       ├── repository/
│       │   ├── UserRepository.java (NEW)
│       │   └── RoleRepository.java (NEW)
│       ├── service/
│       │   └── RoleService.java (NEW)
│       ├── controller/
│       │   ├── UserController.java (NEW) ← 3 endpoints
│       │   └── RoleController.java (NEW) ← 5 endpoints
│       └── config/
│           ├── SecurityConfig.java (UPDATED)
│           └── DataInitializer.java (UPDATED)
│
├── frontend/
│   └── src/
│       ├── api/
│       │   └── authService.js (NEW)
│       ├── auth/
│       │   └── AuthContext.jsx (UPDATED)
│       ├── components/
│       │   ├── ProtectedRoute.jsx (NEW)
│       │   └── layout/
│       │       ├── TopNav.jsx (UPDATED)
│       │       └── TopNav.css (NEW)
│       ├── pages/
│       │   ├── LoginPage.jsx (NEW)
│       │   ├── RegisterPage.jsx (NEW)
│       │   ├── UnauthorizedPage.jsx (NEW)
│       │   └── AuthPages.css (NEW)
│       └── App.jsx (UPDATED)
│
├── AUTH_IMPLEMENTATION.md (NEW - Full guide)
├── MEMBER_4_IMPLEMENTATION.md (NEW - Submission doc)
└── postman_auth_collection.json (NEW - API tests)
```

---

## Component Relationships

```
App
├── ProtectedRoute (/)
│   └── AppLayout
│       ├── TopNav (uses useAuth hook)
│       │   └── Logout button
│       └── DashboardPage
│
├── ProtectedRoute (/admin, requires ADMIN)
│   └── AppLayout
│       └── AdminPage
│
├── ProtectedRoute (/other routes)
│   └── AppLayout
│       └── Various pages
│
├── PublicRoute (/login)
│   └── LoginPage (uses useAuth hook)
│
└── PublicRoute (/register)
    └── RegisterPage (uses useAuth hook)
```

---

## Key Hooks Used

### useAuth() Hook
```javascript
const {
  user,              // Current user object
  roles,             // Array of role names
  loading,           // Loading state
  login,             // Async function
  register,          // Async function
  logout,            // Function
  hasRole,           // Function to check role
  isAuthenticated    // Boolean
} = useAuth();
```

### Example Usage
```javascript
const { isAuthenticated, hasRole, logout } = useAuth();

if (!isAuthenticated) return <Navigate to="/login" />;
if (hasRole("ADMIN")) return <AdminPanel />;
```
