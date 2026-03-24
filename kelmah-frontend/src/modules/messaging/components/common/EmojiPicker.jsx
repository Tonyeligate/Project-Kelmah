import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  ClickAwayListener,
  TextField,
  InputAdornment,
  IconButton,
  Tab,
  Tabs,
  Typography,
  Popper,
  Paper,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { devError } from '';

// Define emoji categories
const categories = [
  { id: 'smileys', name: 'Smileys', icon: '😀' },
  { id: 'people', name: 'People', icon: '👋' },
  { id: 'animals', name: 'Animals', icon: '🐶' },
  { id: 'food', name: 'Food', icon: '🍎' },
  { id: 'travel', name: 'Travel', icon: '🚗' },
  { id: 'activities', name: 'Activities', icon: '⚽' },
  { id: 'objects', name: 'Objects', icon: '📱' },
  { id: 'symbols', name: 'Symbols', icon: '❤️' },
  { id: 'flags', name: 'Flags', icon: '🏁' },
];

// Sample emoji data (in a real app, this would be a more comprehensive dataset)
const emojiData = {
  smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '🥲',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
  ],
  people: [
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '👌',
    '🤌',
    '🤏',
    '✌️',
    '🤞',
    '🫰',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
  ],
  animals: [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐻‍❄️',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐸',
    '🐵',
  ],
  food: [
    '🍎',
    '🍐',
    '🍊',
    '🍋',
    '🍌',
    '🍉',
    '🍇',
    '🍓',
    '🫐',
    '🍈',
    '🍒',
    '🍑',
    '🥭',
    '🍍',
    '🥥',
    '🥝',
  ],
  travel: [
    '🚗',
    '🚕',
    '🚙',
    '🚌',
    '🚎',
    '🏎️',
    '🚓',
    '🚑',
    '🚒',
    '🚐',
    '🛻',
    '🚚',
    '🚛',
    '🚜',
    '🛴',
    '🚲',
  ],
  activities: [
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🪀',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
  ],
  objects: [
    '⌚',
    '📱',
    '📲',
    '💻',
    '⌨️',
    '🖥️',
    '🖨️',
    '🖱️',
    '🖲️',
    '🕹️',
    '🗜️',
    '💽',
    '💾',
    '💿',
    '📀',
    '📼',
  ],
  symbols: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
  ],
  flags: [
    '🏁',
    '🚩',
    '🎌',
    '🏴',
    '🏳️',
    '🏳️‍🌈',
    '🏳️‍⚧️',
    '🏴‍☠️',
    '🇦🇨',
    '🇦🇩',
    '🇦🇪',
    '🇦🇫',
    '🇦🇬',
    '🇦🇮',
    '🇦🇱',
    '🇦🇲',
  ],
};

// Styled components
const EmojiButton = styled(Box)(({ theme }) => ({
  fontSize: '1.5rem',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  borderRadius: theme.shape.borderRadius,
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minWidth: 'auto',
  padding: theme.spacing(1),
}));

/**
 * EmojiPicker component for selecting emojis in chat
 */
const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeCategory, setActiveCategory] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState([]);
  const [filteredEmojis, setFilteredEmojis] = useState([]);
  const buttonRef = useRef(null);

  // Load recent emojis from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentEmojis');
      if (saved) {
        setRecentEmojis(JSON.parse(saved));
      }
    } catch (error) {
      devError('Error loading recent emojis', error);
    }
  }, []);

  // Handle emoji search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmojis([]);
      return;
    }

    // Search through all categories — filter by category name as a simple heuristic
    const query = searchQuery.trim().toLowerCase();
    const results = [];
    Object.entries(emojiData).forEach(([category, emojis]) => {
      if (category.toLowerCase().includes(query)) {
        results.push(...emojis);
      }
    });
    // If no category match, include all emojis (user can browse freely)
    setFilteredEmojis(results.length > 0 ? results : Object.values(emojiData).flat());
  }, [searchQuery]);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
    if (!open) {
      setAnchorEl(buttonRef.current);
    }
  };

  const handleClickAway = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const handleCategoryChange = (event, newValue) => {
    setActiveCategory(newValue);
  };

  const handleEmojiClick = (emoji) => {
    // Add to recent emojis
    const updatedRecent = [
      emoji,
      ...recentEmojis.filter((e) => e !== emoji),
    ].slice(0, 20);
    setRecentEmojis(updatedRecent);

    // Save to localStorage
    try {
      localStorage.setItem('recentEmojis', JSON.stringify(updatedRecent));
    } catch (error) {
      devError('Error saving recent emojis', error);
    }

    // Call the onSelect callback
    if (onEmojiSelect) {
      onEmojiSelect(emoji);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Get current emojis to display based on category or search
  const currentEmojis = searchQuery.trim()
    ? filteredEmojis
    : activeCategory === 'recent'
      ? recentEmojis
      : emojiData[activeCategory] || [];

  return (
    <>
      <IconButton
        ref={buttonRef}
        onClick={handleToggle}
        size="small"
        color="primary"
        aria-label="Open emoji picker"
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
        <EmojiEmotionsIcon />
      </IconButton>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="top-start"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleClickAway}>
          <Paper
            elevation={3}
            sx={{
              width: 320,
              maxHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 1.5, pb: 0.5 }}>
              <TextField
                placeholder="Search emojis"
                value={searchQuery}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={clearSearch}
                        edge="end"
                        aria-label="Clear emoji search"
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
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {!searchQuery && (
              <Tabs
                value={activeCategory}
                onChange={handleCategoryChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  minHeight: 40,
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                  },
                }}
              >
                {categories.map((category) => (
                  <StyledTab
                    key={category.id}
                    value={category.id}
                    icon={category.icon}
                    iconPosition="start"
                    aria-label={category.name}
                  />
                ))}
              </Tabs>
            )}

            <Box
              sx={{
                p: 1,
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                flexGrow: 1,
              }}
            >
              {currentEmojis.length > 0 ? (
                currentEmojis.map((emoji, index) => (
                  <EmojiButton
                    key={`${emoji}-${index}`}
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </EmojiButton>
                ))
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: 100,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'No emojis found' : 'No recent emojis'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

EmojiPicker.propTypes = {
  onEmojiSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func,
};

export default EmojiPicker;
