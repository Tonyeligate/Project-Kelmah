import React from 'react'
import { motion } from 'framer-motion'
import '../styles/Timeline.css'
import work1 from '../assets/work1.svg'
import work2 from '../assets/work2.svg'
import work3 from '../assets/work3.svg'

const Timeline = () => {
  const timelineData = [
    {
      phase: 'Phase 1',
      duration: 'Weeks 1-6',
      title: 'Foundation & Fundamentals',
      description: 'Master the core technologies and development principles.',
      skills: ['HTML5 & CSS3', 'JavaScript ES6+', 'React.js', 'Git & Version Control', 'Development Environment'],
      deliverables: ['Personal Portfolio Website', 'Interactive JavaScript Projects', 'First React Application'],
      icon: '🏗️',
      iconSvg: work1,
      color: 'blue'
    },
    {
      phase: 'Phase 2',
      duration: 'Weeks 7-12',
      title: 'Backend & Database',
      description: 'Build robust server-side applications and data management systems.',
      skills: ['Node.js & Express', 'MongoDB & Mongoose', 'RESTful APIs', 'Authentication', 'Testing'],
      deliverables: ['Full-Stack Web Application', 'API Documentation', 'Database Design'],
      icon: '⚙️',
      iconSvg: work2,
      color: 'green'
    },
    {
      phase: 'Phase 3',
      duration: 'Weeks 13-18',
      title: 'Mobile & Advanced Topics',
      description: 'Expand into mobile development and advanced web technologies.',
      skills: ['React Native', 'Mobile UI/UX', 'State Management', 'Performance Optimization', 'Deployment'],
      deliverables: ['Cross-Platform Mobile App', 'Advanced Web Features', 'Deployed Applications'],
      icon: '📱',
      iconSvg: work3,
      color: 'purple'
    },
    {
      phase: 'Phase 4',
      duration: 'Weeks 19-24',
      title: 'AI & Professional Skills',
      description: 'Integrate AI technologies and develop professional competencies.',
      skills: ['AI & Prompt Engineering', 'OpenAI APIs', 'Project Management', 'Client Communication', 'Freelancing'],
      deliverables: ['AI-Powered Application', 'Professional Portfolio', 'Client Project Simulation'],
      icon: '🤖',
      color: 'gold'
    },
    {
      phase: 'Final',
      duration: 'Weeks 25-26',
      title: 'Job Placement & Launch',
      description: 'Secure your position in the Kelmah project and career launch.',
      skills: ['Interview Preparation', 'Salary Negotiation', 'Team Integration', 'Continuous Learning', 'Career Planning'],
      deliverables: ['Job Placement', 'Career Roadmap', 'Ongoing Mentorship'],
      icon: '🚀',
      color: 'gold'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  return (
    <section id="timeline" className="timeline section">
      <div className="container">
        <motion.div 
          className="timeline__header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="heading-secondary">
            Your 6-Month Journey to Success
          </h2>
          <p className="timeline__subtitle">
            A carefully structured program designed to take you from 
            <span className="text-highlight"> beginner to professional</span> in just 6 months.
          </p>
        </motion.div>

        <motion.div 
          className="timeline__container"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="timeline__line">
            <motion.div 
              className="timeline__progress"
              initial={{ height: 0 }}
              whileInView={{ height: '100%' }}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
              viewport={{ once: true }}
            />
          </div>

          {timelineData.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`timeline__item timeline__item--${index % 2 === 0 ? 'left' : 'right'}`}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="timeline__marker">
                <div className={`timeline__marker-icon timeline__marker--${item.color}`}>
                  {item.iconSvg ? (
                    <img src={item.iconSvg} alt={item.phase} className="marker-svg" />
                  ) : (
                    <span className="marker-icon">{item.icon}</span>
                  )}
                </div>
                <motion.div 
                  className="timeline__marker-pulse"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.3, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <div className={`timeline__content timeline__content--${item.color}`}>
                <div className="timeline__badge">
                  <span className="phase-text">{item.phase}</span>
                  <span className="duration-text">{item.duration}</span>
                </div>

                <h3 className="timeline__title">{item.title}</h3>
                <p className="timeline__description">{item.description}</p>

                <div className="timeline__skills">
                  <h4 className="skills-title">Skills You'll Master:</h4>
                  <div className="skills-grid">
                    {item.skills.map((skill, skillIndex) => (
                      <motion.span
                        key={skillIndex}
                        className="skill-chip"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: skillIndex * 0.1,
                          ease: "easeOut"
                        }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.1, y: -2 }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>

                <div className="timeline__deliverables">
                  <h4 className="deliverables-title">What You'll Build:</h4>
                  <ul className="deliverables-list">
                    {item.deliverables.map((deliverable, delIndex) => (
                      <motion.li
                        key={delIndex}
                        className="deliverable-item"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: delIndex * 0.1,
                          ease: "easeOut"
                        }}
                        viewport={{ once: true }}
                      >
                        <span className="deliverable-icon">🎯</span>
                        <span className="deliverable-text">{deliverable}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="timeline__progress-indicator">
                  <div className="progress-bar">
                    <motion.div 
                      className="progress-fill"
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      viewport={{ once: true }}
                    />
                  </div>
                  <span className="progress-text">Complete Mastery</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Summary Stats */}
        <motion.div 
          className="timeline__summary"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="summary-stats">
            <motion.div 
              className="stat-item"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stat-number">26</div>
              <div className="stat-label">Weeks of Training</div>
            </motion.div>
            <motion.div 
              className="stat-item"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stat-number">50+</div>
              <div className="stat-label">Skills Mastered</div>
            </motion.div>
            <motion.div 
              className="stat-item"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stat-number">15+</div>
              <div className="stat-label">Projects Built</div>
            </motion.div>
            <motion.div 
              className="stat-item"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stat-number">100%</div>
              <div className="stat-label">Job Guarantee</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Timeline
