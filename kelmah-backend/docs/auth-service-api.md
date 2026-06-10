# Authentication Service API Documentation

The Authentication Service handles user authentication, registration, and token management.

## Base URL

When accessing directly: `http://localhost:3001/api/auth`
When using API Gateway: `http://localhost:5000/api/auth`

## Endpoints

### User Registration

**Endpoint:** `POST /register`

**Description:** Registers a new user account

**Authentication Required:** No

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "worker"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "worker",
      "createdAt": "2023-10-15T10:30:00Z"
    },
    "token": "jwt_token_here"
  },
  "message": "User registered successfully"
}
```

### User Login

**Endpoint:** `POST /login`

**Description:** Authenticates a user and returns tokens

**Authentication Required:** No

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "worker"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  },
  "message": "Login successful"
}
```

### Refresh Token

**Endpoint:** `POST /refresh-token`

**Description:** Gets a new access token using a refresh token

**Authentication Required:** No

**Request Body:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here"
  },
  "message": "Token refreshed successfully"
}
```

### Logout

**Endpoint:** `POST /logout`

**Description:** Invalidates the current user's refresh tokens

**Authentication Required:** Yes

**Request Body:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Forgot Password

**Endpoint:** `POST /forgot-password`

**Description:** Sends a password reset link to the user's email

**Authentication Required:** No

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

### Reset Password

**Endpoint:** `POST /reset-password`

**Description:** Resets a user's password using a valid reset token

**Authentication Required:** No

**Request Body:**

```json
{
  "token": "password_reset_token",
  "password": "newSecurePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Validate Token (Internal)

**Endpoint:** `POST /validate`

**Description:** Validates a JWT token (for service-to-service communication)

**Authentication Required:** Internal API Key

**Request Body:**

```json
{
  "token": "jwt_token_to_validate"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "worker"
    }
  }
}
```

### Get Current User

**Endpoint:** `GET /me`

**Description:** Retrieves the currently authenticated user's details

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "worker",
    "createdAt": "2023-10-15T10:30:00Z"
  }
}
```

### Change Password

**Endpoint:** `PUT /change-password`

**Description:** Changes the password for the authenticated user

**Authentication Required:** Yes

**Request Body:**

```json
{
  "currentPassword": "currentSecurePassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Error Responses

### Invalid Credentials

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### Email Already Exists

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email is already registered"
  }
}
```

### Invalid Token

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token is invalid or expired"
  }
} 