/**
 * Application Guide Agent
 * Generates application guidance and next steps
 */

const ZyndClient = require('../shared/zyndClient');

class ApplicationGuideAgent {
  constructor(config) {
    this.id = 4;
    this.name = 'Application Guide Agent';
    this.role = 'Process Assistance';
    this.did = config.did;
    this.capabilities = ['guidance', 'form-assistance'];
    this.status = 'idle';
    this.verified = false;
    
    this.zyndClient = new ZyndClient(config);
    
    // Knowledge base of application processes
    this.processKnowledge = this.initializeKnowledgeBase();
  }

  /**
   * Initialize agent
   */
  async initialize() {
    try {
      await this.zyndClient.initialize();
      this.verified = this.zyndClient.verified;
      
      console.log(`✅ ${this.name} initialized`);
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Initialize knowledge base of application processes
   */
  initializeKnowledgeBase() {
    return {
      old_age_pension: {
        eligible: {
          steps: [
            'Visit the official pension portal at gov.in/pension',
            'Click on "Apply for Old Age Pension"',
            'Fill out Application Form OAP-2024 online',
            'Upload required documents (age proof, income certificate, residence proof)',
            'Submit the application and note your application reference number',
            'Visit your nearest pension office for biometric verification',
            'Track application status online using reference number',
            'Application typically takes 15-30 business days for processing',
            'You will receive approval notification via SMS and email',
            'Pension will be credited to your registered bank account from the next month'
          ],
          documents: [
            'Aadhaar Card (mandatory)',
            'Age Proof (Birth Certificate or School Leaving Certificate)',
            'Income Certificate (issued by Tehsildar)',
            'Bank Account Details (Passbook copy)',
            'Residence Proof (Ration Card / Voter ID)',
            'Recent Passport Size Photograph'
          ],
          timeline: '15-30 business days',
          helpline: '1800-XXX-XXXX',
          websiteForm: 'https://gov.in/pension/apply'
        },
        notEligible: {
          reasons: [
            'If age requirement not met: You must wait until you turn 60 years old',
            'If income too high: Consider other pension schemes or investment options',
            'If already receiving another pension: Only one pension can be availed at a time'
          ],
          alternatives: [
            'National Pension System (NPS) - for those below 60',
            'Senior Citizen Savings Scheme (SCSS) - if income is above threshold',
            'Pradhan Mantri Vaya Vandana Yojana (PMVVY) - alternative pension scheme'
          ],
          appeal: {
            available: true,
            process: [
              'You can file an appeal within 30 days of rejection',
              'Submit appeal form with supporting documents',
              'Appeal will be reviewed by District Pension Committee',
              'Decision on appeal typically takes 45 days'
            ]
          }
        }
      }
    };
  }

  /**
   * Generate application guidance based on eligibility result
   */
  async generateGuidance(eligibilityResult) {
    try {
      console.log(`📖 Generating guidance for: ${eligibilityResult.decision}`);
      
      const policyId = 'old_age_pension'; // In production: extract from eligibilityResult
      const knowledge = this.processKnowledge[policyId];
      
      if (!knowledge) {
        throw new Error('No guidance available for this policy');
      }

      let guidance;

      if (eligibilityResult.decision === 'Eligible') {
        guidance = this.generateEligibleGuidance(knowledge.eligible, eligibilityResult);
      } else {
        guidance = this.generateNotEligibleGuidance(knowledge.notEligible, eligibilityResult);
      }

      console.log(`✅ Guidance generated successfully`);
      
      return guidance;

    } catch (error) {
      console.error('Guidance generation error:', error);
      throw error;
    }
  }

  /**
   * Generate guidance for eligible citizens
   */
  generateEligibleGuidance(eligibleInfo, result) {
    return {
      decision: 'Eligible',
      congratulations: true,
      message: 'Congratulations! You are eligible for the Old Age Pension scheme.',
      steps: eligibleInfo.steps,
      requiredDocuments: eligibleInfo.documents,
      timeline: eligibleInfo.timeline,
      importantNotes: [
        'Ensure all documents are valid and not expired',
        'Keep your application reference number safe for tracking',
        'Biometric verification is mandatory - cannot be done by proxy',
        'Any false information may lead to application rejection and legal action'
      ],
      support: {
        helpline: eligibleInfo.helpline,
        email: 'pension@gov.in',
        website: eligibleInfo.websiteForm,
        officeHours: 'Monday-Friday, 10:00 AM - 5:00 PM'
      },
      nextAction: 'Begin your application process by visiting gov.in/pension',
      generatedBy: this.did,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate guidance for non-eligible citizens
   */
  generateNotEligibleGuidance(notEligibleInfo, result) {
    // Identify specific reasons based on evaluation
    const specificReasons = [];
    for (const evaluation of result.evaluations) {
      if (evaluation.status !== 'satisfied') {
        specificReasons.push(`${evaluation.criterion} not met`);
      }
    }

    return {
      decision: 'Not Eligible',
      congratulations: false,
      message: 'Unfortunately, you do not meet all the eligibility criteria at this time.',
      reasons: specificReasons,
      detailedReasons: notEligibleInfo.reasons,
      alternatives: {
        title: 'Alternative Options',
        schemes: notEligibleInfo.alternatives
      },
      appeal: notEligibleInfo.appeal,
      guidance: [
        'Review the eligibility criteria carefully',
        'Check if you qualify for alternative schemes listed above',
        'If you believe there is an error, you can file an appeal',
        'Contact the helpline for personalized assistance'
      ],
      support: {
        helpline: '1800-XXX-XXXX',
        email: 'pension@gov.in',
        website: 'gov.in/pension/eligibility'
      },
      nextAction: 'Review alternative schemes or prepare an appeal if applicable',
      generatedBy: this.did,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get application checklist
   */
  getApplicationChecklist(policyId = 'old_age_pension') {
    const knowledge = this.processKnowledge[policyId];
    
    if (!knowledge || !knowledge.eligible) {
      return null;
    }

    return {
      title: 'Application Checklist',
      documents: knowledge.eligible.documents.map((doc, idx) => ({
        id: idx + 1,
        document: doc,
        status: 'pending'
      })),
      steps: knowledge.eligible.steps.map((step, idx) => ({
        id: idx + 1,
        step: step,
        status: 'pending'
      }))
    };
  }

  /**
   * Get appeal process information
   */
  getAppealProcess(policyId = 'old_age_pension') {
    const knowledge = this.processKnowledge[policyId];
    
    if (!knowledge || !knowledge.notEligible || !knowledge.notEligible.appeal) {
      return null;
    }

    return knowledge.notEligible.appeal;
  }

  /**
   * Get FAQ
   */
  getFAQ() {
    return [
      {
        question: 'How long does the application process take?',
        answer: 'The application typically takes 15-30 business days to process after submission.'
      },
      {
        question: 'Can I apply online?',
        answer: 'Yes, you can apply online through the official portal at gov.in/pension. However, biometric verification must be done in person.'
      },
      {
        question: 'What if my income increases after receiving the pension?',
        answer: 'You must inform the pension office immediately. Your pension may be suspended if income exceeds the threshold.'
      },
      {
        question: 'Can I appeal if rejected?',
        answer: 'Yes, you can file an appeal within 30 days of rejection with supporting documents.'
      },
      {
        question: 'When will I receive the first payment?',
        answer: 'Once approved, pension will be credited to your bank account from the following month.'
      }
    ];
  }

  /**
   * Verify identity
   */
  async verifyIdentity() {
    return this.verified;
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    console.log(`${this.name} received message:`, message.type);
    
    // Verify sender
    if (!this.zyndClient.verifySenderDID(message.from)) {
      console.warn('Message from unverified sender rejected');
      return;
    }

    // Process message based on type
    switch (message.type) {
      case 'GENERATE_GUIDANCE':
        this.generateGuidance(message.payload.eligibilityResult);
        break;
      case 'GET_CHECKLIST':
        this.getApplicationChecklist(message.payload.policyId);
        break;
      case 'GET_FAQ':
        this.getFAQ();
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Disconnect agent
   */
  async disconnect() {
    await this.zyndClient.disconnect();
    this.status = 'disconnected';
  }
}

module.exports = ApplicationGuideAgent;