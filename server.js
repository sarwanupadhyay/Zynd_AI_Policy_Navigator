/**
 * Policy Navigator - Server Orchestrator
 * Coordinates multi-agent workflow with trust verification
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import agents
const PolicyInterpreter = require('./agents/policyInterpreter');
const EligibilityVerifier = require('./agents/eligibilityVerifier');
const CitizenAgent = require('./agents/citizenAgent');
const ApplicationGuide = require('./agents/applicationGuide');

// Import shared utilities
const { discoverAgents, registerAgent } = require('./shared/registry');
const AuditLogger = require('./shared/auditLogger');
const { initializeSecureChannel } = require('./shared/secureMessaging');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Global state
let agents = {};
let auditLogger;
let isInitialized = false;

/**
 * Initialize all agents with Zynd credentials
 */
async function initializeAgents() {
  try {
    console.log('🚀 Initializing Policy Navigator Agent Network...');
    
    auditLogger = new AuditLogger();
    auditLogger.log('System initialization started', 'System');

    // Initialize Policy Interpreter Agent
    console.log('📋 Initializing Policy Interpreter Agent...');
    agents.policyInterpreter = new PolicyInterpreter({
      did: process.env.POLICY_INTERPRETER_DID,
      seed: process.env.POLICY_INTERPRETER_SEED,
      credential: JSON.parse(process.env.POLICY_INTERPRETER_CREDENTIAL || '{}')
    });
    await agents.policyInterpreter.initialize();
    await registerAgent(agents.policyInterpreter);
    auditLogger.log('Policy Interpreter Agent initialized and verified', 'Policy Interpreter Agent');

    // Initialize Eligibility Verifier Agent
    console.log('✅ Initializing Eligibility Verifier Agent...');
    agents.eligibilityVerifier = new EligibilityVerifier({
      did: process.env.ELIGIBILITY_VERIFIER_DID,
      seed: process.env.ELIGIBILITY_VERIFIER_SEED,
      credential: JSON.parse(process.env.ELIGIBILITY_VERIFIER_CREDENTIAL || '{}')
    });
    await agents.eligibilityVerifier.initialize();
    await registerAgent(agents.eligibilityVerifier);
    auditLogger.log('Eligibility Verifier Agent initialized and verified', 'Eligibility Verifier Agent');

    // Initialize Citizen Agent
    console.log('👤 Initializing Citizen Agent...');
    agents.citizenAgent = new CitizenAgent({
      did: process.env.CITIZEN_AGENT_DID,
      seed: process.env.CITIZEN_AGENT_SEED,
      credential: JSON.parse(process.env.CITIZEN_AGENT_CREDENTIAL || '{}')
    });
    await agents.citizenAgent.initialize();
    await registerAgent(agents.citizenAgent);
    auditLogger.log('Citizen Agent initialized and verified', 'Citizen Agent');

    // Initialize Application Guide Agent
    console.log('📖 Initializing Application Guide Agent...');
    agents.applicationGuide = new ApplicationGuide({
      did: process.env.APPLICATION_GUIDE_DID,
      seed: process.env.APPLICATION_GUIDE_SEED,
      credential: JSON.parse(process.env.APPLICATION_GUIDE_CREDENTIAL || '{}')
    });
    await agents.applicationGuide.initialize();
    await registerAgent(agents.applicationGuide);
    auditLogger.log('Application Guide Agent initialized and verified', 'Application Guide Agent');

    // Initialize secure messaging channels
    console.log('🔐 Establishing encrypted MQTT channels...');
    await initializeSecureChannel(Object.values(agents));
    auditLogger.log('Encrypted communication channels established', 'System');

    isInitialized = true;
    console.log('✅ Agent network ready!');
    auditLogger.log('Agent network initialization complete', 'System');

  } catch (error) {
    console.error('❌ Failed to initialize agents:', error);
    auditLogger.log(`Initialization failed: ${error.message}`, 'System', 'error');
    throw error;
  }
}

/**
 * Process citizen query through multi-agent workflow
 */
