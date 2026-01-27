# III. Functional Requirements

## 1. Authentication

### a. Login

#### Function Trigger

- **Navigation Path:** User accesses URL `/login` or clicks the "Login" button on the header when not logged in.
- **Timing:** Anytime the user wants to access the system.

#### Function Description

- **Actors/Roles:** Guest (unauthenticated user)
- **Purpose:** Allow users to authenticate and access the system with a registered account.
- **Interface:** Login form with Email, Password fields and action buttons.
- **Data Processing:**
  1. Receive login credentials from user (email, password)
  2. Send request to API `/api/auth/login`
  3. Validate credentials against database
  4. Return access token and user info if successful
  5. Save token and user info to localStorage
  6. Redirect to home page

#### Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                        Login                            │
│              Welcome back to UniLife                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Email                                             │  │
│  │ [Enter your email                              ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Password                                          │  │
│  │ [Enter your password                           ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ☐ Remember me                    Forgot password?     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                      Login                         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                         ── or ──                        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │           🔵 Sign in with Google                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│           Don't have an account? Register now           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Function Details

| Field    | Data Type | Validation                           | Description                    |
| -------- | --------- | ------------------------------------ | ------------------------------ |
| Email    | String    | Required, Email format (xxx@xxx.xxx) | Email registered in the system |
| Password | String    | Required                             | Account password               |

**Business Logic:**

| #   | Condition                      | Action                                                                        |
| --- | ------------------------------ | ----------------------------------------------------------------------------- |
| 1   | Email or password is empty     | Display validation error, do not send request                                 |
| 2   | Invalid email format           | Display "Invalid email format"                                                |
| 3   | Email does not exist in system | Display "Email or password is incorrect"                                      |
| 4   | Incorrect password             | Display "Email or password is incorrect"                                      |
| 5   | Account registered with Google | Display "This account was registered with Google. Please sign in with Google" |
| 6   | Account is banned/inactive     | Display corresponding notification                                            |
| 7   | Login successful               | Save token, display toast "Login successful!", redirect to "/"                |

**API Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response (Success - 200):**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "fullName": "Nguyen Van A",
      "role": "customer",
      "avatar": "...",
      "provider": "local"
    }
  }
}
```

---

### b. Register

#### Function Trigger

- **Navigation Path:** User accesses URL `/register` or clicks the "Register" button on the header, or clicks "Register now" link on Login page.
- **Timing:** When a new user wants to create an account.

#### Function Description

- **Actors/Roles:** Guest (user without an account)
- **Purpose:** Allow users to create a new account in the system through OTP verification via email.
- **Interface:** Registration form and OTP verification page.
- **Data Processing:**
  1. Receive registration information from user
  2. Validate data on client side
  3. Send OTP request to API `/api/auth/register/send-otp`
  4. Redirect to OTP verification page
  5. User enters OTP from email
  6. Send OTP verification request to API `/api/auth/register/verify-otp`
  7. Create account and redirect to Login page

#### Screen Layout

**Registration Screen:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   Create Account                        │
│            Create a new account to use UniLife          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Full Name                                         │  │
│  │ [Enter your full name                          ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Email                                             │  │
│  │ [Enter your email                              ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Phone Number                                      │  │
│  │ [Enter your phone number                       ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Password                                          │  │
│  │ [Enter password (at least 6 characters)        ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                     Register                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│           Already have an account? Login now            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**OTP Verification Screen:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                        📧                               │
│                  Verify Email                           │
│        Enter the OTP code sent to your email            │
│                user@example.com                         │
│                                                         │
│         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐            │
│         │ _ │ │ _ │ │ _ │ │ _ │ │ _ │ │ _ │            │
│         └───┘ └───┘ └───┘ └───┘ └───┘ └───┘            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                      Verify                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│         Didn't receive code? Resend (60s)               │
│                                                         │
│                ← Back to registration                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Function Details

| Field        | Data Type | Validation                     | Description                              |
| ------------ | --------- | ------------------------------ | ---------------------------------------- |
| Full Name    | String    | Required, Max 100 chars        | User's full name                         |
| Email        | String    | Required, Email format, Unique | Email for registration and receiving OTP |
| Phone Number | String    | Required, 10-11 digits         | Contact phone number                     |
| Password     | String    | Required, Min 6 chars          | Login password                           |
| OTP          | String    | Required, 6 digits             | OTP code sent via email                  |

**Business Logic - Registration:**

| #   | Condition                 | Action                                                |
| --- | ------------------------- | ----------------------------------------------------- |
| 1   | Any field is missing      | Display required field error                          |
| 2   | Invalid email format      | Display "Invalid email format"                        |
| 3   | Password < 6 characters   | Display "Password must be at least 6 characters"      |
| 4   | Invalid phone number      | Display "Invalid phone number format"                 |
| 5   | Email already used        | Display "Email is already in use"                     |
| 6   | Phone number already used | Display "Phone number is already in use"              |
| 7   | Valid information         | Send OTP via email, redirect to OTP verification page |

**Business Logic - OTP Verification:**

| #   | Condition                     | Action                                                                |
| --- | ----------------------------- | --------------------------------------------------------------------- |
| 1   | OTP is empty                  | Display required error                                                |
| 2   | OTP is not 6 digits           | Display "Please enter all 6 OTP digits"                               |
| 3   | Incorrect OTP                 | Display "Incorrect OTP code. X attempts remaining"                    |
| 4   | OTP expired (> 5 minutes)     | Display "OTP verification failed"                                     |
| 5   | Exceeded 5 attempts           | Display "Maximum attempts exceeded. Please request a new OTP"         |
| 6   | Resend OTP when countdown > 0 | Button disabled, display countdown                                    |
| 7   | Resend OTP successful         | Reset countdown to 60s, old OTP invalidated                           |
| 8   | Correct OTP                   | Create account, display "Registration successful!", redirect to Login |

**API Endpoints:**

1. **Send OTP:** `POST /api/auth/register/send-otp`
2. **Verify OTP:** `POST /api/auth/register/verify-otp`

---

### c. Login with Google

#### Function Trigger

- **Navigation Path:** Click "Sign in with Google" button on Login page.
- **Timing:** When user wants to quickly sign in using their Google account.

#### Function Description

- **Actors/Roles:** Guest
- **Purpose:** Allow users to quickly login/register using Google OAuth.
- **Interface:** Google OAuth popup.
- **Data Processing:**
  1. User clicks "Sign in with Google" button
  2. Open Google OAuth popup
  3. User selects Google account and grants permission
  4. Receive Google ID Token
  5. Send token to API `/api/auth/google`
  6. Backend verifies token with Google
  7. Create new account (if not exists) or login (if exists)
  8. Return access token and user info
  9. Redirect to home page

#### Screen Layout

_Uses default Google OAuth popup_

#### Function Details

**Business Logic:**

| #   | Condition                                   | Action                                                         |
| --- | ------------------------------------------- | -------------------------------------------------------------- |
| 1   | User cancels popup                          | Display "Unable to connect with Google. Please try again."     |
| 2   | New Google account (not in system)          | Auto-create account with provider="google", emailVerified=true |
| 3   | Email already registered with local account | Link account, update provider="google"                         |
| 4   | Google account already logged in before     | Login normally                                                 |
| 5   | Login successful                            | Save token, avatar from Google, redirect to "/"                |

**API Endpoint:** `POST /api/auth/google`

**Request Body:**

```json
{
  "idToken": "Google ID Token from OAuth"
}
```

**Note:** Accounts registered with Google cannot change password.

---

### d. Logout

#### Function Trigger

- **Navigation Path:** Click on avatar → Dropdown menu → "Logout".
- **Timing:** When user wants to log out of the system.

#### Function Description

- **Actors/Roles:** Authenticated User (all roles)
- **Purpose:** Allow users to safely log out of the system.
- **Interface:** Dropdown menu from avatar.
- **Data Processing:**
  1. User clicks "Logout"
  2. Call API `/api/auth/logout` to blacklist token
  3. Clear token and user info from localStorage
  4. Redirect to Login page

#### Screen Layout

```
┌─────────────────────────────────┐
│  ┌─────┐                        │
│  │Avatar│ ▼                     │
│  └─────┘                        │
│  ┌─────────────────────────┐    │
│  │ 👤 Profile             │    │
│  │ 💰 Wallet              │    │
│  │ ⚙️ Settings            │    │
│  │ ─────────────────────── │    │
│  │ 🚪 Logout              │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

