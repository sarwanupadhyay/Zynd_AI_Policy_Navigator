/**
 * Policy Interpreter Agent
 * Analyzes policy documents and extracts eligibility criteria
 */

const ZyndClient = require('../shared/zyndClient');
const fs = require('fs').promises;
const path = require('path');

class PolicyInterpreterAgent {
  constructor(config) {
    this.id = 1;
    this.name = 'Policy Interpreter Agent';
    this.role = 'Policy Analysis';
    this.did = config.did;
    this.capabilities = ['policy-analysis', 'rag', 'document-parsing'];
    this.status = 'idle';
    this.verified = false;
    
    this.zyndClient = new ZyndClient(config);
    this.policyCache = new Map();
  }

  /**
   * Initialize agent
   */
  async initialize() {
    try {
      await this.zyndClient.initialize();
      this.verified = this.zyndClient.verified;
      
      // Load policy documents
      await this.loadPolicies();
      
      console.log(`✅ ${this.name} initialized`);
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Load policy documents into cache
   */
  async loadPolicies() {
    try {
      const policiesDir = path.join(__dirname, '../policies');
      const files = await fs.readdir(policiesDir);
      
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const content = await fs.readFile(
            path.join(policiesDir, file),
            'utf-8'
          );
          
          const policyId = file.replace('.txt', '');
          this.policyCache.set(policyId, content);
          console.log(`📄 Loaded policy: ${policyId}`);
        }
      }
    } catch (error) {
      console.warn('No policy files found, using default policies');
      this.loadDefaultPolicies();
    }
  }

  /**
   * Load default policies if files not found
   */
  loadDefaultPolicies() {
    const oldAgePension = `
Old Age Pension Scheme
======================

Program Overview:
The Old Age Pension Scheme provides financial assistance to elderly citizens
to ensure dignity and financial security in their old age.

Eligibility Criteria:
1. Age Requirement: Applicant must be 60 years or older
2. Income Requirement: Annual household income must be below ₹50,000
3. Residency: Must be a resident of the state for at least 10 years
4. No Other Pension: Should not be receiving any other pension

Benefits:
- Monthly pension of ₹2,000
- Annual increment based on inflation
- Healthcare benefits at government hospitals

Application Process:
1. Fill Application Form OAP-2024
2. Submit age proof (birth certificate, Aadhaar)
3. Submit income certificate
4. Submit residence proof
5. Visit local pension office

Documents Required:
- Aadhaar Card
- Birth Certificate or Age Proof
- Income Certificate
- Bank Account Details
- Residence Proof

Contact:
- Website: gov.in/pension
- Helpline: 1800-XXX-XXXX
- Email: pension@gov.in
    `.trim();

    this.policyCache.set('old_age_pension', oldAgePension);
    console.log('📄 Loaded default Old Age Pension policy');
  }

  /**
   * Analyze query and identify relevant policy
   */
  async analyzeQuery(query) {
    try {
      console.log(`🔍 Analyzing query: "${query}"`);
      
      const lowerQuery = query.toLowerCase();
      
      // Simple keyword matching (in production: use NLP/LLM)
      let policyId = null;
      let policyContent = null;

      if (lowerQuery.includes('pension') || lowerQuery.includes('old age') || lowerQuery.includes('elderly')) {
        policyId = 'old_age_pension';
        policyContent = this.policyCache.get(policyId);
      }
      
      if (!policyContent) {
        throw new Error('No matching policy found for query');
      }

      // Extract policy information using RAG-like approach
      const policyInfo = this.extractPolicyInfo(policyContent, policyId);
      
      console.log(`✅ Policy identified: ${policyInfo.name}`);
      
      return policyInfo;
    } catch (error) {
      console.error('Policy analysis error:', error);
      throw error;
    }
  }

  /**
   * Extract structured information from policy document
   * In production: use RAG (Retrieval-Augmented Generation)
   */
  extractPolicyInfo(content, policyId) {
    // Parse policy document
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    
    // Extract eligibility criteria
    const eligibilityCriteria = [];
    const requiredClaims = [];
    
    if (content.includes('60 years or older')) {
      eligibilityCriteria.push({
        criterion: 'Age ≥ 60',
        field: 'age',
        operator: '>=',
        value: 60
      });
      requiredClaims.push('Age');
    }
    
    if (content.includes('income must be below')) {
      eligibilityCriteria.push({
        criterion: 'Annual income below threshold',
        field: 'income',
        operator: '<',
        value: 50000
      });
      requiredClaims.push('Income Range');
    }

    // Extract benefits
    const benefits = [];
    if (content.includes('Monthly pension')) {
      benefits.push('Monthly pension of ₹2,000');
    }
    if (content.includes('Healthcare benefits')) {
      benefits.push('Healthcare benefits at government hospitals');
    }

    return {
      id: policyId,
      name: 'Old Age Pension',
      summary: 'Financial assistance program for elderly citizens to ensure dignity and financial security',
      eligibilityCriteria: eligibilityCriteria,
      requiredClaims: requiredClaims,
      benefits: benefits,
      applicationForm: 'OAP-2024',
      contactInfo: {
        website: 'gov.in/pension',
        helpline: '1800-XXX-XXXX',
        email: 'pension@gov.in'
      }
    };
  }

  /**
   * Verify sender identity before processing
   */
  async verifyIdentity() {
    return this.verified;
  }

  /**
   * Get policy by ID
   */
  async getPolicy(policyId) {
    return this.policyCache.get(policyId);
  }

  /**
   * List all available policies
   */
  listPolicies() {
    return Array.from(this.policyCache.keys());
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
      case 'POLICY_QUERY':
        this.analyzeQuery(message.payload.query);
        break;
      case 'GET_POLICY':
        this.getPolicy(message.payload.policyId);
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

module.exports = PolicyInterpreterAgent;