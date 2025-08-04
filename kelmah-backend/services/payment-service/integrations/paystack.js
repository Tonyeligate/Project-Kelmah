/**
 * Paystack Integration
 * Paystack API implementation for card payments and other methods
 */

const axios = require('axios');
const crypto = require('crypto');

class PaystackService {
  constructor() {
    this.baseURL = 'https://api.paystack.co';
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    this.webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    
    if (!this.secretKey) {
      throw new Error('Paystack secret key is required');
    }
  }

  /**
   * Initialize payment transaction
   */
  async initializePayment(paymentData) {
    try {
      const {
        email,
        amount,
        currency = 'GHS',
        reference,
        callback_url,
        metadata = {},
        channels = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      } = paymentData;

      const requestData = {
        email,
        amount: Math.round(amount * 100), // Convert to kobo/pesewas
        currency: currency.toUpperCase(),
        reference: reference || this.generateReference(),
        callback_url: callback_url || `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          ...metadata,
          source: 'kelmah-platform'
        },
        channels
      };

      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          reference: response.data.data.reference,
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          status: 'initialized'
        }
      };
    } catch (error) {
      console.error('Paystack Initialize Payment Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(reference) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      const transaction = response.data.data;

      return {
        success: true,
        data: {
          reference: transaction.reference,
          status: transaction.status,
          amount: transaction.amount / 100, // Convert from kobo/pesewas
          currency: transaction.currency,
          gateway_response: transaction.gateway_response,
          paid_at: transaction.paid_at,
          created_at: transaction.created_at,
          channel: transaction.channel,
          authorization: transaction.authorization,
          customer: transaction.customer,
          fees: transaction.fees ? transaction.fees / 100 : 0,
          metadata: transaction.metadata
        }
      };
    } catch (error) {
      console.error('Paystack Verify Payment Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * List all transactions
   */
  async getTransactions(params = {}) {
    try {
      const {
        page = 1,
        perPage = 50,
        customer,
        status,
        from,
        to,
        amount
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString()
      });

      if (customer) queryParams.append('customer', customer);
      if (status) queryParams.append('status', status);
      if (from) queryParams.append('from', from);
      if (to) queryParams.append('to', to);
      if (amount) queryParams.append('amount', (amount * 100).toString());

      const response = await axios.get(
        `${this.baseURL}/transaction?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: true,
        data: {
          transactions: response.data.data.map(transaction => ({
            reference: transaction.reference,
            status: transaction.status,
            amount: transaction.amount / 100,
            currency: transaction.currency,
            channel: transaction.channel,
            customer: transaction.customer,
            created_at: transaction.created_at,
            paid_at: transaction.paid_at
          })),
          meta: response.data.meta
        }
      };
    } catch (error) {
      console.error('Paystack Get Transactions Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(customerData) {
    try {
      const { email, first_name, last_name, phone, metadata = {} } = customerData;

      const requestData = {
        email,
        first_name,
        last_name,
        phone,
        metadata: {
          ...metadata,
          source: 'kelmah-platform'
        }
      };

      const response = await axios.post(
        `${this.baseURL}/customer`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          customer_code: response.data.data.customer_code,
          email: response.data.data.email,
          integration: response.data.data.integration,
          id: response.data.data.id
        }
      };
    } catch (error) {
      console.error('Paystack Create Customer Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(customerCode) {
    try {
      const response = await axios.get(
        `${this.baseURL}/customer/${customerCode}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Paystack Get Customer Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Create transfer recipient
   */
  async createTransferRecipient(recipientData) {
    try {
      const {
        type = 'nuban', // nuban, mobile_money, basa
        name,
        account_number,
        bank_code,
        currency = 'GHS',
        metadata = {}
      } = recipientData;

      const requestData = {
        type,
        name,
        account_number,
        bank_code,
        currency: currency.toUpperCase(),
        metadata: {
          ...metadata,
          source: 'kelmah-platform'
        }
      };

      const response = await axios.post(
        `${this.baseURL}/transferrecipient`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          recipient_code: response.data.data.recipient_code,
          type: response.data.data.type,
          name: response.data.data.name,
          account_number: response.data.data.details.account_number,
          bank_code: response.data.data.details.bank_code,
          bank_name: response.data.data.details.bank_name
        }
      };
    } catch (error) {
      console.error('Paystack Create Recipient Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Initiate transfer
   */
  async initiateTransfer(transferData) {
    try {
      const {
        amount,
        recipient,
        reason = 'Kelmah platform payout',
        currency = 'GHS',
        reference,
        metadata = {}
      } = transferData;

      const requestData = {
        source: 'balance',
        amount: Math.round(amount * 100), // Convert to kobo/pesewas
        recipient,
        reason,
        currency: currency.toUpperCase(),
        reference: reference || this.generateReference('TXN'),
        metadata: {
          ...metadata,
          source: 'kelmah-platform'
        }
      };

      const response = await axios.post(
        `${this.baseURL}/transfer`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          transfer_code: response.data.data.transfer_code,
          reference: response.data.data.reference,
          status: response.data.data.status,
          amount: response.data.data.amount / 100,
          currency: response.data.data.currency,
          recipient: response.data.data.recipient
        }
      };
    } catch (error) {
      console.error('Paystack Initiate Transfer Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Verify transfer
   */
  async verifyTransfer(transferCode) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transfer/verify/${transferCode}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: true,
        data: {
          transfer_code: response.data.data.transfer_code,
          reference: response.data.data.reference,
          status: response.data.data.status,
          amount: response.data.data.amount / 100,
          currency: response.data.data.currency,
          transferred_at: response.data.data.transferred_at,
          recipient: response.data.data.recipient,
          failure_reason: response.data.data.failure_reason
        }
      };
    } catch (error) {
      console.error('Paystack Verify Transfer Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get supported banks
   */
  async getBanks(country = 'ghana', currency = 'GHS') {
    try {
      const queryParams = new URLSearchParams({
        country,
        currency
      });

      const response = await axios.get(
        `${this.baseURL}/bank?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data.map(bank => ({
          name: bank.name,
          slug: bank.slug,
          code: bank.code,
          longcode: bank.longcode,
          gateway: bank.gateway,
          pay_with_bank: bank.pay_with_bank,
          active: bank.active,
          is_deleted: bank.is_deleted,
          country: bank.country,
          currency: bank.currency,
          type: bank.type
        }))
      };
    } catch (error) {
      console.error('Paystack Get Banks Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Resolve account number
   */
  async resolveAccountNumber(accountNumber, bankCode) {
    try {
      const queryParams = new URLSearchParams({
        account_number: accountNumber,
        bank_code: bankCode
      });

      const response = await axios.get(
        `${this.baseURL}/bank/resolve?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: true,
        data: {
          account_number: response.data.data.account_number,
          account_name: response.data.data.account_name,
          bank_id: response.data.data.bank_id
        }
      };
    } catch (error) {
      console.error('Paystack Resolve Account Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Create payment plan (for subscriptions)
   */
  async createPlan(planData) {
    try {
      const {
        name,
        amount,
        interval = 'monthly', // daily, weekly, monthly, biannually, annually
        description,
        currency = 'GHS',
        invoice_limit,
        send_invoices = true,
        send_sms = true
      } = planData;

      const requestData = {
        name,
        amount: Math.round(amount * 100),
        interval,
        description,
        currency: currency.toUpperCase(),
        invoice_limit,
        send_invoices,
        send_sms
      };

      const response = await axios.post(
        `${this.baseURL}/plan`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          plan_code: response.data.data.plan_code,
          name: response.data.data.name,
          amount: response.data.data.amount / 100,
          interval: response.data.data.interval,
          integration: response.data.data.integration,
          domain: response.data.data.domain
        }
      };
    } catch (error) {
      console.error('Paystack Create Plan Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const {
        customer,
        plan,
        authorization,
        start_date,
        metadata = {}
      } = subscriptionData;

      const requestData = {
        customer,
        plan,
        authorization,
        start_date,
        metadata: {
          ...metadata,
          source: 'kelmah-platform'
        }
      };

      const response = await axios.post(
        `${this.baseURL}/subscription`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Paystack Create Subscription Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Process webhook event
   */
  processWebhook(payload, signature) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        return {
          success: false,
          error: 'Invalid webhook signature'
        };
      }

      const event = JSON.parse(payload);

      return {
        success: true,
        data: {
          event: event.event,
          data: event.data,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Paystack Webhook Processing Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    try {
      if (!this.webhookSecret) {
        console.warn('Paystack webhook secret not configured');
        return true; // Skip verification if no secret configured
      }

      const expectedSignature = crypto
        .createHmac('sha512', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate reference code
   */
  generateReference(prefix = 'KLM') {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Get balance
   */
  async getBalance() {
    try {
      const response = await axios.get(
        `${this.baseURL}/balance`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data.map(balance => ({
          currency: balance.currency,
          balance: balance.balance / 100 // Convert from kobo/pesewas
        }))
      };
    } catch (error) {
      console.error('Paystack Get Balance Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Health check for Paystack service
   */
  async healthCheck() {
    try {
      // Try to get balance as a health check
      const result = await this.getBalance();
      
      return {
        success: true,
        service: 'Paystack',
        status: result.success ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        publicKey: this.publicKey ? `${this.publicKey.substring(0, 10)}...` : 'not configured'
      };
    } catch (error) {
      return {
        success: false,
        service: 'Paystack',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Split payment amount (for marketplace transactions)
   */
  async createSplit(splitData) {
    try {
      const {
        name,
        type = 'percentage', // percentage, flat
        currency = 'GHS',
        subaccounts,
        bearer_type = 'all-proportional', // all, account, subaccount, all-proportional
        bearer_subaccount
      } = splitData;

      const requestData = {
        name,
        type,
        currency: currency.toUpperCase(),
        subaccounts,
        bearer_type,
        bearer_subaccount
      };

      const response = await axios.post(
        `${this.baseURL}/split`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          split_code: response.data.data.split_code,
          name: response.data.data.name,
          type: response.data.data.type,
          currency: response.data.data.currency,
          integration: response.data.data.integration,
          domain: response.data.data.domain,
          active: response.data.data.active
        }
      };
    } catch (error) {
      console.error('Paystack Create Split Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = PaystackService;