#### Function Details

**Business Logic:**

| #   | Condition                   | Action                                                             |
| --- | --------------------------- | ------------------------------------------------------------------ |
| 1   | Logout successful           | Display "Logout successful", clear localStorage, redirect to Login |
| 2   | API error (network failure) | Still clear localStorage and redirect to Login (graceful handling) |
| 3   | Token already blacklisted   | Cannot reuse that token for API calls                              |

**API Endpoint:** `POST /api/auth/logout` (Requires Bearer Token)

---

### e. Forgot Password

#### Function Trigger

- **Navigation Path:** Click "Forgot password?" link on Login page → `/forgot-password`.
- **Timing:** When user forgets password and wants to reset it.

#### Function Description

- **Actors/Roles:** Guest
- **Purpose:** Allow users to reset password through OTP verification via email.
- **Interface:** 3 screens: Enter email → Verify OTP → Reset password.
- **Data Processing:**
  1. User enters email
  2. Send OTP request to `/api/auth/forgot-password`
  3. Redirect to OTP verification page
  4. User enters OTP
  5. Send verification request to `/api/auth/forgot-password/verify-otp`
  6. Receive reset token
  7. Redirect to reset password page
  8. User enters new password
  9. Send request to `/api/auth/reset-password`
  10. Redirect to Login page

