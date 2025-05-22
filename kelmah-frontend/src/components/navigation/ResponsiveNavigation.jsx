import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const menuItems = [
  { title: 'Home', path: '/' },
  { title: 'Projects', path: '/projects' },
  { title: 'About', path: '/about' },
  { title: 'Contact', path: '/contact' },
];

export const ResponsiveNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const menuVariants = {
    closed: {
      x: '-100%',
    },
    open: {
      x: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    closed: { x: -20, opacity: 0 },
    open: { x: 0, opacity: 1 },
  };

  return (
    <>
      <AppBar position="fixed" sx={{ background: 'rgba(28, 28, 28, 0.9)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {!isMobile && (
            <motion.div style={{ display: 'flex', gap: '20px' }}>
              {menuItems.map((item) => (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.title}
                </motion.div>
              ))}
            </motion.div>
          )}
        </Toolbar>
      </AppBar>

      <AnimatePresence>
        {isMobile && (
          <Drawer
            anchor="left"
            open={isOpen}
            onClose={toggleDrawer}
            PaperProps={{
              sx: {
                background: 'rgba(28, 28, 28, 0.95)',
                backdropFilter: 'blur(10px)',
                width: 250,
              },
            }}
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
            >
              <IconButton
                sx={{ position: 'absolute', right: 8, top: 8 }}
                onClick={toggleDrawer}
              >
                <CloseIcon />
              </IconButton>
              
              <List>
                {menuItems.map((item) => (
                  <motion.div key={item.path} variants={itemVariants}>
                    <ListItem button>
                      <ListItemText primary={item.title} />
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            </motion.div>
          </Drawer>
        )}
      </AnimatePresence>
    </>
  );
}; 