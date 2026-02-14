
import React, { useState, useMemo, useEffect } from 'react';
import { JobCard } from '../components/JobCard';
import { LOCATIONS } from '../data/mockData';
import { Job, ShopType, Shop, AuthUser, Language } from '../types';
import { storageService } from '../services/storageService';
import { Search, Filter, MapPin, ChevronDown, SlidersHorizontal, X, ArrowDownUp, Sparkles, Frown, PlusCircle, LayoutGrid, List, ChevronRight } from 'lucide-react';
import { APP_STRINGS } from '../data/localization';

interface JobBoardProps {
  onJobClick: (job: Job) => void;
}

export const JobBoard: React.FC<JobBoardProps> = ({ onJobClick }) => {
  const [searchTerm, setSearchTerm] = useState("");
  // HARD CONSTRAINT: Default to Maharashtra districts to reduce chaos
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'salary'>('newest');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  // Filter States
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 50000]);

  // Load Data
  const loadData = () => {
      setJobs(storageService.getJobs());
      setShops(storageService.getShops());
      setCurrentUser(storageService.getCurrentUser());
      
      const storedLang = storageService.getLanguage();
      if(storedLang) setLanguage(storedLang);
  };

  useEffect(() => {
      loadData();
      const unsubscribe = storageService.subscribe(loadData);
      return () => unsubscribe();
  }, []);

  const maharashtraDistricts = useMemo(() => {
     const mh = LOCATIONS.find(l => l.state === 'Maharashtra');
     return mh ? mh.districts : []; // Already sorted in mockData typically, or sort here
  }, []);

  // Mode Detection: Show District Feed if no specific filters applied
  const isFeedMode = selectedDistrict === 'All' && selectedType === 'All' && searchTerm === '';

  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      // Find associated shop
      const shop = shops.find(s => s.id === job.shopId);
      if (!shop) return false; // Don't show jobs with invalid shop IDs

      // STRICT FILTERING LOGIC
      // 1. Text Search
      const matchesSearch = job.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            shop.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Strict District Filter
      // If "All" is selected, we technically allow all, but UX encourages District selection.
      const matchesDistrict = selectedDistrict === "All" || shop.location.district === selectedDistrict;
      
      // 3. Type Filter
      const matchesType = selectedType === "All" || shop.type === selectedType;
      
      // 4. Salary
      const matchesSalary = job.salaryMin >= salaryRange[0];
      
      // 5. Active only
      const isActive = job.status === 'Active';
      
      return matchesSearch && matchesDistrict && matchesType && matchesSalary && isActive;
    });

    // Sorting Priority: 1. Newest -> 2. Salary
    if (sortBy === 'newest') {
        filtered.sort((a, b) => b.postedTimestamp - a.postedTimestamp);
    } else {
        filtered.sort((a, b) => b.salaryMin - a.salaryMin);
    }

    return filtered;
  }, [jobs, shops, searchTerm, selectedDistrict, selectedType, salaryRange, sortBy]);

  // Group jobs by district for the Feed View
  const jobsByDistrict = useMemo(() => {
      if (!isFeedMode) return {};
      
      const grouped: Record<string, Job[]> = {};
      maharashtraDistricts.forEach(dist => {
          grouped[dist] = [];
      });

      // We use the filteredJobs (which contains all active jobs when no filters)
      // but we need to ensure we are only showing Maharashtra jobs in the feed strictly
      filteredJobs.forEach(job => {
          const shop = shops.find(s => s.id === job.shopId);
          if (shop && shop.location.state === 'Maharashtra') {
              if (!grouped[shop.location.district]) {
                  grouped[shop.location.district] = [];
              }
              grouped[shop.location.district].push(job);
          }
      });

      return grouped;
  }, [isFeedMode, filteredJobs, shops, maharashtraDistricts]);

  const strings = APP_STRINGS.job_board;

  const getDynamicHeader = (district: string) => {
     return strings.jobs_in[language].replace('{0}', district);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* Search Header - Dark Slate Theme */}
      <div className="bg-slate-900 text-white rounded-b-[3rem] px-6 pt-6 pb-12 mb-8 shadow-xl">
        <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">{strings.hero_title[language]}</h1>
                <p className="text-slate-400 text-lg">{strings.hero_subtitle[language].replace('{0}', jobs.length.toString())}</p>
            </div>
            
            {/* Minimalist Search Bar */}
            <div className="bg-slate-800/80 backdrop-blur-md p-2 rounded-3xl mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-2 border border-slate-700">
            <div className="relative md:col-span-5 group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-lime-400 transition-colors" />
                </div>
                <input 
                type="text"
                placeholder={strings.search_placeholder[language]}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="relative md:col-span-4 group border-t md:border-t-0 md:border-l border-slate-700">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-lime-400 transition-colors" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                </div>
                <select 
                className="w-full pl-12 pr-10 py-4 rounded-2xl bg-transparent border-none focus:ring-0 text-white appearance-none cursor-pointer font-medium"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                <option value="All" className="bg-slate-800">{strings.all_mh[language]}</option>
                {maharashtraDistricts.map(d => <option key={d} value={d} className="bg-slate-800">{d}</option>)}
                </select>
            </div>

            <div className="md:col-span-3">
                <button className="w-full h-full bg-lime-400 hover:bg-lime-500 text-slate-900 rounded-2xl flex items-center justify-center transition-all shadow-lg font-bold text-lg">
                    {strings.search_btn[language]}
                </button>
            </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24">
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Hide in Feed Mode on Mobile to give more space? Keeping for now */}
            <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sticky top-24">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 flex items-center text-lg"><Filter className="h-5 w-5 mr-2" /> {strings.filters[language]}</h3>
                        <button onClick={() => setShowFilters(false)} className="lg:hidden text-slate-400"><X className="h-5 w-5" /></button>
                    </div>
                    
                    {/* Shop Type Filter */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Shop Type</label>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedType === 'All' ? 'bg-lime-400 border-lime-400' : 'border-slate-300'}`}>
                                    {selectedType === 'All' && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
                                </div>
                                <input type="radio" checked={selectedType === 'All'} onChange={() => setSelectedType('All')} className="hidden" />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">All Types</span>
                            </label>
                            {Object.values(ShopType).map(t => (
                                <label key={t} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedType === t ? 'bg-lime-400 border-lime-400' : 'border-slate-300'}`}>
                                        {selectedType === t && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
                                    </div>
                                    <input type="radio" checked={selectedType === t} onChange={() => setSelectedType(t)} className="hidden" />
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{t}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Salary Filter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Min Salary</label>
                        <input 
                            type="range" min="0" max="30000" step="1000" 
                            value={salaryRange[0]} 
                            onChange={(e) => setSalaryRange([parseInt(e.target.value), 50000])}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lime-500"
                        />
                        <div className="flex justify-between text-sm font-medium text-slate-600 mt-3">
                            <span>₹{salaryRange[0]}</span>
                            <span>₹30k+</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="lg:w-3/4">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden mr-3 p-2 bg-white border border-slate-200 rounded-xl text-slate-600">
                            <SlidersHorizontal className="h-5 w-5" />
                        </button>
                        <h2 className="text-xl font-bold text-slate-900">
                             {isFeedMode ? strings.jobs_near_you[language] : strings.jobs_found[language].replace('{0}', filteredJobs.length.toString())}
                        </h2>
                    </div>
                    
                    {!isFeedMode && (
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-slate-500 font-medium hidden sm:inline">{strings.sort_by[language]}</span>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-lime-400 focus:border-lime-400 block p-2.5 cursor-pointer outline-none pl-4 pr-8"
                            >
                                <option value="newest">{strings.newest[language]}</option>
                                <option value="salary">{strings.salary[language]}</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* --- FEED MODE: District Sections --- */}
                {isFeedMode ? (
                    <div className="space-y-12">
                        {maharashtraDistricts.map((district) => {
                            const districtJobs = jobsByDistrict[district];
                            if (!districtJobs || districtJobs.length === 0) return null;

                            return (
                                <div key={district} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center mb-4 px-2">
                                        <MapPin className="h-5 w-5 text-lime-600 mr-2" />
                                        <h3 className="text-xl font-bold text-slate-900">{getDynamicHeader(district)}</h3>
                                        <div className="h-px flex-1 bg-slate-200 ml-4"></div>
                                        <button 
                                            onClick={() => setSelectedDistrict(district)}
                                            className="text-xs font-bold text-slate-500 hover:text-lime-600 ml-4 transition-colors"
                                        >
                                            {strings.view_all[language]}
                                        </button>
                                    </div>
                                    
                                    {/* Horizontal Scroll Container */}
                                    <div className="flex overflow-x-auto gap-4 pb-6 -mx-4 px-4 snap-x hide-scrollbar">
                                        {districtJobs.map(job => {
                                            const shop = shops.find(s => s.id === job.shopId);
                                            if (!shop) return null;
                                            return (
                                                <div key={job.id} className="min-w-[320px] max-w-[320px] snap-center">
                                                    <JobCard 
                                                        job={job} 
                                                        shop={shop} 
                                                        onClick={() => onJobClick(job)}
                                                    />
                                                </div>
                                            );
                                        })}
                                        {districtJobs.length > 5 && (
                                            <div className="min-w-[150px] flex items-center justify-center">
                                                <button 
                                                    onClick={() => setSelectedDistrict(district)}
                                                    className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-lime-600 transition-colors"
                                                >
                                                    <ChevronRight className="h-6 w-6" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {Object.keys(jobsByDistrict).length === 0 && (
                             <div className="text-center py-16">
                                <p className="text-slate-400">{APP_STRINGS.common.loading[language]}</p>
                             </div>
                        )}
                    </div>
                ) : (
                    /* --- GRID MODE: Search/Filter Results --- */
                    <div className="space-y-4">
                        {filteredJobs.map(job => {
                        const shop = shops.find(s => s.id === job.shopId);
                        if (!shop) return null;
                        return (
                            <JobCard 
                            key={job.id} 
                            job={job} 
                            shop={shop} 
                            onClick={() => onJobClick(job)}
                            />
                        );
                        })}
                        
                        {/* Empty State */}
                        {filteredJobs.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Frown className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{strings.no_jobs[language].replace('{0}', selectedDistrict)}</h3>
                                <p className="text-slate-500 text-lg mb-6">{strings.try_search[language]}</p>
                                
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="flex gap-4">
                                        <button onClick={() => {setSelectedDistrict('All'); setSelectedType('All'); setSearchTerm(''); setSalaryRange([0,50000])}} className="text-slate-900 bg-lime-400 px-6 py-2 rounded-full font-bold hover:bg-lime-500 transition-colors">
                                            {strings.clear_filters[language]}
                                        </button>
                                        {selectedDistrict !== 'All' && (
                                            <button onClick={() => setSelectedDistrict('All')} className="text-slate-600 bg-slate-100 px-6 py-2 rounded-full font-bold hover:bg-slate-200 transition-colors">
                                                {strings.show_all[language]}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* CTA for Post Job if empty */}
                                    {(!currentUser || currentUser.role === 'OWNER') && (
                                        <div className="mt-8 pt-8 border-t border-slate-100 w-full max-w-sm">
                                            <p className="text-slate-500 text-sm mb-3">Are you a shop owner looking to hire?</p>
                                            <button className="flex items-center justify-center w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                                                <PlusCircle className="h-5 w-5 mr-2" />
                                                Post a Free Job Ad
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
