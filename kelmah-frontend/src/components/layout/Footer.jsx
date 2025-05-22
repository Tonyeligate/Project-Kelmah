import React from 'react';
import { Box, Container, Typography, Link, Grid, styled } from '@mui/material';

const StyledFooter = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.primary.main,
  padding: theme.spacing(6, 0),
  marginTop: 'auto',
  borderTop: `2px solid ${theme.palette.primary.main}`,
  position: 'relative',
  bottom: 0,
  width: '100%',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

function Footer() {
  return (
    <StyledFooter component="footer">
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <StyledTypography variant="h6" gutterBottom>
              About Kelmah
            </StyledTypography>
            <StyledTypography variant="body2">
              Connecting skilled professionals with quality job opportunities.
            </StyledTypography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StyledTypography variant="h6" gutterBottom>
              Quick Links
            </StyledTypography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FooterLink href="/find-work">Find Work</FooterLink>
              <FooterLink href="/find-talents">Find Talents</FooterLink>
              <FooterLink href="/pricing">Pricing</FooterLink>
              <FooterLink href="/whats-new">What's New</FooterLink>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StyledTypography variant="h6" gutterBottom>
              Legal
            </StyledTypography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/cookies">Cookie Policy</FooterLink>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(26, 26, 26, 0.1)' }}>
          <StyledTypography variant="body2" align="center">
            © {new Date().getFullYear()} Kelmah. All rights reserved.
          </StyledTypography>
        </Box>
      </Container>
    </StyledFooter>
  );
}

export default Footer;