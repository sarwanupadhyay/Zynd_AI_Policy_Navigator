import React from 'react';
import { Users, CheckCircle } from 'lucide-react';

function AgentNetwork({ agents, setAgents }) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users size={18} />
          Agent Network
        </h2>
        <p className="text-xs text-gray-600 mt-1">Verified autonomous agents</p>
      </div>
      
      <div className="p-4 space-y-3">
        {agents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No agents available
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              className={`border rounded-lg p-3 transition-all ${
                agent.status === 'active'
                  ? 'border-blue-400 bg-blue-50'
                  : agent.status === 'discovering'
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-600">{agent.role}</div>
                </div>
                {agent.verified && (
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0"
                  />
                )}
              </div>
              
              <div className="text-xs text-gray-500 mb-2">
                <span className="font-mono">{agent.did}</span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {agent.capabilities &&
                  agent.capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                    >
                      {cap}
                    </span>
                  ))}
              </div>
              
              {agent.status !== 'idle' && (
                <div className="mt-2 text-xs font-medium">
                  {agent.status === 'active' && (
                    <span className="text-blue-600">● Active</span>
                  )}
                  {agent.status === 'discovering' && (
                    <span className="text-yellow-600">● Discovering</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AgentNetwork;