const ContractTemplate = require('../models/ContractTemplate');

/**
 * Seed Contract Templates for Ghana Trade Services
 * Populates the database with predefined, legally-compliant contract templates
 */

const predefinedTemplates = [
  {
    name: 'Basic Plumbing Services',
    description: 'Standard contract for plumbing repairs and installations in Ghana',
    category: 'plumbing',
    isPopular: true,
    isPredefined: true,
    estimatedDuration: '1-3 days',
    priceRange: {
      min: 200,
      max: 2000,
      currency: 'GHS'
    },
    
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
The Contractor maintains appropriate insurance coverage and shall be liable for damages caused by negligent work.

7. TERMINATION
Either party may terminate this agreement with 48 hours written notice. Payment for work completed shall be made within 7 days of termination.

8. DISPUTE RESOLUTION
Any disputes shall be resolved through mediation in accordance with Ghana's Alternative Dispute Resolution Act, 2010.`,

      ghanaSpecific: `GHANA-SPECIFIC PROVISIONS:
- All work must comply with Ghana Building Code
- Water quality standards as per Ghana Water Company
- Waste disposal according to EPA Ghana regulations
- Use of certified plumbers with Ghana Institute of Plumbers certification preferred
- Emergency contact for Ghana Water Company: 0302-676611
- In case of water supply disruption, Ghana Water Company must be notified immediately
- All materials must be suitable for Ghana's tropical climate and water conditions`,

      paymentTerms: `PAYMENT SCHEDULE:
- 30% deposit upon signing contract
- 40% upon completion of 50% of work
- 30% upon project completion and final inspection
- Payment methods: Bank transfer, Mobile Money (MTN, Vodafone, AirtelTigo), Cash
- All payments in Ghana Cedis (GHS)`,

      warrantyTerms: `WARRANTY PROVISIONS:
- 30-day warranty on all workmanship
- Manufacturer warranty on all materials
- Emergency callback service for 7 days post-completion
- Free minor adjustments within warranty period`
    },
    
    features: [
      'Water supply installation',
      'Drainage repairs',
      'Pipe replacement',
      'Fixture installation',
      '30-day warranty',
      'Emergency callback service',
      'Ghana Water Company compliance'
    ],
    
    legalClauses: [
      'Ghana Water Company compliance',
      'Local building permit requirements',
      'Environmental protection standards',
      'Ghana Institute of Plumbers certification'
    ],
    
    defaultDeliverables: [
      {
        name: 'Site assessment report',
        description: 'Detailed assessment of plumbing requirements and current condition',
        isRequired: true
      },
      {
        name: 'Work timeline and schedule',
        description: 'Project timeline with milestones and completion dates',
        isRequired: true
      },
      {
        name: 'Materials list and receipts',
        description: 'Complete list of materials used with purchase receipts',
        isRequired: true
      },
      {
        name: 'Pressure test results',
        description: 'Water pressure testing results for new installations',
        isRequired: false
      },
      {
        name: 'Installation photographs',
        description: 'Before and after photos of completed work',
        isRequired: false
      }
    ],
    
    defaultMilestones: [
      {
        title: 'Site Assessment',
        description: 'Complete assessment and planning',
        percentage: 20,
        order: 1
      },
      {
        title: 'Material Procurement',
        description: 'Purchase and delivery of materials',
        percentage: 30,
        order: 2
      },
      {
        title: 'Installation Work',
        description: 'Main plumbing work and installation',
        percentage: 40,
        order: 3
      },
      {
        title: 'Testing and Completion',
        description: 'Final testing and project handover',
        percentage: 10,
        order: 4
      }
    ],
    
    ghanaCompliance: {
      hasGhanaLegalReview: true,
      applicableLaws: [
        'Ghana Building Code',
        'Environmental Protection Agency Act',
        'Ghana Water Company Regulations'
      ],
      requiredPermits: [
        {
          permitName: 'Plumbing Work Permit',
          issuingAuthority: 'Local Municipal Assembly',
          isRequired: true
        }
      ],
      emergencyContacts: [
        {
          service: 'Ghana Water Company',
          number: '0302-676611',
          description: 'Water supply emergencies'
        },
        {
          service: 'Fire Service',
          number: '192',
          description: 'Fire emergencies'
        }
      ]
    },
    
    tags: ['plumbing', 'water', 'pipes', 'drainage', 'repairs', 'installation'],
    approvalStatus: 'approved'
  },

  {
    name: 'Residential Electrical Work',
    description: 'Comprehensive electrical services for homes and apartments in Ghana',
    category: 'electrical',
    isPopular: true,
    isPredefined: true,
    estimatedDuration: '2-5 days',
    priceRange: {
      min: 300,
      max: 5000,
      currency: 'GHS'
    },
    
    template: {
      title: 'Residential Electrical Services Agreement',
      scope: `Professional electrical services including:
- Electrical system assessment and design
- Wiring installation and repairs
- Circuit breaker and panel installation
- Lighting and fixture installation
- Safety inspections and testing
- ECG (Electricity Company Ghana) compliance`,
      
      terms: `1. ELECTRICAL SAFETY
All electrical work shall be performed in accordance with Ghana's electrical safety codes and ECG (Electricity Company Ghana) standards.

2. MATERIALS CERTIFICATION
All electrical materials must be approved for use in Ghana and bear appropriate safety certifications from Ghana Standards Authority.

3. TESTING AND INSPECTION
Upon completion, all electrical work will be tested for safety and compliance before final handover.

4. POWER DISCONNECTION
The Contractor will coordinate with ECG for any required power disconnections and reconnections.

5. EMERGENCY PROCEDURES
In case of electrical emergencies, the Contractor provides 24-hour emergency contact service for 30 days post-completion.

6. CODE COMPLIANCE
All work must comply with Ghana's National Building Code and IEE (Institute of Electrical Engineers) standards.

7. LOAD CALCULATIONS
Proper load calculations will be performed to ensure electrical system capacity meets current and future needs.`,

      ghanaSpecific: `GHANA ELECTRICAL PROVISIONS:
- Compliance with Ghana Grid Company standards
- ECG meter installation requirements
- Use of surge protection suitable for Ghana's power grid
- Emergency contact: ECG fault reporting 0302-611611
- Fire Service emergency: 192
- All installations must account for frequent power outages in Ghana
- Backup power considerations for essential circuits
- Use of electrical components rated for tropical climate conditions`,

      paymentTerms: `PAYMENT SCHEDULE:
- 40% deposit upon signing contract
- 35% upon completion of rough electrical work
- 25% upon final testing and ECG approval
- Payments accepted via Mobile Money, bank transfer, or cash
- All amounts in Ghana Cedis (GHS)`,

      warrantyTerms: `ELECTRICAL WARRANTY:
- 60-day warranty on all electrical workmanship
- Manufacturer warranty on all electrical components
- 24-hour emergency service for first 30 days
- Free safety inspections within warranty period`
    },
    
    features: [
      'Wiring installation',
      'Circuit breaker setup',
      'Lighting installation',
      'Socket and switch installation',
      '60-day warranty',
      'ECG compliance',
      'Emergency service support'
    ],
    
    legalClauses: [
      'ECG (Electricity Company Ghana) compliance',
      'Electrical safety standards',
      'Fire safety regulations',
      'Ghana Standards Authority certification'
    ],
    
    defaultMilestones: [
      {
        title: 'Electrical Design',
        description: 'Circuit design and planning',
        percentage: 15,
        order: 1
      },
      {
        title: 'Material Procurement',
        description: 'Purchase certified electrical materials',
        percentage: 25,
        order: 2
      },
      {
        title: 'Rough Electrical',
        description: 'Install wiring and circuits',
        percentage: 40,
        order: 3
      },
      {
        title: 'Final Installation',
        description: 'Install fixtures and final connections',
        percentage: 15,
        order: 4
      },
      {
        title: 'Testing and Certification',
        description: 'Safety testing and ECG approval',
        percentage: 5,
        order: 5
      }
    ],
    
    ghanaCompliance: {
      hasGhanaLegalReview: true,
      applicableLaws: [
        'Ghana Building Code',
        'Electricity Company Ghana Standards'
      ],
      emergencyContacts: [
        {
          service: 'ECG Emergency',
          number: '0302-611611',
          description: 'Electrical emergencies and faults'
        },
        {
          service: 'Fire Service',
          number: '192',
          description: 'Electrical fire emergencies'
        }
      ]
    },
    
    tags: ['electrical', 'wiring', 'lighting', 'circuits', 'ECG', 'safety'],
    approvalStatus: 'approved'
  },

  {
    name: 'Custom Carpentry & Furniture',
    description: 'Bespoke furniture and carpentry work with quality wood finishes',
    category: 'carpentry',
    isPredefined: true,
    estimatedDuration: '1-3 weeks',
    priceRange: {
      min: 500,
      max: 10000,
      currency: 'GHS'
    },
    
    template: {
      title: 'Custom Carpentry Services Agreement',
      scope: `Specialized carpentry services including:
- Custom furniture design and construction
- Door and window installation
- Built-in storage and shelving
- Wood restoration and finishing
- Repair and maintenance services
- Quality craftsmanship with sustainable materials`,
      
      terms: `1. DESIGN AND SPECIFICATIONS
Detailed drawings and specifications will be provided and approved before work begins.

2. WOOD QUALITY AND SOURCING
All timber used shall be properly seasoned and suitable for Ghana's climate. Preference for sustainably sourced wood from certified suppliers.

3. CRAFTSMANSHIP WARRANTY
All carpentry work is warranted for 90 days against defects in workmanship.

4. TERMITE PROTECTION
Wood treatment for termite resistance is included where applicable, using treatments suitable for Ghana's climate.

5. CLIMATE CONSIDERATIONS
All wood finishes and treatments shall be suitable for Ghana's tropical climate conditions with high humidity.

6. QUALITY STANDARDS
Work will meet or exceed Ghana Standards Authority specifications for wooden furniture and fittings.`,

      ghanaSpecific: `GHANA CARPENTRY PROVISIONS:
- Compliance with Forestry Commission regulations
- Use of termite-resistant treatments suitable for Ghana
- Consideration for humid tropical climate
- Local wood species preferences (e.g., Mahogany, Wawa, Odum, Cedrela)
- Forestry Commission contact: 0302-401645
- Sustainable sourcing practices
- Traditional Ghanaian carpentry techniques where appropriate`,

      paymentTerms: `PAYMENT SCHEDULE:
- 40% deposit upon contract signing and design approval
- 35% upon completion of construction phase
- 25% upon final delivery and installation
- Payment methods: Mobile Money, bank transfer, cash
- Currency: Ghana Cedis (GHS)`,

      warrantyTerms: `CARPENTRY WARRANTY:
- 90-day warranty against workmanship defects
- 6-month warranty on wood treatment effectiveness
- Free minor adjustments during warranty period
- Maintenance advice and support included`
    },
    
    features: [
      'Custom furniture design',
      'Door and window installation',
      'Built-in storage solutions',
      'Wood finishing',
      '90-day warranty',
      'Termite protection',
      'Climate-appropriate materials'
    ],
    
    ghanaCompliance: {
      hasGhanaLegalReview: true,
      applicableLaws: [
        'Ghana Building Code',
        'Professional Bodies Registration Act'
      ],
      emergencyContacts: [
        {
          service: 'Forestry Commission',
          number: '0302-401645',
          description: 'Timber sourcing and compliance'
        }
      ]
    },
    
    tags: ['carpentry', 'furniture', 'wood', 'custom', 'joinery', 'finishing'],
    approvalStatus: 'approved'
  },

  {
    name: 'Interior & Exterior Painting',
    description: 'Complete painting services for residential and commercial properties',
    category: 'painting',
    isPopular: true,
    isPredefined: true,
    estimatedDuration: '3-7 days',
    priceRange: {
      min: 400,
      max: 3000,
      currency: 'GHS'
    },
    
    template: {
      title: 'Professional Painting Services Agreement',
      scope: `Complete painting services including:
- Surface preparation and priming
- Interior wall and ceiling painting
- Exterior facade painting
- Color consultation and design advice
- Clean-up and property protection
- Weather-resistant finishes for Ghana's climate`,
      
      terms: `1. SURFACE PREPARATION
All surfaces will be properly cleaned, sanded, and primed before painting to ensure optimal adhesion and finish quality.

2. PAINT QUALITY
Only high-quality paints suitable for Ghana's climate will be used, with appropriate UV and moisture resistance.

3. COLOR MATCHING
Professional color consultation included to ensure optimal results and client satisfaction.

4. WEATHER CONDITIONS
Exterior painting will only be performed during suitable weather conditions, avoiding rainy season and extreme heat.

5. PROPERTY PROTECTION
All furniture and property will be properly protected during painting work with quality drop cloths and plastic sheeting.

6. ENVIRONMENTAL CONSIDERATIONS
Use of low-VOC paints where possible to minimize environmental impact and improve indoor air quality.`,

      ghanaSpecific: `GHANA PAINTING PROVISIONS:
- Use of paints suitable for tropical climate with high humidity
- Anti-fungal and mildew-resistant formulations
- Consideration for harmattan season painting restrictions
- UV-resistant exterior paints for intense sun exposure
- Environmental compliance with EPA Ghana standards
- Use of locally available quality paint brands when appropriate
- Protection against termite damage for wooden surfaces`,

      paymentTerms: `PAYMENT TERMS:
- 35% deposit upon contract signing
- 40% upon completion of surface preparation
- 25% upon final completion and cleanup
- Accepted payments: Mobile Money, bank transfer, cash
- All amounts in Ghana Cedis (GHS)`,

      warrantyTerms: `PAINTING WARRANTY:
- 45-day warranty on workmanship
- Paint manufacturer warranty on materials
- Touch-up service within warranty period
- Color guarantee - satisfaction assured`
    },
    
    features: [
      'Surface preparation',
      'Interior painting',
      'Exterior weatherproofing',
      'Color consultation',
      '45-day warranty',
      'Property protection',
      'Climate-resistant paints'
    ],
    
    ghanaCompliance: {
      hasGhanaLegalReview: true,
      applicableLaws: [
        'Environmental Protection Agency Act'
      ],
      emergencyContacts: [
        {
          service: 'EPA Ghana',
          number: '0302-664697',
          description: 'Environmental compliance issues'
        }
      ]
    },
    
    tags: ['painting', 'interior', 'exterior', 'color', 'decoration', 'weatherproof'],
    approvalStatus: 'approved'
  },

  {
    name: 'Professional Cleaning Services',
    description: 'Thorough cleaning for homes and offices with health-safe products',
    category: 'cleaning',
    isPredefined: true,
    estimatedDuration: '1-2 days',
    priceRange: {
      min: 150,
      max: 800,
      currency: 'GHS'
    },
    
    template: {
      title: 'Professional Cleaning Services Agreement',
      scope: `Comprehensive cleaning services including:
- Deep cleaning and sanitization
- Floor, carpet, and upholstery cleaning
- Window and glass surface cleaning
- Bathroom and kitchen deep cleaning
- Waste removal and disposal
- Health and safety compliance`,
      
      terms: `1. CLEANING STANDARDS
All cleaning will be performed to professional standards using appropriate equipment and EPA-approved materials.

2. HEALTH AND SAFETY
Ghana Health Service approved cleaning products will be used, safe for humans and pets.

3. PROPERTY ACCESS
Secure access arrangements and key handling procedures will be established with proper security protocols.

4. SATISFACTION GUARANTEE
If not satisfied with cleaning quality, we will return to address issues at no additional cost within 48 hours.

5. INSURANCE COVERAGE
Fully insured service with liability coverage for any accidental damage during cleaning operations.

6. ENVIRONMENTAL RESPONSIBILITY
Use of eco-friendly products where possible and proper waste disposal according to local regulations.`,

      ghanaSpecific: `GHANA CLEANING PROVISIONS:
- Use of locally available, environmentally friendly products
- Compliance with Ghana Health Service hygiene standards
- Proper waste disposal according to local municipal regulations
- Consideration for malaria prevention (standing water removal)
- Emergency health contact: Ghana Health Service 0302-681109
- Use of products suitable for Ghana's climate and common health concerns
- Special attention to dust control during harmattan season`,

      paymentTerms: `PAYMENT TERMS:
- 50% payment upon service completion
- 50% upon client satisfaction confirmation
- Payment methods: Mobile Money, cash, bank transfer
- Currency: Ghana Cedis (GHS)`,

      warrantyTerms: `CLEANING GUARANTEE:
- 100% satisfaction guarantee
- Re-cleaning within 48 hours if not satisfied
- Damage insurance coverage included
- Health and safety compliance assured`
    },
    
    features: [
      'Deep sanitization',
      'Floor and carpet cleaning',
      'Window cleaning',
      'Bathroom disinfection',
      'Satisfaction guarantee',
      'Health-safe products',
      'Waste disposal included'
    ],
    
    ghanaCompliance: {
      hasGhanaLegalReview: true,
      applicableLaws: [
        'Environmental Protection Agency Act'
      ],
      emergencyContacts: [
        {
          service: 'Ghana Health Service',
          number: '0302-681109',
          description: 'Health and hygiene emergencies'
        }
      ]
    },
    
    tags: ['cleaning', 'sanitization', 'deep-clean', 'health', 'hygiene', 'maintenance'],
    approvalStatus: 'approved'
  },

  {
    name: 'Security System Installation',
    description: 'CCTV, alarms, and security system setup with monitoring options',
    category: 'security',
    isPredefined: true,
    estimatedDuration: '1-3 days',
    priceRange: {
      min: 800,
      max: 8000,
      currency: 'GHS'
    },
    
    template: {
      title: 'Security System Installation Agreement',
      scope: `Professional security services including:
- CCTV camera system design and installation
- Burglar alarm system setup
- Access control and intercom systems
- Remote monitoring configuration
- Training on system operation
- 24/7 monitoring service options`,
      
      terms: `1. SYSTEM DESIGN
Security system design will be customized based on comprehensive property assessment and client security requirements.

2. EQUIPMENT WARRANTY
All equipment comes with manufacturer warranty, with local support and service availability in Ghana.

3. INSTALLATION STANDARDS
Installation follows international security standards and complies with local building codes and regulations.

4. MONITORING SERVICES
Optional 24/7 monitoring services available with trained local security response teams.

5. MAINTENANCE SUPPORT
Regular maintenance schedule available to ensure optimal system performance and reliability.

6. PRIVACY COMPLIANCE
All installations will respect privacy laws and neighbor rights according to Ghana's legal framework.`,

      ghanaSpecific: `GHANA SECURITY PROVISIONS:
- Compliance with Ghana Police Service guidelines on private security
- CCTV placement respecting neighbor privacy laws
- Integration with local security response services
- Backup power systems for frequent power outages
- Police emergency contact: 191
- Use of equipment suitable for Ghana's climate conditions
- Coordination with local security agencies where required
- Compliance with National Communications Authority regulations for wireless systems`,

      paymentTerms: `PAYMENT SCHEDULE:
- 50% deposit upon contract signing and equipment order
- 30% upon installation completion
- 20% upon system testing and training completion
- Payment methods: Bank transfer, Mobile Money, cash
- Currency: Ghana Cedis (GHS)`,

      warrantyTerms: `SECURITY SYSTEM WARRANTY:
- 12-month warranty on all equipment
- 6-month warranty on installation workmanship
- 24/7 technical support for first 30 days
- Free system health checks during warranty period`
    },
    
    features: [
      'CCTV camera installation',
      'Alarm system setup',
      'Access control systems',
      'Remote monitoring',
      '12-month warranty',
      'Professional installation',
      'Local support available'
    ],
    
    ghanaCompliance: {
      hasGhanaLegalReview: true,
      applicableLaws: [
        'Ghana Building Code'
      ],
      emergencyContacts: [
        {
          service: 'Ghana Police',
          number: '191',
          description: 'Security emergencies'
        },
        {
          service: 'National Communications Authority',
          number: '0302-771701',
          description: 'Wireless system compliance'
        }
      ]
    },
    
    tags: ['security', 'CCTV', 'alarm', 'monitoring', 'access-control', 'surveillance'],
    approvalStatus: 'approved'
  }
];

