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
import { safeFormatDate } from '@/modules/common/utils/formatters';
import { messagingService } from '../../services/messagingService';
import { devError } from '';

// Styled components
const SearchHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SearchResult = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ContentPreview = styled(Typography)(({ theme, highlight }) => ({
  '& .highlight': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(184, 134, 11, 0.18)',
    padding: '0 2px',
    borderRadius: '2px',
  },
}));

const FilterChip = styled(Chip)(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: selected
    ? (theme.palette.mode === 'dark' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(184, 134, 11, 0.12)')
    : theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  color: selected ? theme.palette.secondary.main : theme.palette.text.secondary,
  borderColor: selected ? theme.palette.secondary.main : theme.palette.divider,
  '&:hover': {
    backgroundColor: selected
      ? (theme.palette.mode === 'dark' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(184, 134, 11, 0.18)')
      : theme.palette.action.hover,
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
      devError('Error searching messages:', error);
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
              <span key={`highlight-part-${i}-${part}`} className="highlight">
                {part}
              </span>
            ) : (
              <React.Fragment key={`plain-part-${i}-${part}`}>{part}</React.Fragment>
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
      aria-label="Message search panel"
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          bgcolor: 'background.paper',
        },
      }}
    >
      <SearchHeader>
        <IconButton
          edge="start"
          onClick={onClose}
          aria-label="Close message search"
          sx={{
            width: 44,
            height: 44,
            '&:focus-visible': {
              outline: '3px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h6">Message Search</Typography>
      </SearchHeader>

      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search names, words, or shared details"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          helperText="Start with one word, then narrow by date or attachments."
          inputProps={{ 'aria-label': 'Search messages' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={() => setQuery('')}
                  aria-label="Clear search text"
                  sx={{
                    width: 44,
                    height: 44,
                    '&:focus-visible': {
                      outline: '3px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    },
                  }}
                >
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
            aria-label="Filter messages with attachments"
          />

          <FilterChip
            icon={<CalendarMonth />}
            label="Today"
            variant={filters.period === 'today' ? 'filled' : 'outlined'}
            selected={filters.period === 'today'}
            onClick={() => toggleFilter('period', 'today')}
            aria-label="Filter messages from today"
          />

          <FilterChip
            icon={<CalendarMonth />}
            label="This week"
            variant={filters.period === 'week' ? 'filled' : 'outlined'}
            selected={filters.period === 'week'}
            onClick={() => toggleFilter('period', 'week')}
            aria-label="Filter messages from this week"
          />

          <FilterChip
            icon={<CalendarMonth />}
            label="This month"
            variant={filters.period === 'month' ? 'filled' : 'outlined'}
            selected={filters.period === 'month'}
            onClick={() => toggleFilter('period', 'month')}
            aria-label="Filter messages from this month"
          />
        </Box>
      </Box>

      <Divider />

      {loading ? (
        <Box sx={{ p: 2 }}>
          {[1, 2, 3, 4].map((row) => (
            <Box
              key={`message-search-loading-skeleton-${row}`}
              sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Skeleton variant="text" width="42%" height={24} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="88%" height={20} sx={{ mb: 0.4 }} />
              <Skeleton variant="text" width="34%" height={18} />
            </Box>
          ))}
        </Box>
      ) : results.length > 0 ? (
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {results.map((message) => (
            <React.Fragment key={message.id}>
              <SearchResult
                onClick={() => handleSelectResult(message)}
                aria-label={`Open matched message in ${message.conversation.title}`}
              >
                <ListItemText
                  primary={
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}
                    >
                      <Typography variant="body1" sx={{ minWidth: 0, wordBreak: 'break-word' }}>
                        {message.conversation.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {safeFormatDate(message.createdAt, 'MMM d, yyyy')}
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
            No messages matched "{query}". Try a shorter word such as payment, job, or name.
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
            Type one word to find messages. Use date or attachments to narrow the list.
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default MessageSearch;

