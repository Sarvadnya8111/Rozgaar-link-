
import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, User, Store, LogOut, LogIn, Bell, X, CheckCircle, AlertCircle, Info, Clock, BellRing, CheckCheck, Globe, HelpCircle } from 'lucide-react';
import { ViewState, UserRole, Notification, Language } from '../types';
import { storageService } from '../services/storageService';
import { DASHBOARD_DATA } from '../data/localization';
import { VoiceBtn } from './VoiceBtn';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  userRole?: UserRole;
  onLogout: () => void;
  onLogin: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, userRole, onLogout, onLogin, language, setLanguage }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined);
  const notificationRef = useRef<HTMLDivElement>(null);
  const t = DASHBOARD_DATA.data.bottom_navigation_bar;
  
  // Real-time notification subscription
  useEffect(() => {
    const user = storageService.getCurrentUser();
    setUserAvatar(user?.profile?.profilePic);

    if (!user) return;

    const fetchNotifications = () => {
        const notifs = storageService.getNotifications(user.id);
        setNotifications(notifs);
        // Also update avatar if profile changes
        const currentUser = storageService.getCurrentUser();
        if(currentUser?.profile?.profilePic !== userAvatar) {
            setUserAvatar(currentUser?.profile?.profilePic);
        }
    };

    fetchNotifications();
    const unsubscribe = storageService.subscribe(fetchNotifications);
    
    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setShowNotifications(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        unsubscribe();
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userRole, userAvatar]); // Re-run if user role or avatar state changes locally

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = (id: string) => {
      storageService.markNotificationRead(id);
      // Local update happens via subscription automatically, but instant feedback is good
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
      const user = storageService.getCurrentUser();
      if (!user) return;
      storageService.markAllNotificationsRead(user.id);
  };

  const getRelativeTime = (timestamp: number) => {
      const now = Date.now();
      const diff = now - timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
  };

  const getIcon = (type: string) => {
    switch (type) {
        case 'success': return <div className="p-2 bg-green-100 rounded-full text-green-600"><CheckCircle className="h-4 w-4" /></div>;
        case 'alert': return <div className="p-2 bg-red-100 rounded-full text-red-600"><AlertCircle className="h-4 w-4" /></div>;
        default: return <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Info className="h-4 w-4" /></div>;
    }
  };

  const toggleLang = () => {
      if (language === 'en') setLanguage('hi');
      else if (language === 'hi') setLanguage('mr');
      else setLanguage('en');
  };

  return (
    <nav className="bg-slate-900 text-white shadow-none sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => setView('JOB_BOARD')}>
            <div className="bg-lime-400 p-2 rounded-xl mr-3 group-hover:rotate-12 transition-transform">
                <Briefcase className="h-6 w-6 text-slate-900" />
            </div>
            <span className="font-bold text-2xl tracking-tight hidden sm:block">Rozgaar<span className="text-lime-400">Link</span></span>
            <span className="font-bold text-xl tracking-tight sm:hidden">Rozgaar</span>
          </div>

          {/* Desktop Menu */}
          <div className="flex items-center space-x-2">
            
            {/* Notification Bell */}
            {(userRole === 'WORKER' || userRole === 'OWNER') && (
                <div className="relative mr-2" ref={notificationRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 py-0 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 origin-top-right ring-1 ring-slate-900/5">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-xl">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 text-lg">Notifications</h3>
                                    {unreadCount > 0 && <span className="bg-lime-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                                </div>
                                <div className="flex gap-2">
                                     {unreadCount > 0 && (
                                        <button onClick={handleMarkAllRead} className="text-xs font-bold text-slate-500 hover:text-lime-600 flex items-center transition-colors px-2 py-1 rounded hover:bg-slate-50" title="Mark all as read">
                                            <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
                                        </button>
                                     )}
                                     <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                                        <X className="h-5 w-5" />
                                     </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <BellRing className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <h4 className="text-slate-900 font-bold mb-1">All caught up!</h4>
                                        <p className="text-slate-400 text-sm">You have no new notifications at the moment.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {notifications.map(notif => (
                                            <div 
                                                key={notif.id} 
                                                className={`px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 group relative ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                                onClick={() => handleMarkRead(notif.id)}
                                            >
                                                {!notif.read && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-lime-400 rounded-r-full"></div>
                                                )}
                                                <div className="flex-shrink-0 mt-1">
                                                     {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-sm ${!notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2 flex items-center">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {getRelativeTime(notif.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Footer */}
                            {notifications.length > 0 && (
                                 <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center">
                                     <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">View All History</button>
                                 </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Language Toggle */}
            <button 
                onClick={toggleLang}
                className="flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all mr-2"
                title="Change Language"
            >
                <Globe className="h-3 w-3 mr-1.5" />
                {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'मराठी'}
            </button>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-2 mr-2">
                <button 
                onClick={() => setView('JOB_BOARD')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'JOB_BOARD' ? 'bg-slate-800 text-lime-400 border border-slate-700' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                {t.nav_home[language]}
                </button>
                
                {userRole === 'OWNER' && (
                    <button 
                    onClick={() => setView('OWNER_DASHBOARD')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'OWNER_DASHBOARD' ? 'bg-slate-800 text-lime-400 border border-slate-700' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                    >
                    Dashboard
                    </button>
                )}

                {userRole === 'WORKER' && (
                    <button 
                    onClick={() => setView('WORKER_PROFILE')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'WORKER_PROFILE' ? 'bg-slate-800 text-lime-400 border border-slate-700' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                    >
                    {t.nav_profile[language]}
                    </button>
                )}
            </div>

            {/* Auth Button */}
            {userRole ? (
                <div className="flex items-center gap-2">
                    {/* User Avatar */}
                    {userAvatar && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center">
                            <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <button
                        onClick={onLogout}
                        className="p-2 md:px-4 md:py-2 rounded-full text-sm font-semibold text-red-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500 transition-all flex items-center"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            ) : (
                <button
                    onClick={onLogin}
                    className="px-5 py-2 rounded-full text-sm font-bold bg-lime-400 text-slate-900 hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20 flex items-center"
                >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Nav - Only specific views */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 text-slate-400 z-50 safe-area-bottom">
         <button onClick={() => setView('JOB_BOARD')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${currentView === 'JOB_BOARD' ? 'text-lime-400 bg-slate-800' : ''}`}>
            <Briefcase className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold">{t.nav_home[language]}</span>
         </button>
         
         {userRole === 'OWNER' && (
            <button onClick={() => setView('OWNER_DASHBOARD')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${currentView === 'OWNER_DASHBOARD' ? 'text-lime-400 bg-slate-800' : ''}`}>
                <Store className="h-5 w-5" />
                <span className="text-[10px] mt-1 font-bold">Dashboard</span>
            </button>
         )}

         {userRole === 'WORKER' && (
            <button onClick={() => setView('WORKER_PROFILE')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${currentView === 'WORKER_PROFILE' ? 'text-lime-400 bg-slate-800' : ''}`}>
                <User className="h-5 w-5" />
                <span className="text-[10px] mt-1 font-bold">{t.nav_profile[language]}</span>
            </button>
         )}

         {!userRole && (
             <button onClick={onLogin} className={`flex flex-col items-center p-2 rounded-xl text-slate-300`}>
                <LogIn className="h-5 w-5" />
                <span className="text-[10px] mt-1 font-bold">Login</span>
            </button>
         )}
      </div>
    </nav>
  );
};