/**
 * Seed the database with predefined contract templates
 */
async function seedContractTemplates() {
  try {
    console.log('🌱 Starting contract template seeding...');

    // Check if templates already exist
    const existingCount = await ContractTemplate.countDocuments({ isPredefined: true });
    
    if (existingCount > 0) {
      console.log(`📋 Found ${existingCount} existing predefined templates`);
      
      // Optional: Update existing templates
      for (const templateData of predefinedTemplates) {
        const existing = await ContractTemplate.findOne({
          name: templateData.name,
          isPredefined: true
        });
        
        if (existing) {
          console.log(`📝 Updating existing template: ${templateData.name}`);
          Object.assign(existing, templateData);
          await existing.save();
        } else {
          console.log(`✨ Creating new template: ${templateData.name}`);
          const template = new ContractTemplate(templateData);
          await template.save();
        }
      }
    } else {
      // Create all templates
      for (const templateData of predefinedTemplates) {
        console.log(`✨ Creating template: ${templateData.name}`);
        const template = new ContractTemplate(templateData);
        await template.save();
      }
    }

    const finalCount = await ContractTemplate.countDocuments({ isPredefined: true });
    console.log(`✅ Contract template seeding completed! Total predefined templates: ${finalCount}`);
    
    return {
      success: true,
      message: 'Contract templates seeded successfully',
      count: finalCount
    };

  } catch (error) {
    console.error('❌ Error seeding contract templates:', error);
    throw error;
  }
}

/**
 * Remove all predefined templates (for testing)
 */
async function removePredefinedTemplates() {
  try {
    console.log('🗑️ Removing predefined contract templates...');
    
    const result = await ContractTemplate.deleteMany({ isPredefined: true });
    
    console.log(`✅ Removed ${result.deletedCount} predefined templates`);
    
    return {
      success: true,
      message: 'Predefined templates removed successfully',
      deletedCount: result.deletedCount
    };

  } catch (error) {
    console.error('❌ Error removing predefined templates:', error);
    throw error;
  }
}

module.exports = {
  seedContractTemplates,
  removePredefinedTemplates,
  predefinedTemplates
};