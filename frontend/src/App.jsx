import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AgentNetwork from './components/AgentNetwork';
import CitizenPanel from './components/CitizenPanel';
import AuditTimeline from './components/AuditTimeline';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function App() {
  const [agents, setAgents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetchAgents();
    fetchAuditLogs();
    
    const interval = setInterval(() => {
      fetchAuditLogs();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents`);
      const data = await response.json();
      setAgents(data.agents || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // Use mock data if API fails
      setAgents(getMockAgents());
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/audit`);
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const getMockAgents = () => [
    {
      id: 1,
      name: 'Policy Interpreter Agent',
      role: 'Policy Analysis',
      did: 'did:zynd:ab12...9f',
      verified: true,
      capabilities: ['policy-analysis', 'rag', 'document-parsing'],
      status: 'idle'
    },
    {
      id: 2,
      name: 'Eligibility Verifier Agent',
      role: 'Credential Verification',
      did: 'did:zynd:cd34...7e',
      verified: true,
      capabilities: ['credential-verification', 'rule-engine', 'eligibility-check'],
      status: 'idle'
    },
    {
      id: 3,
      name: 'Citizen Agent',
      role: 'Identity & Privacy',
      did: 'did:zynd:ef56...3d',
      verified: true,
      capabilities: ['identity-management', 'credential-holder'],
      status: 'idle'
    },
    {
      id: 4,
      name: 'Application Guide Agent',
      role: 'Process Assistance',
      did: 'did:zynd:gh78...1c',
      verified: true,
      capabilities: ['guidance', 'form-assistance'],
      status: 'idle'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing agent network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <AgentNetwork agents={agents} setAgents={setAgents} />
        <CitizenPanel 
          agents={agents} 
          setAgents={setAgents}
          auditLogs={auditLogs}
          setAuditLogs={setAuditLogs}
        />
        <AuditTimeline logs={auditLogs} />
      </div>
    </div>
  );
}

export default App;