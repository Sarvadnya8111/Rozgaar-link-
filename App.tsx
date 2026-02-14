
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { JobBoard } from './pages/JobBoard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { JobDetail } from './pages/JobDetail';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { ApplicantReview } from './pages/ApplicantReview';
import { ViewState, Job, AuthUser, UserRole, Language } from './types';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentView, setView] = useState<ViewState>('JOB_BOARD');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobIdForReview, setSelectedJobIdForReview] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  // Initialize Data & Check Session & Subscribe to Updates
  useEffect(() => {
    storageService.init();
    
    // Initial Load
    const loadSession = () => {
      const currentUser = storageService.getCurrentUser();
      setUser(currentUser);
      const storedLang = storageService.getLanguage();
      if (storedLang) setLanguage(storedLang);
      
      // Redirect to Dashboard if Owner logs in from another tab
      if (currentUser && currentUser.role === 'OWNER' && currentView === 'JOB_BOARD') {
          // Optional: we can force view change, but maybe better to let user navigate
      }
      
      // Force logout if session cleared in another tab
      if (!currentUser && user) {
          setUser(null);
          // Force back to a safe view or Auth
          if (currentView === 'OWNER_DASHBOARD' || currentView === 'WORKER_PROFILE') {
              setView('OWNER_DASHBOARD'); // Will show AuthPage
          }
      }
    };

    loadSession();

    // Real-time Sync for Session/User changes
    const unsubscribe = storageService.subscribe(loadSession);
    return () => unsubscribe();
  }, [user, currentView]);

  const handleSetLanguage = (lang: Language) => {
      setLanguage(lang);
      storageService.setLanguage(lang);
  };

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
    if (authUser.role === 'OWNER') {
        setView('OWNER_DASHBOARD');
    } else {
        setView('JOB_BOARD');
    }
  };

  const handleLogout = () => {
    setUser(null);
    storageService.logoutUser();
    // Redirect to AuthPage (via Protected Route logic)
    setView('OWNER_DASHBOARD'); 
  };

  const handleLoginRequest = () => {
      // Force Auth Page
      setView('OWNER_DASHBOARD'); 
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setView('JOB_DETAILS');
  };

  const handleBackToBoard = () => {
    setSelectedJob(null);
    setView('JOB_BOARD');
  };

  const handleUpdateUser = (updatedUser: AuthUser) => {
      setUser(updatedUser);
      storageService.updateUser(updatedUser);
  };

  const handleNavigateToProfile = () => {
      setView('WORKER_PROFILE');
  };

  const handleBackToDashboard = () => {
      setView('OWNER_DASHBOARD');
  };

  const handleViewApplicants = (jobId: string) => {
      setSelectedJobIdForReview(jobId);
      setView('APPLICANT_REVIEW');
  };

  // Logic to determine if we show AuthPage or Content
  // If user is logged out, they can only see JobBoard and JobDetail (Guest Mode)
  const isGuestAllowedView = currentView === 'JOB_BOARD' || currentView === 'JOB_DETAILS';
  const showAuthPage = !user && !isGuestAllowedView;

  if (showAuthPage) {
      return <AuthPage onLogin={handleLogin} language={language} setLanguage={handleSetLanguage} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'JOB_BOARD':
        return <JobBoard onJobClick={handleJobClick} />;
      case 'OWNER_DASHBOARD':
        if (!user) return <AuthPage onLogin={handleLogin} language={language} setLanguage={handleSetLanguage} />;
        return (
            <OwnerDashboard 
                user={user} 
                onNavigateToProfile={handleNavigateToProfile}
                onViewApplicants={handleViewApplicants}
            />
        );
      case 'JOB_DETAILS':
        return selectedJob ? (
            <JobDetail 
                job={selectedJob} 
                user={user}
                onBack={handleBackToBoard} 
                onLoginRequest={handleLoginRequest}
            /> 
        ) : <JobBoard onJobClick={handleJobClick} />;
      case 'WORKER_PROFILE':
        if (!user) return <AuthPage onLogin={handleLogin} language={language} setLanguage={handleSetLanguage} />;
        return (
            <ProfilePage 
                user={user} 
                onUpdate={handleUpdateUser} 
                onBack={user.role === 'OWNER' ? handleBackToDashboard : undefined} 
                language={language}
            />
        );
      case 'APPLICANT_REVIEW':
        if (!user) return <AuthPage onLogin={handleLogin} language={language} setLanguage={handleSetLanguage} />;
        return selectedJobIdForReview ? (
            <ApplicantReview 
                jobId={selectedJobIdForReview} 
                onBack={handleBackToDashboard} 
            />
        ) : <OwnerDashboard user={user} onViewApplicants={handleViewApplicants} />;
      default:
        return <JobBoard onJobClick={handleJobClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        userRole={user?.role}
        onLogout={handleLogout}
        onLogin={handleLoginRequest}
        language={language}
        setLanguage={handleSetLanguage}
      />
      <main>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
