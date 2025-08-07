import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Requirements from '../components/Requirements'
import Timeline from '../components/Timeline'
import Testimonials from '../components/Testimonials'
import CTA from '../components/CTA'
import Footer from '../components/Footer'
import '../styles/HomePage.css'

const HomePage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true
    })

    return () => {
      AOS.refresh()
    }
  }, [])

  const handleJoinTeam = () => {
    navigate('/register')
  }

  return (
    <motion.div 
      className="home-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Floating Elements Background */}
      <div className="floating-elements">
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
      </div>

      <Header />
      
      <main>
        <Hero onJoinTeam={handleJoinTeam} />
        <Features />
        <Requirements />
        <Timeline />
        <Testimonials />
        <CTA onJoinTeam={handleJoinTeam} />
      </main>
      
      <Footer />
    </motion.div>
  )
}

export default HomePage
