import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Mic as MicIcon,
  HelpOutline as HelpIcon,
  LocalOffer as SkillIcon,
  Work as JobTypeIcon,
  LocationOn as LocationIcon,
  AttachMoney as BudgetIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { API_BASE_URL } from '../../config/constants';

/**
 * Enhanced search bar with natural language processing capabilities
 */
const NaturalLanguageSearch = ({ onSearch, placeholder = "Try 'React developer in Accra paying over $20/hr'" }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [extractedParams, setExtractedParams] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  
  // Speech recognition setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  
  if (recognition) {
    recognition.continuous = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setRecording(false);
    };
    
    recognition.onerror = () => {
      setRecording(false);
    };
    
    recognition.onend = () => {
      setRecording(false);
    };
  }
  
  // Handle outside clicks (to close suggestions)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch search suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/jobs/search/suggestions`, {
          params: { query: debouncedQuery }
        });
        
        setSuggestions(response.data.data || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedQuery]);
  
  // Preview query parameters extracted by NLP
  useEffect(() => {
    const previewParams = async () => {
      if (!debouncedQuery || debouncedQuery.length < 5) {
        setExtractedParams(null);
        return;
      }
      
      try {
        // This would be a lightweight API call to show extracted parameters
        // You might create a separate endpoint for this or mock it here
        const nlpParams = mockParamExtraction(debouncedQuery);
        setExtractedParams(nlpParams);
      } catch (error) {
        console.error('Error previewing NLP params:', error);
        setExtractedParams(null);
      }
    };
    
    previewParams();
  }, [debouncedQuery]);
  
  // Mock NLP parameter extraction for preview
  // In a real app, this would be an API call
  const mockParamExtraction = (queryText) => {
    const extractedParams = {
      skills: [],
      jobType: null,
      location: null,
      budget: null
    };
    
    // Very simplified skill extraction
    const commonSkills = ['react', 'javascript', 'python', 'design', 'marketing'];
    commonSkills.forEach(skill => {
      if (queryText.toLowerCase().includes(skill)) {
        extractedParams.skills.push(skill);
      }
    });
    
    // Simplified job type extraction
    if (queryText.toLowerCase().includes('full-time') || queryText.toLowerCase().includes('full time')) {
      extractedParams.jobType = 'full-time';
    } else if (queryText.toLowerCase().includes('part-time') || queryText.toLowerCase().includes('part time')) {
      extractedParams.jobType = 'part-time';
    } else if (queryText.toLowerCase().includes('contract') || queryText.toLowerCase().includes('freelance')) {
      extractedParams.jobType = 'contract';
    }
    
    // Simplified location extraction
    const locationPattern = /(in|at|near|from)\s+([A-Za-z\s]+)/i;
    const locationMatch = queryText.match(locationPattern);
    if (locationMatch && locationMatch[2]) {
      extractedParams.location = locationMatch[2].trim();
    }
    
    // Simplified budget extraction
    const budgetPattern = /(\$|GHS|USD|cedi|dollar|pay|rate|budget)\s*(\d+)/i;
    const budgetMatch = queryText.match(budgetPattern);
    if (budgetMatch && budgetMatch[2]) {
      extractedParams.budget = {
        minBudget: parseInt(budgetMatch[2]),
        maxBudget: null
      };
    }
    
    // Return null if no parameters were extracted
    if (extractedParams.skills.length === 0 && 
        !extractedParams.jobType && 
        !extractedParams.location && 
        !extractedParams.budget) {
      return null;
    }
    
    return extractedParams;
  };
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Close suggestions
    setShowSuggestions(false);
    
    // Call the parent component's search handler
    if (onSearch) {
      onSearch(query);
    } else {
      // If no search handler is provided, navigate to search page
      navigate(`/search?nlQuery=${encodeURIComponent(query)}`);
    }
  };
  
  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setTimeout(() => {
      handleSearch({ preventDefault: () => {} });
    }, 100);
  };
  
  // Handle voice input
  const handleVoiceInput = () => {
    if (recognition && !recording) {
      setRecording(true);
      recognition.start();
    }
  };
  
  return (
    <Box 
      ref={searchContainerRef} 
      sx={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: 800, 
        margin: '0 auto' 
      }}
    >
      <form onSubmit={handleSearch}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= 2) setShowSuggestions(true);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    {query && (
                      <IconButton onClick={() => setQuery('')} edge="end">
                        <ClearIcon />
                      </IconButton>
                    )}
                    {recognition && (
                      <IconButton 
                        onClick={handleVoiceInput} 
                        edge="end" 
                        color={recording ? 'primary' : 'default'}
                      >
                        <MicIcon />
                      </IconButton>
                    )}
                    <Tooltip title="Try natural language search like 'Remote React developer with 3 years experience paying at least $25/hr'">
                      <IconButton edge="end">
                        <HelpIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              '&.Mui-focused': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
      </form>
      
      {/* Search suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            zIndex: 1000, 
            mt: 1, 
            maxHeight: 300, 
            overflow: 'auto' 
          }}
        >
          <List dense>
            {suggestions.map((suggestion, index) => (
              <ListItem 
                key={index} 
                button 
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <ListItemText primary={suggestion} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Extracted parameters display */}
      {isFocused && extractedParams && (
        <Paper 
          elevation={2} 
          sx={{ 
            mt: 1, 
            p: 1.5, 
            borderRadius: 2,
            background: 'rgba(247, 250, 252, 0.95)'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            I understand you're looking for:
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {extractedParams.skills.length > 0 && extractedParams.skills.map((skill, index) => (
              <Chip 
                key={index} 
                icon={<SkillIcon fontSize="small" />} 
                label={skill} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            ))}
            
            {extractedParams.jobType && (
              <Chip 
                icon={<JobTypeIcon fontSize="small" />} 
                label={extractedParams.jobType} 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
            )}
            
            {extractedParams.location && (
              <Chip 
                icon={<LocationIcon fontSize="small" />} 
                label={extractedParams.location} 
                size="small" 
                color="info" 
                variant="outlined" 
              />
            )}
            
            {extractedParams.budget && (
              <Chip 
                icon={<BudgetIcon fontSize="small" />} 
                label={`${extractedParams.budget.minBudget ? '≥ $' + extractedParams.budget.minBudget : ''}${extractedParams.budget.maxBudget ? ' ≤ $' + extractedParams.budget.maxBudget : ''}`} 
                size="small" 
                color="success" 
                variant="outlined" 
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              size="small" 
              onClick={handleSearch}
              endIcon={<SearchIcon fontSize="small" />}
            >
              Search
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default NaturalLanguageSearch; 