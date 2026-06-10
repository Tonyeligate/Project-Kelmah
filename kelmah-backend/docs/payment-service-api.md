# Payment Service API Documentation

## Overview
The Payment Service handles all financial transactions, wallet management, and payment processing within the Kelmah platform. This service ensures secure and reliable payment operations for both clients and freelancers.

## Base URL
```
https://api.kelmah.com/payment
```

## Authentication
All endpoints require authentication using a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Wallet Management

#### Get Wallet Balance
```http
GET /wallet/balance
```
Returns the current balance of the authenticated user's wallet.

**Response**
```json
{
  "success": true,
  "data": {
    "balance": 1000.00,
    "currency": "USD",
    "lastUpdated": "2024-03-20T10:00:00Z"
  }
}
```

#### Get Transaction History
```http
GET /wallet/transactions
```
Retrieves the transaction history for the authenticated user's wallet.

**Query Parameters**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `type` (optional): Filter by transaction type (deposit, withdrawal, payment)

**Response**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "type": "deposit",
        "amount": 500.00,
        "currency": "USD",
        "status": "completed",
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
}
```

### Payment Methods

#### List Payment Methods
```http
GET /payment-methods
```
Retrieves all payment methods associated with the authenticated user.

**Response**
```json
{
  "success": true,
  "data": {
    "paymentMethods": [
      {
        "id": "pm_123",
        "type": "card",
        "last4": "4242",
        "brand": "visa",
        "expiryMonth": 12,
        "expiryYear": 2025,
        "isDefault": true
      }
    ]
  }
}
```

#### Add Payment Method
```http
POST /payment-methods
```
Adds a new payment method to the user's account.

**Request Body**
```json
{
  "type": "card",
  "token": "tok_123",
  "isDefault": false
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "pm_123",
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "isDefault": false
  }
}
```

#### Remove Payment Method
```http
DELETE /payment-methods/:id
```
Removes a payment method from the user's account.

**Response**
```json
{
  "success": true,
  "message": "Payment method removed successfully"
}
```

### Transactions

#### Create Transaction
```http
POST /transactions
```
Creates a new transaction (deposit, withdrawal, or payment).

**Request Body**
```json
{
  "type": "deposit",
  "amount": 100.00,
  "currency": "USD",
  "paymentMethodId": "pm_123",
  "description": "Wallet deposit"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "txn_123",
    "type": "deposit",
    "amount": 100.00,
    "currency": "USD",
    "status": "pending",
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

#### Get Transaction Details
```http
GET /transactions/:id
```
Retrieves detailed information about a specific transaction.

**Response**
```json
{
  "success": true,
  "data": {
    "id": "txn_123",
    "type": "deposit",
    "amount": 100.00,
    "currency": "USD",
    "status": "completed",
    "paymentMethod": {
      "id": "pm_123",
      "type": "card",
      "last4": "4242"
    },
    "createdAt": "2024-03-20T10:00:00Z",
    "completedAt": "2024-03-20T10:01:00Z"
  }
}
```

### Contract Payments

#### Create Contract Payment
```http
POST /contracts/:contractId/payments
```
Creates a payment for a specific contract.

**Request Body**
```json
{
  "amount": 500.00,
  "currency": "USD",
  "description": "Payment for milestone 1"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "txn_123",
    "contractId": "contract_123",
    "amount": 500.00,
    "currency": "USD",
    "status": "pending",
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

#### Get Contract Payments
```http
GET /contracts/:contractId/payments
```
Retrieves all payments associated with a specific contract.

**Response**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "txn_123",
        "amount": 500.00,
        "currency": "USD",
        "status": "completed",
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ]
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Rate Limiting
The Payment Service implements rate limiting to ensure fair usage and prevent abuse. The current limits are:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

When rate limit is exceeded, the service returns a 429 Too Many Requests response:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

## Webhooks
The Payment Service provides webhooks for real-time event notifications. Configure webhook endpoints in your account settings to receive notifications for:
- Transaction status updates
- Payment method changes
- Failed payments
- Successful deposits/withdrawals

Webhook payloads are signed using HMAC-SHA256 for security verification. 