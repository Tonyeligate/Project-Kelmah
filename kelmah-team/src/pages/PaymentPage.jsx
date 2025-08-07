import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Header from '../components/Header'
import Footer from '../components/Footer'
import '../styles/PaymentPage.css'

const PaymentPage = () => {
  const [registrationData, setRegistrationData] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    phone: ''
  })
  const navigate = useNavigate()

  const REGISTRATION_FEE = 500
  const PROCESSING_FEE = 15
  const TOTAL_AMOUNT = REGISTRATION_FEE + PROCESSING_FEE

  useEffect(() => {
    // Get registration data from localStorage
    const savedData = localStorage.getItem('registrationData')
    if (savedData) {
      const data = JSON.parse(savedData)
      setRegistrationData(data)
      setPaymentData(prev => ({
        ...prev,
        email: data.email || '',
        phone: data.phone || ''
      }))
    } else {
      // Redirect to registration if no data
      toast.error('Please complete registration first')
      navigate('/register')
    }
  }, [navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
      setPaymentData(prev => ({ ...prev, [name]: formattedValue }))
    } 
    // Format expiry date
    else if (name === 'expiryDate') {
      const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2')
      setPaymentData(prev => ({ ...prev, [name]: formattedValue }))
    }
    // CVV restriction
    else if (name === 'cvv') {
      const formattedValue = value.replace(/\D/g, '').slice(0, 4)
      setPaymentData(prev => ({ ...prev, [name]: formattedValue }))
    }
    else {
      setPaymentData(prev => ({ ...prev, [name]: value }))
    }
  }

  const validatePayment = () => {
    const errors = []
    
    if (paymentMethod === 'card') {
      if (!paymentData.cardholderName) errors.push('Cardholder name is required')
      if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length < 16) {
        errors.push('Valid card number is required')
      }
      if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
        errors.push('Valid expiry date is required (MM/YY)')
      }
      if (!paymentData.cvv || paymentData.cvv.length < 3) {
        errors.push('Valid CVV is required')
      }
    }
    
    if (!paymentData.email) errors.push('Email is required')
    if (!paymentData.phone) errors.push('Phone number is required')
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validatePayment()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Store payment confirmation
      const paymentConfirmation = {
        transactionId: `KLM_${Date.now()}`,
        amount: TOTAL_AMOUNT,
        paymentMethod,
        timestamp: new Date().toISOString(),
        registrationData,
        paymentData
      }
      
      localStorage.setItem('paymentConfirmation', JSON.stringify(paymentConfirmation))
      localStorage.removeItem('registrationData') // Clean up
      
      toast.success('Payment processed successfully!')
      navigate('/success')
      
    } catch (error) {
      toast.error('Payment failed. Please try again.')
      console.error('Payment error:', error)
    } finally {
      setIsProcessing(false)
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
            <h1 className="heading-primary">Complete Your Registration</h1>
            <p className="payment-subtitle">
              Secure your spot in the Kelmah Team training program
            </p>
          </motion.div>

          <div className="payment-content">
            <div className="payment-layout">
              
              {/* Registration Summary */}
              <motion.div 
                className="registration-summary"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="summary-header">
                  <h2>Registration Summary</h2>
                  <div className="applicant-info">
                    <div className="applicant-avatar">
                      {registrationData.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="applicant-details">
                      <h3>{registrationData.fullName}</h3>
                      <p>{registrationData.email}</p>
                      <p>{registrationData.country}</p>
                    </div>
                  </div>
                </div>

                <div className="summary-details">
                  <div className="detail-row">
                    <span className="detail-label">Program:</span>
                    <span className="detail-value">Kelmah Team Training</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">6 Months</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Experience Level:</span>
                    <span className="detail-value">{registrationData.experience}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Commitment:</span>
                    <span className="detail-value">{registrationData.availability}</span>
                  </div>
                </div>

                <div className="price-breakdown">
                  <h3>Payment Breakdown</h3>
                  <div className="price-row">
                    <span>Registration Fee</span>
                    <span>${REGISTRATION_FEE}</span>
                  </div>
                  <div className="price-row">
                    <span>Processing Fee</span>
                    <span>${PROCESSING_FEE}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span>${TOTAL_AMOUNT}</span>
                  </div>
                </div>

                <div className="guarantee-notice">
                  <div className="guarantee-icon">🛡️</div>
                  <div className="guarantee-text">
                    <strong>100% Job Placement Guarantee</strong>
                    <p>Your investment is protected by our employment guarantee</p>
                  </div>
                </div>
              </motion.div>

              {/* Payment Form */}
              <motion.div 
                className="payment-form-container"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="payment-form-card">
                  <div className="form-header">
                    <h2>Payment Information</h2>
                    <div className="security-badge">
                      <span className="security-icon">🔒</span>
                      <span>256-bit SSL Encrypted</span>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="payment-methods">
                    <h3>Select Payment Method</h3>
                    <div className="method-options">
                      <label className={`method-option ${paymentMethod === 'card' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <div className="method-content">
                          <span className="method-icon">💳</span>
                          <span className="method-text">Credit/Debit Card</span>
                        </div>
                      </label>
                      
                      <label className={`method-option ${paymentMethod === 'paypal' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <div className="method-content">
                          <span className="method-icon">🏦</span>
                          <span className="method-text">PayPal</span>
                        </div>
                      </label>

                      <label className={`method-option ${paymentMethod === 'bank' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          value="bank"
                          checked={paymentMethod === 'bank'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <div className="method-content">
                          <span className="method-icon">🏛️</span>
                          <span className="method-text">Bank Transfer</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="payment-form">
                    {paymentMethod === 'card' && (
                      <div className="card-details">
                        <div className="form-group">
                          <label className="form-label">Cardholder Name</label>
                          <input
                            type="text"
                            name="cardholderName"
                            value={paymentData.cardholderName}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="John Doe"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Card Number</label>
                          <input
                            type="text"
                            name="cardNumber"
                            value={paymentData.cardNumber}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="1234 5678 9012 3456"
                            maxLength="19"
                            required
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Expiry Date</label>
                            <input
                              type="text"
                              name="expiryDate"
                              value={paymentData.expiryDate}
                              onChange={handleInputChange}
                              className="form-input"
                              placeholder="MM/YY"
                              maxLength="5"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">CVV</label>
                            <input
                              type="text"
                              name="cvv"
                              value={paymentData.cvv}
                              onChange={handleInputChange}
                              className="form-input"
                              placeholder="123"
                              maxLength="4"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'paypal' && (
                      <div className="paypal-info">
                        <div className="info-card">
                          <h4>PayPal Payment</h4>
                          <p>You will be redirected to PayPal to complete your payment securely.</p>
                          <div className="paypal-amount">
                            <span>Amount: ${TOTAL_AMOUNT} USD</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'bank' && (
                      <div className="bank-info">
                        <div className="info-card">
                          <h4>Bank Transfer Details</h4>
                          <div className="bank-details">
                            <div className="bank-row">
                              <span>Bank Name:</span>
                              <span>Kelmah Finance Bank</span>
                            </div>
                            <div className="bank-row">
                              <span>Account Name:</span>
                              <span>Kelmah Team Training</span>
                            </div>
                            <div className="bank-row">
                              <span>Account Number:</span>
                              <span>1234567890</span>
                            </div>
                            <div className="bank-row">
                              <span>Reference:</span>
                              <span>KLM_{registrationData.fullName?.replace(/\s+/g, '')}</span>
                            </div>
                          </div>
                          <p className="bank-note">
                            Please use the reference code when making your transfer.
                            Send confirmation to: finance@kelmah.com
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="billing-info">
                      <h3>Billing Information</h3>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={paymentData.email}
                            onChange={handleInputChange}
                            className="form-input"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Phone</label>
                          <input
                            type="tel"
                            name="phone"
                            value={paymentData.phone}
                            onChange={handleInputChange}
                            className="form-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="payment-actions">
                      <motion.button
                        type="button"
                        onClick={() => navigate('/register')}
                        className="btn btn-secondary"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        ← Back to Registration
                      </motion.button>

                      <motion.button
                        type="submit"
                        className="btn btn-primary btn--payment"
                        disabled={isProcessing}
                        whileHover={!isProcessing ? { scale: 1.02 } : {}}
                        whileTap={!isProcessing ? { scale: 0.98 } : {}}
                      >
                        {isProcessing ? (
                          <>
                            <div className="loading-spinner"></div>
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            🔒 Pay ${TOTAL_AMOUNT} Securely
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
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
