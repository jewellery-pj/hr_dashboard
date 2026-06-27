import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { filterInputClass } from './OperationalLayout';

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user.username);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 pt-10 pb-7 border-b border-slate-100 text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">29 JEWELLERY</h1>
            <p className="text-base font-bold text-slate-700 mt-3">HR Executive Dashboard 2.0</p>
            <p className="text-sm text-slate-500 mt-2">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-1">
              <label htmlFor="username" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className={`${filterInputClass} pl-9`}
                  placeholder="Username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${filterInputClass} pl-9`}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">HR Analytics · Live sheet data</p>
      </div>
    </div>
  );
}
