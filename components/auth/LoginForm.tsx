"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthTokens } from "@/lib/auth";
import { Eye, EyeClosed } from "lucide-react";

interface Props {
  setError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export default function LoginForm({ setError, loading, setLoading }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      const auth = data as AuthTokens;
      localStorage.setItem("access_token", auth.access);
      localStorage.setItem("refresh_token", auth.refresh);

      router.push("/main");
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
    <form onSubmit={handleLogin} className="space-y-5">
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
          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:cursor-pointer"
        >
          {showPassword ? (
            <EyeClosed className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>

        <div className="text-right mt-2 -mb-3">
          <button
            type="button"
            className="text-blue-700 hover:underline text-sm hover:cursor-pointer"
            onClick={() => alert("Forgot password clicked!")}
          >
            Forgot password?
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 font-medium transition-colors hover:cursor-pointer disabled:bg-gray-400"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
