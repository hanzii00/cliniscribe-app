"use client";

import { Eye, EyeClosed } from "lucide-react";
import { useState } from "react";

interface Props {
  setError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSuccess: () => void;
}

export default function RegisterForm({
  setError,
  loading,
  setLoading,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== password2) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            password2,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.email?.[0] ||
            data.password?.[0] ||
            "Registration failed"
        );
        return;
      }

      alert("Registration successful! Check your email to verify.");
      onSuccess();
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-700";

  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="relative">
        <label className={labelClass}>Password</label>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass + " pr-10"}
          required
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute top-1/2 right-3 text-gray-400 hover:text-gray-600 hover:cursor-pointer"
        >
          {showPassword ? <EyeClosed className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative">
        <label className={labelClass}>Confirm Password</label>
        <input
          type={showPassword2 ? "text" : "password"}
          placeholder="Confirm password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className={inputClass + " pr-10"}
          required
        />

        <button
          type="button"
          onClick={() => setShowPassword2(!showPassword2)}
          className="absolute top-1/2 right-3 text-gray-400 hover:text-gray-600 hover:cursor-pointer"
        >
          {showPassword2 ? <EyeClosed className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 font-medium transition-colors hover:cursor-pointer disabled:bg-gray-400"
      >
        {loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
}