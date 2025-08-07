import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import '../styles/Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    program: [
      { label: 'What You\'ll Learn', href: '#features' },
      { label: 'Program Timeline', href: '#timeline' },
      { label: 'Requirements', href: '#requirements' },
      { label: 'Success Stories', href: '#testimonials' }
    ],
    company: [
      { label: 'About Kelmah', href: '#about' },
      { label: 'Our Mission', href: '#mission' },
      { label: 'Meet the Team', href: '#team' },
      { label: 'Careers', href: '#careers' }
    ],
    support: [
      { label: 'FAQs', href: '#faq' },
      { label: 'Contact Us', href: '#contact' },
      { label: 'Technical Support', href: '#support' },
      { label: 'Student Portal', href: '#portal' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Refund Policy', href: '#refund' },
      { label: 'Code of Conduct', href: '#conduct' }
    ]
  }

  const socialLinks = [
    { platform: 'Twitter', icon: '🐦', href: '#' },
    { platform: 'LinkedIn', icon: '💼', href: '#' },
    { platform: 'YouTube', icon: '📺', href: '#' },
    { platform: 'Discord', icon: '💬', href: '#' },
    { platform: 'GitHub', icon: '👨‍💻', href: '#' }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
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
    <footer className="footer">
      <div className="footer__background">
        <div className="footer__gradient"></div>
      </div>

      <div className="container">
        <motion.div 
          className="footer__content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Main Footer Content */}
          <div className="footer__main">
            {/* Brand Section */}
            <motion.div variants={itemVariants} className="footer__brand">
              <Link to="/" className="footer__logo">
                <span className="logo__text">KELMAH</span>
                <span className="logo__subtitle">Team</span>
              </Link>
              
              <p className="footer__description">
                Transforming lives through comprehensive web development, 
                mobile app creation, and AI engineering education. Join our 
                exclusive team and unlock your potential in the tech industry.
              </p>

              <div className="footer__social">
                <h4 className="social__title">Follow Our Journey</h4>
                <div className="social__links">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.href}
                      className="social__link"
                      aria-label={`Follow us on ${social.platform}`}
                      whileHover={{ scale: 1.2, y: -3 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="social__icon">{social.icon}</span>
                      <span className="social__label">{social.platform}</span>
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Links Sections */}
            <div className="footer__links">
              <motion.div variants={itemVariants} className="footer__column">
                <h4 className="footer__title">Program</h4>
                <ul className="footer__list">
                  {footerLinks.program.map((link, index) => (
                    <li key={index} className="footer__item">
                      <a 
                        href={link.href} 
                        className="footer__link"
                        onClick={(e) => {
                          if (link.href.startsWith('#')) {
                            e.preventDefault()
                            const element = document.querySelector(link.href)
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' })
                            }
                          }
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={itemVariants} className="footer__column">
                <h4 className="footer__title">Company</h4>
                <ul className="footer__list">
                  {footerLinks.company.map((link, index) => (
                    <li key={index} className="footer__item">
                      <a href={link.href} className="footer__link">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={itemVariants} className="footer__column">
                <h4 className="footer__title">Support</h4>
                <ul className="footer__list">
                  {footerLinks.support.map((link, index) => (
                    <li key={index} className="footer__item">
                      <a href={link.href} className="footer__link">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={itemVariants} className="footer__column">
                <h4 className="footer__title">Legal</h4>
                <ul className="footer__list">
                  {footerLinks.legal.map((link, index) => (
                    <li key={index} className="footer__item">
                      <a href={link.href} className="footer__link">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>

          {/* Newsletter Section */}
          <motion.div variants={itemVariants} className="footer__newsletter">
            <div className="newsletter__content">
              <h4 className="newsletter__title">
                Stay Updated on Program News
              </h4>
              <p className="newsletter__description">
                Get exclusive updates, tips, and early access to new programs.
              </p>
              
              <div className="newsletter__form">
                <div className="form__group">
                  <input 
                    type="email" 
                    placeholder="Enter your email address"
                    className="form__input"
                    aria-label="Email address"
                  />
                  <motion.button 
                    className="form__button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    Subscribe
                  </motion.button>
                </div>
                <p className="form__note">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Bottom Section */}
          <motion.div variants={itemVariants} className="footer__bottom">
            <div className="footer__copyright">
              <p>
                © {currentYear} Kelmah Team. All rights reserved. 
                Made with ❤️ for aspiring developers.
              </p>
            </div>
            
            <div className="footer__badges">
              <div className="badge">
                <span className="badge__icon">🛡️</span>
                <span className="badge__text">100% Job Guarantee</span>
              </div>
              <div className="badge">
                <span className="badge__icon">⭐</span>
                <span className="badge__text">4.9/5 Rating</span>
              </div>
              <div className="badge">
                <span className="badge__icon">🎓</span>
                <span className="badge__text">Industry Certified</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating CTA */}
      <motion.div 
        className="footer__floating-cta"
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        viewport={{ once: true }}
      >
        <Link to="/register" className="floating-cta">
          <span className="floating-cta__text">Ready to Join?</span>
          <span className="floating-cta__icon">🚀</span>
        </Link>
      </motion.div>
    </footer>
  )
}

export default Footer