#### Screen Layout

**Forgot Password Screen:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                        🔑                               │
│                 Forgot Password?                        │
│          Enter your email to receive OTP code           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Email                                             │  │
│  │ [Enter your email                              ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                Send Verification Code              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│           Remember your password? Login                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**OTP Verification Screen:** _(Similar to Register OTP screen)_

**Reset Password Screen:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                        🔒                               │
│                  Reset Password                         │
│            Enter new password for your account          │
│                  user@example.com                       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ New Password                                      │  │
│  │ [Enter new password (at least 6 characters)    ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Confirm Password                                  │  │
│  │ [Re-enter new password                         ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                  Reset Password                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│           Remember your password? Login                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Function Details

| Field            | Data Type | Validation             | Description           |
| ---------------- | --------- | ---------------------- | --------------------- |
| Email            | String    | Required, Email format | Registered email      |
| OTP              | String    | Required, 6 digits     | Verification OTP code |
| New Password     | String    | Required, Min 6 chars  | New password          |
| Confirm Password | String    | Required, Must match   | Confirm new password  |

**Business Logic - Send OTP:**

| #   | Condition                      | Action                                                                        |
| --- | ------------------------------ | ----------------------------------------------------------------------------- |
| 1   | Email is empty                 | Display required error                                                        |
| 2   | Invalid email format           | Display "Invalid email format"                                                |
| 3   | Email does not exist           | Display "Email does not exist in the system"                                  |
| 4   | Account registered with Google | Display "This account was registered with Google. Please sign in with Google" |
| 5   | Send OTP successful            | Display "OTP sent!", redirect to verification page                            |

**Business Logic - Reset Password:**

| #   | Condition                      | Action                                                  |
| --- | ------------------------------ | ------------------------------------------------------- |
| 1   | Password < 6 characters        | Display "Password must be at least 6 characters"        |
| 2   | Passwords do not match         | Display "Passwords do not match"                        |
| 3   | Reset token expired (> 10 min) | Display "Token is invalid or expired"                   |
| 4   | Reset successful               | Display "Password reset successful!", redirect to Login |

**API Endpoints:**

1. **Send OTP:** `POST /api/auth/forgot-password`
2. **Verify OTP:** `POST /api/auth/forgot-password/verify-otp`
3. **Reset Password:** `POST /api/auth/reset-password`

---

### f. Change Password

#### Function Trigger

- **Navigation Path:** Login → Profile (`/profile`) → "Change Password" section → Click "Change Password" button.
- **Timing:** When user wants to change their current password.

#### Function Description

- **Actors/Roles:** Authenticated User with local account (provider="local")
- **Purpose:** Allow users to change password when logged in.
- **Interface:** Section in Profile page with change password form.
- **Data Processing:**
  1. User opens change password form
  2. Enter current password, new password and confirmation
  3. Validate on client side
  4. Send request to API `/api/auth/change-password`
  5. Backend verifies current password
  6. Update new password
  7. Display success notification

#### Screen Layout

**Default State (Local Account):**

```
┌─────────────────────────────────────────────────────────┐
│  Change Password                      [Change Password] │
│  ─────────────────────────────────────────────────────  │
│  To secure your account, you should change your         │
│  password regularly and not share it with others.       │
└─────────────────────────────────────────────────────────┘
```

**Form Expanded State:**

```
┌─────────────────────────────────────────────────────────┐
│  Change Password                             [Close]    │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Current Password                              👁️  │  │
│  │ [Enter current password                        ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ New Password                                  👁️  │  │
│  │ [Enter new password (min 6 characters)         ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Confirm New Password                          👁️  │  │
│  │ [Re-enter new password                         ]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [Confirm]  [Cancel]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Google Account State (Cannot change password):**

```
┌─────────────────────────────────────────────────────────┐
│  Change Password                                        │
│  ─────────────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ⚠️ This account was registered with Google.       │  │
│  │    Password cannot be changed.                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Function Details

| Field                | Data Type | Validation                                    | Description      |
| -------------------- | --------- | --------------------------------------------- | ---------------- |
| Current Password     | String    | Required                                      | Current password |
| New Password         | String    | Required, Min 6 chars, Different from current | New password     |
| Confirm New Password | String    | Required, Must match new password             | Confirmation     |

**Business Logic:**

| #   | Condition                                 | Action                                                            |
| --- | ----------------------------------------- | ----------------------------------------------------------------- |
| 1   | Account registered with Google/Facebook   | Hide "Change Password" button, display warning message            |
| 2   | Any field is missing                      | Display "Please fill in all fields"                               |
| 3   | New password < 6 characters               | Display "New password must be at least 6 characters"              |
| 4   | New password and confirmation don't match | Display "New password and confirmation do not match"              |
| 5   | New password same as current password     | Display "New password must be different from current password"    |
| 6   | Current password is incorrect             | Display "Current password is incorrect"                           |
| 7   | Token expired                             | Redirect to Login page (401 Unauthorized)                         |
| 8   | Password change successful                | Display "Password changed successfully", close form, reset fields |

**API Endpoint:** `POST /api/auth/change-password` (Requires Bearer Token)

**Request Body:**

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Response (Success - 200):**

```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

**UI Features:**

- Toggle show/hide password for each field (👁️ icon)
- Loading state during processing
- Reset form on cancel or success

---

## Summary

| Function          | Actors                          | Authentication Required | Main API Endpoints                                                                                       |
| ----------------- | ------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Login             | Guest                           | No                      | POST /api/auth/login                                                                                     |
| Register          | Guest                           | No                      | POST /api/auth/register/send-otp, POST /api/auth/register/verify-otp                                     |
| Login with Google | Guest                           | No                      | POST /api/auth/google                                                                                    |
| Logout            | All Authenticated Users         | Yes                     | POST /api/auth/logout                                                                                    |
| Forgot Password   | Guest                           | No                      | POST /api/auth/forgot-password, POST /api/auth/forgot-password/verify-otp, POST /api/auth/reset-password |
| Change Password   | Authenticated User (local only) | Yes                     | POST /api/auth/change-password                                                                           |

## Business Rules Reference

| Rule                          | Value        |
| ----------------------------- | ------------ |
| Password minimum length       | 6 characters |
| OTP validity                  | 5 minutes    |
| OTP digits                    | 6 digits     |
| OTP resend cooldown           | 60 seconds   |
| OTP max attempts              | 5 times      |
| Reset token validity          | 10 minutes   |
| Default role for new accounts | "customer"   |
| Phone number format           | 10-11 digits |
