import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Card, Avatar, Rating, Chip } from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';
import { styled } from '@mui/material/styles';
import Particles from 'react-particles';
import { loadFull } from "tsparticles";
import { Parallax } from 'react-parallax';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Styled Components
const ParallaxSection = styled(Box)(({ theme }) => ({
  height: '50vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  position: 'relative',
  overflow: 'hidden',
}));

const TestimonialCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2),
  background: 'rgba(255, 215, 0, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
  borderRadius: '20px',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 30px rgba(255, 215, 0, 0.2)',
  },
}));

const JobCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  background: 'rgba(28, 28, 28, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
  borderRadius: '15px',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 8px 24px rgba(255, 215, 0, 0.15)',
  },
}));

// Sample Data
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "UI/UX Designer",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    content: "KELMAH helped me find amazing clients and grow my freelance business.",
    rating: 5,
  },
  // Add more testimonials...
];

const featuredJobs = [
  {
    title: "Senior React Developer",
    company: "TechCorp",
    budget: "$5000-$8000",
    type: "Remote",
    skills: ["React", "Node.js", "TypeScript"],
  },
  // Add more jobs...
];

const ContentSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  // Particle configuration
  const particlesInit = async (main) => {
    await loadFull(main);
  };

  const particlesConfig = {
    particles: {
      number: {
        value: 80,
        density: { enable: true, value_area: 800 },
      },
      color: { value: "#ffd700" },
      shape: {
        type: "circle",
        stroke: { width: 0, color: "#000000" },
        polygon: { nb_sides: 5 },
      },
      opacity: {
        value: 0.5,
        random: false,
        animation: {
          enable: true,
          speed: 1,
          opacity_min: 0.1,
          sync: false,
        },
      },
      size: {
        value: 3,
        random: true,
        animation: {
          enable: true,
          speed: 2,
          size_min: 0.1,
          sync: false,
        },
      },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#ffd700",
        opacity: 0.4,
        width: 1,
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false,
        attract: { enable: true, rotateX: 600, rotateY: 1200 },
      },
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "repulse" },
        onclick: { enable: true, mode: "push" },
        resize: true,
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push: { particles_nb: 4 },
      },
    },
    retina_detect: true,
  };

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <>
      {/* Parallax Hero Section */}
      <Parallax
        blur={0}
        bgImage="/images/hero-bg.jpg"
        strength={200}
        renderLayer={percentage => (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: `rgba(0, 0, 0, ${0.5 + percentage * 0.3})`,
            }}
          />
        )}
      >
        <ParallaxSection>
          <motion.div style={{ scale }}>
            <Typography variant="h2" align="center">
              Transform Your Career
            </Typography>
          </motion.div>
        </ParallaxSection>
      </Parallax>

      {/* Main Content */}
      <Box sx={{ position: 'relative', bgcolor: 'background.default' }}>
        <Particles id="tsparticles" init={particlesInit} options={particlesConfig} />
        
        {/* Rest of your content sections */}
        
        {/* Testimonials Section */}
        <Box sx={{ py: 8 }}>
          <Container>
            <Typography variant="h3" align="center" gutterBottom>
              What Our Users Say
            </Typography>
            <Slider {...sliderSettings}>
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index}>
                  <Avatar
                    src={testimonial.avatar}
                    sx={{ width: 80, height: 80, margin: '0 auto 20px' }}
                  />
                  <Typography variant="body1" paragraph>
                    {testimonial.content}
                  </Typography>
                  <Typography variant="h6">{testimonial.name}</Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {testimonial.role}
                  </Typography>
                  <Rating value={testimonial.rating} readOnly />
                </TestimonialCard>
              ))}
            </Slider>
          </Container>
        </Box>

        {/* Featured Jobs Section */}
        <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
          <Container>
            <Typography variant="h3" align="center" gutterBottom>
              Featured Opportunities
            </Typography>
            <Grid container spacing={3}>
              {featuredJobs.map((job, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <JobCard>
                    <Typography variant="h6" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography variant="subtitle1" color="secondary">
                      {job.company}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Budget: {job.budget}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {job.skills.map((skill, i) => (
                        <Chip key={i} label={skill} size="small" />
                      ))}
                    </Box>
                  </JobCard>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default ContentSection;