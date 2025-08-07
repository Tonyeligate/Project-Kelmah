import React from 'react'
import { motion } from 'framer-motion'
import '../styles/Hero.css'

const Hero = ({ onJoinTeam }) => {
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

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop"
      }
    }
  }

  return (
    <section id="home" className="hero">
      <div className="hero__background">
        <div className="hero__gradient"></div>
        <motion.div 
          className="hero__floating-shapes"
          variants={floatingVariants}
          animate="animate"
        >
          <div className="floating-shape floating-shape--1"></div>
          <div className="floating-shape floating-shape--2"></div>
          <div className="floating-shape floating-shape--3"></div>
        </motion.div>
      </div>

      <div className="container">
        <motion.div 
          className="hero__content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="hero__text">
            <motion.div variants={itemVariants} className="hero__badge">
              <span className="badge">
                🎯 Limited Spots Available - Only 10 Positions
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="hero__title">
              Join The <span className="highlight">Kelmah Team</span>
              <br />
              <span className="hero__subtitle">Master Web Development & AI</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="hero__description">
              I'm handpicking <strong>10 talented individuals</strong> to join an exclusive 
              training program in <strong>Web/App Development</strong> and <strong>Prompt Engineering</strong>. 
              This isn't just training—it's your gateway to career transformation and 
              guaranteed job opportunities in my upcoming projects.
            </motion.p>

            <motion.div variants={itemVariants} className="hero__features">
              <div className="feature-item">
                <div className="feature-icon">💻</div>
                <span>Full-Stack Development</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🤖</div>
                <span>AI & Prompt Engineering</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">💼</div>
                <span>Job Placement Guarantee</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🚀</div>
                <span>Career Acceleration</span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="hero__cta">
              <motion.button
                className="btn btn-primary btn--large"
                onClick={onJoinTeam}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Secure Your Spot Now
                <span className="btn__icon">→</span>
              </motion.button>
              
              <div className="hero__cta-note">
                <p>
                  ⚡ Only <strong>serious applicants</strong> who are ready to commit to 
                  their growth should apply. Registration fee required.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            variants={itemVariants}
            className="hero__visual"
          >
            <div className="hero__image-container">
              <motion.div 
                className="hero__image-wrapper"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="hero__image">
                  <div className="code-preview">
                    <div className="code-header">
                      <div className="code-dots">
                        <span className="dot dot--red"></span>
                        <span className="dot dot--yellow"></span>
                        <span className="dot dot--green"></span>
                      </div>
                      <span className="code-title">kelmah-team.js</span>
                    </div>
                    <div className="code-content">
                      <div className="code-line">
                        <span className="code-keyword">const</span> <span className="code-variable">team</span> = {
                      </div>
                      <div className="code-line">
                        &nbsp;&nbsp;<span className="code-property">size</span>: <span className="code-number">10</span>,
                      </div>
                      <div className="code-line">
                        &nbsp;&nbsp;<span className="code-property">skills</span>: [<span className="code-string">'React'</span>, <span className="code-string">'Node.js'</span>, <span className="code-string">'AI'</span>],
                      </div>
                      <div className="code-line">
                        &nbsp;&nbsp;<span className="code-property">opportunity</span>: <span className="code-string">'guaranteed'</span>,
                      </div>
                      <div className="code-line">
                        &nbsp;&nbsp;<span className="code-property">growth</span>: <span className="code-string">'unlimited'</span>
                      </div>
                      <div className="code-line">};</div>
                      <div className="code-line"></div>
                      <div className="code-line">
                        <span className="code-keyword">export</span> <span className="code-keyword">default</span> <span className="code-variable">team</span>;
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="hero__stats">
                  <motion.div 
                    className="stat-card"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="stat-number">10</div>
                    <div className="stat-label">Available Spots</div>
                  </motion.div>
                  <motion.div 
                    className="stat-card"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="stat-number">100%</div>
                    <div className="stat-label">Job Placement</div>
                  </motion.div>
                  <motion.div 
                    className="stat-card"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="stat-number">3-6</div>
                    <div className="stat-label">Months Training</div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="hero__scroll-indicator"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <motion.div 
            className="scroll-arrow"
            animate={{ y: [0, 5, 0] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            ↓
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export default Hero
