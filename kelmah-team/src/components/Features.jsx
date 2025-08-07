import React from 'react'
import { motion } from 'framer-motion'
import '../styles/Features.css'

const Features = () => {
  const features = [
    {
      icon: '🚀',
      title: 'Full-Stack Web Development',
      description: 'Master modern web technologies including React.js, Node.js, Express, MongoDB, and deployment strategies.',
      skills: ['React.js', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Git'],
      color: 'blue'
    },
    {
      icon: '📱',
      title: 'Mobile App Development',
      description: 'Build cross-platform mobile applications using React Native and modern mobile development practices.',
      skills: ['React Native', 'Expo', 'Mobile UI/UX', 'App Store Deployment', 'Push Notifications', 'Native APIs'],
      color: 'green'
    },
    {
      icon: '🤖',
      title: 'AI & Prompt Engineering',
      description: 'Learn to harness the power of AI tools, create effective prompts, and integrate AI into applications.',
      skills: ['ChatGPT API', 'Prompt Design', 'AI Integration', 'Machine Learning Basics', 'OpenAI', 'AI Ethics'],
      color: 'purple'
    },
    {
      icon: '💼',
      title: 'Professional Development',
      description: 'Develop soft skills, portfolio building, interview preparation, and guaranteed job placement.',
      skills: ['Portfolio Building', 'Interview Skills', 'Project Management', 'Team Collaboration', 'Client Communication', 'Freelancing'],
      color: 'gold'
    },
    {
      icon: '🛠️',
      title: 'Development Tools & DevOps',
      description: 'Master essential development tools, version control, testing, CI/CD, and deployment strategies.',
      skills: ['Git/GitHub', 'VS Code', 'Docker', 'Testing', 'CI/CD', 'Cloud Deployment'],
      color: 'red'
    },
    {
      icon: '🎨',
      title: 'UI/UX Design Principles',
      description: 'Learn design thinking, user experience principles, and how to create beautiful, functional interfaces.',
      skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Responsive Design', 'Accessibility'],
      color: 'pink'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
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
    <section id="features" className="features section">
      <div className="container">
        <motion.div 
          className="features__header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="heading-secondary">
            What You'll Master in Our Program
          </h2>
          <p className="features__subtitle">
            A comprehensive curriculum designed to transform you into a 
            <span className="text-highlight"> full-stack developer</span> and 
            <span className="text-highlight"> AI specialist</span> ready for the modern tech industry.
          </p>
        </motion.div>

        <motion.div 
          className="features__grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className={`feature-card feature-card--${feature.color}`}
              whileHover={{ 
                y: -10, 
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
            >
              <div className="feature-card__header">
                <div className="feature-card__icon">
                  <span className="icon">{feature.icon}</span>
                  <div className="icon-glow"></div>
                </div>
                <h3 className="feature-card__title">{feature.title}</h3>
              </div>

              <p className="feature-card__description">
                {feature.description}
              </p>

              <div className="feature-card__skills">
                <h4 className="skills__title">You'll Learn:</h4>
                <div className="skills__list">
                  {feature.skills.map((skill, skillIndex) => (
                    <motion.span
                      key={skillIndex}
                      className="skill-tag"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: skillIndex * 0.1,
                        ease: "easeOut"
                      }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="feature-card__progress">
                <div className="progress-bar">
                  <motion.div 
                    className="progress-fill"
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    transition={{ 
                      duration: 1.5, 
                      delay: 0.5,
                      ease: "easeOut"
                    }}
                    viewport={{ once: true }}
                  ></motion.div>
                </div>
                <span className="progress-text">Complete Mastery</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="features__highlight"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="highlight-box">
            <div className="highlight-icon">⭐</div>
            <div className="highlight-content">
              <h3>Bonus: Real-World Project Experience</h3>
              <p>
                Work on actual client projects during your training. Build a portfolio 
                that showcases real applications used by real users. This isn't just 
                theoretical learning—it's practical, hands-on experience that employers value.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Features
