import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import RealTimeChat from '../components/RealTimeChat';
import SEO from '../../common/components/common/SEO';

const SimpleMessagingPage = () => {
  const { conversationId } = useParams();

  return (
    <>
      <SEO title="Messages | Kelmah" description="Real-time messaging" />
      <Container maxWidth="xl" sx={{ py: 2, height: 'calc(100vh - 100px)' }}>
        <Box sx={{ height: '100%' }}>
          <RealTimeChat
            conversationId={conversationId}
            height="100%"
            showHeader={true}
          />
        </Box>
      </Container>
    </>
  );
};

export default SimpleMessagingPage;
