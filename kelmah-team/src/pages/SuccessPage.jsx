import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import '../styles/SuccessPage.css'

const SuccessPage = () => {
  const [paymentConfirmation, setPaymentConfirmation] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Get payment confirmation from localStorage
    const confirmation = localStorage.getItem('paymentConfirmation')
    if (confirmation) {
      setPaymentConfirmation(JSON.parse(confirmation))
    } else {
      // Redirect to home if no confirmation
      navigate('/')
    }
  }, [navigate])

  const nextSteps = [
    {
      step: 1,
      title: 'Check Your Email',
      description: 'You\'ll receive a welcome email within 24 hours with program details and next steps.',
      icon: '📧',
      timeline: 'Within 24 hours'
    },
    {
      step: 2,
      title: 'Join Our Community',
      description: 'Access to our exclusive Discord server where you\'ll connect with fellow team members.',
      icon: '💬',
      timeline: 'Within 48 hours'
    },
    {
      step: 3,
      title: 'Program Kickoff',
      description: 'Attend the virtual orientation session where we\'ll outline the complete program.',
      icon: '🚀',
      timeline: 'January 15, 2025'
    },
    {
      step: 4,
      title: 'Begin Learning',
      description: 'Start your journey with Foundation Phase - HTML, CSS, JavaScript, and React basics.',
      icon: '📚',
      timeline: 'January 22, 2025'
    }
  ]

  const benefits = [
    'Comprehensive 6-month training program',
    '100% job placement guarantee',
    'Real-world project experience',
    'Mentorship from industry experts',
    'Certificate of completion',
    'Career coaching and interview prep',
    'Access to exclusive job opportunities',
    'Lifetime community membership'
  ]

  if (!paymentConfirmation) {
    return (
      <div className="success-page">
        <Header />
        <main className="success-main">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading confirmation details...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="success-page">
      <Header />
      
      <main className="success-main">
        <div className="container">
          {/* Success Animation */}
          <motion.div 
            className="success-animation"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut",
              type: "spring",
              stiffness: 200
            }}
          >
            <div className="success-circle">
              <motion.div 
                className="checkmark"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                ✓
              </motion.div>
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div 
            className="success-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="success-title">
              🎉 Welcome to the Kelmah Team!
            </h1>
            <p className="success-subtitle">
              Congratulations! Your registration has been confirmed and payment processed successfully.
              You're now part of an exclusive group of 10 individuals who will transform their careers.
            </p>
          </motion.div>

          {/* Payment Confirmation */}
          <motion.div 
            className="confirmation-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="confirmation-header">
              <h2>Payment Confirmation</h2>
              <div className="confirmation-badge">
                <span className="badge-icon">🛡️</span>
                <span>Verified Payment</span>
              </div>
            </div>

            <div className="confirmation-details">
              <div className="detail-row">
                <span className="detail-label">Transaction ID:</span>
                <span className="detail-value">{paymentConfirmation.transactionId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount Paid:</span>
                <span className="detail-value">${paymentConfirmation.amount}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment Method:</span>
                <span className="detail-value">
                  {paymentConfirmation.paymentMethod === 'card' && '💳 Credit Card'}
                  {paymentConfirmation.paymentMethod === 'paypal' && '🏦 PayPal'}
                  {paymentConfirmation.paymentMethod === 'bank' && '🏛️ Bank Transfer'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date(paymentConfirmation.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <div className="receipt-note">
              <p>
                📧 A detailed receipt has been sent to{' '}
                <strong>{paymentConfirmation.registrationData.email}</strong>
              </p>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div 
            className="next-steps-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <h2 className="section-title">What Happens Next?</h2>
            <div className="steps-timeline">
              {nextSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  className="step-card"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.8 + (index * 0.1),
                    ease: "easeOut"
                  }}
                >
                  <div className="step-number">{step.step}</div>
                  <div className="step-content">
                    <div className="step-header">
                      <span className="step-icon">{step.icon}</span>
                      <h3 className="step-title">{step.title}</h3>
                      <span className="step-timeline">{step.timeline}</span>
                    </div>
                    <p className="step-description">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Program Benefits */}
          <motion.div 
            className="benefits-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <h2 className="section-title">Your Program Benefits</h2>
            <div className="benefits-grid">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="benefit-item"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 1 + (index * 0.05),
                    ease: "easeOut"
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <span className="benefit-check">✅</span>
                  <span className="benefit-text">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            className="contact-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <div className="contact-card">
              <h2>Need Help or Have Questions?</h2>
              <p>
                Our team is here to support you every step of the way. 
                Don't hesitate to reach out if you have any questions.
              </p>
              
              <div className="contact-options">
                <div className="contact-option">
                  <span className="contact-icon">📧</span>
                  <div className="contact-info">
                    <strong>Email Support</strong>
                    <p>team@kelmah.com</p>
                  </div>
                </div>
                <div className="contact-option">
                  <span className="contact-icon">💬</span>
                  <div className="contact-info">
                    <strong>Direct Message</strong>
                    <p>@TonyShelby</p>
                  </div>
                </div>
                <div className="contact-option">
                  <span className="contact-icon">📱</span>
                  <div className="contact-info">
                    <strong>WhatsApp</strong>
                    <p>+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="success-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            <motion.button
              className="btn btn-primary btn--large"
              onClick={() => {
                // Create a downloadable receipt
                const receipt = {
                  ...paymentConfirmation,
                  generatedAt: new Date().toISOString()
                }
                const blob = new Blob([JSON.stringify(receipt, null, 2)], {
                  type: 'application/json'
                })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `kelmah-receipt-${paymentConfirmation.transactionId}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              📄 Download Receipt
            </motion.button>

            <Link to="/" className="btn btn-secondary">
              🏠 Back to Home
            </Link>
          </motion.div>

          {/* Celebration Confetti Effect */}
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="confetti-piece"
                initial={{
                  y: -100,
                  x: Math.random() * window.innerWidth,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{
                  y: window.innerHeight + 100,
                  x: Math.random() * window.innerWidth,
                  rotate: 360,
                  opacity: 0
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default SuccessPage
