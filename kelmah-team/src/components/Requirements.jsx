import React from 'react'
import { motion } from 'framer-motion'
import '../styles/Requirements.css'

const Requirements = () => {
  const requirements = [
    {
      icon: '💻',
      title: 'Basic Computer Literacy',
      description: 'Comfortable using computers, browsing the internet, and installing software.',
      level: 'Essential',
      color: 'gold'
    },
    {
      icon: '🔥',
      title: 'Passion for Learning',
      description: 'Strong desire to learn new technologies and commitment to personal growth.',
      level: 'Essential',
      color: 'gold'
    },
    {
      icon: '⏰',
      title: 'Time Commitment',
      description: 'Available for 15-20 hours per week for the duration of the program.',
      level: 'Essential',
      color: 'gold'
    },
    {
      icon: '💬',
      title: 'English Proficiency',
      description: 'Good understanding of English for learning materials and communication.',
      level: 'Important',
      color: 'blue'
    },
    {
      icon: '🎯',
      title: 'Career Focus',
      description: 'Clear intention to pursue a career in web development or tech.',
      level: 'Important',
      color: 'blue'
    },
    {
      icon: '👥',
      title: 'Team Player',
      description: 'Willingness to collaborate, share knowledge, and support fellow learners.',
      level: 'Preferred',
      color: 'green'
    }
  ]

  const idealCandidate = [
    'Recent graduates looking to break into tech',
    'Career changers seeking new opportunities',
    'Self-taught developers wanting structured learning',
    'Entrepreneurs planning tech-based businesses',
    'Students wanting real-world experience',
    'Freelancers expanding their skillset'
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <section id="requirements" className="requirements section">
      <div className="container">
        <motion.div 
          className="requirements__header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="heading-secondary">
            Are You Ready to Join?
          </h2>
          <p className="requirements__subtitle">
            We're looking for <span className="text-highlight">dedicated individuals</span> who 
            are serious about transforming their careers. Here's what we're looking for:
          </p>
        </motion.div>

        <div className="requirements__content">
          {/* Requirements Grid */}
          <motion.div 
            className="requirements__grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {requirements.map((req, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`requirement-card requirement-card--${req.color}`}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="requirement-card__header">
                  <div className="requirement-card__icon">
                    {req.icon}
                  </div>
                  <div className="requirement-card__level">
                    <span className={`level-badge level-badge--${req.level.toLowerCase()}`}>
                      {req.level}
                    </span>
                  </div>
                </div>
                
                <h3 className="requirement-card__title">{req.title}</h3>
                <p className="requirement-card__description">{req.description}</p>
                
                <div className="requirement-card__check">
                  <div className="check-icon">✓</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Ideal Candidates Section */}
          <motion.div 
            className="ideal-candidates"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="ideal-candidates__content">
              <div className="ideal-candidates__text">
                <h3 className="ideal-candidates__title">
                  Perfect for These Backgrounds:
                </h3>
                <p className="ideal-candidates__description">
                  Our program is designed for motivated individuals from diverse backgrounds 
                  who are ready to commit to their professional growth.
                </p>
              </div>
              
              <div className="ideal-candidates__list">
                {idealCandidate.map((candidate, index) => (
                  <motion.div
                    key={index}
                    className="candidate-item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    viewport={{ once: true }}
                    whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  >
                    <div className="candidate-icon">👤</div>
                    <span className="candidate-text">{candidate}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Application Process */}
          <motion.div 
            className="application-process"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="process__title">Application Process</h3>
            <div className="process__steps">
              <div className="process-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Submit Application</h4>
                  <p>Fill out our comprehensive application form</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Pay Registration Fee</h4>
                  <p>Secure your spot with the registration payment</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Brief Interview</h4>
                  <p>Short conversation to ensure mutual fit</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Welcome to Team</h4>
                  <p>Receive access to exclusive learning materials</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Important Note */}
          <motion.div 
            className="requirements__note"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="note-content">
              <div className="note-icon">⚠️</div>
              <div className="note-text">
                <h4>Important Notice</h4>
                <p>
                  We're only selecting <strong>10 dedicated individuals</strong>. 
                  The registration fee demonstrates your commitment and helps us 
                  ensure that only serious candidates join the program. 
                  <span className="highlight-text">
                    If you're not ready to invest in yourself, please pass this opportunity to someone who is.
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Requirements
