import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import '../styles/Header.css'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '#home', label: 'Home' },
    { href: '#features', label: 'What You\'ll Learn' },
    { href: '#requirements', label: 'Requirements' },
    { href: '#timeline', label: 'Timeline' },
    { href: '/register', label: 'Join Team', isButton: true }
  ]

  return (
    <motion.header 
      className={`header ${isScrolled ? 'header--scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container">
        <div className="header__content">
          {/* Logo */}
          <motion.div 
            className="header__logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="logo">
              <span className="logo__text">KELMAH</span>
              <span className="logo__subtitle">Team</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="header__nav">
            <ul className="nav__list">
              {navItems.map((item, index) => (
                <motion.li 
                  key={item.href}
                  className="nav__item"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {item.isButton ? (
                    <Link to={item.href} className="btn btn-primary nav__cta">
                      {item.label}
                    </Link>
                  ) : (
                    <a 
                      href={item.href} 
                      className="nav__link"
                      onClick={(e) => {
                        if (item.href.startsWith('#')) {
                          e.preventDefault()
                          const element = document.querySelector(item.href)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                      }}
                    >
                      {item.label}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <motion.button
            className="header__mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle mobile menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'hamburger--open' : ''}`}>
              <span className="hamburger__line"></span>
              <span className="hamburger__line"></span>
              <span className="hamburger__line"></span>
            </span>
          </motion.button>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                className="mobile-menu"
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="mobile-menu__overlay" onClick={() => setIsMobileMenuOpen(false)} />
                <div className="mobile-menu__content">
                  <div className="mobile-menu__header">
                    <span className="mobile-menu__title">Navigation</span>
                    <button 
                      className="mobile-menu__close"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      ×
                    </button>
                  </div>
                  <ul className="mobile-menu__list">
                    {navItems.map((item, index) => (
                      <motion.li 
                        key={item.href}
                        className="mobile-menu__item"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        {item.isButton ? (
                          <Link 
                            to={item.href} 
                            className="btn btn-primary mobile-menu__cta"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <a 
                            href={item.href} 
                            className="mobile-menu__link"
                            onClick={(e) => {
                              if (item.href.startsWith('#')) {
                                e.preventDefault()
                                const element = document.querySelector(item.href)
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth' })
                                }
                              }
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            {item.label}
                          </a>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  )
}

export default Header
