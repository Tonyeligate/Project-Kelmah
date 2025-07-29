import React from 'react';
import { Box, Typography, Chip, useMediaQuery } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Build as BuildIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Verified as VerifiedIcon,
  TrendingUp as TrendingUpIcon,
  WorkOutline as WorkIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
} from '@mui/icons-material';

import { 
  PageLayout, 
  LandingLayout, 
  Container, 
  Grid, 
  GridItem, 
  Stack, 
  Flex, 
  Center 
} from '../../../design-system/components/Layout';
import { 
  Button, 
  PrimaryButton, 
  SecondaryButton 
} from '../../../design-system/components/UI/Button';
import { 
  Card, 
  FeatureCard, 
  StatCard 
} from '../../../design-system/components/UI/Card';
import { 
  PRIMARY_COLORS, 
  BRAND_GRADIENTS 
} from '../../../design-system/foundations/colors';
import { 
  SEMANTIC_SPACING, 
  BORDER_RADIUS 
} from '../../../design-system/foundations/spacing';
import { 
  TYPOGRAPHY_SCALE, 
  FONT_WEIGHTS 
} from '../../../design-system/foundations/typography';
import Header from '../../layout/components/Header';

/**
 * Enhanced HomePage with Design System Integration
 * 
 * Features:
 * - Modern hero section with animations
 * - Feature showcase with interactive cards
 * - Statistics section with animated counters
 * - Service categories with Ghana focus
 * - Responsive design with mobile optimization
 * - Consistent brand styling throughout
 */

const HeroSection = styled(Box)(({ theme }) => ({
  minHeight: '80vh',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${PRIMARY_COLORS.black[900]} 0%, ${PRIMARY_COLORS.black[800]} 50%, ${PRIMARY_COLORS.gold[500]}15 100%)`
    : `linear-gradient(135deg, ${PRIMARY_COLORS.gold[400]} 0%, ${PRIMARY_COLORS.gold[500]} 50%, ${PRIMARY_COLORS.gold[600]} 100%)`,
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.1,
  },
}));

const HeroContent = styled(motion.div)(({ theme }) => ({
  textAlign: 'center',
  zIndex: 1,
  position: 'relative',
  maxWidth: '800px',
  margin: '0 auto',
  padding: `${SEMANTIC_SPACING.layout.xl} ${SEMANTIC_SPACING.container.md}`,
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  ...TYPOGRAPHY_SCALE['display-lg'],
  fontWeight: FONT_WEIGHTS.black,
  marginBottom: SEMANTIC_SPACING.layout.md,
  background: theme.palette.mode === 'dark' 
    ? BRAND_GRADIENTS.gold 
    : `linear-gradient(135deg, ${PRIMARY_COLORS.black[900]}, ${PRIMARY_COLORS.black[700]})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  lineHeight: 1.1,
  
  [theme.breakpoints.down('md')]: {
    ...TYPOGRAPHY_SCALE['display-md'],
  },
  
  [theme.breakpoints.down('sm')]: {
    ...TYPOGRAPHY_SCALE['display-sm'],
  },
}));

const HeroSubtitle = styled(Typography)(({ theme }) => ({
  ...TYPOGRAPHY_SCALE['body-xl'],
  marginBottom: SEMANTIC_SPACING.layout.lg,
  opacity: 0.9,
  color: theme.palette.mode === 'dark' 
    ? theme.palette.text.primary 
    : PRIMARY_COLORS.black[800],
  maxWidth: '600px',
  margin: `0 auto ${SEMANTIC_SPACING.layout.lg}`,
  
  [theme.breakpoints.down('sm')]: {
    ...TYPOGRAPHY_SCALE['body-lg'],
  },
}));

const StatsSection = styled(Box)(({ theme }) => ({
  padding: `${SEMANTIC_SPACING.layout['2xl']} 0`,
  backgroundColor: theme.palette.background.paper,
  position: 'relative',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100px',
    background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
  },
}));

const FeaturesSection = styled(Box)(({ theme }) => ({
  padding: `${SEMANTIC_SPACING.layout['3xl']} 0`,
  backgroundColor: theme.palette.background.default,
}));

