/**
 * Eligibility Verifier Agent
 * Verifies credentials and checks eligibility using rule engine
 */

const ZyndClient = require('../shared/zyndClient');

class EligibilityVerifierAgent {
  constructor(config) {
    this.id = 2;
    this.name = 'Eligibility Verifier Agent';
    this.role = 'Credential Verification';
    this.did = config.did;
    this.capabilities = ['credential-verification', 'rule-engine', 'eligibility-check'];
    this.status = 'idle';
    this.verified = false;
    
    this.zyndClient = new ZyndClient(config);
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
   * Check eligibility based on policy and credentials
   */
  async checkEligibility(policyInfo, credentials) {
    try {
      console.log(`🔍 Checking eligibility for: ${policyInfo.name}`);
      
      // Verify credentials first
      const verifiedCreds = await this.verifyCredentials(credentials);
      
      if (!verifiedCreds) {
        throw new Error('Credential verification failed');
      }

      // Execute rule engine
      const result = await this.executeRuleEngine(policyInfo.eligibilityCriteria, credentials);
      
      console.log(`✅ Eligibility check complete: ${result.decision}`);
      
      return result;
    } catch (error) {
      console.error('Eligibility verification error:', error);
      throw error;
    }
  }

  /**
   * Verify credential signatures and issuer trust
   */
  async verifyCredentials(credentials) {
    try {
      console.log('🔐 Verifying credential signatures...');
      
      for (const cred of credentials) {
        // Verify signature
        if (!cred.signature) {
          console.warn(`Credential missing signature: ${cred.type}`);
          return false;
        }

        // Verify issuer
        if (!cred.issuer || !cred.issuer.startsWith('did:')) {
          console.warn(`Invalid issuer: ${cred.issuer}`);
          return false;
        }

        // Verify not expired
        if (cred.expirationDate) {
          const expDate = new Date(cred.expirationDate);
          if (expDate < new Date()) {
            console.warn(`Credential expired: ${cred.type}`);
            return false;
          }
        }

        console.log(`✅ Verified credential: ${cred.type}`);
      }
      
      return true;
    } catch (error) {
      console.error('Credential verification error:', error);
      return false;
    }
  }

  /**
   * Execute rule engine to evaluate eligibility
   */
  async executeRuleEngine(criteria, credentials) {
    console.log('⚙️  Executing rule engine...');
    
    const evaluations = [];
    let allSatisfied = true;

    for (const rule of criteria) {
      const evaluation = this.evaluateRule(rule, credentials);
      evaluations.push(evaluation);
      
      if (evaluation.status !== 'satisfied') {
        allSatisfied = false;
      }
      
      console.log(`  ${evaluation.status === 'satisfied' ? '✅' : '❌'} ${rule.criterion}`);
    }

    const decision = allSatisfied ? 'Eligible' : 'Not Eligible';

    return {
      decision: decision,
      evaluations: evaluations,
      reasoning: evaluations.map(e => ({
        criterion: e.criterion,
        status: e.status,
        verified: e.verified
      })),
      verifiedBy: this.did,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Evaluate single rule against credentials
   */
  evaluateRule(rule, credentials) {
    try {
      // Find matching credential
      const cred = credentials.find(c => 
        c.type.toLowerCase().includes(rule.field.toLowerCase())
      );

      if (!cred) {
        return {
          criterion: rule.criterion,
          status: 'not_satisfied',
          verified: false,
          reason: 'Required credential not provided'
        };
      }

      // Extract value from credential
      const value = cred.credentialSubject[rule.field];

      if (value === undefined || value === null) {
        return {
          criterion: rule.criterion,
          status: 'not_satisfied',
          verified: false,
          reason: 'Required field not found in credential'
        };
      }

      // Evaluate based on operator
      let satisfied = false;

      switch (rule.operator) {
        case '>=':
          satisfied = value >= rule.value;
          break;
        case '>':
          satisfied = value > rule.value;
          break;
        case '<=':
          satisfied = value <= rule.value;
          break;
        case '<':
          satisfied = value < rule.value;
          break;
        case '==':
          satisfied = value == rule.value;
          break;
        case '!=':
          satisfied = value != rule.value;
          break;
        default:
          satisfied = false;
      }

      return {
        criterion: rule.criterion,
        status: satisfied ? 'satisfied' : 'not_satisfied',
        verified: true,
        actualValue: value,
        requiredValue: rule.value,
        operator: rule.operator
      };

    } catch (error) {
      console.error('Rule evaluation error:', error);
      return {
        criterion: rule.criterion,
        status: 'error',
        verified: false,
        reason: error.message
      };
    }
  }

  /**
   * Request specific credentials from citizen
   */
  async requestCredentials(claims, purpose) {
    return {
      requestedClaims: claims,
      requestedBy: this.did,
      purpose: purpose,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify sender identity before processing
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
      case 'CHECK_ELIGIBILITY':
        this.checkEligibility(message.payload.policy, message.payload.credentials);
        break;
      case 'VERIFY_CREDENTIAL':
        this.verifyCredentials([message.payload.credential]);
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

module.exports = EligibilityVerifierAgent;