import PropTypes from 'prop-types';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';

const PAGE_CONTENT = {
  about: {
    title: 'About Kelmah',
    subtitle:
      'Kelmah is a vocational marketplace that connects trusted artisans and hirers across Ghana.',
    sections: [
      {
        heading: 'Our mission',
        body:
          'We make it easier for skilled workers to find fair jobs and for hirers to find reliable talent quickly.',
      },
      {
        heading: 'Who we serve',
        body:
          'Carpenters, masons, electricians, plumbers, painters, and businesses that need dependable craft work.',
      },
    ],
  },
  contact: {
    title: 'Contact Kelmah',
    subtitle: 'Need help from our team? Reach us through the channels below.',
    sections: [
      {
        heading: 'Support email',
        body: 'support@kelmah.com',
      },
      {
        heading: 'Business hours',
        body: 'Monday to Saturday, 8:00 AM to 6:00 PM GMT.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How Kelmah collects, stores, and protects your personal information.',
    sections: [
      {
        heading: 'Data usage',
        body:
          'We use account, profile, and activity data to deliver matching, messaging, and secure payments.',
      },
      {
        heading: 'Data protection',
        body:
          'We apply encryption and access controls to reduce unauthorized access and protect user information.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Rules and responsibilities for workers, hirers, and platform use.',
    sections: [
      {
        heading: 'Account responsibilities',
        body:
          'Users are responsible for accurate profile details and lawful use of the platform and communications.',
      },
      {
        heading: 'Marketplace conduct',
        body:
          'Kelmah expects respectful behavior, honest job details, and timely dispute cooperation when needed.',
      },
    ],
  },
};

const InfoPage = ({ variant }) => {
  const content = PAGE_CONTENT[variant] || PAGE_CONTENT.about;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Helmet>
        <title>{`${content.title} | Kelmah`}</title>
      </Helmet>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          {content.title}
        </Typography>
        <Typography color="text.secondary">{content.subtitle}</Typography>
      </Box>
      <Stack spacing={2.5}>
        {content.sections.map((section) => (
          <Box key={section.heading} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              {section.heading}
            </Typography>
            <Typography color="text.secondary">{section.body}</Typography>
          </Box>
        ))}
      </Stack>
    </Container>
  );
};

InfoPage.propTypes = {
  variant: PropTypes.oneOf(['about', 'contact', 'privacy', 'terms']),
};

InfoPage.defaultProps = {
  variant: 'about',
};

export default InfoPage;