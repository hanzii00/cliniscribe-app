'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
}

interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export default function AuthForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (regPassword !== regPassword2) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
          password2: regPassword2,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.username?.[0] ||
          data.email?.[0] ||
          data.password?.[0] ||
          'Registration failed'
        );
        return;
      }

      alert('Registration successful! Check your email to verify.');

      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setRegPassword2('');
      setActiveTab('login');
    } catch {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }

      const auth = data as AuthTokens;

      localStorage.setItem('access_token', auth.access);
      localStorage.setItem('refresh_token', auth.refresh);

      router.push('/main');
    } catch {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full h-11 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {activeTab === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-gray-600 mt-1">
            {activeTab === 'login'
              ? 'Enter your credentials to continue'
              : 'Fill in your details to get started'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {/* Tab Buttons */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  placeholder="johndoe"
                  value={regUsername}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegUsername(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegEmail(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegPassword(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-password2" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="reg-password2"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword2}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegPassword2(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {activeTab === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-indigo-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-indigo-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
