# Kelmah Payment Service

This microservice handles all payment-related functionalities for the Kelmah platform, including wallet operations, payment processing, and integrations with external payment providers with a focus on Ghana-specific payment methods.

## Features

- **Payment Processing**: Manage payments through providers including Ghana-specific options (Mobile Money, Paystack, Flutterwave)
- **Wallet Management**: Handle user wallet operations (deposit, withdrawal, transfer)
- **Payment Methods**: Save, retrieve, and delete user payment methods
- **Escrow**: Securely hold funds for job contracts until completion
- **Payment Disputes**: Handle payment disputes between users

## Supported Payment Providers

### Ghana-Specific Providers (Implemented)
- **Mobile Money (MoMo)**: MTN Mobile Money, Vodafone Cash, AirtelTigo Money
- **Paystack**: Local payment gateway for Ghana
- **Flutterwave**: Pan-African payment gateway

## API Endpoints

### Wallet Operations

- `GET /payment/wallet` - Get user wallet information
- `GET /payment/wallet/transactions` - Get transaction history
- `POST /payment/wallet/deposit` - Deposit funds to wallet
- `POST /payment/wallet/withdraw` - Withdraw funds from wallet
- `POST /payment/wallet/transfer` - Transfer funds to another user

### Payment Operations

- `POST /payment/initialize` - Initialize a payment with a provider
- `POST /payment/verify` - Verify a payment with a provider
- `POST /payment/process` - Process a payment
- `POST /payment/methods` - Save a payment method
- `GET /payment/methods` - Get all payment methods
- `DELETE /payment/methods/:id` - Delete a payment method

### Webhook Endpoints

- `POST /payment/webhook/mobile-money` - Webhook endpoint for Mobile Money
- `POST /payment/webhook/paystack` - Webhook endpoint for Paystack
- `POST /payment/webhook/flutterwave` - Webhook endpoint for Flutterwave

### Payment Entity Operations

- `POST /payment` - Create a new payment
- `GET /payment/:id` - Get a payment by ID
- `GET /payment/by-number/:paymentNumber` - Get a payment by payment number
- `POST /payment/:id/process` - Process an existing payment
- `POST /payment/:id/cancel` - Cancel a payment
- `POST /payment/:id/refund` - Refund a payment
- `GET /payment/:id/receipt` - Generate a receipt for a payment

## Integrations

The service includes complete integrations with the following payment providers:

### Mobile Money Integration
Includes functionality for:
- Creating payment requests
- Checking payment status
- Processing webhooks
- Initiating withdrawals to mobile money accounts

### Paystack Integration
Includes functionality for:
- Initializing payments
- Verifying payments
- Managing transfer recipients
- Initiating transfers
- Processing webhooks
- Listing available banks

### Flutterwave Integration
Includes functionality for:
- Initializing payments
- Verifying payments
- Initiating transfers
- Processing webhooks
- Listing available banks

See the [integrations README](./integrations/README.md) for detailed documentation on payment integrations.

## Models

- **Transaction**: Tracks all financial transactions
- **Wallet**: Stores user wallet information
- **PaymentMethod**: Stores user payment methods
- **Payment**: Records all payment transactions
- **Escrow**: Manages escrow accounts for job contracts
- **Dispute**: Handles payment disputes between users

## Configuration

The service can be configured through environment variables:

- `PAYMENT_SERVICE_PORT`: Port for the service (default: 5003)
- `POSTGRES_PAYMENT_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_HOST`: Database host
- `POSTGRES_PORT`: Database port
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: URL of the frontend application for CORS
- `DEFAULT_CURRENCY`: Default currency (default: GHS)

### Payment Provider Configurations

For payment provider configuration variables, see the [integrations README](./integrations/README.md).

## Dependencies

- Express.js for API routing
- Sequelize for ORM
- PostgreSQL for database
- Winston for logging
- Axios for HTTP requests
- UUID for generating unique IDs
- Crypto for security operations

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables (see .env.example)

3. Start the service:
   ```
   npm start
   ```

## Development

Start in development mode with hot reloading:
```
npm run dev
```

## Integration Testing

The service includes integration tests:
```
npm test
```

## API Documentation

For detailed API documentation, see the [API Documentation](./docs/api.md) file. 