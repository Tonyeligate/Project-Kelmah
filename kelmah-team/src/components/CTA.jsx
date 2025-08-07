import React from 'react'
import { motion } from 'framer-motion'
import '../styles/CTA.css'

const CTA = ({ onJoinTeam }) => {
  const urgencyFactors = [
    { icon: '⚡', text: 'Only 10 spots available' },
    { icon: '🔒', text: 'Registration closes soon' },
    { icon: '🎯', text: 'Next cohort starts January 2025' },
    { icon: '💼', text: 'Job guarantee included' }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="cta section">
      <div className="cta__background">
        <div className="cta__gradient"></div>
        <div className="cta__pattern"></div>
      </div>

      <div className="container">
        <motion.div 
          className="cta__content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={itemVariants} className="cta__badge">
            <span className="urgency-badge">
              🔥 Limited Time Offer - Act Now!
            </span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="cta__title">
            Ready to Transform Your Life?
            <br />
            <span className="cta__highlight">Secure Your Spot Today</span>
          </motion.h2>

          <motion.p variants={itemVariants} className="cta__description">
            Don't let this opportunity pass you by. Join the exclusive Kelmah team 
            and unlock your potential in web development, mobile apps, and AI technologies. 
            <strong>Your future self will thank you.</strong>
          </motion.p>

          <motion.div variants={itemVariants} className="cta__urgency">
            <div className="urgency-grid">
              {urgencyFactors.map((factor, index) => (
                <motion.div
                  key={index}
                  className="urgency-item"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <span className="urgency-icon">{factor.icon}</span>
                  <span className="urgency-text">{factor.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="cta__actions">
            <motion.button
              className="btn btn-primary btn--hero"
              onClick={onJoinTeam}
              whileHover={{ 
                scale: 1.05, 
                y: -3,
                boxShadow: "0 20px 60px rgba(255, 215, 0, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <span className="btn-text">Join The Kelmah Team</span>
              <span className="btn-subtext">Start Your Journey Now</span>
              <span className="btn-icon">🚀</span>
            </motion.button>

            <div className="cta__guarantee">
              <div className="guarantee-badge">
                <span className="guarantee-icon">🛡️</span>
                <div className="guarantee-text">
                  <strong>100% Job Placement Guarantee</strong>
                  <small>Or get your investment back</small>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="cta__contact">
            <p className="contact-text">
              Still have questions? Want to know more?
            </p>
            <div className="contact-info">
              <span className="contact-item">
                📧 Email: <a href="mailto:team@kelmah.com">team@kelmah.com</a>
              </span>
              <span className="contact-item">
                💬 DM: <a href="#" className="highlight-link">@TonyShelby</a>
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Action Elements */}
      <div className="cta__floating-elements">
        <motion.div 
          className="floating-element floating-element--1"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          💻
        </motion.div>
        <motion.div 
          className="floating-element floating-element--2"
          animate={{
            y: [0, 15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          🤖
        </motion.div>
        <motion.div 
          className="floating-element floating-element--3"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 10, 0]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          📱
        </motion.div>
      </div>

      {/* Countdown Timer (Mock) */}
      <motion.div 
        className="cta__countdown"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        viewport={{ once: true }}
      >
        <div className="countdown-container">
          <div className="countdown-title">⏰ Early Bird Pricing Ends In:</div>
          <div className="countdown-timer">
            <div className="time-unit">
              <span className="time-number">07</span>
              <span className="time-label">Days</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-number">18</span>
              <span className="time-label">Hours</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-number">42</span>
              <span className="time-label">Minutes</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default CTA
