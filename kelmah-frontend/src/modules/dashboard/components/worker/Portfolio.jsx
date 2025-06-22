import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  CardActionArea, 
  Button, 
  Collapse,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Chip,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import DashboardCard from '../common/DashboardCard';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import workersApi from '../../../../api/services/workersApi';

// Transition for dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Portfolio = () => {
  const [expanded, setExpanded] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch portfolio projects
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setIsLoading(true);
        const data = await workersApi.getPortfolioProjects();
        setProjects(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching portfolio projects:', err);
        setError('Failed to load portfolio projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, []);
  
  // Handle expand/collapse with animation
  const handleExpandToggle = () => {
    setExpanded(!expanded);
  };
  
  // Handle opening project details dialog
  const handleOpenProject = (project) => {
    setSelectedProject(project);
    setLoading(true);
    // Short loading for better UX
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };
  
  // Handle closing project dialog
  const handleCloseProject = () => {
    setSelectedProject(null);
  };
  
  if (isLoading) {
    return (
      <DashboardCard 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PhotoLibraryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">My Portfolio</Typography>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }
  
  if (error) {
    return (
      <DashboardCard 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PhotoLibraryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">My Portfolio</Typography>
          </Box>
        }
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      </DashboardCard>
    );
  }
  
  // Early return if no projects
  if (projects.length === 0) {
    return (
      <DashboardCard 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PhotoLibraryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">My Portfolio</Typography>
          </Box>
        }
      >
        <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
          No portfolio projects yet. Add some to showcase your work!
        </Typography>
      </DashboardCard>
    );
  }

  // Split projects into featured and others
  const featuredProject = projects[0];
  const otherProjects = projects.slice(1);
  
  return (
    <DashboardCard 
      title={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PhotoLibraryIcon sx={{ mr: 1 }} />
          <Typography variant="h6">My Portfolio</Typography>
        </Box>
      }
      action={
        <Button 
          onClick={handleExpandToggle}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          size="large"
          variant="outlined"
          sx={{ 
            borderRadius: '20px',
            px: 2,
            fontWeight: 'bold',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease'
          }}
        >
          {expanded ? 'Show Less' : 'Show More'}
        </Button>
      }
    >
      <Collapse in={expanded} timeout={300} unmountOnExit>
        {/* Featured Project */}
        <Card elevation={0} sx={{ mb: 2 }}>
          <CardActionArea onClick={() => handleOpenProject(featuredProject)}>
            <Grid container>
              <Grid item xs={12} md={4}>
                <CardMedia
                  component="img"
                  height="200"
                  image={featuredProject.imageUrl || 'https://via.placeholder.com/400x200?text=Featured+Project'}
                  alt={featuredProject.title}
                  sx={{ objectFit: 'cover' }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <CardContent>
                  <Typography variant="h6" component="div" fontWeight="bold">
                    {featuredProject.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {featuredProject.description}
                  </Typography>
                </CardContent>
              </Grid>
            </Grid>
          </CardActionArea>
        </Card>
        
        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {otherProjects.map((project, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardActionArea onClick={() => handleOpenProject(project)}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={project.imageUrl || `https://via.placeholder.com/300x140?text=Project+${index + 2}`}
                        alt={project.title}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                          {project.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {project.description.length > 100
                            ? `${project.description.substring(0, 100)}...`
                            : project.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Collapse>
      
      {/* Project Details Dialog */}
      <Dialog
        open={selectedProject !== null}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleCloseProject}
        maxWidth="md"
        fullWidth
      >
        {loading ? (
          <LinearProgress />
        ) : null}
        
        {selectedProject && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="div" fontWeight="bold">
                {selectedProject.title}
              </Typography>
              <IconButton onClick={handleCloseProject}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent>
              <CardMedia
                component="img"
                height="400"
                image={selectedProject.imageUrl || 'https://via.placeholder.com/800x400?text=Project+Image'}
                alt={selectedProject.title}
                sx={{ borderRadius: 1, mb: 2 }}
              />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" paragraph>
                  {selectedProject.description}
                  
                  {/* Additional details if available */}
                  {selectedProject.fullDescription && ` ${selectedProject.fullDescription}`}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  icon={<DateRangeIcon />} 
                  label={`Completed: ${selectedProject.completionDate || 'Not specified'}`} 
                />
                {selectedProject.clientSatisfaction && (
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label={`Client: ${selectedProject.clientSatisfaction}`} 
                    color="success" 
                  />
                )}
              </Box>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Skills Utilized
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedProject.skills ? (
                  selectedProject.skills.map((skill, index) => (
                    <Chip key={index} label={skill} />
                  ))
                ) : (
                  <>
                    <Chip label="Carpentry" />
                    <Chip label="Design" />
                    <Chip label="Material Selection" />
                  </>
                )}
              </Box>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseProject}>Close</Button>
              <Button variant="contained">Contact for Similar Work</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </DashboardCard>
  );
};

Portfolio.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    }),
  ),
};

export default Portfolio; 