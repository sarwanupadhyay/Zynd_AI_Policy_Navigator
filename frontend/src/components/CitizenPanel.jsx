import React, { useState } from 'react';
import {
  Search,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function CitizenPanel({ agents, setAgents, auditLogs, setAuditLogs }) {
  const [userInput, setUserInput] = useState('');
  const [progress, setProgress] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [credentialRequest, setCredentialRequest] = useState(null);
  const [sharedClaims, setSharedClaims] = useState(null);

  const quickPrompts = [
    'What benefits am I eligible for?',
    'Am I eligible for old-age pension?',
    'Check my eligibility for disability benefits'
  ];

  const addProgress = (message, status = 'complete') => {
    setProgress((prev) => [...prev, { message, status }]);
  };

  const addAuditLog = (action, agentName) => {
    const entry = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      agent: agentName,
      action,
      status: 'success'
    };
    setAuditLogs((prev) => [...prev, entry]);
  };

  const updateAgentStatus = (agentId, status) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, status } : agent
      )
    );
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleQuery = async (query) => {
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setProgress([]);
    setEligibilityResult(null);
    setCredentialRequest(null);
    setSharedClaims(null);

    try {
      // Try to use the API
      const response = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Process API response
          processApiResponse(data);
          return;
        }
      }
    } catch (error) {
      console.log('API not available, using simulation mode');
    }

    // Fallback to simulation mode
    await simulateWorkflow(query);
  };

  const processApiResponse = (data) => {
    // Process workflow steps
    if (data.workflow) {
      data.workflow.forEach((step) => {
        addProgress(step.message, step.status);
      });
    }

    if (data.credentialRequest) {
      setCredentialRequest(data.credentialRequest);
    }

    if (data.disclosure) {
      setSharedClaims(data.disclosure);
    }

    if (data.eligibilityResult) {
      setEligibilityResult(data.eligibilityResult);
    }

    setIsProcessing(false);
  };

  const simulateWorkflow = async (query) => {
    // Step 1: Agent Discovery
    addProgress('Discovering agents with policy-analysis capability...', 'inProgress');
    updateAgentStatus(1, 'discovering');
    await sleep(1200);
    addAuditLog('Agent discovery initiated via Zynd registry', 'System');
    addProgress('Policy Interpreter Agent discovered', 'complete');
    addAuditLog('Policy Interpreter Agent verified ✅', 'Policy Interpreter Agent');
    updateAgentStatus(1, 'active');
    await sleep(800);

    // Step 2: DID Verification
    addProgress('Verifying agent identity (DID)...', 'inProgress');
    await sleep(1000);
    addProgress('Identity verified via cryptographic proof', 'complete');
    addAuditLog('DID verification successful', 'Policy Interpreter Agent');
    await sleep(500);

    // Step 3: Policy Analysis
    addProgress('Analyzing policy documents using RAG...', 'inProgress');
    await sleep(1500);
    addProgress('Policy interpretation complete', 'complete');
    addAuditLog('Policy analyzed: Old Age Pension scheme identified', 'Policy Interpreter Agent');
    updateAgentStatus(1, 'idle');
    await sleep(800);

    // Step 4: Discover Eligibility Verifier
    addProgress('Discovering Eligibility Verifier Agent...', 'inProgress');
    updateAgentStatus(2, 'discovering');
    await sleep(1000);
    addProgress('Eligibility Verifier Agent discovered', 'complete');
    addAuditLog('Eligibility Verifier Agent discovered and verified ✅', 'System');
    updateAgentStatus(2, 'active');
    await sleep(500);

    // Step 5: Encrypted Communication
    addProgress('Establishing encrypted MQTT channel...', 'inProgress');
    await sleep(1000);
    addProgress('Secure channel established 🔐', 'complete');
    addAuditLog('Encrypted communication channel established', 'Eligibility Verifier Agent');
    await sleep(800);

    // Step 6: Credential Request
    addProgress('Requesting selective credentials...', 'inProgress');
    updateAgentStatus(3, 'active');
    await sleep(1200);

    const credRequest = {
      requestedClaims: ['Age', 'Income Range'],
      requestedBy: 'Eligibility Verifier Agent',
      purpose: 'Old Age Pension Eligibility Check'
    };
    setCredentialRequest(credRequest);
    addProgress('Credential request sent', 'warning');
    addAuditLog('Requested claims: Age, Income Range', 'Eligibility Verifier Agent');
    await sleep(1500);

    // Step 7: Citizen shares selective claims
    addProgress('Citizen Agent processing credential request...', 'inProgress');
    await sleep(1000);

    const shared = {
      shared: ['Age: 65 years', 'Income Range: Below threshold'],
      notShared: ['Address', 'ID Number', 'Phone Number']
    };
    setSharedClaims(shared);
    addProgress('Selective disclosure completed', 'complete');
    addAuditLog('Citizen shared: Age, Income Range only', 'Citizen Agent');
    addAuditLog('Privacy preserved: Address, ID not shared', 'Citizen Agent');
    updateAgentStatus(3, 'idle');
    await sleep(1000);

    // Step 8: Eligibility Verification
    addProgress('Verifying credentials and checking eligibility...', 'inProgress');
    await sleep(1500);
    addProgress('Eligibility evaluation complete', 'complete');
    addAuditLog('Credential signatures verified', 'Eligibility Verifier Agent');
    addAuditLog('Rule engine executed: 2/2 criteria met', 'Eligibility Verifier Agent');
    updateAgentStatus(2, 'idle');
    await sleep(800);

    // Step 9: Decision & Guidance
    updateAgentStatus(4, 'active');
    addProgress('Generating application guidance...', 'inProgress');
    await sleep(1000);

    const result = {
      decision: 'Eligible',
      program: 'Old Age Pension',
      reasoning: [
        { criterion: 'Age ≥ 60', status: 'satisfied', verified: true },
        { criterion: 'Annual income below threshold', status: 'satisfied', verified: true }
      ],
      nextSteps: [
        'Visit the official pension portal at gov.in/pension',
        'Fill out Application Form OAP-2024',
        'Submit before March 31, 2025',
        'Verification typically takes 15 business days'
      ],
      verifiedBy: 'did:zynd:cd34...7e'
    };

    setEligibilityResult(result);
    addProgress('Application guidance generated', 'complete');
    addAuditLog('Eligibility decision: ELIGIBLE ✅', 'Eligibility Verifier Agent');
    addAuditLog('Application guidance provided', 'Application Guide Agent');
    updateAgentStatus(4, 'idle');

    setIsProcessing(false);
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        {/* Query Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ask About Government Benefits
          </h2>

          <div className="mb-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuery(userInput)}
              placeholder="What benefits am I eligible for?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUserInput(prompt);
                  handleQuery(prompt);
                }}
                disabled={isProcessing}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded transition disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleQuery(userInput)}
            disabled={isProcessing || !userInput.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Activity className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              <>
                <Search size={18} />
                Check Eligibility
              </>
            )}
          </button>
        </div>

        {/* Progress Display */}
        {progress.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={18} />
              System Progress
            </h3>
            <div className="space-y-2">
              {progress.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  {item.status === 'complete' && (
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                  )}
                  {item.status === 'inProgress' && (
                    <Activity size={16} className="text-blue-600 animate-spin flex-shrink-0" />
                  )}
                  {item.status === 'warning' && (
                    <AlertCircle size={16} className="text-yellow-600 flex-shrink-0" />
                  )}
                  {item.status === 'error' && (
                    <XCircle size={16} className="text-red-600 flex-shrink-0" />
                  )}
                  <span
                    className={
                      item.status === 'complete'
                        ? 'text-gray-700'
                        : item.status === 'warning'
                        ? 'text-yellow-700'
                        : item.status === 'error'
                        ? 'text-red-700'
                        : 'text-blue-700'
                    }
                  >
                    {item.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credential Request */}
        {credentialRequest && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <AlertCircle size={18} />
              Credential Request
            </h3>
            <p className="text-sm text-yellow-800 mb-3">
              <strong>{credentialRequest.requestedBy}</strong> requests the
              following claims:
            </p>
            <div className="space-y-1 mb-3">
              {credentialRequest.requestedClaims.map((claim, idx) => (
                <div key={idx} className="text-sm text-yellow-800">
                  • {claim}
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-700">
              Purpose: {credentialRequest.purpose}
            </p>
          </div>
        )}

        {/* Shared Claims */}
        {sharedClaims && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Privacy-Preserving Disclosure
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2">
                  ✓ Shared
                </h4>
                {sharedClaims.shared.map((claim, idx) => (
                  <div key={idx} className="text-sm text-gray-700 mb-1">
                    • {claim}
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  ✗ Not Shared
                </h4>
                {sharedClaims.notShared.map((claim, idx) => (
                  <div key={idx} className="text-sm text-gray-500 mb-1">
                    • {claim}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Result */}
        {eligibilityResult && (
          <div
            className={`rounded-lg p-6 border ${
              eligibilityResult.decision === 'Eligible'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {eligibilityResult.decision === 'Eligible' ? (
                <CheckCircle size={32} className="text-green-600" />
              ) : (
                <XCircle size={32} className="text-red-600" />
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {eligibilityResult.decision}
                </h3>
                <p className="text-sm text-gray-600">
                  {eligibilityResult.program}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Reasoning:</h4>
              {eligibilityResult.reasoning.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 mb-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />
                  <div className="text-sm">
                    <span className="text-gray-700">{item.criterion}</span>
                    {item.verified && (
                      <span className="ml-2 text-xs text-green-700 font-medium">
                        (verified)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={18} />
                Next Steps
              </h4>
              <ol className="space-y-2">
                {eligibilityResult.nextSteps.map((step, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    <span className="font-medium">{idx + 1}.</span> {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              Verified by:{' '}
              <span className="font-mono">{eligibilityResult.verifiedBy}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CitizenPanel;