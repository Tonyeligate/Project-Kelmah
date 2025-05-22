# Payment Integrations for Kelmah Platform

This directory contains implementations for various payment providers used in the Kelmah platform, with a focus on Ghana-specific payment methods.

## Supported Payment Providers

### 1. Mobile Money (MoMo)

Integration with Ghana's mobile money providers:
- MTN Mobile Money
- Vodafone Cash
- AirtelTigo Money

**File**: `mobile-money.js`

### 2. Paystack

Integration with Paystack, a popular payment gateway in West Africa.

**File**: `paystack.js`

### 3. Flutterwave

Integration with Flutterwave, another leading payment service provider in Africa.

**File**: `flutterwave.js`

## Integration Hub

The `index.js` file serves as an integration hub that provides a unified interface for all payment providers. This allows the payment controller to interact with any provider through consistent methods.

**File**: `index.js`

## Environment Variables

The following environment variables must be configured in `.env`:

### Mobile Money (MoMo)
```
MOMO_API_KEY=your_momo_api_key
MOMO_API_SECRET=your_momo_api_secret
MOMO_API_USER_ID=your_momo_user_id
MOMO_PRIMARY_KEY=your_momo_primary_key
MOMO_API_URL=https://sandbox.momodeveloper.mtn.com
MOMO_CALLBACK_URL=https://your-domain.com/payment/webhook/mobile-money
```

### Paystack
```
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_CALLBACK_URL=https://your-domain.com/payment/verify
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret
```

### Flutterwave
```
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
FLUTTERWAVE_ENCRYPTION_KEY=your_flutterwave_encryption_key
FLUTTERWAVE_API_URL=https://api.flutterwave.com/v3
FLUTTERWAVE_CALLBACK_URL=https://your-domain.com/payment/flutterwave/callback
FLUTTERWAVE_WEBHOOK_HASH=your_flutterwave_webhook_hash
```

## API Usage Examples

### Initialize a Payment

```js
const PaymentIntegrations = require('../integrations');

// Using Mobile Money
const momoPayment = await PaymentIntegrations.initializePayment('mobile_money', {
  amount: 100,
  currency: 'GHS',
  phone: '233XXXXXXXXX',
  provider: 'mtn', // or 'vodafone' or 'airteltigo'
  description: 'Payment for service'
});

// Using Paystack
const paystackPayment = await PaymentIntegrations.initializePayment('paystack', {
  amount: 100,
  email: 'customer@example.com',
  currency: 'GHS',
  metadata: { userId: 'user123' }
});

// Using Flutterwave
const flutterwavePayment = await PaymentIntegrations.initializePayment('flutterwave', {
  amount: 100,
  currency: 'GHS',
  email: 'customer@example.com',
  name: 'John Doe',
  phone: '233XXXXXXXXX'
});
```

### Verify a Payment

```js
// Verify a Mobile Money payment
const momoVerification = await PaymentIntegrations.verifyPayment('mobile_money', 'reference123');

// Verify a Paystack payment
const paystackVerification = await PaymentIntegrations.verifyPayment('paystack', 'reference456');

// Verify a Flutterwave payment
const flutterwaveVerification = await PaymentIntegrations.verifyPayment('flutterwave', 'reference789');
```

### Process a Webhook

```js
// Process webhook from any provider
app.post('/webhook/:provider', (req, res) => {
  const provider = req.params.provider;
  const response = PaymentIntegrations.processWebhook(provider, req);
  
  // Handle webhook response
  if (response.success) {
    // Update payment status, etc.
  }
  
  res.status(200).send('OK');
});
```

### Make a Transfer (Payout)

```js
// Make a transfer via Mobile Money
const momoTransfer = await PaymentIntegrations.initiateTransfer('mobile_money', {
  amount: 100,
  currency: 'GHS',
  phone: '233XXXXXXXXX',
  provider: 'mtn'
});

// Make a transfer via Paystack
const paystackTransfer = await PaymentIntegrations.initiateTransfer('paystack', {
  amount: 100,
  recipientCode: 'recipient_code',
  reason: 'Payout for completed job'
});

// Make a transfer via Flutterwave
const flutterwaveTransfer = await PaymentIntegrations.initiateTransfer('flutterwave', {
  amount: 100,
  currency: 'GHS',
  phoneNumber: '233XXXXXXXXX',
  email: 'recipient@example.com',
  name: 'Recipient Name',
  type: 'mobile_money_ghana'
});
```

## Webhooks

Each payment provider sends webhook notifications to confirm payment status changes. These webhooks are processed in the following endpoints:

- Mobile Money: `/payment/webhook/mobile-money`
- Paystack: `/payment/webhook/paystack`
- Flutterwave: `/payment/webhook/flutterwave`

## Testing

For testing purposes, most providers offer sandbox environments. Set the appropriate environment variables with test credentials.

## Security Notes

- Never expose API secret keys on the client side
- Always validate webhook signatures
- Store sensitive payment data securely
- Use HTTPS for all payment endpoints
- Implement proper error handling and logging 