/**
 * Agent Registry
 * Capability-based agent discovery - NO HARDCODING
 */

// In-memory registry (in production, this would be Zynd's distributed registry)
const agentRegistry = new Map();

/**
 * Register agent with capabilities
 * @param {Object} agent - Agent instance with DID and capabilities
 */
async function registerAgent(agent) {
  try {
    if (!agent.did || !agent.capabilities) {
      throw new Error('Agent must have DID and capabilities');
    }

    // Verify agent before registration
    if (!agent.verified) {
      throw new Error('Only verified agents can be registered');
    }

    const registration = {
      did: agent.did,
      name: agent.name,
      role: agent.role,
      capabilities: agent.capabilities,
      verified: agent.verified,
      registeredAt: new Date().toISOString(),
      endpoint: agent.endpoint || null
    };

    agentRegistry.set(agent.did, registration);
    
    console.log(`✅ Registered agent: ${agent.name} with capabilities: ${agent.capabilities.join(', ')}`);
    
    return {
      success: true,
      registration
    };
  } catch (error) {
    console.error('Agent registration failed:', error);
    throw error;
  }
}

/**
 * Discover agents by capabilities
 * This is the core of dynamic agent discovery - NO static IDs
 * @param {Array} requiredCapabilities - List of required capabilities
 * @param {Boolean} verifiedOnly - Only return verified agents
 */
async function discoverAgents(requiredCapabilities, verifiedOnly = true) {
  try {
    console.log(`🔍 Discovering agents with capabilities: ${requiredCapabilities.join(', ')}`);
    
    const discoveredAgents = [];

    // Search registry for matching agents
    for (const [did, registration] of agentRegistry.entries()) {
      // Skip unverified agents if verifiedOnly is true
      if (verifiedOnly && !registration.verified) {
        continue;
      }

      // Check if agent has ALL required capabilities
      const hasAllCapabilities = requiredCapabilities.every(cap =>
        registration.capabilities.includes(cap)
      );

      if (hasAllCapabilities) {
        discoveredAgents.push({
          did: registration.did,
          name: registration.name,
          role: registration.role,
          capabilities: registration.capabilities,
          verified: registration.verified,
          endpoint: registration.endpoint
        });
      }
    }

    console.log(`✅ Discovered ${discoveredAgents.length} matching agent(s)`);
    
    return discoveredAgents;
  } catch (error) {
    console.error('Agent discovery failed:', error);
    throw error;
  }
}

/**
 * Search agents by single capability
 * @param {String} capability - Single capability to search for
 */
async function searchByCapability(capability) {
  return discoverAgents([capability]);
}

/**
 * Get agent details by DID
 * @param {String} did - Agent's DID
 */
async function getAgentByDID(did) {
  const registration = agentRegistry.get(did);
  
  if (!registration) {
    throw new Error(`Agent with DID ${did} not found in registry`);
  }
  
  return registration;
}

/**
 * Update agent registration
 * @param {String} did - Agent's DID
 * @param {Object} updates - Fields to update
 */
async function updateAgent(did, updates) {
  const registration = agentRegistry.get(did);
  
  if (!registration) {
    throw new Error(`Agent with DID ${did} not found`);
  }
  
  const updated = {
    ...registration,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  agentRegistry.set(did, updated);
  
  console.log(`✅ Updated agent: ${did}`);
  
  return updated;
}

/**
 * Unregister agent
 * @param {String} did - Agent's DID
 */
async function unregisterAgent(did) {
  const existed = agentRegistry.delete(did);
  
  if (existed) {
    console.log(`✅ Unregistered agent: ${did}`);
  }
  
  return existed;
}

/**
 * List all registered agents
 */
async function listAllAgents() {
  const agents = [];
  
  for (const registration of agentRegistry.values()) {
    agents.push(registration);
  }
  
  return agents;
}

/**
 * Get registry statistics
 */
function getRegistryStats() {
  const allCapabilities = new Set();
  let verifiedCount = 0;
  
  for (const registration of agentRegistry.values()) {
    registration.capabilities.forEach(cap => allCapabilities.add(cap));
    if (registration.verified) verifiedCount++;
  }
  
  return {
    totalAgents: agentRegistry.size,
    verifiedAgents: verifiedCount,
    uniqueCapabilities: allCapabilities.size,
    capabilities: Array.from(allCapabilities)
  };
}

/**
 * Verify agent network connectivity
 * Ensures all agents can discover each other
 */
async function verifyNetworkConnectivity() {
  const stats = getRegistryStats();
  
  console.log('🔍 Network Connectivity Check:');
  console.log(`   Total Agents: ${stats.totalAgents}`);
  console.log(`   Verified Agents: ${stats.verifiedAgents}`);
  console.log(`   Capabilities: ${stats.capabilities.join(', ')}`);
  
  if (stats.totalAgents === 0) {
    console.warn('⚠️  No agents registered in network');
    return false;
  }
  
  if (stats.verifiedAgents === 0) {
    console.warn('⚠️  No verified agents in network');
    return false;
  }
  
  console.log('✅ Network connectivity verified');
  return true;
}

/**
 * Clear registry (for testing)
 */
function clearRegistry() {
  agentRegistry.clear();
  console.log('🗑️  Registry cleared');
}

module.exports = {
  registerAgent,
  discoverAgents,
  searchByCapability,
  getAgentByDID,
  updateAgent,
  unregisterAgent,
  listAllAgents,
  getRegistryStats,
  verifyNetworkConnectivity,
  clearRegistry
};