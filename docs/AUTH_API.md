# 🔐 Authentication API Documentation

Complete guide for authentication endpoints in UniLife Backend.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [Register](#1-register)
  - [Login](#2-login)
  - [Logout](#3-logout)
- [Token Management](#token-management)
- [Security Features](#security-features)
- [Error Handling](#error-handling)
- [Frontend Integration](#frontend-integration)

---

## 🎯 Overview

The authentication system uses **JWT (JSON Web Tokens)** for stateless authentication with token blacklist for logout functionality.

**Base URL**: `/api/auth`

---

## 🚀 Endpoints

### 1. Register

Create a new user account.

**Endpoint**: `POST /api/auth/register`  
**Access**: Public

#### Request Body

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "0901234567",
  "role": "customer" // Optional: customer, staff, admin
}
```

**Required fields:**

- `fullName`: User's full name
- `email`: Valid email address (must be unique)
- `password`: Minimum 6 characters
- `phone`: 10-11 digit phone number (must be unique)

**Optional fields:**

- `role`: User role (default: "customer")

#### Success Response (201 Created)

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "0901234567",
      "role": "customer",
      "balance": 0,
      "createdAt": "2024-01-23T10:30:00.000Z"
    }
  }
}
```

#### Error Response (400 Bad Request)

```json
{
  "status": "fail",
  "message": "Email already in use"
}
```

**Possible error messages:**

- "Please provide full name, email, password, and phone number"
- "Email already in use"
- "Phone number already in use"
- "Please provide a valid phone number" (if format is invalid)

````

#### Example Usage

```bash
# cURL
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "phone": "0901234567",
    "role": "customer"
  }'
````

```javascript
// JavaScript (Axios)
const response = await axios.post("/api/auth/register", {
  fullName: "John Doe",
  email: "john@example.com",
  password: "SecurePass123!",
  phone: "0901234567",
  role: "customer",
});

// Save token
localStorage.setItem("token", response.data.token);
```

---

### 2. Login

Authenticate existing user and get access token.

**Endpoint**: `POST /api/auth/login`  
**Access**: Public

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Success Response (200 OK)

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "avatar": "https://res.cloudinary.com/...",
      "phoneNumber": "+84901234567",
      "studentId": "SE12345",
      "createdAt": "2024-01-23T10:30:00.000Z"
    }
  }
}
```

#### Error Response (401 Unauthorized)

```json
{
  "status": "fail",
  "message": "Incorrect email or password"
}
```

#### Example Usage

```bash
# cURL
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

```javascript
// JavaScript (Axios)
const response = await axios.post("/api/auth/login", {
  email: "john@example.com",
  password: "SecurePass123!",
});

// Save token and user info
localStorage.setItem("token", response.data.token);
localStorage.setItem("user", JSON.stringify(response.data.data.user));
```

---

### 3. Logout

Invalidate current JWT token (add to blacklist).

**Endpoint**: `POST /api/auth/logout`  
**Access**: Private (Requires Authentication)

#### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Request Body

```json
{}
```

_No body required - token is extracted from Authorization header_

#### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

#### Error Response (401 Unauthorized)

```json
{
  "status": "fail",
  "message": "You are not logged in. Please log in to access."
}
```

#### Example Usage

```bash
# cURL
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```javascript
// JavaScript (Axios)
const token = localStorage.getItem("token");

const response = await axios.post(
  "/api/auth/logout",
  {},
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

// Clear local storage
localStorage.removeItem("token");
localStorage.removeItem("user");

// Redirect to login
window.location.href = "/login";
```

---

## 🔑 Token Management

### Token Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZDVlYzQ5ZjFiMmM3MmI4YzhlNGYxYSIsImlhdCI6MTcwNjAwNDYwMCwiZXhwIjoxNzA2NjA5NDAwfQ.signature
```

**Payload Decoded:**

```json
{
  "id": "60d5ec49f1b2c72b8c8e4f1a",
  "iat": 1706004600, // Issued at
  "exp": 1706609400 // Expires at (7 days)
}
```

### Token Expiration

- **Default**: 7 days
- **Configuration**: `JWT_EXPIRES_IN` in `.env`

### Using Token in Requests

Include token in Authorization header for all protected routes:

```
Authorization: Bearer <your-jwt-token>
```

### Token Blacklist System

When user logs out:

1. Token is added to server-side blacklist
2. Token becomes immediately invalid
3. Subsequent requests with this token will be rejected

**Note**: In-memory blacklist (current implementation) resets on server restart. For production, use **Redis** for persistent blacklist with TTL.

---

## 🛡️ Security Features

### 1. Password Hashing

Passwords are hashed using **bcrypt** with 12 salt rounds before storing in database.

```javascript
// Never stored in plain text
password: "SecurePass123!"; // ❌ Stored as plain text

// Stored as bcrypt hash
password: "$2b$12$KIX8v8..."; // ✅ Securely hashed
```

### 2. Token Blacklist

Prevents replay attacks by invalidating logged-out tokens.

```javascript
// After logout
Authorization: Bearer <blacklisted-token>
// Response: 401 - "This token has been invalidated. Please log in again."
```

### 3. Token Verification

All protected routes verify:

1. Token exists in Authorization header
2. Token is not blacklisted
3. Token signature is valid
4. Token has not expired
5. User still exists in database

### 4. Password Not Returned

User password is never returned in API responses:

```javascript
user.password = undefined; // Removed before sending
```

---

## ❌ Error Handling

### Common Error Codes

| Status  | Error                                             | Cause                        |
| ------- | ------------------------------------------------- | ---------------------------- |
| **400** | Email already in use                              | User with this email exists  |
| **400** | Please provide email and password                 | Missing credentials          |
| **401** | Incorrect email or password                       | Invalid login credentials    |
| **401** | You are not logged in                             | Missing Authorization header |
| **401** | This token has been invalidated                   | Token was logged out         |
| **401** | The user belonging to this token no longer exists | User deleted                 |
| **401** | Invalid token                                     | Malformed or expired token   |

### Error Response Format

```json
{
  "status": "fail",
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

---

## 💻 Frontend Integration

### React/Next.js Example

```javascript
// utils/auth.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_URL,
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (logout user)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authService = {
  // Register
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};
```

### Usage in Components

```jsx
// Login.jsx
import { useState } from "react";
import { authService } from "../utils/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await authService.login({ email, password });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

```jsx
// Header.jsx
import { authService } from "../utils/auth";

function Header() {
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await authService.logout();
    }
  };

  return (
    <header>
      <div>Welcome, {user?.fullName}</div>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
}
```

### Protected Route Component

```jsx
// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { authService } from "../utils/auth";

function ProtectedRoute({ children, allowedRoles }) {
  const user = authService.getCurrentUser();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🚀 Production Considerations

### 1. Use Redis for Token Blacklist

```javascript
// auth.service.js (Production)
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

export const logout = async (token, userId) => {
  // Add token to Redis with TTL (7 days = token expiration)
  await redis.setex(`blacklist:${token}`, 7 * 24 * 60 * 60, userId);
};

export const isTokenBlacklisted = async (token) => {
  const exists = await redis.exists(`blacklist:${token}`);
  return exists === 1;
};
```

### 2. Secure Environment Variables

```bash
# .env (Production)
JWT_SECRET=very-long-random-secure-secret-key-change-me
JWT_EXPIRES_IN=7d
NODE_ENV=production

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### 3. HTTPS Only

Always use HTTPS in production to prevent token interception.

### 4. Refresh Token System (Advanced)

For better security, implement refresh tokens:

```javascript
// auth.service.js (Advanced)
export const login = async (credentials) => {
  // ... existing code

  const accessToken = generateToken({ id: user._id }, "15m"); // Short-lived
  const refreshToken = generateToken({ id: user._id }, "7d"); // Long-lived

  return { user, accessToken, refreshToken };
};
```

---

## 📚 Summary

| Endpoint             | Method | Access  | Purpose            |
| -------------------- | ------ | ------- | ------------------ |
| `/api/auth/register` | POST   | Public  | Create new account |
| `/api/auth/login`    | POST   | Public  | Get access token   |
| `/api/auth/logout`   | POST   | Private | Invalidate token   |

**Key Features:**

- ✅ JWT-based authentication
- ✅ Token blacklist for logout
- ✅ Secure password hashing (bcrypt)
- ✅ Token expiration (7 days default)
- ✅ Protected route middleware
- ✅ Role-based access control ready

---

**Happy Coding! 🎉**
