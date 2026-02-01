import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Description as TemplateIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Build as BuildIcon,
  Plumbing as PlumbingIcon,
  Electrical as ElectricalIcon,
  Carpenter as CarpenterIcon,
  FormatPaint as PaintIcon,
  CleaningServices as CleaningIcon,
  Security as SecurityIcon,
  Landscape as GardeningIcon,
  Construction as MasonryIcon,
  ExpandMore as ExpandMoreIcon,
  FileCopy as CopyIcon,
  Star as StarIcon,
  Gavel as LegalIcon,
  LocationOn as LocationIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Contract Template Manager for Ghana Trade Services
 * Features: Predefined templates, customization, legal compliance, Ghana-specific clauses
 */
const ContractTemplateManager = ({
  onSelectTemplate,
  onCreateContract,
  currentUser,
  jobType = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [customFields, setCustomFields] = useState({});

  // Ghana trade categories with icons
  const tradeCategories = {
    plumbing: {
      label: 'Plumbing',
      icon: PlumbingIcon,
      color: '#2196F3',
      description: 'Water supply, drainage, pipe installation',
    },
    electrical: {
      label: 'Electrical',
      icon: ElectricalIcon,
      color: '#FF9800',
      description: 'Wiring, installations, electrical repairs',
    },
    carpentry: {
      label: 'Carpentry',
      icon: CarpenterIcon,
      color: '#8BC34A',
      description: 'Furniture, doors, windows, custom woodwork',
    },
    painting: {
      label: 'Painting',
      icon: PaintIcon,
      color: '#E91E63',
      description: 'Interior, exterior, decorative painting',
    },
    cleaning: {
      label: 'Cleaning',
      icon: CleaningIcon,
      color: '#00BCD4',
      description: 'House cleaning, office cleaning, deep cleaning',
    },
    security: {
      label: 'Security',
      icon: SecurityIcon,
      color: '#9C27B0',
      description: 'Security installations, CCTV, alarm systems',
    },
    gardening: {
      label: 'Gardening',
      icon: GardeningIcon,
      color: '#4CAF50',
      description: 'Landscaping, lawn care, garden maintenance',
    },
    masonry: {
      label: 'Masonry',
      icon: MasonryIcon,
      color: '#795548',
      description: 'Brick work, concrete, construction',
    },
  };

  // Predefined contract templates for Ghana trades
  const contractTemplates = useMemo(
    () => [
      {
        id: 'plumbing-basic',
        name: 'Basic Plumbing Services',
        category: 'plumbing',
        description: 'Standard contract for plumbing repairs and installations',
        isPopular: true,
        estimatedDuration: '1-3 days',
        priceRange: '₵200 - ₵2,000',
        features: [
          'Water supply installation',
          'Drainage repairs',
          'Pipe replacement',
          'Fixture installation',
          '30-day warranty',
        ],
        legalClauses: [
          'Ghana Water Company compliance',
          'Local building permit requirements',
          'Environmental protection standards',
        ],
        template: {
          title: 'Plumbing Services Agreement',
          scope: `This agreement covers professional plumbing services including:
- Assessment and diagnosis of plumbing issues
- Installation of water supply systems
- Repair and replacement of pipes and fixtures
- Drainage system maintenance and repair
- Compliance with Ghana Water Company regulations`,

          terms: `1. SCOPE OF WORK
The Contractor agrees to provide plumbing services as specified in the project description, in accordance with Ghana's building codes and water authority regulations.

2. MATERIALS AND EQUIPMENT
All materials shall be of good quality and suitable for use in Ghana's climate conditions. Materials must comply with Ghana Standards Authority specifications.

3. WARRANTIES
The Contractor warrants all work for a period of thirty (30) days from completion date. Materials are warranted according to manufacturer specifications.

4. PERMITS AND COMPLIANCE
The Contractor shall obtain all necessary permits and ensure compliance with:
- Ghana Water Company regulations
- Local municipal building codes
- Environmental Protection Agency standards

5. PAYMENT TERMS
Payment shall be made according to the milestone schedule. Final payment is due within 7 days of project completion and client approval.

6. LIABILITY AND INSURANCE
The Contractor maintains appropriate insurance coverage and shall be liable for damages caused by negligent work.`,

          ghanaSpecific: `GHANA-SPECIFIC PROVISIONS:
- All work must comply with Ghana Building Code
- Water quality standards as per Ghana Water Company
- Waste disposal according to EPA Ghana regulations
- Use of certified plumbers with Ghana Institute of Plumbers certification preferred
- Emergency contact for Ghana Water Company: 0302-676611`,
        },
      },

      {
        id: 'electrical-residential',
        name: 'Residential Electrical Work',
        category: 'electrical',
        description:
          'Comprehensive electrical services for homes and apartments',
        isPopular: true,
        estimatedDuration: '2-5 days',
        priceRange: '₵300 - ₵5,000',
        features: [
          'Wiring installation',
          'Circuit breaker setup',
          'Lighting installation',
          'Socket and switch installation',
          '60-day warranty',
        ],
        legalClauses: [
          'ECG (Electricity Company Ghana) compliance',
          'Electrical safety standards',
          'Fire safety regulations',
        ],
        template: {
          title: 'Residential Electrical Services Agreement',
          scope: `Professional electrical services including:
- Electrical system assessment and design
- Wiring installation and repairs
- Circuit breaker and panel installation
- Lighting and fixture installation
- Safety inspections and testing`,

          terms: `1. ELECTRICAL SAFETY
All electrical work shall be performed in accordance with Ghana's electrical safety codes and ECG (Electricity Company Ghana) standards.

2. MATERIALS CERTIFICATION
All electrical materials must be approved for use in Ghana and bear appropriate safety certifications.

3. TESTING AND INSPECTION
Upon completion, all electrical work will be tested for safety and compliance before final handover.

4. POWER DISCONNECTION
The Contractor will coordinate with ECG for any required power disconnections and reconnections.

5. EMERGENCY PROCEDURES
In case of electrical emergencies, the Contractor provides 24-hour emergency contact service for 30 days post-completion.`,

          ghanaSpecific: `GHANA ELECTRICAL PROVISIONS:
- Compliance with Ghana Grid Company standards
- ECG meter installation requirements
- Use of surge protection suitable for Ghana's power grid
- Emergency contact: ECG fault reporting 0302-611611
- Fire Service emergency: 192`,
        },
      },

      {
        id: 'carpentry-custom',
        name: 'Custom Carpentry & Furniture',
        category: 'carpentry',
        description: 'Bespoke furniture and carpentry work',
        isPopular: false,
        estimatedDuration: '1-3 weeks',
        priceRange: '₵500 - ₵10,000',
        features: [
          'Custom furniture design',
          'Door and window installation',
          'Built-in storage solutions',
          'Wood finishing',
          '90-day warranty',
        ],
        legalClauses: [
          'Timber sourcing compliance',
          'Quality craftsmanship standards',
          'Environmental sustainability',
        ],
        template: {
          title: 'Custom Carpentry Services Agreement',
          scope: `Specialized carpentry services including:
- Custom furniture design and construction
- Door and window installation
- Built-in storage and shelving
- Wood restoration and finishing
- Repair and maintenance services`,

          terms: `1. DESIGN AND SPECIFICATIONS
Detailed drawings and specifications will be provided and approved before work begins.

2. WOOD QUALITY AND SOURCING
All timber used shall be properly seasoned and suitable for Ghana's climate. Preference for sustainably sourced wood.

3. CRAFTSMANSHIP WARRANTY
All carpentry work is warranted for 90 days against defects in workmanship.

4. TERMITE PROTECTION
Wood treatment for termite resistance is included where applicable.

5. CLIMATE CONSIDERATIONS
All wood finishes and treatments shall be suitable for Ghana's tropical climate conditions.`,

          ghanaSpecific: `GHANA CARPENTRY PROVISIONS:
- Compliance with Forestry Commission regulations
- Use of termite-resistant treatments suitable for Ghana
- Consideration for humid tropical climate
- Local wood species preferences (e.g., Mahogany, Wawa, Odum)
- Forestry Commission contact: 0302-401645`,
        },
      },

      {
        id: 'painting-comprehensive',
        name: 'Interior & Exterior Painting',
        category: 'painting',
        description:
          'Complete painting services for residential and commercial properties',
        isPopular: true,
        estimatedDuration: '3-7 days',
        priceRange: '₵400 - ₵3,000',
        features: [
          'Surface preparation',
          'Interior painting',
          'Exterior weatherproofing',
          'Color consultation',
          '45-day warranty',
        ],
        legalClauses: [
          'Paint quality standards',
          'Environmental safety',
          'Property protection',
        ],
        template: {
          title: 'Professional Painting Services Agreement',
          scope: `Complete painting services including:
- Surface preparation and priming
- Interior wall and ceiling painting
- Exterior facade painting
- Color consultation and design advice
- Clean-up and property protection`,

          terms: `1. SURFACE PREPARATION
All surfaces will be properly cleaned, sanded, and primed before painting.

2. PAINT QUALITY
Only high-quality paints suitable for Ghana's climate will be used, with appropriate UV and moisture resistance.

3. COLOR MATCHING
Color consultation included to ensure optimal results and client satisfaction.

4. WEATHER CONDITIONS
Exterior painting will only be performed during suitable weather conditions.

5. PROPERTY PROTECTION
All furniture and property will be properly protected during painting work.`,

          ghanaSpecific: `GHANA PAINTING PROVISIONS:
- Use of paints suitable for tropical climate
- Anti-fungal and mildew-resistant formulations
- Consideration for harmattan season painting restrictions
- UV-resistant exterior paints for intense sun exposure
- Environmental compliance with EPA Ghana standards`,
        },
      },

      {
        id: 'cleaning-deep',
        name: 'Deep Cleaning Services',
        category: 'cleaning',
        description: 'Thorough cleaning for homes and offices',
        isPopular: false,
        estimatedDuration: '1-2 days',
        priceRange: '₵150 - ₵800',
        features: [
          'Deep sanitization',
          'Floor and carpet cleaning',
          'Window cleaning',
          'Bathroom disinfection',
          'Satisfaction guarantee',
        ],
        legalClauses: [
          'Health and safety standards',
          'Property security',
          'Chemical safety compliance',
        ],
        template: {
          title: 'Professional Cleaning Services Agreement',
          scope: `Comprehensive cleaning services including:
- Deep cleaning and sanitization
- Floor, carpet, and upholstery cleaning
- Window and glass surface cleaning
- Bathroom and kitchen deep cleaning
- Waste removal and disposal`,

          terms: `1. CLEANING STANDARDS
All cleaning will be performed to professional standards using appropriate equipment and materials.

2. HEALTH AND SAFETY
EPA-approved cleaning products will be used, safe for humans and pets.

3. PROPERTY ACCESS
Secure access arrangements and key handling procedures will be established.

4. SATISFACTION GUARANTEE
If not satisfied with cleaning quality, we will return to address issues at no additional cost.

5. INSURANCE COVERAGE
Fully insured service with liability coverage for any accidental damage.`,

          ghanaSpecific: `GHANA CLEANING PROVISIONS:
- Use of locally available, environmentally friendly products
- Compliance with Ghana Health Service hygiene standards
- Proper waste disposal according to local regulations
- Consideration for malaria prevention (standing water removal)
- Emergency health contact: Ghana Health Service 0302-681109`,
        },
      },

      {
        id: 'security-installation',
        name: 'Security System Installation',
        category: 'security',
        description: 'CCTV, alarms, and security system setup',
        isPopular: false,
        estimatedDuration: '1-3 days',
        priceRange: '₵800 - ₵8,000',
        features: [
          'CCTV camera installation',
          'Alarm system setup',
          'Access control systems',
          'Remote monitoring',
          '12-month warranty',
        ],
        legalClauses: [
          'Privacy protection compliance',
          'Data security standards',
          'Equipment warranty terms',
        ],
        template: {
          title: 'Security System Installation Agreement',
          scope: `Professional security services including:
- CCTV camera system design and installation
- Burglar alarm system setup
- Access control and intercom systems
- Remote monitoring configuration
- Training on system operation`,

          terms: `1. SYSTEM DESIGN
Security system design will be customized based on property assessment and client requirements.

2. EQUIPMENT WARRANTY
All equipment comes with manufacturer warranty, with local support available.

3. INSTALLATION STANDARDS
Installation follows international security standards and local building codes.

4. MONITORING SERVICES
Optional 24/7 monitoring services available with local security response.

5. MAINTENANCE SUPPORT
Regular maintenance schedule available to ensure optimal system performance.`,

          ghanaSpecific: `GHANA SECURITY PROVISIONS:
- Compliance with Ghana Police Service guidelines
- CCTV placement respecting neighbor privacy laws
- Integration with local security response services
- Backup power systems for frequent power outages
- Police emergency contact: 191`,
        },
      },
    ],
    [],
  );

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return contractTemplates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        template.description.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || template.category === categoryFilter;
      const matchesJobType = !jobType || template.category === jobType;

      return matchesSearch && matchesCategory && matchesJobType;
    });
  }, [contractTemplates, searchFilter, categoryFilter, jobType]);

  // Handle template selection
  const selectTemplate = useCallback(
    (template) => {
      setSelectedTemplate(template);
      if (onSelectTemplate) {
        onSelectTemplate(template);
      }
    },
    [onSelectTemplate],
  );

  // Handle template customization
  const customizeTemplate = useCallback(
    (template) => {
      setSelectedTemplate(template);
      setCustomFields({
        clientName: '',
        workerName: currentUser?.name || '',
        projectLocation: '',
        startDate: '',
        completionDate: '',
        totalAmount: '',
        depositAmount: '',
        specialInstructions: '',
      });
      setCustomizeOpen(true);
    },
    [currentUser],
  );

  // Create contract from template
  const createContractFromTemplate = useCallback(() => {
    if (!selectedTemplate) return;

    const contractData = {
      templateId: selectedTemplate.id,
      template: selectedTemplate,
      customFields,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };

    if (onCreateContract) {
      onCreateContract(contractData);
    }

    setCustomizeOpen(false);
    console.log('Contract created from template:', contractData);
  }, [selectedTemplate, customFields, onCreateContract]);

  // Render template card
  const renderTemplateCard = useCallback(
    (template) => {
      const category = tradeCategories[template.category];
      const CategoryIcon = category.icon;

      return (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -4 }}
        >
          <Card
            elevation={3}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              border:
                selectedTemplate?.id === template.id
                  ? '2px solid #FFD700'
                  : '1px solid rgba(255,215,0,0.2)',
              background:
                'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.95) 100%)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 32px rgba(255,215,0,0.2)',
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => selectTemplate(template)}
          >
            {/* Popular Badge */}
            {template.isPopular && (
              <Chip
                label="Popular"
                size="small"
                icon={<StarIcon />}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: '#FFD700',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '10px',
                  zIndex: 1,
                }}
              />
            )}

            <CardContent sx={{ flex: 1, pb: 1 }}>
              {/* Header */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: category.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <CategoryIcon />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: '#FFD700', mb: 0.5 }}
                  >
                    {template.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: category.color, fontWeight: 600 }}
                  >
                    {category.label}
                  </Typography>
                </Box>
              </Stack>

              {/* Description */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, lineHeight: 1.5 }}
              >
                {template.description}
              </Typography>

              {/* Details */}
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ScheduleIcon
                    sx={{ fontSize: 16, color: 'text.secondary' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Duration: {template.estimatedDuration}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <AttachMoneyIcon
                    sx={{ fontSize: 16, color: 'text.secondary' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Range: {template.priceRange}
                  </Typography>
                </Stack>
              </Stack>

              {/* Features */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: '#FFD700',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Key Features:
                </Typography>
                <Stack spacing={0.5}>
                  {template.features.slice(0, 3).map((feature, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <CheckIcon sx={{ fontSize: 12, color: '#4CAF50' }} />
                      <Typography variant="caption" color="text.secondary">
                        {feature}
                      </Typography>
                    </Stack>
                  ))}
                  {template.features.length > 3 && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                    >
                      +{template.features.length - 3} more features
                    </Typography>
                  )}
                </Stack>
              </Box>

              {/* Legal Compliance */}
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1 }}
                >
                  <LegalIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: '#4CAF50' }}
                  >
                    Ghana Legal Compliance
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Includes {template.legalClauses.length} specific legal clauses
                  for Ghana
                </Typography>
              </Box>
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTemplate(template);
                  setPreviewOpen(true);
                }}
                sx={{
                  borderColor: 'rgba(255,215,0,0.5)',
                  color: '#FFD700',
                  flex: 1,
                }}
              >
                Preview
              </Button>

              <Button
                size="small"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  customizeTemplate(template);
                }}
                sx={{
                  background:
                    'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                  color: '#000',
                  fontWeight: 700,
                  flex: 1,
                }}
              >
                Use Template
              </Button>
            </CardActions>
          </Card>
        </motion.div>
      );
    },
    [selectedTemplate, selectTemplate, customizeTemplate],
  );

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          background:
            'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ color: '#FFD700', fontWeight: 700, mb: 1 }}
            >
              Contract Templates
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Professional contract templates designed for Ghana's trade
              services
            </Typography>
          </Box>

          <TemplateIcon sx={{ fontSize: 48, color: '#FFD700', opacity: 0.7 }} />
        </Stack>

        {/* Search and Filters */}
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          sx={{ mt: 3 }}
        >
          <TextField
            placeholder="Search templates..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {Object.entries(tradeCategories).map(([key, category]) => (
                <MenuItem key={key} value={key}>
                  {category.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Category Overview */}
      <Paper
        elevation={1}
        sx={{ p: 2, mb: 3, backgroundColor: 'rgba(255,255,255,0.02)' }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, color: '#FFD700' }}>
          Available Categories ({Object.keys(tradeCategories).length})
        </Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
          {Object.entries(tradeCategories).map(([key, category]) => {
            const CategoryIcon = category.icon;
            const count = contractTemplates.filter(
              (t) => t.category === key,
            ).length;

            return (
              <Chip
                key={key}
                icon={<CategoryIcon />}
                label={`${category.label} (${count})`}
                onClick={() =>
                  setCategoryFilter(categoryFilter === key ? 'all' : key)
                }
                color={categoryFilter === key ? 'primary' : 'default'}
                sx={{
                  backgroundColor:
                    categoryFilter === key
                      ? category.color
                      : 'rgba(255,255,255,0.1)',
                  color: categoryFilter === key ? '#000' : '#fff',
                  fontWeight: 600,
                  minWidth: 'fit-content',
                  '&:hover': {
                    backgroundColor:
                      categoryFilter === key
                        ? category.color
                        : 'rgba(255,255,255,0.2)',
                  },
                }}
              />
            );
          })}
        </Stack>
      </Paper>

      {/* Templates Grid */}
      <Grid container spacing={3}>
        <AnimatePresence>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} sm={6} lg={4} key={template.id}>
              {renderTemplateCard(template)}
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>

      {filteredTemplates.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        >
          <TemplateIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or category filter
          </Typography>
        </Paper>
      )}

      {/* Template Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,215,0,0.2)' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <PreviewIcon sx={{ color: '#FFD700' }} />
            <Box>
              <Typography
                variant="h6"
                sx={{ color: '#FFD700', fontWeight: 700 }}
              >
                {selectedTemplate?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contract Template Preview
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedTemplate && (
            <Box>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                <Tab label="Overview" />
                <Tab label="Terms & Conditions" />
                <Tab label="Ghana Provisions" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {activeTab === 0 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
                        {selectedTemplate.template.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}
                      >
                        {selectedTemplate.template.scope}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ color: '#FFD700', mb: 2 }}
                      >
                        Template Features
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedTemplate.features.map((feature, index) => (
                          <Grid item xs={12} sm={6} key={index}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <CheckIcon
                                sx={{ color: '#4CAF50', fontSize: 16 }}
                              />
                              <Typography variant="body2">{feature}</Typography>
                            </Stack>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ color: '#FFD700', mb: 2 }}
                      >
                        Legal Compliance
                      </Typography>
                      <Stack spacing={1}>
                        {selectedTemplate.legalClauses.map((clause, index) => (
                          <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <LegalIcon
                              sx={{ color: '#4CAF50', fontSize: 16 }}
                            />
                            <Typography variant="body2">{clause}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                )}

                {activeTab === 1 && (
                  <Typography
                    variant="body2"
                    sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}
                  >
                    {selectedTemplate.template.terms}
                  </Typography>
                )}

                {activeTab === 2 && (
                  <Stack spacing={2}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        These provisions ensure compliance with Ghana's legal
                        framework and local business practices.
                      </Typography>
                    </Alert>
                    <Typography
                      variant="body2"
                      sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}
                    >
                      {selectedTemplate.template.ghanaSpecific}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{ p: 3, borderTop: '1px solid rgba(255,215,0,0.2)' }}
        >
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setPreviewOpen(false);
              customizeTemplate(selectedTemplate);
            }}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
            }}
          >
            Use This Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Customization Dialog */}
      <Dialog
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,215,0,0.2)' }}>
          <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
            Customize Contract Template
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedTemplate?.name}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client Name"
                  value={customFields.clientName || ''}
                  onChange={(e) =>
                    setCustomFields((prev) => ({
                      ...prev,
                      clientName: e.target.value,
                    }))
                  }
                  placeholder="Enter client full name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Worker/Contractor Name"
                  value={customFields.workerName || ''}
                  onChange={(e) =>
                    setCustomFields((prev) => ({
                      ...prev,
                      workerName: e.target.value,
                    }))
                  }
                  placeholder="Enter contractor name"
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Project Location"
              value={customFields.projectLocation || ''}
              onChange={(e) =>
                setCustomFields((prev) => ({
                  ...prev,
                  projectLocation: e.target.value,
                }))
              }
              placeholder="e.g., East Legon, Accra"
              InputProps={{
                startAdornment: (
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={customFields.startDate || ''}
                  onChange={(e) =>
                    setCustomFields((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Expected Completion"
                  value={customFields.completionDate || ''}
                  onChange={(e) =>
                    setCustomFields((prev) => ({
                      ...prev,
                      completionDate: e.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Contract Amount (₵)"
                  value={customFields.totalAmount || ''}
                  onChange={(e) =>
                    setCustomFields((prev) => ({
                      ...prev,
                      totalAmount: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Deposit Amount (₵)"
                  value={customFields.depositAmount || ''}
                  onChange={(e) =>
                    setCustomFields((prev) => ({
                      ...prev,
                      depositAmount: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Special Instructions"
              value={customFields.specialInstructions || ''}
              onChange={(e) =>
                setCustomFields((prev) => ({
                  ...prev,
                  specialInstructions: e.target.value,
                }))
              }
              placeholder="Any additional requirements, specifications, or special conditions..."
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{ p: 3, borderTop: '1px solid rgba(255,215,0,0.2)' }}
        >
          <Button onClick={() => setCustomizeOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createContractFromTemplate}
            disabled={!customFields.clientName || !customFields.projectLocation}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
            }}
          >
            Create Contract
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractTemplateManager;
