/**
 * Citizen Agent
 * Manages citizen's identity and privacy-preserving credential disclosure
 */

const ZyndClient = require('../shared/zyndClient');

class CitizenAgent {
  constructor(config) {
    this.id = 3;
    this.name = 'Citizen Agent';
    this.role = 'Identity & Privacy';
    this.did = config.did;
    this.capabilities = ['identity-management', 'credential-holder'];
    this.status = 'idle';
    this.verified = false;
    
    this.zyndClient = new ZyndClient(config);
    
    // Initialize citizen's verifiable credentials
    this.credentials = this.initializeCredentials();
  }

  /**
   * Initialize agent
   */
  async initialize() {
    try {
      await this.zyndClient.initialize();
      this.verified = this.zyndClient.verified;
      
      console.log(`✅ ${this.name} initialized`);
      console.log(`👤 Citizen credentials loaded: ${this.credentials.length} credentials`);
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Initialize citizen's verifiable credentials
   * In production: these would be issued by trusted authorities
   */
  initializeCredentials() {
    const now = new Date();
    const futureDate = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());

    return [
      {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: 'AgeCredential',
        issuer: 'did:gov:age-verification-authority',
        issuanceDate: now.toISOString(),
        expirationDate: futureDate.toISOString(),
        credentialSubject: {
          id: this.did,
          age: 65,
          dateOfBirth: '1959-03-15'
        },
        signature: this.generateMockSignature('age'),
        proof: {
          type: 'Ed25519Signature2020',
          created: now.toISOString(),
          proofPurpose: 'assertionMethod'
        }
      },
      {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: 'IncomeCredential',
        issuer: 'did:gov:income-tax-department',
        issuanceDate: now.toISOString(),
        expirationDate: futureDate.toISOString(),
        credentialSubject: {
          id: this.did,
          income: 35000,
          annualIncome: 35000,
          incomeRange: 'below-threshold',
          taxYear: now.getFullYear()
        },
        signature: this.generateMockSignature('income'),
        proof: {
          type: 'Ed25519Signature2020',
          created: now.toISOString(),
          proofPurpose: 'assertionMethod'
        }
      },
      {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: 'ResidenceCredential',
        issuer: 'did:gov:municipal-authority',
        issuanceDate: now.toISOString(),
        expirationDate: futureDate.toISOString(),
        credentialSubject: {
          id: this.did,
          address: '123 Main Street, City, State',
          residenceYears: 15,
          state: 'StateName'
        },
        signature: this.generateMockSignature('residence'),
        proof: {
          type: 'Ed25519Signature2020',
          created: now.toISOString(),
          proofPurpose: 'assertionMethod'
        }
      },
      {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: 'IdentityCredential',
        issuer: 'did:gov:national-id-authority',
        issuanceDate: now.toISOString(),
        expirationDate: futureDate.toISOString(),
        credentialSubject: {
          id: this.did,
          idNumber: 'ID-123456789',
          fullName: 'John Doe',
          phoneNumber: '+91-9876543210'
        },
        signature: this.generateMockSignature('identity'),
        proof: {
          type: 'Ed25519Signature2020',
          created: now.toISOString(),
          proofPurpose: 'assertionMethod'
        }
      }
    ];
  }

  /**
   * Generate mock signature for demo
   */
  generateMockSignature(type) {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(`${this.did}-${type}-${Date.now()}`)
      .digest('hex');
  }

  /**
   * Share selective credentials (privacy-preserving)
   * Only shares requested claims, not entire credentials
   */
  async shareSelectiveClaims(requestedClaims) {
    try {
      console.log(`🔐 Processing selective disclosure request for: ${requestedClaims.join(', ')}`);
      
      const sharedCredentials = [];
      const sharedClaims = [];
      const notSharedClaims = [];

      // Identify which credentials to share
      for (const claim of requestedClaims) {
        const credential = this.findCredentialForClaim(claim);
        
        if (credential) {
          sharedCredentials.push(credential);
          
          // Format shared claim
          const value = this.extractClaimValue(credential, claim);
          sharedClaims.push(`${claim}: ${value}`);
        } else {
          notSharedClaims.push(claim);
        }
      }

      // Identify what was NOT shared (for privacy demonstration)
      const allAvailableClaims = this.getAllAvailableClaims();
      for (const claim of allAvailableClaims) {
        if (!requestedClaims.includes(claim)) {
          notSharedClaims.push(claim);
        }
      }

      console.log(`✅ Shared: ${sharedClaims.join(', ')}`);
      console.log(`🔒 Not shared: ${notSharedClaims.join(', ')}`);

      return {
        shared: sharedClaims,
        notShared: notSharedClaims,
        credentials: sharedCredentials,
        disclosedBy: this.did,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Selective disclosure error:', error);
      throw error;
    }
  }

  /**
   * Find credential that contains the requested claim
   */
  findCredentialForClaim(claim) {
    const claimLower = claim.toLowerCase();
    
    for (const credential of this.credentials) {
      const subject = credential.credentialSubject;
      
      // Check if credential has this claim
      for (const key of Object.keys(subject)) {
        if (key.toLowerCase().includes(claimLower) || 
            claimLower.includes(key.toLowerCase())) {
          return credential;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract claim value from credential
   */
  extractClaimValue(credential, claim) {
    const subject = credential.credentialSubject;
    const claimLower = claim.toLowerCase();
    
    for (const [key, value] of Object.entries(subject)) {
      if (key.toLowerCase().includes(claimLower) || 
          claimLower.includes(key.toLowerCase())) {
        
        if (claimLower.includes('income') && claimLower.includes('range')) {
          return 'Below threshold';
        }
        
        return value;
      }
    }
    
    return 'Available';
  }

  /**
   * Get all available claims (for privacy demonstration)
   */
  getAllAvailableClaims() {
    const claims = new Set();
    
    for (const credential of this.credentials) {
      const subject = credential.credentialSubject;
      
      for (const key of Object.keys(subject)) {
        if (key !== 'id') {
          // Format claim name
          const claimName = this.formatClaimName(key);
          claims.add(claimName);
        }
      }
    }
    
    return Array.from(claims);
  }

  /**
   * Format claim name for display
   */
  formatClaimName(key) {
    // Convert camelCase to Title Case
    const formatted = key.replace(/([A-Z])/g, ' $1').trim();
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  /**
   * Reject credential request from unverified agent
   */
  async rejectRequest(requesterId) {
    console.log(`🚫 Rejected credential request from unverified agent: ${requesterId}`);
    
    return {
      success: false,
      reason: 'Request from unverified agent',
      rejectedBy: this.did,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify requesting agent before sharing credentials
   */
  async verifyRequester(requesterDID) {
    // Verify requester's DID
    const verified = await this.zyndClient.verifySenderDID(requesterDID);
    
    if (!verified) {
      console.warn(`⚠️  Unverified requester: ${requesterDID}`);
      return false;
    }
    
    console.log(`✅ Verified requester: ${requesterDID}`);
    return true;
  }

  /**
   * Get credential by type
   */
  getCredentialByType(type) {
    return this.credentials.find(c => c.type === type);
  }

  /**
   * List all credentials
   */
  listCredentials() {
    return this.credentials.map(c => ({
      type: c.type,
      issuer: c.issuer,
      issuanceDate: c.issuanceDate,
      expirationDate: c.expirationDate
    }));
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
      case 'REQUEST_CREDENTIALS':
        this.shareSelectiveClaims(message.payload.claims);
        break;
      case 'GET_CREDENTIAL':
        this.getCredentialByType(message.payload.type);
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

module.exports = CitizenAgent;