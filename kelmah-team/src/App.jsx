import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import HomePage from './pages/HomePage'
import RegistrationPage from './pages/RegistrationPage'
import PaymentPage from './pages/PaymentPage'
import SuccessPage from './pages/SuccessPage'
import ParticleBackground from './components/ParticleBackground'
import './styles/App.css'

function App() {
  return (
    <div className="app">
      <ParticleBackground />
      
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/" 
            element={
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <HomePage />
              </motion.div>
            } 
          />
          <Route 
            path="/register" 
            element={
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <RegistrationPage />
              </motion.div>
            } 
          />
          <Route 
            path="/payment" 
            element={
              <motion.div
                key="payment"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <PaymentPage />
              </motion.div>
            } 
          />
          <Route 
            path="/success" 
            element={
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <SuccessPage />
              </motion.div>
            } 
          />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
