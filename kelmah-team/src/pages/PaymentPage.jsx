import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Header from '../components/Header'
import Footer from '../components/Footer'
import '../styles/PaymentPage.css'

const PaymentPage = () => {
  const [registrationData, setRegistrationData] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('momo')
  const [paymentData, setPaymentData] = useState({
    momoNumber: '',
    networkProvider: 'mtn',
    transactionReference: '',
    name: '',
    email: '',
    phone: '',
    bankName: '',
    accountNumber: ''
  })
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const navigate = useNavigate()

  const REGISTRATION_FEE = 1000 // GHS 1,000
  const PROCESSING_FEE = 0 // No processing fee for local payments
  const TOTAL_AMOUNT = REGISTRATION_FEE + PROCESSING_FEE

  // Ghana Payment Methods
  const paymentMethods = [
    {
      id: 'momo',
      name: 'Mobile Money',
      description: 'Pay with MTN, AirtelTigo, or Vodafone Mobile Money',
      icon: '📱',
      popular: true
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct bank transfer to our account',
      icon: '🏦',
      popular: false
    },
    {
      id: 'bank_mobile',
      name: 'Mobile Banking',
      description: 'Use your bank\'s mobile app',
      icon: '📲',
      popular: true
    }
  ]

  const networkProviders = [
    { id: 'mtn', name: 'MTN Mobile Money', color: '#FFCC02' },
    { id: 'vodafone', name: 'Vodafone Cash', color: '#E60000' },
    { id: 'airteltigo', name: 'AirtelTigo Money', color: '#ED1C24' }
  ]

  const ghanaianBanks = [
    'Access Bank', 'Absa Bank', 'Agricultural Development Bank',
    'Bank of Africa', 'CAL Bank', 'Ecobank', 'Fidelity Bank',
    'First National Bank', 'GCB Bank', 'Ghana Commercial Bank',
    'GT Bank', 'National Investment Bank', 'OmniBank',
    'Prudential Bank', 'Republic Bank', 'Societe Generale',
    'Standard Chartered', 'Stanbic Bank', 'United Bank for Africa',
    'Zenith Bank'
  ]

  useEffect(() => {
    // Get registration data from localStorage
    const savedData = localStorage.getItem('registrationData')
    if (savedData) {
      const data = JSON.parse(savedData)
      setRegistrationData(data)
      setPaymentData(prev => ({
        ...prev,
        email: data.email || '',
        phone: data.phone || '',
        name: data.fullName || ''
      }))
    } else {
      // Redirect to registration if no data
      toast.error('Please complete registration first')
      navigate('/register')
    }
  }, [navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Format phone numbers
    if (name === 'momoNumber' || name === 'phone') {
      // Remove non-digits and format for Ghana numbers
      let formattedValue = value.replace(/\D/g, '')
      if (formattedValue.startsWith('233')) {
        formattedValue = formattedValue.slice(3)
      }
      if (formattedValue.length <= 9) {
        setPaymentData(prev => ({ ...prev, [name]: formattedValue }))
      }
    } else {
      setPaymentData(prev => ({ ...prev, [name]: value }))
    }
  }

  const validatePaymentData = () => {
    const errors = []

    if (!paymentData.name.trim()) {
      errors.push('Full name is required')
    }

    if (!paymentData.email.trim() || !/\S+@\S+\.\S+/.test(paymentData.email)) {
      errors.push('Valid email is required')
    }

    if (!paymentData.phone.trim() || paymentData.phone.length < 9) {
      errors.push('Valid phone number is required (9 digits)')
    }

    if (paymentMethod === 'momo') {
      if (!paymentData.momoNumber.trim() || paymentData.momoNumber.length < 9) {
        errors.push('Valid Mobile Money number is required (9 digits)')
      }
      if (!paymentData.networkProvider) {
        errors.push('Please select your network provider')
      }
    } else if (paymentMethod === 'bank' || paymentMethod === 'bank_mobile') {
      if (!paymentData.bankName.trim()) {
        errors.push('Bank name is required')
      }
      if (!paymentData.accountNumber.trim()) {
        errors.push('Account number is required')
      }
    }

    return errors
  }

  const handleSubmitPayment = async (e) => {
    e.preventDefault()
    
    const errors = validatePaymentData()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    try {
      setPaymentSubmitted(true)
      
      // Store payment information for admin verification
      const paymentInfo = {
        id: `KLM_${Date.now()}`,
        registrationData,
        paymentData,
        paymentMethod,
        amount: TOTAL_AMOUNT,
        currency: 'GHS',
        status: 'pending_verification',
        submissionDate: new Date().toISOString(),
        paymentInstructions: getPaymentInstructions()
      }
      
      localStorage.setItem('paymentInfo', JSON.stringify(paymentInfo))
      
      toast.success('Payment information submitted successfully!')
      toast.info('Please complete the payment and wait for verification')
      
      // Navigate to success page after a short delay
      setTimeout(() => {
        navigate('/success')
      }, 2000)
      
    } catch (error) {
      toast.error('Failed to submit payment information. Please try again.')
      console.error('Payment submission error:', error)
      setPaymentSubmitted(false)
    }
  }

  const getPaymentInstructions = () => {
    switch (paymentMethod) {
      case 'momo':
        return {
          method: 'Mobile Money',
          steps: [
            `1. Open your ${networkProviders.find(p => p.id === paymentData.networkProvider)?.name || 'Mobile Money'} app`,
            '2. Select "Send Money" or "Transfer"',
            '3. Enter recipient number: 0249251305',
            `4. Enter amount: GHS ${TOTAL_AMOUNT}`,
            '5. Complete the transaction',
            '6. Send the transaction reference to us for verification'
          ],
          recipientNumber: '0249251305',
          recipientName: 'Kelmah Team Training Program'
        }
      case 'bank':
      case 'bank_mobile':
        return {
          method: 'Bank Transfer',
          steps: [
            '1. Log into your bank account (online or mobile app)',
            '2. Select "Transfer Money" or "Send Money"',
            '3. Add recipient details below',
            `4. Enter amount: GHS ${TOTAL_AMOUNT}`,
            '5. Complete the transfer',
            '6. Send transaction receipt for verification'
          ],
          accountDetails: {
            accountName: 'Kelmah Team Training Program',
            accountNumber: 'Will be provided after submission',
            bank: 'Details will be sent via email'
          }
        }
      default:
        return {}
    }
  }

  if (!registrationData) {
    return (
      <div className="payment-page">
        <Header />
        <main className="payment-main">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading payment information...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="payment-page">
      <Header />
      
      <main className="payment-main">
        <div className="container">
          <motion.div 
            className="payment-header"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="heading-primary">Complete Your Payment</h1>
            <p className="payment-subtitle">
              Secure your spot in the Kelmah Team training program
            </p>
          </motion.div>

          <div className="payment-content">
            <div className="payment-layout">
              
              {/* Payment Summary */}
              <motion.div 
                className="payment-summary"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="summary-header">
                  <h2>Payment Summary</h2>
                  <div className="applicant-info">
                    <div className="applicant-avatar">
                      {registrationData.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="applicant-details">
                      <h3>{registrationData.fullName}</h3>
                      <p>{registrationData.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="payment-breakdown">
                  <div className="breakdown-item">
                    <span>Registration Fee</span>
                    <span className="amount">GHS {REGISTRATION_FEE}</span>
                  </div>
                  {PROCESSING_FEE > 0 && (
                    <div className="breakdown-item">
                      <span>Processing Fee</span>
                      <span className="amount">GHS {PROCESSING_FEE}</span>
                    </div>
                  )}
                  <div className="breakdown-total">
                    <span>Total Amount</span>
                    <span className="total-amount">GHS {TOTAL_AMOUNT}</span>
                  </div>
                </div>

                <div className="payment-note">
                  <h4>🇬🇭 Ghana Local Payments</h4>
                  <p>We support all major Ghanaian payment methods including Mobile Money, Bank Transfers, and Mobile Banking.</p>
                </div>
              </motion.div>

              {/* Payment Form */}
              <motion.div 
                className="payment-form-container"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <form onSubmit={handleSubmitPayment} className="payment-form">
                  
                  {/* Payment Method Selection */}
                  <div className="payment-methods">
                    <h3>Choose Payment Method</h3>
                    <div className="method-grid">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`method-card ${paymentMethod === method.id ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <div className="method-icon">{method.icon}</div>
                          <div className="method-info">
                            <h4>{method.name}</h4>
                            <p>{method.description}</p>
                            {method.popular && <span className="popular-badge">Popular</span>}
                          </div>
                          <div className="method-radio">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={paymentMethod === method.id}
                              onChange={() => setPaymentMethod(method.id)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="form-section">
                    <h3>Contact Information</h3>
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-input"
                        value={paymentData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-input"
                          value={paymentData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number *</label>
                        <div className="phone-input-group">
                          <span className="phone-prefix">+233</span>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            className="form-input"
                            placeholder="XXXXXXXXX"
                            value={paymentData.phone}
                            onChange={handleInputChange}
                            maxLength="9"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Money Details */}
                  {paymentMethod === 'momo' && (
                    <div className="form-section">
                      <h3>Mobile Money Details</h3>
                      <div className="form-group">
                        <label htmlFor="networkProvider">Network Provider *</label>
                        <select
                          id="networkProvider"
                          name="networkProvider"
                          className="form-select"
                          value={paymentData.networkProvider}
                          onChange={handleInputChange}
                          required
                        >
                          {networkProviders.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="momoNumber">Mobile Money Number *</label>
                        <div className="phone-input-group">
                          <span className="phone-prefix">+233</span>
                          <input
                            type="tel"
                            id="momoNumber"
                            name="momoNumber"
                            className="form-input"
                            placeholder="XXXXXXXXX"
                            value={paymentData.momoNumber}
                            onChange={handleInputChange}
                            maxLength="9"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Details */}
                  {(paymentMethod === 'bank' || paymentMethod === 'bank_mobile') && (
                    <div className="form-section">
                      <h3>Bank Details</h3>
                      <div className="form-group">
                        <label htmlFor="bankName">Bank Name *</label>
                        <select
                          id="bankName"
                          name="bankName"
                          className="form-select"
                          value={paymentData.bankName}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select your bank</option>
                          {ghanaianBanks.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="accountNumber">Account Number *</label>
                        <input
                          type="text"
                          id="accountNumber"
                          name="accountNumber"
                          className="form-input"
                          value={paymentData.accountNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Instructions */}
                  <div className="payment-instructions">
                    <h3>Payment Instructions</h3>
                    <div className="instruction-card">
                      <h4>📋 How to Pay:</h4>
                      {paymentMethod === 'momo' && (
                        <div className="momo-instructions">
                          <div className="recipient-info">
                            <div className="recipient-detail">
                              <span className="label">Send Money To:</span>
                              <span className="value">0249251305</span>
                            </div>
                            <div className="recipient-detail">
                              <span className="label">Amount:</span>
                              <span className="value">GHS {TOTAL_AMOUNT}</span>
                            </div>
                            <div className="recipient-detail">
                              <span className="label">Reference:</span>
                              <span className="value">KELMAH-{registrationData.email?.split('@')[0]?.toUpperCase()}</span>
                            </div>
                          </div>
                          <ol className="instruction-steps">
                            <li>Dial your Mobile Money code (*170# for MTN, *110# for Vodafone, etc.)</li>
                            <li>Select "Send Money"</li>
                            <li>Enter recipient number: <strong>0249251305</strong></li>
                            <li>Enter amount: <strong>GHS {TOTAL_AMOUNT}</strong></li>
                            <li>Enter reference: <strong>KELMAH-{registrationData.email?.split('@')[0]?.toUpperCase()}</strong></li>
                            <li>Confirm the transaction</li>
                          </ol>
                        </div>
                      )}
                      
                      {(paymentMethod === 'bank' || paymentMethod === 'bank_mobile') && (
                        <div className="bank-instructions">
                          <div className="bank-info">
                            <p><strong>Account details will be sent to your email after submission.</strong></p>
                            <p>Complete the bank transfer and send us the transaction receipt for verification.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="form-actions">
                    <motion.button
                      type="submit"
                      className="submit-btn"
                      disabled={paymentSubmitted}
                      whileHover={{ scale: paymentSubmitted ? 1 : 1.02 }}
                      whileTap={{ scale: paymentSubmitted ? 1 : 0.98 }}
                    >
                      {paymentSubmitted ? 'Processing...' : 'Submit Payment Information'}
                    </motion.button>
                    
                    <p className="payment-note">
                      After submitting, you'll receive payment instructions and your registration will be processed within 24 hours of payment verification.
                    </p>
                  </div>

                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PaymentPage