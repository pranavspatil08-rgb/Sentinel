import React, { useState } from 'react';
import { Shield, User, Lock, AlertTriangle, Clock, Eye, EyeOff } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: { username: string; role: 'Admin' | 'Investigator' }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccess, setShowDemoAccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please verify credentials.');
        if (data.lockoutSeconds) {
          setLockoutSeconds(data.lockoutSeconds);
        }
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.user);
    } catch {
      setErrorMessage('Server connection error. Please ensure backend is running.');
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#F4F3EF] text-[#171B1F]">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-6 sm:p-8 relative text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DCDAD4] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-[#171B1F] flex items-center justify-center text-white shrink-0">
              <Shield className="w-5 h-5 text-[#D9822B]" />
            </div>
            <div>
              <div className="text-base font-bold tracking-wider text-[#171B1F]">SENTINEL</div>
              <div className="text-xs text-[#88857C]">Police CCTV Intelligence Workstation</div>
            </div>
          </div>
          {/* Demonstration Environment Tag */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-xs font-mono bg-[#FFFBEB] text-[#D9822B] border border-[#DCDAD4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9822B]" />
            <span>Demonstration</span>
          </span>
        </div>

        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[#171B1F]">Operator Sign In</h2>
          <p className="text-xs text-[#88857C] mt-0.5">
            Maharashtra Police – Authorised personnel only
          </p>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-[4px] bg-[#FEF2F2] border border-[#DC2626] text-[#DC2626] text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-medium">{errorMessage}</span>
              {lockoutSeconds && (
                <div className="text-xs text-[#DC2626] flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Rate limiting active. Retry in {lockoutSeconds}s.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#171B1F] mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#88857C]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-[#FFFFFF] text-[#171B1F] text-xs pl-9 pr-3 py-2.5 rounded-[4px] border border-[#DCDAD4] focus:outline-none focus:border-[#D9822B] focus:ring-1 focus:ring-[#D9822B] placeholder:text-[#88857C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#171B1F] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#88857C]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#FFFFFF] text-[#171B1F] text-xs pl-9 pr-10 py-2.5 rounded-[4px] border border-[#DCDAD4] focus:outline-none focus:border-[#D9822B] focus:ring-1 focus:ring-[#D9822B] placeholder:text-[#88857C]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#88857C] hover:text-[#171B1F] p-0.5 rounded-[2px]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#171B1F] text-white font-medium text-xs rounded-[4px] hover:bg-[#252B32] transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo Credentials Hidden Behind a Link */}
        <div className="mt-5 pt-3 border-t border-[#DCDAD4] text-left">
          <button
            type="button"
            onClick={() => setShowDemoAccess(!showDemoAccess)}
            className="text-xs text-[#171B1F] font-medium underline hover:text-[#D9822B] cursor-pointer"
          >
            {showDemoAccess ? 'Hide demo access' : 'Show demo access'}
          </button>

          {showDemoAccess && (
            <div className="mt-3 p-3 bg-[#FAFAF8] rounded-[4px] border border-[#DCDAD4] space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#DCDAD4]">
                <span className="font-semibold text-[#171B1F]">Demonstration Operator Accounts</span>
                <span className="text-xs font-mono text-[#88857C]">Local Auth</span>
              </div>

              {/* Investigator Account */}
              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-[2px] border border-[#DCDAD4]">
                <div className="min-w-0">
                  <div className="font-semibold text-[#171B1F]">Investigator Terminal</div>
                  <div className="font-mono text-xs text-[#6F7379]">
                    User: <span className="font-bold text-[#171B1F]">investigator</span> / Pass: <span className="font-bold text-[#171B1F]">investigator123</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('investigator', 'investigator123')}
                  className="px-2 py-1 rounded-[2px] border border-[#DCDAD4] text-xs font-medium hover:bg-[#F4F3EF] cursor-pointer shrink-0"
                >
                  Autofill
                </button>
              </div>

              {/* Admin Account */}
              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-[2px] border border-[#DCDAD4]">
                <div className="min-w-0">
                  <div className="font-semibold text-[#171B1F]">Admin Supervisor</div>
                  <div className="font-mono text-xs text-[#6F7379]">
                    User: <span className="font-bold text-[#171B1F]">admin</span> / Pass: <span className="font-bold text-[#171B1F]">admin123</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('admin', 'admin123')}
                  className="px-2 py-1 rounded-[2px] border border-[#DCDAD4] text-xs font-medium hover:bg-[#F4F3EF] cursor-pointer shrink-0"
                >
                  Autofill
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