async function processQuery(query) {
  const workflowLog = [];
  
  try {
    // Step 1: Discover Policy Interpreter Agent
    workflowLog.push({ step: 'discovery', status: 'started', message: 'Discovering policy-analysis agent...' });
    const policyAgents = await discoverAgents(['policy-analysis']);
    
    if (policyAgents.length === 0) {
      throw new Error('No policy interpreter agent found');
    }
    
    workflowLog.push({ step: 'discovery', status: 'complete', message: 'Policy Interpreter Agent discovered' });
    auditLogger.log('Agent discovery completed', 'System');

    // Step 2: Verify agent DID
    workflowLog.push({ step: 'verification', status: 'started', message: 'Verifying agent identity...' });
    const verified = await agents.policyInterpreter.verifyIdentity();
    
    if (!verified) {
      throw new Error('Agent identity verification failed');
    }
    
    workflowLog.push({ step: 'verification', status: 'complete', message: 'Identity verified' });
    auditLogger.log('DID verification successful', 'Policy Interpreter Agent');

    // Step 3: Analyze policy
    workflowLog.push({ step: 'analysis', status: 'started', message: 'Analyzing policy documents...' });
    const policyInfo = await agents.policyInterpreter.analyzeQuery(query);
    workflowLog.push({ step: 'analysis', status: 'complete', message: `Policy identified: ${policyInfo.name}` });
    auditLogger.log(`Policy analyzed: ${policyInfo.name}`, 'Policy Interpreter Agent');

    // Step 4: Discover Eligibility Verifier
    workflowLog.push({ step: 'discovery', status: 'started', message: 'Discovering eligibility verifier...' });
    const verifierAgents = await discoverAgents(['eligibility-check']);
    workflowLog.push({ step: 'discovery', status: 'complete', message: 'Eligibility Verifier discovered' });
    auditLogger.log('Eligibility Verifier Agent discovered', 'System');

    // Step 5: Request credentials
    workflowLog.push({ step: 'credentials', status: 'started', message: 'Requesting selective credentials...' });
    const requiredClaims = policyInfo.requiredClaims || ['Age', 'Income Range'];
    const credentialRequest = {
      requestedClaims: requiredClaims,
      requestedBy: agents.eligibilityVerifier.did,
      purpose: `${policyInfo.name} Eligibility Check`
    };
    
    workflowLog.push({ step: 'credentials', status: 'requested', credentialRequest });
    auditLogger.log(`Requested claims: ${requiredClaims.join(', ')}`, 'Eligibility Verifier Agent');

    // Step 6: Citizen shares selective claims
    workflowLog.push({ step: 'disclosure', status: 'started', message: 'Processing credential request...' });
    const disclosure = await agents.citizenAgent.shareSelectiveClaims(requiredClaims);
    workflowLog.push({ step: 'disclosure', status: 'complete', disclosure });
    auditLogger.log(`Citizen shared: ${disclosure.shared.join(', ')}`, 'Citizen Agent');
    auditLogger.log(`Privacy preserved: ${disclosure.notShared.join(', ')} not shared`, 'Citizen Agent');

    // Step 7: Verify eligibility
    workflowLog.push({ step: 'eligibility', status: 'started', message: 'Verifying eligibility...' });
    const eligibilityResult = await agents.eligibilityVerifier.checkEligibility(
      policyInfo,
      disclosure.credentials
    );
    workflowLog.push({ step: 'eligibility', status: 'complete', result: eligibilityResult });
    auditLogger.log(`Eligibility decision: ${eligibilityResult.decision}`, 'Eligibility Verifier Agent');

    // Step 8: Generate guidance
    workflowLog.push({ step: 'guidance', status: 'started', message: 'Generating application guidance...' });
    const guidance = await agents.applicationGuide.generateGuidance(eligibilityResult);
    workflowLog.push({ step: 'guidance', status: 'complete' });
    auditLogger.log('Application guidance generated', 'Application Guide Agent');

    return {
      success: true,
      workflow: workflowLog,
      credentialRequest,
      disclosure,
      eligibilityResult: {
        ...eligibilityResult,
        nextSteps: guidance.steps
      }
    };

  } catch (error) {
    console.error('Workflow error:', error);
    auditLogger.log(`Workflow error: ${error.message}`, 'System', 'error');
    return {
      success: false,
      error: error.message,
      workflow: workflowLog
    };
  }
}

// API Routes

/**
 * GET /api/agents - List all active agents
 */
app.get('/api/agents', (req, res) => {
  try {
    const agentList = Object.values(agents).map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      did: agent.did,
      verified: agent.verified,
      capabilities: agent.capabilities,
      status: agent.status
    }));
    
    res.json({ agents: agentList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/query - Process citizen query
 */
app.post('/api/query', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'Agent network not initialized' });
    }

    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    auditLogger.log(`Citizen query received: "${query}"`, 'System');
    
    const result = await processQuery(query);
    
    res.json(result);
  } catch (error) {
    console.error('Query processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/audit - Get audit log
 */
app.get('/api/audit', (req, res) => {
  try {
    res.json({ logs: auditLogger.getLogs() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agents/discover - Discover agents by capability
 */
app.post('/api/agents/discover', async (req, res) => {
  try {
    const { capabilities } = req.body;
    const discovered = await discoverAgents(capabilities);
    
    auditLogger.log(`Agent discovery: ${capabilities.join(', ')}`, 'System');
    
    res.json({ agents: discovered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: isInitialized ? 'healthy' : 'initializing',
    agents: Object.keys(agents).length,
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Start server
async function startServer() {
  try {
    await initializeAgents();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Policy Navigator server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔍 API: http://localhost:${PORT}/api`);
      console.log(`✅ Agent network: ACTIVE\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Disconnect agents
  for (const agent of Object.values(agents)) {
    if (agent.disconnect) {
      await agent.disconnect();
    }
  }
  
  console.log('✅ Cleanup complete');
  process.exit(0);
});

startServer();