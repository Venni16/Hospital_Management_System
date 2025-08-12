import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Lock, HeartPulse, AlertCircle, Eye, EyeOff } from 'lucide-react';
import ForgotPassword from './ForgotPassword';

export default function Login() {
  const { login, loading } = useApp();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!credentials.username.trim() || !credentials.password.trim()) {
      setLocalError('Please enter both username and password');
      return;
    }

    const success = await login(credentials.username, credentials.password);
    if (!success) {
      setLocalError('Invalid username or password');
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    if (localError) setLocalError('');
  };

  if (showForgotPassword) {
    return <ForgotPassword onClose={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/src/assets/HMS_BACK.png')`,
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600/90 backdrop-blur-sm p-3 rounded-full">
              <HeartPulse className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Hospital Management System</h1>
          <p className="mt-2 text-white/90 drop-shadow">Welcome back! Please sign in to your account</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">Sign In</h2>
            <p className="text-white/80 text-sm mt-1">Enter your credentials to access your account</p>
          </div>

          {localError && (
            <div className="bg-red-500/20 border-l-4 border-red-400 text-white p-4 mb-6 rounded flex items-center">
              <AlertCircle className="h-5 w-5  mr-2 flex-shrink-0" />
              <span className="text-sm">{localError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pl-12 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors placeholder-white/60"
                  placeholder="Enter your username"
                />
                <User className="h-5 w-5 text-gray/70 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pl-12 pr-12 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors placeholder-white/60"
                  placeholder="Enter your password"
                />
                <Lock className="h-5 w-5 text-gray/70 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-white/30 bg-white/10 text-blue-400 focus:ring-blue-400" />
                <span className="ml-2 text-sm text-white/80">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-300 hover:text-blue-200 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500/80 backdrop-blur-sm text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600/80 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/80">
              Need an account? Contact your administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
