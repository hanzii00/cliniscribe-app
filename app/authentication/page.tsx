"use client";

import { useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { CircleAlertIcon, CircleX } from "lucide-react";

export default function AuthPage() {
  const [activeView, setActiveView] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = activeView === "login";

  return (
    <div className="w-screen h-screen bg-white flex">
      <div className="w-1/2 h-full flex flex-col p-10 pl-18 space-y-8">
        <div className="text-gray-800 mb-20 flex space-x-4 items-center">
          {/* <img src="" alt="" /> */}
          <div className="w-15 h-15 rounded bg-gradient-to-b from-blue-500 to-blue-700"></div>
          <div>
            <h1 className="font-bold text-lg">
              <span className="text-blue-500">Synchro</span>
              <span className="text-blue-700">Nurse</span>
            </h1>
            <p className="text-xs">Nursing Narratives, Synchronized</p>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-blue-700">
            {isLogin ? "Login to Dashboard" : "Register an Account"}
          </h1>

          <p className="text-gray-900 font-light">
            {isLogin
              ? "Welcome back! Please login to continue"
              : "Create your account to get started"}
          </p>
        </div>

        {isLogin ? (
          <LoginForm
            setError={setError}
            loading={loading}
            setLoading={setLoading}
          />
        ) : (
          <RegisterForm
            setError={setError}
            loading={loading}
            setLoading={setLoading}
            onSuccess={() => setActiveView("login")}
          />
        )}

        {error && (
          <div className="text-red-700 flex items-center justify-center gap-1"><CircleX className="w-4 h-4"/>{error}</div>
        )}

        <div className="text-center text-gray-900 font-light">
          {isLogin ? (
            <>
              Don't have an account?
              <button
                onClick={() => {
                  setError("");
                  setActiveView("register");
                }}
                className="ml-7 text-blue-700 hover:underline font-normal hover:cursor-pointer"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?
              <button
                onClick={() => {
                  setError("");
                  setActiveView("login");
                }}
                className="ml-7 text-blue-700 hover:underline font-normal hover:cursor-pointer"
              >
                Login
              </button>
            </>
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

      <div className="w-1/2 h-full flex items-center justify-center p-7">
        <div className="w-full h-full flex items-center justify-center rounded-md bg-blue-100 text-black">
          FeatureSlider ni ari, edit ra ata ta para ani later
        </div>
      </div>
    </div>
  );
}
