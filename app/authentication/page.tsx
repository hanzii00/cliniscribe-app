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

export default function AuthDemo() {
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

  // REGISTER -------------------------------------------------------

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

  // LOGIN -------------------------------------------------------

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

  // INPUT STYLE
  const inputClass =
    "w-full p-3 border border-gray-300 rounded-md bg-transparent " +
    "text-gray-900 placeholder-gray-500 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Auth Demo</h1>

        <div className="space-y-4">

          {/* TAB BUTTONS */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 rounded-md font-medium ${
                activeTab === 'login'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Login
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 rounded-md font-medium ${
                activeTab === 'register'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">

              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className={inputClass}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={inputClass}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition font-medium"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className={inputClass}
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={inputClass}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={inputClass}
                required
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={regPassword2}
                onChange={(e) => setRegPassword2(e.target.value)}
                className={inputClass}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition font-medium"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
