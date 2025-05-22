# Payment Service API Documentation

This document details the API endpoints available in the Kelmah Payment Service.

## Authentication

All endpoints require authentication via JWT token. Add the token to the request headers:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Wallet Endpoints

### Get Wallet

Retrieves the user's wallet information.

- **URL**: `/payment/wallet`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "wallet": {
        "id": "uuid",
        "balance": 100.00,
        "currency": "GHS",
        "lastTransactionAt": "2023-08-01T12:00:00Z"
      }
    }
  }
  ```

### Get Transaction History

Retrieves the user's transaction history.

- **URL**: `/payment/wallet/transactions`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `type` (optional): Filter by transaction type (deposit, withdrawal, payment, refund, fee)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "transactions": [
        {
          "id": "uuid",
          "userId": "user-uuid",
          "amount": 50.00,
          "currency": "GHS",
          "paymentMethod": "momo",
          "type": "deposit",
          "status": "completed",
          "description": "Wallet deposit",
          "createdAt": "2023-08-01T12:00:00Z",
          "completedAt": "2023-08-01T12:01:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalItems": 1,
        "totalPages": 1
      }
    }
  }
  ```

### Deposit to Wallet

Adds funds to the user's wallet.

- **URL**: `/payment/wallet/deposit`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "amount": 50.00,
    "source": "momo",
    "description": "Deposit from MTN Mobile Money"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Deposit successful",
      "transaction": {
        "id": "uuid",
        "amount": 50.00,
        "status": "completed"
      },
      "wallet": {
        "id": "uuid",
        "balance": 150.00,
        "currency": "GHS"
      }
    }
  }
  ```

### Withdraw from Wallet

Withdraws funds from the user's wallet.

- **URL**: `/payment/wallet/withdraw`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "amount": 25.00,
    "destination": "momo",
    "description": "Withdrawal to MTN Mobile Money"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Withdrawal request submitted",
      "transaction": {
        "id": "uuid",
        "amount": 25.00,
        "status": "pending"
      },
      "wallet": {
        "id": "uuid",
        "balance": 125.00,
        "currency": "GHS"
      }
    }
  }
  ```

### Transfer to Another User

Transfers funds from the user's wallet to another user.

- **URL**: `/payment/wallet/transfer`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "toUserId": "recipient-uuid",
    "amount": 15.00,
    "description": "Payment for services"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Transfer successful",
      "fromTransaction": {
        "id": "uuid",
        "amount": 15.00,
        "status": "completed"
      },
      "wallet": {
        "id": "uuid",
        "balance": 110.00,
        "currency": "GHS"
      }
    }
  }
  ```

## Payment Endpoints

### Initialize Payment

Initializes a payment through an external payment provider.

- **URL**: `/payment/payments/initialize`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "amount": 50.00,
    "currency": "GHS",
    "provider": "momo",
    "description": "Payment for subscription"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Payment initiated",
      "paymentId": "payment-id",
      "transactionId": "transaction-uuid",
      "provider": "momo",
      "amount": 50.00,
      "currency": "GHS",
      "status": "pending"
    }
  }
  ```

### Process Payment

Processes a payment after the user has completed the payment flow.

- **URL**: `/payment/payments/process`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "paymentId": "payment-id",
    "paymentMethodId": "payment-method-id",
    "provider": "momo"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Payment processed",
      "status": "completed",
      "paymentId": "payment-id",
      "transactionId": "transaction-uuid"
    }
  }
  ```

### Save Payment Method

Creates or updates a payment method for the user.

- **URL**: `/payment/payments/methods`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "type": "mobile_money",
    "provider": "momo",
    "token": "token-from-provider",
    "isDefault": true,
    "details": {
      "phoneNumber": "233xxxxxxxxx",
      "network": "MTN",
      "accountName": "John Doe"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Payment method saved",
      "paymentMethod": {
        "id": "uuid",
        "type": "mobile_money",
        "provider": "momo",
        "phoneNumber": "233xxxxxxxxx",
        "network": "MTN",
        "accountName": "John Doe",
        "isDefault": true
      }
    }
  }
  ```

### Get Payment Methods

Retrieves all payment methods for the user.

- **URL**: `/payment/payments/methods`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "paymentMethods": [
        {
          "id": "uuid",
          "type": "mobile_money",
          "provider": "momo",
          "phoneNumber": "233xxxxxxxxx",
          "network": "MTN",
          "accountName": "John Doe",
          "isDefault": true
        },
        {
          "id": "uuid",
          "type": "card",
          "provider": "stripe",
          "lastFour": "4242",
          "expiryMonth": "12",
          "expiryYear": "2025",
          "brand": "Visa",
          "isDefault": false
        }
      ]
    }
  }
  ```

### Delete Payment Method

Deletes a payment method.

- **URL**: `/payment/payments/methods/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **URL Parameters**:
  - `id`: Payment method ID
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Payment method deleted"
    }
  }
  ```

## Supported Payment Providers

The payment service supports the following payment providers:

### International Providers
- **Stripe**: Credit/debit card processing
- **PayPal**: Online payments

### Ghana-Specific Providers
- **Mobile Money (MoMo)**: MTN Mobile Money, Vodafone Cash, AirtelTigo Money
- **Paystack**: Local payment gateway
- **Flutterwave**: Local payment gateway

## Error Responses

All endpoints return a standardized error format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "details": {} // Optional additional details
  }
}
```

Common HTTP status codes:
- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: User doesn't have permission
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error 