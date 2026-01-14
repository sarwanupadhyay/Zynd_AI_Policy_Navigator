import React from 'react';
import { Shield, CheckCircle, Lock } from 'lucide-react';

function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="text-blue-600" size={28} />
              Policy Navigator
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Trusted AI Agents for Public Benefit Access
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded">
              <CheckCircle size={16} />
              <span className="font-medium">Agent Network Active</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded">
              <Lock size={16} />
              <span className="font-medium">Encrypted Communication Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;