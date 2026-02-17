import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Search,
  Close,
  ArrowBack,
  CalendarMonth,
  Person,
  Attachment,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { messagingService } from '../../services/messagingService';

// Styled components
const SearchHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const SearchResult = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
}));

const ContentPreview = styled(Typography)(({ theme, highlight }) => ({
  '& .highlight': {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    padding: '0 2px',
    borderRadius: '2px',
  },
}));

const FilterChip = styled(Chip)(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: selected
    ? 'rgba(255, 215, 0, 0.2)'
    : 'rgba(255, 255, 255, 0.1)',
  borderColor: selected ? '#FFA500' : 'transparent',
  '&:hover': {
    backgroundColor: selected
      ? 'rgba(255, 215, 0, 0.3)'
      : 'rgba(255, 255, 255, 0.2)',
  },
}));

const MessageSearch = ({ open, onClose, onSelectMessage }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    attachments: false,
    period: 'all', // all, today, week, month
    sender: null,
  });

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const options = {
        attachments: filters.attachments,
        period: filters.period !== 'all' ? filters.period : undefined,
        sender: filters.sender,
      };

      const response = await messagingService.searchMessages(query, options);
      setResults(response.messages || []);
    } catch (error) {
      console.error('Error searching messages:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Search when query or filters change
  useEffect(() => {
    if (open) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [query, filters, open]);

  const handleSelectResult = (message) => {
    if (onSelectMessage) {
      onSelectMessage(message);
    }
    onClose();
  };

  const toggleFilter = (filterType, value) => {
    setFilters((prev) => {
      if (filterType === 'attachments') {
        return { ...prev, attachments: !prev.attachments };
      }

      if (filterType === 'period') {
        return { ...prev, period: prev.period === value ? 'all' : value };
      }

      if (filterType === 'sender') {
        return { ...prev, sender: prev.sender === value ? null : value };
      }

      return prev;
    });
  };

  // Safe highlight without HTML injection
  const renderHighlighted = (text, q) => {
    if (!text || !q) return <>{text}</>;
    try {
      const parts = text.split(
        new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
      );
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === q.toLowerCase() ? (
              <span key={i} className="highlight">
                {part}
              </span>
            ) : (
              <React.Fragment key={i}>{part}</React.Fragment>
            ),
          )}
        </>
      );
    } catch (_) {
      return <>{text}</>;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          bgcolor: 'background.paper',
        },
      }}
    >
      <SearchHeader>
        <IconButton edge="start" onClick={onClose}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6">Message Search</Typography>
      </SearchHeader>

      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for messages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={() => setQuery('')}>
                  <Close />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap' }}>
          <FilterChip
            icon={<Attachment />}
            label="Has attachments"
            variant={filters.attachments ? 'filled' : 'outlined'}
            selected={filters.attachments}
            onClick={() => toggleFilter('attachments')}
          />

          <FilterChip
            icon={<CalendarMonth />}
            label="Today"
            variant={filters.period === 'today' ? 'filled' : 'outlined'}
            selected={filters.period === 'today'}
            onClick={() => toggleFilter('period', 'today')}
          />

          <FilterChip
            icon={<CalendarMonth />}
            label="This week"
            variant={filters.period === 'week' ? 'filled' : 'outlined'}
            selected={filters.period === 'week'}
            onClick={() => toggleFilter('period', 'week')}
          />

          <FilterChip
            icon={<CalendarMonth />}
            label="This month"
            variant={filters.period === 'month' ? 'filled' : 'outlined'}
            selected={filters.period === 'month'}
            onClick={() => toggleFilter('period', 'month')}
          />
        </Box>
      </Box>

      <Divider />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : results.length > 0 ? (
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {results.map((message) => (
            <React.Fragment key={message.id}>
              <SearchResult onClick={() => handleSelectResult(message)}>
                <ListItemText
                  primary={
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography variant="body1">
                        {message.conversation.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(message.createdAt), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Person fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {message.sender.name}
                        </Typography>
                      </Box>
                      <ContentPreview variant="body2">
                        {renderHighlighted(message.content, query)}
                      </ContentPreview>
                      {message.attachments &&
                        message.attachments.length > 0 && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mt: 0.5,
                            }}
                          >
                            <Attachment fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {message.attachments.length} attachment
                              {message.attachments.length !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        )}
                    </>
                  }
                />
              </SearchResult>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      ) : query ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No messages found matching "{query}"
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Enter a search term to find messages
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default MessageSearch;
