import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { teamRegistrationApi } from '../services/teamApi'
import '../styles/RegistrationPage.css'

const RegistrationPage = () => {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors },
    trigger
  } = useForm({
    mode: 'onChange'
  })

  const totalSteps = 4
  const currentData = watch()

  const skills = [
    'HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 
    'Mobile Development', 'UI/UX Design', 'Database Management', 'DevOps', 
    'AI/ML', 'Data Analysis', 'Project Management', 'None - Complete Beginner'
  ]

  const hearAboutOptions = [
    'Social Media', 'Friend/Colleague', 'Online Search', 'Tech Community', 
    'University/School', 'Job Board', 'Podcast', 'YouTube', 'Other'
  ]

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(step)
    const isValid = await trigger(fieldsToValidate)
    
    if (isValid) {
      if (step < totalSteps) {
        setStep(step + 1)
      }
    } else {
      toast.error('Please fill in all required fields correctly')
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const getFieldsForStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        return ['fullName', 'email', 'phone', 'country']
      case 2:
        return ['currentStatus', 'experience', 'skills', 'goals']
      case 3:
        return ['availability', 'commitment', 'hearAbout', 'motivation']
      case 4:
        return ['agreement', 'marketingConsent']
      default:
        return []
    }
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      // Prepare registration data for backend
      const registrationData = {
        // Personal Information
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        age: 25, // Default age since form doesn't collect it
        location: data.country || 'Not specified', // Form uses 'country' field
        education: data.education || 'Not specified',
        currentStatus: data.currentStatus || 'student',
        
        // Technical Background  
        programmingLanguages: data.skills ? [data.skills] : [], // Form uses 'skills' field
        frameworks: [], // Form doesn't collect frameworks separately
        experienceLevel: data.experience || 'beginner',
        portfolioUrl: data.portfolio || '',
        githubUrl: data.github || '',
        previousProjects: [], // Form doesn't collect this
        hasWebDevelopmentExperience: data.experience !== 'beginner',
        hasAIExperience: false, // Form doesn't collect this specifically
        
        // Commitment and Motivation
        availableHours: parseInt(data.availability?.split('-')[0]) || 15,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        motivationLetter: data.motivation || '', // Form uses 'motivation' field
        careerGoals: data.goals || '',
        whyKelmah: data.motivation || '', // Use motivation for both fields
        canRelocate: false, // Form doesn't collect this
        hasTransportation: true, // Assume true
        
        // Source info
        source: data.hearAbout || 'website' // Form uses 'hearAbout' field
      }

      console.log('Submitting registration data:', registrationData)
      
      // Call the actual backend API
      const response = await teamRegistrationApi.submitRegistration(registrationData)
      
      console.log('Registration response:', response)
      
      // Store registration data and response for payment page
      localStorage.setItem('registrationData', JSON.stringify({
        ...data,
        registrationId: response.id || response._id,
        submissionDate: new Date().toISOString()
      }))
      
      toast.success('Registration submitted successfully! Please proceed to payment.')
      navigate('/payment')
      
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle specific error messages
      if (error.message?.includes('Email already registered')) {
        toast.error('This email is already registered. Please use a different email or contact support.')
      } else if (error.message?.includes('validation')) {
        toast.error('Please check your information and try again.')
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error(error.message || 'Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const stepVariants = {
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
    <div className="registration-page">
      <Header />
      
      <main className="registration-main">
        <div className="container">
          <motion.div 
            className="registration-header"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="heading-primary">Join The Kelmah Team</h1>
            <p className="registration-subtitle">
              Complete your application to secure one of the 10 available spots
            </p>
            
            <div className="progress-container">
              <div className="progress-bar">
                <motion.div 
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="progress-text">Step {step} of {totalSteps}</span>
            </div>
          </motion.div>

          <div className="registration-content">
            <form onSubmit={handleSubmit(onSubmit)} className="registration-form">
              
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="form-step"
                >
                  <div className="step-header">
                    <h2 className="step-title">Personal Information</h2>
                    <p className="step-description">Tell us about yourself</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        Full Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-input ${errors.fullName ? 'error' : ''}`}
                        placeholder="Enter your full name"
                        {...register('fullName', {
                          required: 'Full name is required',
                          minLength: { value: 2, message: 'Name must be at least 2 characters' }
                        })}
                      />
                      {errors.fullName && (
                        <span className="error-message">{errors.fullName.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Email Address <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-input ${errors.email ? 'error' : ''}`}
                        placeholder="your@email.com"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                      />
                      {errors.email && (
                        <span className="error-message">{errors.email.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Phone Number <span className="required">*</span>
                      </label>
                      <input
                        type="tel"
                        className={`form-input ${errors.phone ? 'error' : ''}`}
                        placeholder="+1 (555) 123-4567"
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[\+]?[0-9\-\(\)\s]+$/,
                            message: 'Invalid phone number'
                          }
                        })}
                      />
                      {errors.phone && (
                        <span className="error-message">{errors.phone.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Country/Location <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-input ${errors.country ? 'error' : ''}`}
                        placeholder="e.g., United States, Nigeria, UK"
                        {...register('country', {
                          required: 'Country is required'
                        })}
                      />
                      {errors.country && (
                        <span className="error-message">{errors.country.message}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Technical Background */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="form-step"
                >
                  <div className="step-header">
                    <h2 className="step-title">Technical Background</h2>
                    <p className="step-description">Help us understand your current skill level</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">
                        Current Status <span className="required">*</span>
                      </label>
                      <select
                        className={`form-input form-select ${errors.currentStatus ? 'error' : ''}`}
                        {...register('currentStatus', {
                          required: 'Please select your current status'
                        })}
                      >
                        <option value="">Select your current status</option>
                        <option value="student">Student</option>
                        <option value="recent-graduate">Recent Graduate</option>
                        <option value="employed-tech">Employed (Tech)</option>
                        <option value="employed-non-tech">Employed (Non-Tech)</option>
                        <option value="unemployed">Unemployed/Job Seeking</option>
                        <option value="freelancer">Freelancer</option>
                        <option value="entrepreneur">Entrepreneur</option>
                        <option value="career-changer">Career Changer</option>
                      </select>
                      {errors.currentStatus && (
                        <span className="error-message">{errors.currentStatus.message}</span>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">
                        Programming Experience Level <span className="required">*</span>
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            value="beginner"
                            {...register('experience', {
                              required: 'Please select your experience level'
                            })}
                          />
                          <span className="radio-custom"></span>
                          <div className="radio-content">
                            <strong>Complete Beginner</strong>
                            <small>No programming experience</small>
                          </div>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            value="basic"
                            {...register('experience')}
                          />
                          <span className="radio-custom"></span>
                          <div className="radio-content">
                            <strong>Basic Knowledge</strong>
                            <small>Some online courses or tutorials</small>
                          </div>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            value="intermediate"
                            {...register('experience')}
                          />
                          <span className="radio-custom"></span>
                          <div className="radio-content">
                            <strong>Intermediate</strong>
                            <small>Built some projects, familiar with concepts</small>
                          </div>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            value="advanced"
                            {...register('experience')}
                          />
                          <span className="radio-custom"></span>
                          <div className="radio-content">
                            <strong>Advanced</strong>
                            <small>Professional experience or extensive projects</small>
                          </div>
                        </label>
                      </div>
                      {errors.experience && (
                        <span className="error-message">{errors.experience.message}</span>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">
                        Current Skills/Technologies <span className="required">*</span>
                      </label>
                      <div className="checkbox-grid">
                        {skills.map((skill, index) => (
                          <label key={index} className="checkbox-option">
                            <input
                              type="checkbox"
                              value={skill}
                              {...register('skills', {
                                required: 'Please select at least one skill or "None - Complete Beginner"'
                              })}
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">{skill}</span>
                          </label>
                        ))}
                      </div>
                      {errors.skills && (
                        <span className="error-message">{errors.skills.message}</span>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">
                        Career Goals <span className="required">*</span>
                      </label>
                      <textarea
                        className={`form-input form-textarea ${errors.goals ? 'error' : ''}`}
                        placeholder="What do you hope to achieve through this program? What are your career aspirations?"
                        rows="4"
                        {...register('goals', {
                          required: 'Please share your career goals',
                          minLength: { value: 20, message: 'Please provide more detail (at least 20 characters)' }
                        })}
                      />
                      {errors.goals && (
                        <span className="error-message">{errors.goals.message}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Commitment & Motivation */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="form-step"
                >
                  <div className="step-header">
                    <h2 className="step-title">Commitment & Motivation</h2>
                    <p className="step-description">Show us your dedication</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">
                        Weekly Time Availability <span className="required">*</span>
                      </label>
                      <select
                        className={`form-input form-select ${errors.availability ? 'error' : ''}`}
                        {...register('availability', {
                          required: 'Please select your availability'
                        })}
                      >
                        <option value="">Select your weekly availability</option>
                        <option value="10-15">10-15 hours per week</option>
                        <option value="15-20">15-20 hours per week (Recommended)</option>
                        <option value="20-25">20-25 hours per week</option>
                        <option value="25+">25+ hours per week</option>
                      </select>
                      {errors.availability && (
                        <span className="error-message">{errors.availability.message}</span>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">
                        Commitment Level <span className="required">*</span>
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            value="full"
                            {...register('commitment', {
                              required: 'Please indicate your commitment level'
                            })}
                          />
                          <span className="radio-custom"></span>
                          <div className="radio-content">
                            <strong>Fully Committed</strong>
                            <small>This is my top priority for the next 6 months</small>
                          </div>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            value="high"
                            {...register('commitment')}
                          />
                          <span className="radio-custom"></span>
                          <div className="radio-content">
                            <strong>Highly Committed</strong>
                            <small>Very important, will dedicate significant time</small>
                          </div>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            value="moderate"
                            {...register('commitment')}
                          />
                          <span className="radio-custom"></span>
                          <div className="radio-content">
                            <strong>Moderately Committed</strong>
                            <small>Important, but balancing with other priorities</small>
                          </div>
                        </label>
                      </div>
                      {errors.commitment && (
                        <span className="error-message">{errors.commitment.message}</span>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">
                        How did you hear about this program? <span className="required">*</span>
                      </label>
                      <select
                        className={`form-input form-select ${errors.hearAbout ? 'error' : ''}`}
                        {...register('hearAbout', {
                          required: 'Please tell us how you heard about the program'
                        })}
                      >
                        <option value="">Select an option</option>
                        {hearAboutOptions.map((option, index) => (
                          <option key={index} value={option.toLowerCase().replace(/\s+/g, '-')}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.hearAbout && (
                        <span className="error-message">{errors.hearAbout.message}</span>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">
                        Why should we select you? <span className="required">*</span>
                      </label>
                      <textarea
                        className={`form-input form-textarea ${errors.motivation ? 'error' : ''}`}
                        placeholder="Tell us what makes you a great fit for this program. What unique value will you bring?"
                        rows="5"
                        {...register('motivation', {
                          required: 'Please tell us why we should select you',
                          minLength: { value: 50, message: 'Please provide more detail (at least 50 characters)' }
                        })}
                      />
                      {errors.motivation && (
                        <span className="error-message">{errors.motivation.message}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Agreement & Final Details */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="form-step"
                >
                  <div className="step-header">
                    <h2 className="step-title">Final Step</h2>
                    <p className="step-description">Review and agree to the terms</p>
                  </div>

                  <div className="agreement-section">
                    <div className="info-box">
                      <h3>Program Summary</h3>
                      <ul>
                        <li>6-month comprehensive training program</li>
                        <li>Web development, mobile apps, and AI technologies</li>
                        <li>15-20 hours per week commitment</li>
                        <li>100% job placement guarantee</li>
                        <li>Registration fee: $500 (one-time payment)</li>
                        <li>Limited to 10 participants</li>
                      </ul>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-option agreement-checkbox">
                        <input
                          type="checkbox"
                          {...register('agreement', {
                            required: 'You must agree to the terms and conditions'
                          })}
                        />
                        <span className="checkbox-custom"></span>
                        <span className="checkbox-label">
                          I agree to the <a href="#terms" className="link">Terms and Conditions</a> and 
                          understand that a registration fee of $500 is required to secure my spot in the program. 
                          I commit to dedicating the necessary time and effort to complete the program successfully. <span className="required">*</span>
                        </span>
                      </label>
                      {errors.agreement && (
                        <span className="error-message">{errors.agreement.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          {...register('marketingConsent')}
                        />
                        <span className="checkbox-custom"></span>
                        <span className="checkbox-label">
                          I would like to receive updates about future programs, job opportunities, 
                          and relevant tech industry news via email.
                        </span>
                      </label>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          {...register('portfolioConsent')}
                        />
                        <span className="checkbox-custom"></span>
                        <span className="checkbox-label">
                          I consent to having my projects and success story potentially featured 
                          in program marketing materials (with anonymization if requested).
                        </span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="form-navigation">
                {step > 1 && (
                  <motion.button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ← Previous
                  </motion.button>
                )}
                
                <div className="nav-spacer"></div>
                
                {step < totalSteps ? (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Next →
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    className="btn btn-primary btn--large"
                    disabled={isLoading}
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Submit Application 🚀
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default RegistrationPage