const ServicesSection = styled(Box)(({ theme }) => ({
  padding: `${SEMANTIC_SPACING.layout['3xl']} 0`,
  backgroundColor: theme.palette.background.paper,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  ...TYPOGRAPHY_SCALE['display-sm'],
  fontWeight: FONT_WEIGHTS.bold,
  textAlign: 'center',
  marginBottom: SEMANTIC_SPACING.layout.xl,
  background: theme.palette.mode === 'dark' 
    ? BRAND_GRADIENTS.gold 
    : BRAND_GRADIENTS.black,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const SectionSubtitle = styled(Typography)(({ theme }) => ({
  ...TYPOGRAPHY_SCALE['body-lg'],
  textAlign: 'center',
  marginBottom: SEMANTIC_SPACING.layout.xl,
  opacity: 0.8,
  maxWidth: '600px',
  margin: `0 auto ${SEMANTIC_SPACING.layout.xl}`,
}));

const ServiceCard = styled(motion.div)(({ theme }) => ({
  padding: SEMANTIC_SPACING.card.padding.lg,
  borderRadius: BORDER_RADIUS.xl,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${PRIMARY_COLORS.gold[500]}10, ${PRIMARY_COLORS.gold[600]}20)`
    : `linear-gradient(135deg, ${PRIMARY_COLORS.gold[200]}, ${PRIMARY_COLORS.gold[300]})`,
  border: `1px solid ${theme.palette.mode === 'dark' ? PRIMARY_COLORS.gold[500] : PRIMARY_COLORS.black[900]}40`,
  cursor: 'pointer',
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px ${theme.palette.mode === 'dark' ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.1)'}`,
  },
}));

const SkillTag = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? `${PRIMARY_COLORS.gold[500]}20` 
    : `${PRIMARY_COLORS.black[900]}20`,
  color: theme.palette.mode === 'dark' 
    ? PRIMARY_COLORS.gold[500] 
    : PRIMARY_COLORS.black[900],
  border: `1px solid ${theme.palette.mode === 'dark' ? PRIMARY_COLORS.gold[500] : PRIMARY_COLORS.black[900]}40`,
  fontSize: '0.75rem',
  fontWeight: FONT_WEIGHTS.medium,
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? `${PRIMARY_COLORS.gold[500]}30` 
      : `${PRIMARY_COLORS.black[900]}30`,
  },
}));

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const stats = [
    { label: 'Active Professionals', value: '2,500+', trend: 15, icon: <PeopleIcon /> },
    { label: 'Jobs Completed', value: '10,000+', trend: 22, icon: <WorkIcon /> },
    { label: 'Client Satisfaction', value: '98%', trend: 5, icon: <StarIcon /> },
    { label: 'Cities Covered', value: '16', trend: 8, icon: <VerifiedIcon /> },
  ];

  const features = [
    {
      icon: <VerifiedIcon />,
      title: 'Verified Professionals',
      description: 'Every tradesperson undergoes thorough background checks and skill verification to ensure quality and reliability.',
    },
    {
      icon: <SecurityIcon />,
      title: 'Secure Payments',
      description: 'Protected payment system with escrow services, ensuring safe transactions for both clients and professionals.',
    },
    {
      icon: <SpeedIcon />,
      title: 'Quick Matching',
      description: 'AI-powered matching system connects you with the right professionals in your area within minutes.',
    },
    {
      icon: <SupportIcon />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to assist you throughout your project journey.',
    },
  ];

  const services = [
    {
      title: 'Construction & Building',
      description: 'Professional builders, masons, and construction workers for residential and commercial projects.',
      skills: ['Masonry', 'Roofing', 'Tiling', 'Concrete Work', 'Steel Bending'],
      icon: <BuildIcon />,
    },
    {
      title: 'Electrical Services',
      description: 'Licensed electricians for installations, repairs, and electrical maintenance.',
      skills: ['Wiring', 'Solar Installation', 'Electrical Repairs', 'Security Systems'],
      icon: '⚡',
    },
    {
      title: 'Plumbing & Water',
      description: 'Expert plumbers for installations, repairs, and water system maintenance.',
      skills: ['Pipe Installation', 'Water Heating', 'Drainage', 'Bathroom Fitting'],
      icon: '🔧',
    },
    {
      title: 'Automotive Services',
      description: 'Skilled mechanics and auto technicians for vehicle maintenance and repairs.',
      skills: ['Engine Repair', 'Body Work', 'Tire Services', 'Auto Painting'],
      icon: '🚗',
    },
    {
      title: 'Welding & Metalwork',
      description: 'Professional welders and metalworkers for fabrication and repair services.',
      skills: ['Arc Welding', 'Metal Fabrication', 'Gate Making', 'Structural Work'],
      icon: '🔥',
    },
    {
      title: 'Tailoring & Fashion',
      description: 'Experienced tailors and seamstresses for custom clothing and alterations.',
      skills: ['Custom Tailoring', 'Alterations', 'Traditional Wear', 'Fashion Design'],
      icon: '✂️',
    },
  ];

  const heroVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <LandingLayout header={<Header />}>
      {/* Hero Section */}
      <HeroSection>
        <Container size="xl">
          <HeroContent
            variants={heroVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={cardVariants}>
              <HeroTitle>
                Ghana's Premier Platform for Skilled Trades
              </HeroTitle>
            </motion.div>
            
            <motion.div variants={cardVariants}>
              <HeroSubtitle>
                Connect with verified local professionals for construction, electrical, plumbing, 
                automotive, and specialized trade services across Ghana.
              </HeroSubtitle>
            </motion.div>
            
            <motion.div variants={cardVariants}>
              <Flex 
                justify="center" 
                gap="md" 
                direction={isMobile ? 'column' : 'row'}
                align="center"
              >
                <PrimaryButton 
                  size="lg"
                  href="/auth/register"
                >
                  Get Started Today
                </PrimaryButton>
                <SecondaryButton 
                  size="lg"
                  href="/jobs"
                >
                  Browse Services
                </SecondaryButton>
              </Flex>
            </motion.div>
          </HeroContent>
        </Container>
      </HeroSection>

      {/* Stats Section */}
      <StatsSection>
        <Container size="lg">
          <Grid columns={isMobile ? 2 : 4} gap="md">
            {stats.map((stat, index) => (
              <GridItem key={stat.label}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <StatCard {...stat} />
                </motion.div>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </StatsSection>

      {/* Features Section */}
      <FeaturesSection>
        <Container size="lg">
          <SectionTitle>Why Choose Kelmah?</SectionTitle>
          <SectionSubtitle>
            We're committed to connecting you with Ghana's most skilled and reliable tradespeople
          </SectionSubtitle>
          
          <Grid columns={isMobile ? 1 : 2} gap="lg">
            {features.map((feature, index) => (
              <GridItem key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <FeatureCard {...feature} />
                </motion.div>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </FeaturesSection>

      {/* Services Section */}
      <ServicesSection>
        <Container size="lg">
          <SectionTitle>Our Services</SectionTitle>
          <SectionSubtitle>
            Comprehensive trade services covering all your professional needs across Ghana
          </SectionSubtitle>
          
          <Grid columns={isMobile ? 1 : 3} gap="lg">
            {services.map((service, index) => (
              <GridItem key={service.title}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ServiceCard
                    whileHover={{ y: -8 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Stack gap="md">
                      <Center>
                        <Box sx={{ fontSize: '3rem', mb: 2 }}>
                          {typeof service.icon === 'string' ? service.icon : service.icon}
                        </Box>
                      </Center>
                      
                      <Typography 
                        variant="h5" 
                        fontWeight={600} 
                        textAlign="center"
                        gutterBottom
                      >
                        {service.title}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        textAlign="center" 
                        sx={{ opacity: 0.8, mb: 3 }}
                      >
                        {service.description}
                      </Typography>
                      
                      <Flex gap="xs" wrap="wrap" justify="center">
                        {service.skills.map((skill) => (
                          <SkillTag 
                            key={skill} 
                            label={skill} 
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Flex>
                    </Stack>
                  </ServiceCard>
                </motion.div>
              </GridItem>
            ))}
          </Grid>
          
          <Center sx={{ mt: 6 }}>
            <PrimaryButton size="lg" href="/services">
              View All Services
            </PrimaryButton>
          </Center>
        </Container>
      </ServicesSection>

      {/* CTA Section */}
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Container size="md">
          <Stack gap="lg" align="center">
            <Typography 
              variant="h3" 
              fontWeight={700}
              sx={{
                background: theme.palette.mode === 'dark' 
                  ? BRAND_GRADIENTS.gold 
                  : BRAND_GRADIENTS.black,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Ready to Get Started?
            </Typography>
            
            <Typography variant="h6" sx={{ opacity: 0.8, maxWidth: 500 }}>
              Join thousands of satisfied clients who have found reliable tradespeople through Kelmah
            </Typography>
            
            <Flex gap="md" direction={isMobile ? 'column' : 'row'}>
              <PrimaryButton size="lg" href="/auth/register">
                Sign Up as Client
              </PrimaryButton>
              <SecondaryButton size="lg" href="/auth/register?role=worker">
                Join as Professional
              </SecondaryButton>
            </Flex>
          </Stack>
        </Container>
      </Box>
    </LandingLayout>
  );
};

export default HomePage;
