// components/UserMenu.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, X, Mail, Calendar, Shield, ChevronDown } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_verified?: boolean;
  date_joined?: string;
}

interface UserMenuProps {
  onLogout: () => void;
}

export default function UserMenu({ onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { ApiService } = await import('@/lib/api');
      const data = await ApiService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    setIsOpen(false);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  const getInitials = () => {
    if (!profile) return '?';
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile.username.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (!profile) return 'User';
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.username;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* User Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
          aria-label="User menu"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:shadow-lg transition-shadow">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                getInitials()
              )}
            </div>
            {profile?.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Name and Arrow */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">{getDisplayName()}</div>
              <div className="text-xs text-gray-500">{profile?.email || 'Loading...'}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User Info Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-4 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{getDisplayName()}</div>
                  <div className="text-indigo-100 text-sm truncate">{profile?.email}</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">View Profile</div>
                  <div className="text-xs text-gray-500">Account details</div>
                </div>
              </button>
              
              <div className="border-t border-gray-100 my-2"></div>
              
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <LogOut className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Sign Out</div>
                  <div className="text-xs text-red-400">End your session</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header with Gradient */}
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-8">
              <button
                onClick={handleCloseProfile}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl border-4 border-white/30 shadow-xl mb-3">
                  {getInitials()}
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{getDisplayName()}</h2>
                <p className="text-indigo-100 text-sm">@{profile?.username}</p>
                {profile?.is_verified && (
                  <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                    <Shield className="w-3.5 h-3.5 text-green-300" />
                    <span className="text-xs font-medium text-green-100">Verified Account</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-200 border-t-indigo-600"></div>
                </div>
              ) : profile ? (
                <>
                  {/* Email */}
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Email Address
                      </label>
                      <p className="mt-1 text-sm text-gray-900 truncate">{profile.email}</p>
                    </div>
                  </div>

                  {/* Full Name */}
                  {(profile.first_name || profile.last_name) && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Full Name
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Not set'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Join Date */}
                  {profile.date_joined && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Member Since
                        </label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(profile.date_joined)}</p>
                      </div>
                    </div>
                  )}

                  {/* User ID (compact) */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">User ID</span>
                      <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">#{profile.id}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Failed to load profile</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleCloseProfile}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloseProfile();
                  handleLogoutClick();
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}