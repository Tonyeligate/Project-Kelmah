'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Standard contract templates
    const templates = [
      // Fixed price contract template
      {
        id: uuidv4(),
        name: 'Standard Fixed Price Contract',
        description: 'A general-purpose fixed price contract for one-time projects.',
        category: 'fixed',
        content: `
# FIXED PRICE CONTRACT AGREEMENT

## PARTIES
This Fixed Price Contract Agreement (the "Agreement") is made between:

**Client**: {{clientName}}, hereinafter referred to as the "Client"
**Worker**: {{workerName}}, hereinafter referred to as the "Worker"

## PROJECT DETAILS
- **Project Title**: {{projectTitle}}
- **Project Description**: {{projectDescription}}
- **Start Date**: {{startDate}}
- **Deadline**: {{deadline}}

## SCOPE OF WORK
The Worker agrees to perform the following services (the "Services"):
{{scopeOfWork}}

## DELIVERABLES
The Worker shall deliver the following items (the "Deliverables"):
{{deliverables}}

## PAYMENT TERMS
- **Total Fee**: {{totalFee}} {{currency}}
- **Payment Schedule**:
  {{paymentSchedule}}

All payments shall be made via the Kelmah platform escrow system.

## REVISION POLICY
{{revisionPolicy}}

## INTELLECTUAL PROPERTY RIGHTS
Upon receipt of full payment, the Worker assigns to the Client all intellectual property rights in the Deliverables, including copyright.

## CONFIDENTIALITY
Both parties agree to keep confidential all information shared during the course of this Agreement.

## TERMINATION
This Agreement may be terminated by either party with written notice if the other party breaches any material term of this Agreement.

## DISPUTE RESOLUTION
Any dispute arising under this Agreement shall be resolved through the Kelmah dispute resolution process.

## APPLICABLE LAW
This Agreement shall be governed by the laws of Ghana.

## ACCEPTANCE
By accepting this contract on the Kelmah platform, both parties agree to all terms and conditions of this Agreement.
        `,
        variables: [
          'clientName', 'workerName', 'projectTitle', 'projectDescription', 
          'startDate', 'deadline', 'scopeOfWork', 'deliverables', 
          'totalFee', 'currency', 'paymentSchedule', 'revisionPolicy'
        ],
        isDefault: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Hourly contract template
      {
        id: uuidv4(),
        name: 'Standard Hourly Rate Contract',
        description: 'A general-purpose hourly rate contract for ongoing work.',
        category: 'hourly',
        content: `
# HOURLY RATE CONTRACT AGREEMENT

## PARTIES
This Hourly Rate Contract Agreement (the "Agreement") is made between:

**Client**: {{clientName}}, hereinafter referred to as the "Client"
**Worker**: {{workerName}}, hereinafter referred to as the "Worker"

## PROJECT DETAILS
- **Project Title**: {{projectTitle}}
- **Project Description**: {{projectDescription}}
- **Start Date**: {{startDate}}
- **End Date**: {{endDate}} (if applicable)

## SCOPE OF WORK
The Worker agrees to perform the following services (the "Services"):
{{scopeOfWork}}

## RATE AND PAYMENT TERMS
- **Hourly Rate**: {{hourlyRate}} {{currency}}
- **Maximum Hours Per Week**: {{maxHoursPerWeek}} hours
- **Payment Schedule**: Weekly, based on approved hours tracked via the Kelmah platform
- **Invoice Period**: Monday to Sunday

All payments shall be made via the Kelmah platform payment system.

## TIME TRACKING
The Worker shall track all time spent on the Services using the Kelmah platform time tracking system. Hours must be submitted by Monday 11:59 PM for the previous week.

## REPORTING
The Worker shall provide weekly progress reports detailing tasks completed and in progress.

## CONFIDENTIALITY
Both parties agree to keep confidential all information shared during the course of this Agreement.

## INTELLECTUAL PROPERTY RIGHTS
The Client owns all intellectual property rights to work produced during billable hours under this Agreement.

## TERMINATION
Either party may terminate this Agreement with {{terminationNoticeDays}} days written notice.

## DISPUTE RESOLUTION
Any dispute arising under this Agreement shall be resolved through the Kelmah dispute resolution process.

## APPLICABLE LAW
This Agreement shall be governed by the laws of Ghana.

## ACCEPTANCE
By accepting this contract on the Kelmah platform, both parties agree to all terms and conditions of this Agreement.
        `,
        variables: [
          'clientName', 'workerName', 'projectTitle', 'projectDescription', 
          'startDate', 'endDate', 'scopeOfWork', 'hourlyRate', 'currency', 
          'maxHoursPerWeek', 'terminationNoticeDays'
        ],
        isDefault: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Milestone-based contract template
      {
        id: uuidv4(),
        name: 'Standard Milestone Contract',
        description: 'A contract with payments broken down by project milestones.',
        category: 'milestone',
        content: `
# MILESTONE-BASED CONTRACT AGREEMENT

## PARTIES
This Milestone-Based Contract Agreement (the "Agreement") is made between:

**Client**: {{clientName}}, hereinafter referred to as the "Client"
**Worker**: {{workerName}}, hereinafter referred to as the "Worker"

## PROJECT DETAILS
- **Project Title**: {{projectTitle}}
- **Project Description**: {{projectDescription}}
- **Start Date**: {{startDate}}
- **Final Deadline**: {{finalDeadline}}

## SCOPE OF WORK
The Worker agrees to perform the following services (the "Services"):
{{scopeOfWork}}

## MILESTONES AND PAYMENT SCHEDULE
The project will be completed in the following milestones:

{{milestones}}

Each milestone payment shall be released after the Client approves the deliverables for that milestone. All payments shall be made via the Kelmah platform escrow system.

## TOTAL CONTRACT VALUE
- **Total Fee**: {{totalFee}} {{currency}}

## REVISION POLICY
{{revisionPolicy}}

## INTELLECTUAL PROPERTY RIGHTS
Upon receipt of full payment for each milestone, the Worker assigns to the Client all intellectual property rights in the deliverables for that milestone, including copyright.

## CONFIDENTIALITY
Both parties agree to keep confidential all information shared during the course of this Agreement.

## TERMINATION
This Agreement may be terminated by either party with written notice if the other party breaches any material term of this Agreement. In case of termination, the Client shall pay for completed and approved milestones.

## DISPUTE RESOLUTION
Any dispute arising under this Agreement shall be resolved through the Kelmah dispute resolution process.

## APPLICABLE LAW
This Agreement shall be governed by the laws of Ghana.

## ACCEPTANCE
By accepting this contract on the Kelmah platform, both parties agree to all terms and conditions of this Agreement.
        `,
        variables: [
          'clientName', 'workerName', 'projectTitle', 'projectDescription', 
          'startDate', 'finalDeadline', 'scopeOfWork', 'milestones', 
          'totalFee', 'currency', 'revisionPolicy'
        ],
        isDefault: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert the templates
    await queryInterface.bulkInsert('contract_templates', templates, {});
    
    console.log(`Inserted ${templates.length} contract templates`);
    
    return Promise.resolve();
  },

  async down(queryInterface, Sequelize) {
    // Remove all the contract templates
    await queryInterface.bulkDelete('contract_templates', null, {});
  }
}; 