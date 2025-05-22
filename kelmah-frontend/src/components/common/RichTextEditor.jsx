import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Toolbar,
  IconButton,
  Tooltip,
  Divider,
  Typography,
  Menu,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Code,
  Link as LinkIcon,
  TableChart,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  InsertPhoto,
  FormatSize,
  TextFields
} from '@mui/icons-material';

const RichTextEditor = ({ value, onChange, readOnly = false, placeholder = 'Enter text here...' }) => {
  const editorRef = useRef(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [headingAnchorEl, setHeadingAnchorEl] = useState(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleEditorChange = () => {
    if (editorRef.current && onChange && !readOnly) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    handleEditorChange();
    editorRef.current.focus();
  };

  const handleLinkDialogOpen = () => {
    if (readOnly) return;
    const selection = window.getSelection();
    if (selection.toString()) {
      setLinkText(selection.toString());
    }
    setLinkDialogOpen(true);
  };

  const insertLink = () => {
    if (!linkUrl) return;
    
    const selectedText = window.getSelection().toString();
    const text = linkText || selectedText || linkUrl;
    
    execCommand('insertHTML', `<a href="${linkUrl}" target="_blank">${text}</a>`);
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleHeadingMenuOpen = (event) => {
    if (readOnly) return;
    setHeadingAnchorEl(event.currentTarget);
  };

  const handleHeadingMenuClose = () => {
    setHeadingAnchorEl(null);
  };

  const applyHeading = (tag) => {
    execCommand('formatBlock', tag);
    handleHeadingMenuClose();
  };

  // Insert an example variable placeholder
  const insertVariable = () => {
    if (readOnly) return;
    execCommand('insertHTML', '<span style="background-color: #f0f8ff; padding: 0 4px; border-radius: 4px;">{{variableName}}</span>');
  };

  return (
    <Box sx={{ border: readOnly ? 'none' : '1px solid rgba(0, 0, 0, 0.23)', borderRadius: 1 }}>
      {!readOnly && (
        <>
          <Toolbar variant="dense" sx={{ overflowX: 'auto', minHeight: 'auto' }}>
            <Tooltip title="Bold">
              <IconButton size="small" onClick={() => execCommand('bold')}>
                <FormatBold fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton size="small" onClick={() => execCommand('italic')}>
                <FormatItalic fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline">
              <IconButton size="small" onClick={() => execCommand('underline')}>
                <FormatUnderlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            <Tooltip title="Heading">
              <IconButton size="small" onClick={handleHeadingMenuOpen}>
                <FormatSize fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={headingAnchorEl}
              open={Boolean(headingAnchorEl)}
              onClose={handleHeadingMenuClose}
            >
              <MenuItem onClick={() => applyHeading('h1')}>
                <Typography variant="h6">Heading 1</Typography>
              </MenuItem>
              <MenuItem onClick={() => applyHeading('h2')}>
                <Typography variant="subtitle1">Heading 2</Typography>
              </MenuItem>
              <MenuItem onClick={() => applyHeading('h3')}>
                <Typography variant="subtitle2">Heading 3</Typography>
              </MenuItem>
              <MenuItem onClick={() => applyHeading('p')}>
                <Typography variant="body1">Normal</Typography>
              </MenuItem>
            </Menu>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            <Tooltip title="Bullet List">
              <IconButton size="small" onClick={() => execCommand('insertUnorderedList')}>
                <FormatListBulleted fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
              <IconButton size="small" onClick={() => execCommand('insertOrderedList')}>
                <FormatListNumbered fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Quote">
              <IconButton size="small" onClick={() => execCommand('formatBlock', 'blockquote')}>
                <FormatQuote fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            <Tooltip title="Align Left">
              <IconButton size="small" onClick={() => execCommand('justifyLeft')}>
                <FormatAlignLeft fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Center">
              <IconButton size="small" onClick={() => execCommand('justifyCenter')}>
                <FormatAlignCenter fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Right">
              <IconButton size="small" onClick={() => execCommand('justifyRight')}>
                <FormatAlignRight fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Justify">
              <IconButton size="small" onClick={() => execCommand('justifyFull')}>
                <FormatAlignJustify fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            <Tooltip title="Insert Link">
              <IconButton size="small" onClick={handleLinkDialogOpen}>
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Insert Variable">
              <IconButton 
                size="small" 
                onClick={insertVariable}
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 'bold' 
                }}
              >
                <TextFields fontSize="small" />
              </IconButton>
            </Tooltip>
          </Toolbar>
          <Divider />
        </>
      )}
      
      <Box
        ref={editorRef}
        contentEditable={!readOnly}
        sx={{
          p: 2,
          minHeight: '200px',
          maxHeight: '500px',
          overflowY: 'auto',
          outline: 'none',
          '&:empty:before': {
            content: `"${placeholder}"`,
            color: 'text.disabled',
            display: 'block'
          },
          '& blockquote': {
            borderLeft: '3px solid #ccc',
            margin: '1.5em 10px',
            padding: '0.5em 10px'
          },
          '& img': {
            maxWidth: '100%'
          }
        }}
        onInput={handleEditorChange}
        onBlur={handleEditorChange}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      
      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
        <DialogTitle>Insert Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="URL"
            type="url"
            fullWidth
            variant="outlined"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Text"
            type="text"
            fullWidth
            variant="outlined"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={insertLink} variant="contained" disabled={!linkUrl}>
            Insert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  placeholder: PropTypes.string
};

export default RichTextEditor; 