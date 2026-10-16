import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Bell,
  Globe,
  ShieldCheck,
  User,
  Menu,
  X,
  FileText,
  Search,
  LayoutDashboard,
  HardHat,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Contact,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    role,
    setRole,
    activeTab,
    setActiveTab,
    notifications,
    unreadCount,
    markAsRead,
    navigateToTrack,
    user,
    login,
    logout,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'ADMIN') setActiveTab('admin');
    else if (newRole === 'OFFICER') setActiveTab('officer');
    else setActiveTab('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-lg shrink-0">
      {/* Top Tiranga Micro Ribbon */}
      <div className="h-1 w-full bg-linear-to-r from-orange-500 via-white to-emerald-600" />

      {/* Official State Banner Header */}
      <div className="bg-slate-950 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Gov of Tamil Nadu
          </span>
          <span className="hidden sm:inline">{t.portalTagline}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-500 hidden md:inline text-[11px]">
            {t.emblemSubtitle}
          </span>
          <div className="flex items-center space-x-1 bg-slate-800 rounded px-2 py-0.5 border border-slate-700">
            <Globe className="w-3 h-3 text-indigo-400" />
            <button
              onClick={() => setLanguage('en')}
              className={`text-[11px] font-medium px-1 transition-colors ${
                language === 'en' ? 'text-white font-bold underline decoration-indigo-400 underline-offset-2' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setLanguage('ta')}
              className={`text-[11px] font-medium px-1 transition-colors ${
                language === 'ta' ? 'text-white font-bold underline decoration-indigo-400 underline-offset-2' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo & Portal Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xl">
              N
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-semibold tracking-tight text-white font-sans">
                  NivaranAI <span className="text-indigo-400 text-sm font-normal">| Grievance System</span>
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.navHome}
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'file'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t.navFileComplaint}</span>
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'track'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{t.navTrack}</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.navHistory}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t.navAnalytics}</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'directory'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Contact className="w-4 h-4" />
              <span>{t.navDirectory}</span>
            </button>
          </nav>

          {/* Right Controls: Notifications & Demo Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 relative transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-1.5">
                      <Bell className="w-4 h-4 text-blue-700" />
                      <span className="font-semibold text-sm text-slate-800">
                        {language === 'ta' ? 'அறிவிப்புகள்' : 'Live Notifications'}
                      </span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} {language === 'ta' ? 'புதியவை' : 'unread'}
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {language === 'ta' ? 'புதிய அறிவிப்புகள் இல்லை' : 'No notifications yet'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            navigateToTrack(n.grievanceId);
                            setIsNotifOpen(false);
                          }}
                          className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.read ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-1.5">
                              {n.type === 'resolution' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                              )}
                              <p className="text-xs font-bold text-slate-800">
                                {language === 'ta' ? n.titleTa : n.title}
                              </p>
                            </div>
                            <span className="text-[10px] text-blue-700 font-mono font-semibold">
                              {n.grievanceId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {language === 'ta' ? n.messageTa : n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Button */}
            <div className="hidden sm:flex items-center">
              {user ? (
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition-colors"
                >
                  <img src={user.photoURL || ''} alt="User" className="w-5 h-5 rounded-full bg-slate-600" />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Role Switcher Pill Bar */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => handleRoleChange('CITIZEN')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center space-x-1 ${
                  role === 'CITIZEN'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Citizen view"
              >
                <User className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">{t.roleCitizen}</span>
              </button>
              <button
                onClick={() => handleRoleChange('OFFICER')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center space-x-1 ${
                  role === 'OFFICER'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Field Officer Desk"
              >
                <HardHat className="w-3.5 h-3.5 text-orange-300" />
                <span className="hidden sm:inline">{t.roleOfficer}</span>
              </button>
              <button
                onClick={() => handleRoleChange('ADMIN')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center space-x-1 ${
                  role === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Admin Command Center"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-green-300" />
                <span className="hidden sm:inline">{t.roleAdmin}</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            <button
              onClick={() => {
                setActiveTab('home');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              {t.navHome}
            </button>
            <button
              onClick={() => {
                setActiveTab('file');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50"
            >
              {t.navFileComplaint}
            </button>
            <button
              onClick={() => {
                setActiveTab('track');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              {t.navTrack}
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              {t.navHistory}
            </button>
            <button
              onClick={() => {
                setActiveTab('directory');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              {t.navDirectory}
            </button>
            <button
              onClick={() => {
                setActiveTab('analytics');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              {t.navAnalytics}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
