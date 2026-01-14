import React, { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

function AuditTimeline({ logs }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock size={18} />
          Trust & Audit Timeline
        </h2>
        <p className="text-xs text-gray-600 mt-1">Chronological action log</p>
      </div>
      
      <div className="p-4">
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No activity yet
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="border-l-2 border-gray-300 pl-3 pb-3 animate-fadeIn"
              >
                <div className="text-xs text-gray-500 mb-1">
                  {entry.time || new Date(entry.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {entry.agent}
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {entry.action}
                </div>
                {entry.status === 'error' && (
                  <div className="text-xs text-red-600 mt-1">● Error</div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditTimeline;