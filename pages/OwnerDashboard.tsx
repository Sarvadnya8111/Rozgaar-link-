
import React, { useState, useEffect, useMemo } from 'react';
import { ShopType, JobRole, AuthUser, Job, JobStatus, Shop, Application, Worker, Language } from '../types';
import { LOCATIONS, MOCK_WORKERS } from '../data/mockData';
import { generateJobDescription } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Sparkles, CheckCircle, User, Store, MapPin, Mail, Phone, LayoutDashboard, Plus, Briefcase, TrendingUp, Users, Eye, Clock, Edit2, PauseCircle, StopCircle, ArrowUpRight, Trash2, X, ChevronRight, Zap, BarChart3, ArrowLeft, Search, Filter, Calendar, IndianRupee, PieChart, Activity, Target, Layers, ListTodo, Coffee, Home, Bike, Banknote, Book, Globe, Award, Check, Megaphone, UserPlus, GraduationCap, Languages, PlayCircle, Lightbulb, Flame, Info, ChevronUp, Bell } from 'lucide-react';
import { APP_STRINGS } from '../data/localization';

interface OwnerDashboardProps {
    user: AuthUser;
    onNavigateToProfile?: () => void;
    onViewApplicants: (jobId: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, onNavigateToProfile, onViewApplicants }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'create' | 'profile'>('overview');
  const [myShop, setMyShop] = useState<Shop | null>(null);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');

  // Load Data
  const loadData = () => {
      const shop = storageService.getShopByOwnerId(user.id);
      setMyShop(shop || null);
      if (shop) {
          setMyJobs(storageService.getJobsByShopId(shop.id));
      } else {
          setMyJobs([]);
      }
      setLoading(false);
      
      const storedLang = storageService.getLanguage();
      if(storedLang) setLanguage(storedLang);
  };

  useEffect(() => {
      loadData();
      // Subscribe to real-time updates
      const unsubscribe = storageService.subscribe(loadData);
      return () => unsubscribe();
  }, [user.id]);

  const strings = APP_STRINGS.owner_dashboard;
  const common = APP_STRINGS.common;

  // Real-time Stats Calculation
  const stats = useMemo(() => {
      const activeJobs = myJobs.filter(j => j.status === 'Active').length;
      const totalViews = myJobs.reduce((acc, j) => acc + j.views, 0);
      let totalApps = 0;
      let totalShortlisted = 0;
      myJobs.forEach(j => {
          const apps = storageService.getApplicationsByJobId(j.id);
          totalApps += apps.length;
          totalShortlisted += apps.filter(a => a.status === 'Shortlisted').length;
      });

      return { activeJobs, totalViews, totalApps, totalShortlisted };
  }, [myJobs]);

  // --- ANALYTICS LOGIC ---
  const marketInsights = useMemo(() => {
      if (!myShop) return null;
      const allJobs = storageService.getJobs();
      const district = myShop.location.district;
      
      // Filter jobs in same district (Market)
      const districtJobs = allJobs.filter(j => {
         const s = storageService.getShopById(j.shopId);
         return s?.location.district === district && j.status === 'Active';
      });

      // 1. Popular Roles
      const roleCounts: Record<string, number> = {};
      districtJobs.forEach(j => { roleCounts[j.role] = (roleCounts[j.role] || 0) + 1; });
      const topRoles = Object.entries(roleCounts).sort((a,b) => b[1] - a[1]).slice(0, 3);

      // 2. Avg Salary for Shop's most frequent role
      const myRoles = myJobs.map(j => j.role);
      const primaryRole = myRoles.length > 0 ? myRoles[0] : topRoles[0]?.[0] || 'Helper';
      
      const roleJobs = districtJobs.filter(j => j.role === primaryRole);
      const avgSalary = roleJobs.length > 0 
          ? roleJobs.reduce((acc, j) => acc + (j.salaryMin + j.salaryMax)/2, 0) / roleJobs.length
          : 0;

      const mySalaryJob = myJobs.find(j => j.role === primaryRole);
      const mySalary = mySalaryJob?.salaryMax || 0;

      // 3. Advanced Metrics (Mocked Logic + Real Data)
      // Hype Score: Applicant Density in District
      const totalAppsInDistrict = districtJobs.reduce((acc, j) => acc + (j.applications || 0), 0);
      const hypeScore = Math.min(100, Math.round((totalAppsInDistrict / (districtJobs.length || 1)) * 10) + 40);

      // Working Hours Benchmark
      const marketAvgHours = 9;
      // Calculate user hours from profile or default
      const userOpen = parseInt(user.profile?.workingHours?.open?.split(':')[0] || "10");
      const userClose = parseInt(user.profile?.workingHours?.close?.split(':')[0] || "20");
      const userHours = Math.abs(userClose - userOpen) || 10;

      // 4. Enhanced Suggestions
      const enhancedSuggestions = [];
      
      // Salary Suggestion
      if (mySalary > 0 && mySalary < avgSalary) {
          enhancedSuggestions.push({
              id: 'rec_01',
              strategy: `Increase Salary by ₹${Math.round((avgSalary - mySalary)/500)*500}`,
              reason: `Competitors offering ₹${Math.round(avgSalary)} are getting applicants in 2 days.`,
              predicted_boom: "+40% more calls",
              difficulty: "Easy",
              action: "Edit Salary",
              color: "yellow",
              targetJobId: mySalaryJob?.id,
              actionType: 'EDIT_JOB'
          });
      } else {
           enhancedSuggestions.push({
              id: 'rec_01_good',
              strategy: `Maintain Competitive Salary`,
              reason: `Your offer is above market average!`,
              predicted_boom: "High Retention",
              difficulty: "Easy",
              action: "View",
              color: "green",
              actionType: 'VIEW_OVERVIEW'
          });
      }

      // Benefits Suggestion
      const hasShopAllowances = user.profile?.shopAllowances && user.profile.shopAllowances.length > 0;
      const hasJobAllowances = myJobs.some(j => j.allowances && j.allowances.length > 0);

      if (!hasJobAllowances && !hasShopAllowances) {
           enhancedSuggestions.push({
              id: 'rec_02',
              strategy: "Add 'Free Tea/Snacks'",
              reason: "Candidates in this area value daily allowances.",
              predicted_boom: "+15% more calls",
              difficulty: "Easy",
              action: "Update Profile",
              color: "blue",
              actionType: 'EDIT_PROFILE'
          });
      }

      // 5. Activity Ticker Generator
      const tickers = [
          `Rohan Electronics just hired a Salesman (₹12k).`,
          `New 15 candidates active in ${district} area.`,
          `Average closing time for jobs is now 4 days.`,
          `Demand for Helpers increased by 20% today.`
      ];

      return { 
          topRoles, 
          avgSalary, 
          primaryRole, 
          district, 
          totalMarketJobs: districtJobs.length, 
          suggestions: enhancedSuggestions, 
          mySalary,
          hypeScore,
          marketAvgHours,
          userHours,
          tickers
      };
  }, [myShop, myJobs, language, user.profile]);

  // --- JOB FORM STATE ---
  const [editMode, setEditMode] = useState<string | null>(null);
  const [role, setRole] = useState<JobRole>(JobRole.Helper);
  const [shopType, setShopType] = useState<ShopType>(user.profile?.shopType || ShopType.Grocery);
  const [location, setLocation] = useState(user.profile?.district || "Mumbai Suburban");
  const [minSalary, setMinSalary] = useState<string>("10000");
  const [maxSalary, setMaxSalary] = useState<string>("15000");
  const [education, setEducation] = useState<string>("None");
  const [shopDescription, setShopDescription] = useState<string>(user.profile?.shopDescription || "");
  const [selectedAllowances, setSelectedAllowances] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobPosted, setJobPosted] = useState(false);

  // Initialize allowances from shop profile when opening create tab
  useEffect(() => {
      if (activeTab === 'create' && !editMode && selectedAllowances.length === 0) {
          if (user.profile?.shopAllowances) {
              setSelectedAllowances(user.profile.shopAllowances);
          }
      }
  }, [activeTab, user.profile]);

  const toggleAllowance = (id: string) => {
      setSelectedAllowances(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleEditClick = (job: Job) => {
      setEditMode(job.id);
      setRole(job.role);
      setMinSalary(job.salaryMin.toString());
      setMaxSalary(job.salaryMax.toString());
      setDescription(job.description);
      setEducation(job.educationRequired);
      setSelectedAllowances(job.allowances || []);
      setActiveTab('create');
  };

  const handleStatusToggle = (job: Job) => {
      const newStatus = job.status === 'Active' ? 'Paused' : 'Active';
      const updatedJob = { ...job, status: newStatus as JobStatus };
      storageService.saveJob(updatedJob);
      loadData(); // Refresh list via direct call, though subscription also catches it
  };

  const handleDeleteJob = (jobId: string) => {
      if (confirm("Are you sure you want to close this job? It will be removed from the public board.")) {
          storageService.deleteJob(jobId);
          loadData();
      }
  };

  const handleSuggestionAction = (suggestion: any) => {
      if (suggestion.actionType === 'EDIT_JOB' && suggestion.targetJobId) {
          const job = myJobs.find(j => j.id === suggestion.targetJobId);
          if (job) handleEditClick(job);
          else setActiveTab('create'); // Fallback if job deleted
      } else if (suggestion.actionType === 'EDIT_PROFILE') {
          if (onNavigateToProfile) onNavigateToProfile();
          else setActiveTab('profile');
      } else if (suggestion.actionType === 'VIEW_OVERVIEW') {
          setActiveTab('overview');
      }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    const salaryRange = `${minSalary} - ${maxSalary}`;
    const desc = await generateJobDescription(role, shopType, location, salaryRange, selectedAllowances, education, language);
    setDescription(desc);
    setIsGenerating(false);
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    let shopId = myShop?.id;
    if (!shopId) {
        // Create shop if doesn't exist (edge case)
        const newShop: Shop = {
            id: `shop-${Date.now()}`,
            ownerId: user.id,
            name: user.profile?.shopName || 'My Shop',
            type: shopType,
            address: user.profile?.shopAddress?.street || 'Local Market',
            location: { state: user.profile?.state || 'Maharashtra', district: location },
            ownerName: user.name,
            phone: user.contact,
            email: user.profile?.email || '',
            verified: false
        };
        storageService.createShop(newShop);
        shopId = newShop.id;
        setMyShop(newShop);
    }

    const newJob: Job = {
        id: editMode || `job-${Date.now()}`,
        shopId: shopId,
        role: role,
        description: description,
        salaryMin: parseInt(minSalary) || 10000,
        salaryMax: parseInt(maxSalary) || 15000,
        type: "Full-time",
        urgency: "Immediate",
        postedAt: new Date().toISOString(),
        postedTimestamp: Date.now(),
        educationRequired: education as any, 
        status: "Active",
        skillsRequired: [role],
        allowances: selectedAllowances,
        views: editMode ? (myJobs.find(j => j.id === editMode)?.views || 0) : 0,
        applications: editMode ? (myJobs.find(j => j.id === editMode)?.applications || 0) : 0,
        isRecent: true
    };

    storageService.saveJob(newJob);
    loadData();
    setJobPosted(true);

    setTimeout(() => {
        setJobPosted(false);
        setEditMode(null);
        setDescription("");
        setSelectedAllowances([]);
        setActiveTab('overview');
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans relative">
       {/* Dashboard Navigation Tabs */}
       <div className="bg-white border-b border-slate-200 sticky top-20 z-40">
           <div className="max-w-7xl mx-auto px-4 sm:px-6">
               <div className="flex space-x-8 overflow-x-auto hide-scrollbar">
                   <button onClick={() => setActiveTab('overview')} className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-lime-400 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                       <LayoutDashboard className="h-4 w-4" />
                       {strings.business_manager[language]}
                   </button>
                   <button onClick={() => setActiveTab('analytics')} className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'analytics' ? 'border-lime-400 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                       <BarChart3 className="h-4 w-4" />
                       {strings.analytics[language]}
                   </button>
                   <button onClick={() => setActiveTab('create')} className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'create' ? 'border-lime-400 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                       <Plus className="h-4 w-4" />
                       {strings.post_req[language]}
                   </button>
                   <button onClick={() => setActiveTab('profile')} className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-lime-400 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                       <Store className="h-4 w-4" />
                       {strings.shop_profile[language]}
                   </button>
               </div>
           </div>
       </div>

       {activeTab === 'overview' && (
           <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="mb-8 flex items-center gap-6">
                    {/* Persistent Profile Logo/Image */}
                    <div className="w-20 h-20 bg-white rounded-full p-1 shadow-md shrink-0">
                        {user.profile?.profilePic ? (
                            <img src={user.profile.profilePic} alt="Shop Logo" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                <Store className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{strings.welcome[language]}, {myShop?.name || user.profile?.shopName}</h1>
                        <p className="text-slate-500 font-medium mt-1 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-lime-600" /> {myShop?.location.district}
                        </p>
                    </div>
                </div>

                {/* ANALYTICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Briefcase className="h-24 w-24 text-blue-500 transform rotate-12 translate-x-4 -translate-y-4" />
                        </div>
                        <div>
                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{strings.stats_active[language]}</span>
                        </div>
                        <div>
                            <h2 className="text-5xl font-bold text-slate-900 tracking-tight">{stats.activeJobs}</h2>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Postings</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="h-24 w-24 text-lime-500 transform rotate-12 translate-x-4 -translate-y-4" />
                        </div>
                        <div>
                            <span className="bg-lime-50 text-lime-700 text-xs font-bold px-3 py-1 rounded-full">{strings.stats_applicants[language]}</span>
                        </div>
                        <div>
                            <h2 className="text-5xl font-bold text-slate-900 tracking-tight">{stats.totalApps}</h2>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Candidates</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Eye className="h-24 w-24 text-purple-500 transform rotate-12 translate-x-4 -translate-y-4" />
                        </div>
                        <div>
                            <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">{strings.stats_views[language]}</span>
                        </div>
                        <div>
                            <h2 className="text-5xl font-bold text-slate-900 tracking-tight">{stats.totalViews}</h2>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Impressions</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Award className="h-24 w-24 text-orange-500 transform rotate-12 translate-x-4 -translate-y-4" />
                        </div>
                        <div>
                            <span className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">{strings.stats_shortlisted[language]}</span>
                        </div>
                        <div>
                            <h2 className="text-5xl font-bold text-slate-900 tracking-tight">{stats.totalShortlisted}</h2>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Selected</p>
                        </div>
                    </div>
                </div>

                {/* RECENT POSTINGS */}
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-slate-400" /> {strings.recent_activity[language]}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myJobs.slice(0, 4).map(job => (
                            <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-all group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-lime-600 transition-colors">{job.role}</h4>
                                        <div className="flex items-center text-xs text-slate-500 mt-1 font-medium">
                                            <Clock className="h-3 w-3 mr-1" /> Posted {new Date(job.postedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center text-slate-600 font-bold text-sm bg-slate-50 px-3 py-1 rounded-lg">
                                            <Users className="h-4 w-4 mr-2 text-lime-600" />
                                            {storageService.getApplicationsByJobId(job.id).length}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                         {/* Functional Actions */}
                                         <button onClick={() => handleStatusToggle(job)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-yellow-600 transition-colors" title={job.status === 'Active' ? 'Pause' : 'Activate'}>
                                            {job.status === 'Active' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                        </button>
                                        <button onClick={() => handleDeleteJob(job.id)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleEditClick(job)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => onViewApplicants(job.id)} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center">
                                            {strings.view_applicants[language]} <ArrowUpRight className="h-3 w-3 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Add New Card */}
                        <button onClick={() => setActiveTab('create')} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-lime-400 hover:text-lime-600 hover:bg-lime-50/10 transition-all h-full min-h-[180px]">
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus className="h-6 w-6" />
                            </div>
                            <span className="font-bold">{strings.create_job_title[language]}</span>
                        </button>
                    </div>
                </div>
           </div>
       )}

       {/* --- ANALYTICS TAB --- */}
       {activeTab === 'analytics' && marketInsights && (
           <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-500">
               <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">{strings.market_overview[language]}</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Analysis for <span className="text-slate-900 font-bold">{marketInsights.district}</span> area based on {marketInsights.totalMarketJobs} jobs
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* 1. JOB MARKET HEAT (Circular Gauge) */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Flame className="h-24 w-24 text-orange-500" /></div>
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center self-start w-full">
                             <Flame className="h-5 w-5 mr-2 text-orange-500" /> {strings.analytics_heat_title[language]}
                        </h3>
                        
                        <div className="relative w-40 h-40">
                             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path 
                                    className="text-orange-500 transition-all duration-1000 ease-out" 
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                    fill="none" stroke="currentColor" strokeWidth="3" 
                                    strokeDasharray={`${marketInsights.hypeScore}, 100`} 
                                />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                 <span className="text-3xl font-bold text-slate-900">{marketInsights.hypeScore}</span>
                                 <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                             </div>
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-500">
                             {marketInsights.hypeScore > 70 ? 'Very High (Hot)' : marketInsights.hypeScore > 40 ? 'Moderate' : 'Low Activity'}
                             <span className="text-xs block text-slate-400 mt-1">{strings.analytics_heat_desc[language]}</span>
                        </p>
                    </div>

                    {/* 2. COMPETITOR BENCHMARK (Charts) */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 col-span-1 lg:col-span-2">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                             <Target className="h-5 w-5 mr-2 text-blue-500" /> {strings.analytics_bench_title[language]}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                            {/* Salary Comparison */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">{strings.label_salary[language]}</h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm font-bold mb-1">
                                            <span className="text-slate-600">Market Avg</span>
                                            <span>₹{Math.round(marketInsights.avgSalary)}</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#9ca3af] rounded-full" style={{ width: '70%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm font-bold mb-1">
                                            <span className="text-slate-900">You</span>
                                            <span>₹{Math.round(marketInsights.mySalary)}</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${marketInsights.mySalary >= marketInsights.avgSalary ? 'bg-[#3b82f6]' : 'bg-orange-400'}`} 
                                                style={{ width: `${Math.min(100, (marketInsights.mySalary / (marketInsights.avgSalary * 1.5)) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs mt-2 font-medium text-slate-500">
                                            {marketInsights.mySalary >= marketInsights.avgSalary ? 
                                            'You pay above average.' : 
                                            `Pay ₹${Math.round(marketInsights.avgSalary - marketInsights.mySalary)} less than average.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Hours Comparison */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">{strings.label_hours[language]}</h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm font-bold mb-1">
                                            <span className="text-slate-600">Market Avg</span>
                                            <span>{marketInsights.marketAvgHours} Hrs</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#9ca3af] rounded-full" style={{ width: '60%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm font-bold mb-1">
                                            <span className="text-slate-900">You</span>
                                            <span>{marketInsights.userHours} Hrs</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${(marketInsights.userHours / 16) * 100}%` }}></div>
                                        </div>
                                         <p className="text-xs mt-2 font-medium text-slate-500">
                                            {marketInsights.userHours <= marketInsights.marketAvgHours ? 'Good work-life balance.' : 'Longer hours than peers.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. SMART SUGGESTIONS ENGINE */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="col-span-1 lg:col-span-2">
                         <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                             <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" /> {strings.analytics_growth_title[language]}
                         </h3>
                         <div className="space-y-4">
                             {marketInsights.suggestions.map((rec) => (
                                 <div key={rec.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                     <div className="flex items-start gap-4 mb-4 sm:mb-0">
                                         <div className={`p-3 rounded-2xl ${rec.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : rec.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                             <Sparkles className="h-6 w-6" />
                                         </div>
                                         <div>
                                             <h4 className="font-bold text-slate-900 text-lg">{rec.strategy}</h4>
                                             <p className="text-slate-500 text-sm mt-1">{rec.reason}</p>
                                             <div className="flex gap-2 mt-2">
                                                 <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">{rec.difficulty} Difficulty</span>
                                                 <span className="text-[10px] font-bold bg-lime-100 text-lime-700 px-2 py-1 rounded uppercase tracking-wide flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> {rec.predicted_boom}</span>
                                             </div>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => handleSuggestionAction(rec)}
                                        className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap"
                                     >
                                         {rec.action}
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>

                     {/* 4. ACTIVITY TICKER */}
                     <div className="col-span-1">
                         <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                             <Activity className="h-5 w-5 mr-2 text-lime-600" /> {strings.analytics_ticker_title[language]}
                         </h3>
                         <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden h-full min-h-[300px]">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500 rounded-full opacity-10 blur-3xl"></div>
                             <div className="relative z-10 space-y-6">
                                 {marketInsights.tickers.map((msg, i) => (
                                     <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-right-8 duration-700" style={{ animationDelay: `${i * 200}ms` }}>
                                         <div className="mt-1 w-2 h-2 rounded-full bg-lime-400 shrink-0 animate-pulse"></div>
                                         <p className="text-sm font-medium text-slate-300 leading-relaxed">{msg}</p>
                                     </div>
                                 ))}
                             </div>
                             <div className="absolute bottom-6 left-6 right-6">
                                 <div className="h-px w-full bg-slate-800 mb-4"></div>
                                 <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-center">Live Updates • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                             </div>
                         </div>
                     </div>
                </div>
           </div>
       )}

       {activeTab === 'create' && (
           <div className="max-w-3xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handlePostJob} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                     <div className="mb-8 border-b border-slate-100 pb-6">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">{strings.create_job_title[language]}</h2>
                        <p className="text-slate-500">{strings.create_job_subtitle[language]}</p>
                     </div>

                     {/* 1. Basic Info */}
                     <div className="space-y-6 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{strings.label_role[language]}</label>
                            <div className="relative">
                                <select 
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-lg outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all appearance-none" 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value as JobRole)}
                                >
                                    {Object.values(JobRole).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none rotate-90" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{strings.label_education[language]}</label>
                            <div className="grid grid-cols-3 gap-3">
                                {["None", "10th", "12th", "ITI", "Graduate"].map((edu) => (
                                    <button
                                        key={edu}
                                        type="button"
                                        onClick={() => setEducation(edu)}
                                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${education === edu ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                                    >
                                        {edu}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{strings.label_salary_range[language]}</label>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input type="number" value={minSalary} onChange={e => setMinSalary(e.target.value)} className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-lime-400 text-slate-900" />
                                </div>
                                <span className="text-slate-400 font-bold">-</span>
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input type="number" value={maxSalary} onChange={e => setMaxSalary(e.target.value)} className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-lime-400 text-slate-900" />
                                </div>
                            </div>
                        </div>

                        {/* NEW: Allowances Section */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Benefits / Allowances</label>
                            <div className="flex flex-wrap gap-2">
                                {['Free Tea/Snacks', 'Meals Included', 'Travel Allowance', 'Accommodation', 'Overtime Pay', 'Performance Bonus', 'Wifi'].map(b => (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() => toggleAllowance(b)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors flex items-center ${selectedAllowances.includes(b) ? 'bg-lime-500 text-white border-lime-600' : 'bg-white text-slate-500 border-slate-200 hover:border-lime-400'}`}
                                    >
                                        {selectedAllowances.includes(b) && <CheckCircle className="h-3 w-3 mr-1.5" />}
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                     </div>

                     {/* 2. Shop Context */}
                     <div className="mb-8">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{strings.label_shop_desc[language]}</label>
                        <textarea 
                            value={shopDescription} 
                            onChange={(e) => setShopDescription(e.target.value)}
                            placeholder={strings.placeholder_shop_desc[language]}
                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-lime-400 resize-none h-24"
                        ></textarea>
                     </div>

                     {/* 3. AI Generation */}
                     <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{strings.label_job_desc[language]}</label>
                            <button 
                                type="button" 
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                                className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full flex items-center hover:bg-purple-100 transition-colors disabled:opacity-50"
                            >
                                <Sparkles className="h-3 w-3 mr-1" /> {isGenerating ? 'Writing...' : strings.btn_generate_ai[language]}
                            </button>
                        </div>
                        <div className="relative">
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-5 rounded-2xl bg-purple-50/30 border border-purple-100 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-purple-400 resize-none h-40 leading-relaxed"
                                placeholder="Click the AI button to generate..."
                            ></textarea>
                            {isGenerating && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                         <button 
                            type="button" 
                            onClick={() => setActiveTab('overview')} 
                            className="px-8 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            {common.cancel[language]}
                        </button>
                         <button 
                            type="submit" 
                            disabled={!role || !minSalary || !description}
                            className="px-8 py-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center"
                        >
                            {jobPosted ? <Check className="h-5 w-5 mr-2" /> : <Megaphone className="h-5 w-5 mr-2" />}
                            {jobPosted ? common.save[language] : strings.btn_post_job[language]}
                        </button>
                     </div>
                </form>
           </div>
       )}
       
       {activeTab === 'profile' && (
           <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-500">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                            {/* Persistent Profile Logo/Image in Profile Tab */}
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-400 mr-4 shadow-sm border border-slate-100">
                                {user.profile?.profilePic ? (
                                    <img src={user.profile.profilePic} alt="Shop Logo" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <Store className="h-8 w-8" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{myShop?.name || 'My Shop'}</h2>
                                <p className="text-slate-500">{myShop?.type}</p>
                            </div>
                        </div>
                        <button onClick={onNavigateToProfile} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 transition-colors">
                            <Edit2 className="h-4 w-4 mr-2" /> {strings.edit_profile[language]}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                            <span className="text-slate-500 font-medium flex items-center"><MapPin className="h-4 w-4 mr-2"/> Location</span>
                            <span className="font-bold text-slate-900">{myShop?.location.district}, {myShop?.location.state}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                            <span className="text-slate-500 font-medium flex items-center"><Phone className="h-4 w-4 mr-2"/> Contact</span>
                            <span className="font-bold text-slate-900">{myShop?.phone}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                            <span className="text-slate-500 font-medium flex items-center"><User className="h-4 w-4 mr-2"/> Owner</span>
                            <span className="font-bold text-slate-900">{myShop?.ownerName}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                            <span className="text-slate-500 font-medium flex items-center"><Zap className="h-4 w-4 mr-2"/> {strings.verification_status[language]}</span>
                            <span className={`font-bold ${myShop?.verified ? 'text-green-600' : 'text-orange-500'}`}>
                                {myShop?.verified ? strings.verified[language] : strings.not_verified[language]}
                            </span>
                        </div>
                    </div>
                </div>
           </div>
       )}
    </div>
  );
};
