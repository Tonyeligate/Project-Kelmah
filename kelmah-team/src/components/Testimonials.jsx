import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import '../styles/Testimonials.css'

const Testimonials = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Full-Stack Developer',
      company: 'TechCorp Solutions',
      image: '👩‍💻',
      quote: 'This program transformed my career completely. From knowing basic HTML to building full-stack applications with AI integration - the journey was incredible. The job placement was exactly as promised!',
      rating: 5,
      timeframe: '6 months ago',
      salary: '$75,000/year',
      location: 'Remote'
    },
    {
      name: 'Michael Chen',
      role: 'React Native Developer',
      company: 'Mobile Innovations Inc',
      image: '👨‍💻',
      quote: 'I went from complete beginner to deploying mobile apps on both iOS and Android. The mentorship and real-world projects made all the difference. Best investment I ever made in myself.',
      rating: 5,
      timeframe: '4 months ago',
      salary: '$68,000/year',
      location: 'San Francisco, CA'
    },
    {
      name: 'Emma Williams',
      role: 'AI Solutions Engineer',
      company: 'DataMind Technologies',
      image: '👩‍🔬',
      quote: 'The AI and prompt engineering section was game-changing. I\'m now working on cutting-edge AI projects and earning more than I ever imagined. The program exceeded all expectations!',
      rating: 5,
      timeframe: '3 months ago',
      salary: '$82,000/year',
      location: 'New York, NY'
    },
    {
      name: 'David Rodriguez',
      role: 'Freelance Developer',
      company: 'Self-Employed',
      image: '👨‍🎨',
      quote: 'Not only did I learn to code, but I also learned how to run a successful freelance business. I\'m now earning $5,000+ monthly working with clients worldwide. Freedom achieved!',
      rating: 5,
      timeframe: '5 months ago',
      salary: '$60,000+/year',
      location: 'Austin, TX'
    }
  ]

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const slideVariants = {
    enter: {
      x: 300,
      opacity: 0
    },
    center: {
      x: 0,
      opacity: 1
    },
    exit: {
      x: -300,
      opacity: 0
    }
  }

  return (
    <section className="testimonials section">
      <div className="container">
        <motion.div 
          className="testimonials__header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="heading-secondary">
            Success Stories from Our Alumni
          </h2>
          <p className="testimonials__subtitle">
            Real people, real results. See how our program has transformed careers 
            and opened doors to <span className="text-highlight">life-changing opportunities</span>.
          </p>
        </motion.div>

        <div className="testimonials__carousel">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial}
              className="testimonial-card"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 }
              }}
            >
              <div className="testimonial-card__content">
                <div className="testimonial__quote-mark">"</div>
                
                <div className="testimonial__profile">
                  <div className="profile__avatar">
                    <span className="avatar-emoji">{testimonials[activeTestimonial].image}</span>
                    <div className="avatar-ring"></div>
                  </div>
                  
                  <div className="profile__info">
                    <h3 className="profile__name">{testimonials[activeTestimonial].name}</h3>
                    <p className="profile__role">{testimonials[activeTestimonial].role}</p>
                    <p className="profile__company">{testimonials[activeTestimonial].company}</p>
                  </div>
                </div>

                <blockquote className="testimonial__quote">
                  {testimonials[activeTestimonial].quote}
                </blockquote>

                <div className="testimonial__rating">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="star"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>

                <div className="testimonial__details">
                  <div className="detail-item">
                    <span className="detail-icon">💰</span>
                    <span className="detail-text">{testimonials[activeTestimonial].salary}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span className="detail-text">{testimonials[activeTestimonial].location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">{testimonials[activeTestimonial].timeframe}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="testimonials__navigation">
            <motion.button
              className="nav-btn nav-btn--prev"
              onClick={prevTestimonial}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Previous testimonial"
            >
              ←
            </motion.button>

            <div className="testimonials__dots">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  className={`dot ${index === activeTestimonial ? 'dot--active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <motion.button
              className="nav-btn nav-btn--next"
              onClick={nextTestimonial}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Next testimonial"
            >
              →
            </motion.button>
          </div>
        </div>

        {/* Statistics */}
        <motion.div 
          className="testimonials__stats"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="stats-grid">
            <motion.div 
              className="stat-box"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stat-number">100%</div>
              <div className="stat-label">Job Placement Rate</div>
              <div className="stat-description">Every graduate secured employment</div>
            </motion.div>
            
            <motion.div 
              className="stat-box"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stat-number">$72K</div>
              <div className="stat-label">Average Starting Salary</div>
              <div className="stat-description">Above industry average</div>
            </motion.div>
            
            <motion.div 
              className="stat-box"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stat-number">4.9/5</div>
              <div className="stat-label">Program Rating</div>
              <div className="stat-description">Based on alumni feedback</div>
            </motion.div>
            
            <motion.div 
              className="stat-box"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stat-number">6 Mo</div>
              <div className="stat-label">Time to Employment</div>
              <div className="stat-description">From start to job offer</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Auto-advance indicator */}
        <motion.div 
          className="auto-advance-bar"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          onAnimationComplete={() => nextTestimonial()}
        />
      </div>
    </section>
  )
}

export default Testimonials
