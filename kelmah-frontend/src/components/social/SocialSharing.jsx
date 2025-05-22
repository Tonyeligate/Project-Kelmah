import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Twitter, 
  LinkedIn, 
  WhatsApp 
} from '@mui/icons-material';

const socialPlatforms = [
  {
    name: 'Facebook',
    icon: Facebook,
    color: '#1877f2',
    shareUrl: (url, title) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
  },
  {
    name: 'Twitter',
    icon: Twitter,
    color: '#1da1f2',
    shareUrl: (url, title) => 
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: 'LinkedIn',
    icon: LinkedIn,
    color: '#0077b5',
    shareUrl: (url, title) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    icon: WhatsApp,
    color: '#25d366',
    shareUrl: (url, title) => 
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
];

export const SocialSharing = ({ url, title }) => {
  const handleShare = (platform) => {
    window.open(
      platform.shareUrl(url, title),
      '_blank',
      'width=600,height=400'
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
      {socialPlatforms.map((platform) => (
        <motion.div
          key={platform.name}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Tooltip title={`Share on ${platform.name}`}>
            <IconButton
              onClick={() => handleShare(platform)}
              sx={{
                color: platform.color,
                '&:hover': {
                  background: `${platform.color}20`,
                },
              }}
            >
              <platform.icon />
            </IconButton>
          </Tooltip>
        </motion.div>
      ))}
    </Box>
  );
}; 