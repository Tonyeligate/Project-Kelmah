import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Send as SendIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import PageCanvas from '@/modules/common/components/PageCanvas';

const conversations = [
  {
    id: 'conv-1',
    name: 'Ama Boateng',
    role: 'Hirer',
    status: 'Online',
    preview: 'Can you start tomorrow morning?',
    messages: [
      { from: 'them', text: 'Hello, are you available this week?' },
      { from: 'me', text: 'Yes. I can start tomorrow morning.' },
      { from: 'them', text: 'Great. Please send your estimate.' },
    ],
  },
  {
    id: 'conv-2',
    name: 'Kofi Mensah',
    role: 'Worker',
    status: 'Last seen recently',
    preview: 'I have shared the estimate and timeline.',
    messages: [
      { from: 'them', text: 'I shared the estimate earlier.' },
      { from: 'me', text: 'I received it. Let me review and confirm.' },
    ],
  },
  {
    id: 'conv-3',
    name: 'Kelmah Support',
    role: 'System',
    status: 'Pinned',
    preview: 'Your payout has been processed.',
    messages: [
      { from: 'them', text: 'Your account is active and ready.' },
    ],
  },
];

const MessagingPage = () => {
  const navigate = useNavigate();
  const [selectedConversationId, setSelectedConversationId] = useState(conversations[0].id);
  const [messageText, setMessageText] = useState('');

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId),
    [selectedConversationId],
  );

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      return;
    }
    setMessageText('');
  };

  return (
    <PageCanvas disableContainer>
      <Helmet>
        <title>Messages | Kelmah</title>
      </Helmet>

      <Box sx={{ minHeight: '100dvh', p: { xs: 1.25, sm: 2, md: 3 }, color: 'text.primary' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} variant="text" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Chip label={`${conversations.length} conversations`} variant="outlined" />
        </Stack>

        <Grid container spacing={2} sx={{ minHeight: 'calc(100dvh - 140px)' }}>
          <Grid item xs={12} md={4} lg={3}>
            <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                Inbox
              </Typography>
              <Stack spacing={1}>
                {conversations.map((conversation) => (
                  <Paper
                    key={conversation.id}
                    variant="outlined"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    sx={{
                      p: 1.25,
                      cursor: 'pointer',
                      borderColor:
                        selectedConversationId === conversation.id ? 'primary.main' : 'divider',
                      bgcolor:
                        selectedConversationId === conversation.id ? 'action.selected' : 'background.paper',
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar>{conversation.name.charAt(0)}</Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {conversation.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {conversation.preview}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8} lg={9}>
            <Paper
              variant="outlined"
              sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                <Avatar>{selectedConversation?.name?.charAt(0) || '?'}</Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} noWrap>
                    {selectedConversation?.name || 'Conversation'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedConversation?.status || 'Active'}
                  </Typography>
                </Box>
                <Chip label={selectedConversation?.role || 'Chat'} size="small" />
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, display: 'grid', gap: 1.25 }}>
                {(selectedConversation?.messages || []).map((message, index) => (
                  <Box
                    key={`${selectedConversationId}-${index}`}
                    sx={{
                      display: 'flex',
                      justifyContent: message.from === 'me' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        maxWidth: '72ch',
                        bgcolor: message.from === 'me' ? 'action.selected' : 'background.paper',
                      }}
                    >
                      <Typography variant="body2">{message.text}</Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Write a message"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <SendIcon />
                </IconButton>
              </Stack>

              <Alert severity="info" sx={{ mt: 2 }}>
                Messaging UI is shown in a compact shell layout while the route shell sweep continues.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </PageCanvas>
  );
};

export default MessagingPage;



