import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { getApiBaseUrl } from '../../../config/environment';
import { useAuth } from '../../../modules/auth/contexts/AuthContext';

// Use centralized API base (defaults to '/api') to ensure requests go through the gateway
const getApiUrl = async () => {
  try {
    return await getApiBaseUrl();
  } catch (error) {
    console.warn('Failed to get API base URL, using fallback:', error);
    return '/api';
  }
};

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`skills-admin-tabpanel-${index}`}
      aria-labelledby={`skills-admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SkillsAssessmentManagement = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
          Skills Assessment Management
        </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<AssessmentIcon />} />
          <Tab label="Test Management" icon={<SchoolIcon />} />
          <Tab label="Analytics" icon={<AssessmentIcon />} />
        </Tabs>

        <Divider sx={{ my: 2 }} />

      <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assessment Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tests: {tests.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Tests: 0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No recent activity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Manage Assessment Tests
            </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
              disabled={loading}
          >
              Create New Test
          </Button>
        </Box>
        
        {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                    <TableCell>Test Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                  {tests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No assessment tests found. Create your first test to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>{test.title}</TableCell>
                        <TableCell>
                          <Chip label={test.category} size="small" />
                        </TableCell>
                        <TableCell>{test.questions?.length || 0}</TableCell>
                    <TableCell>
                      <Chip
                            label={test.status || 'Draft'} 
                            color={test.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                        <TableCell align="center">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                    </TableCell>
                  </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Assessment Analytics
          </Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                  <Typography variant="h6" color="primary">
                    0
                </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Assessments Taken
                </Typography>
              </CardContent>
            </Card>
          </Grid>
            <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                  <Typography variant="h6" color="primary">
                    0%
                </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Success Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
            <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                  <Typography variant="h6" color="primary">
                    0
                </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
              </Paper>
    </Container>
  );
};

export default SkillsAssessmentManagement; 