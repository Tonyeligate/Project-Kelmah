import PropTypes from 'prop-types';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageCanvas from '../../common/components/PageCanvas';

const PAGE_CONTENT = {
  about: {
    title: 'About Kelmah',
    subtitle:
      'Kelmah is a vocational marketplace that connects trusted artisans and hirers across Ghana.',
    sections: [
      {
        heading: 'Our mission',
        body: 'We make it easier for skilled workers to find fair jobs and for hirers to find reliable talent quickly.',
      },
      {
        heading: 'Who we serve',
        body: 'Carpenters, masons, electricians, plumbers, painters, and businesses that need dependable craft work.',
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
    subtitle:
      'How Kelmah collects, stores, and protects your personal information.',
    sections: [
      {
        heading: 'Data usage',
        body: 'We use account, profile, and activity data to deliver matching, messaging, and secure payments.',
      },
      {
        heading: 'Data protection',
        body: 'We apply encryption and access controls to reduce unauthorized access and protect user information.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle:
      'Rules and responsibilities for workers, hirers, and platform use.',
    sections: [
      {
        heading: 'Account responsibilities',
        body: 'Users are responsible for accurate profile details and lawful use of the platform and communications.',
      },
      {
        heading: 'Marketplace conduct',
        body: 'Kelmah expects respectful behavior, honest job details, and timely dispute cooperation when needed.',
      },
    ],
  },
};

const PAGE_GUIDANCE = {
  about:
    'Kelmah keeps job and worker details simple so both workers and hirers can make confident decisions quickly.',
  contact:
    'For urgent payment, safety, or account issues, include your phone number, job title, and a short problem summary so our support team can assist faster.',
  privacy:
    'We only use your information to run matching, communication, and payments. You can contact support if anything looks unfamiliar.',
  terms:
    'These rules protect both workers and hirers. Clear communication and honest job details help avoid disputes.',
};

const InfoPage = ({ variant }) => {
  const activeVariant = PAGE_CONTENT[variant] ? variant : 'about';
  const content = PAGE_CONTENT[activeVariant];

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Helmet>
          <title>{`${content.title} | Kelmah`}</title>
        </Helmet>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ mb: 1, wordBreak: 'break-word' }}
          >
            {content.title}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: '72ch' }}>
            {content.subtitle}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1.25,
              px: 1.5,
              py: 1,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              wordBreak: 'break-word',
            }}
          >
            {PAGE_GUIDANCE[activeVariant]}
          </Typography>
        </Box>
        <Stack spacing={2.5}>
          {content.sections.map((section) => (
            <Box
              key={section.heading}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                {section.heading}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ wordBreak: 'break-word' }}
              >
                {section.body}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Container>
    </PageCanvas>
  );
};

InfoPage.propTypes = {
  variant: PropTypes.oneOf(['about', 'contact', 'privacy', 'terms']),
};

InfoPage.defaultProps = {
  variant: 'about',
};

export default InfoPage;
