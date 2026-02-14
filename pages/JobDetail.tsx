
import React, { useEffect, useState } from 'react';
import { Job, Shop, JobRole, AuthUser, Application } from '../types';
import { storageService } from '../services/storageService';
import { MapPin, Phone, Building2, Clock, Calendar, CheckCircle, ArrowLeft, Sparkles, AlertTriangle, Coffee, Home, Bike, Banknote } from 'lucide-react';
import { generateInterviewQuestions } from '../services/geminiService';

interface JobDetailProps {
  job: Job;
  user: AuthUser | null;
  onBack: () => void;
  onLoginRequest: () => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({ job, user, onBack, onLoginRequest }) => {
  const [shop, setShop] = useState<Shop | undefined>(undefined);
  const [applied, setApplied] = useState(false);
  const [interviewQs, setInterviewQs] = useState<string[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
      // Fetch shop details from storage
      const fetchedShop = storageService.getShopById(job.shopId);
      setShop(fetchedShop);

      // Check if already applied
      if (user && user.role === 'WORKER') {
          const hasApplied = storageService.hasUserApplied(job.id, user.id);
          setApplied(hasApplied);
      }

      // Load AI hints when viewing details
      generateInterviewQuestions(job.role).then(setInterviewQs);
  }, [job.role, job.shopId, user]);

  const handleApply = () => {
    if (!user) {
        onLoginRequest();
        return;
    }
    
    if (user.role !== 'WORKER') {
        alert("Shop owners cannot apply for jobs. Please create a Worker profile.");
        return;
    }

    // Determine basic Match Score based on skills
    const userSkills = user.profile?.skills || [];
    const requiredSkills = job.skillsRequired || [];
    let matchCount = 0;
    requiredSkills.forEach(skill => {
        if (userSkills.includes(skill)) matchCount++;
    });
    // Basic calculation: (Matched / Total Required) * 100. Min 40, Max 95.
    const baseScore = requiredSkills.length > 0 ? (matchCount / requiredSkills.length) * 100 : 50;
    const finalScore = Math.min(95, Math.max(40, Math.floor(baseScore)));

    const newApp: Application = {
        id: `app-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        jobId: job.id,
        workerId: user.id,
        shopId: job.shopId,
        status: "New",
        appliedAt: new Date().toISOString(),
        matchScore: finalScore,
        notes: ""
    };

    const success = storageService.createApplication(newApp);
    if (success) {
        setApplied(true);
    } else {
        alert("You have already applied to this job.");
    }
  };

  // Helper to get allowance icon
  const getAllowanceIcon = (name: string) => {
      if (name.includes('Food')) return Coffee;
      if (name.includes('Accommodation')) return Home;
      if (name.includes('Travel')) return Bike;
      if (name.includes('Overtime')) return Clock;
      return Banknote;
  };

  if (!shop) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 font-sans">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 mb-6 hover:text-slate-900 font-bold transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Back to Jobs
      </button>

      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
        {/* Header - Dark Slate */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
           <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-lime-400 rounded-full opacity-10 blur-3xl"></div>
           
           <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl font-bold">{job.role}</h1>
                    {job.urgency === 'Immediate' && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            Urgent
                        </span>
                    )}
                </div>
                
                <div className="flex items-center text-slate-300">
                    <div className="bg-white/10 p-2 rounded-xl mr-3">
                        <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-lg block text-white">{shop.name}</span>
                        {shop.verified && <span className="text-lime-400 text-xs font-bold">Verified Shop</span>}
                    </div>
                </div>
           </div>
        </div>

        <div className="p-8">
           {/* Key Info Grid */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                 <p className="text-xs text-slate-400 uppercase font-bold mb-1">Salary</p>
                 <p className="text-slate-900 font-bold">₹{job.salaryMin} - {job.salaryMax}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                 <p className="text-xs text-slate-400 uppercase font-bold mb-1">Location</p>
                 <p className="text-slate-900 font-bold">{shop.location.district}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                 <p className="text-xs text-slate-400 uppercase font-bold mb-1">Job Type</p>
                 <p className="text-slate-900 font-bold">{job.type}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                 <p className="text-xs text-slate-400 uppercase font-bold mb-1">Education</p>
                 <p className="text-slate-900 font-bold">{job.educationRequired}</p>
              </div>
           </div>

           {/* Allowances Section */}
           {job.allowances && job.allowances.length > 0 && (
               <div className="mb-10">
                   <h3 className="text-lg font-bold text-slate-900 mb-4">Benefits & Allowances</h3>
                   <div className="flex flex-wrap gap-3">
                       {job.allowances.map(allowance => {
                           const Icon = getAllowanceIcon(allowance);
                           return (
                               <div key={allowance} className="flex items-center bg-lime-50 text-lime-800 px-4 py-2 rounded-xl border border-lime-200 font-bold text-sm">
                                   <Icon className="h-4 w-4 mr-2" />
                                   {allowance === 'Food' ? 'Meals Included' : allowance === 'Accommodation' ? 'Room Provided' : allowance}
                               </div>
                           );
                       })}
                   </div>
               </div>
           )}

           {/* Description */}
           <div className="mb-10">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Job Description</h3>
              <div className="text-slate-600 leading-relaxed bg-blue-50/50 p-6 rounded-3xl border border-blue-100 font-medium">
                 {job.description}
              </div>
           </div>

           {/* AI Interview Prep */}
           {interviewQs.length > 0 && (
               <div className="mb-10">
                   <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                       <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
                       <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">AI Interview Tips</span>
                   </h3>
                   <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                       <p className="text-sm font-bold text-purple-800 mb-3">Prepare for these questions:</p>
                       <ul className="space-y-3">
                           {interviewQs.map((q, i) => (
                               <li key={i} className="flex items-start text-slate-700 font-medium">
                                   <div className="min-w-[20px] h-5 flex items-center justify-center bg-purple-200 text-purple-800 rounded-full text-xs font-bold mr-3 mt-0.5">{i+1}</div>
                                   {q}
                               </li>
                           ))}
                       </ul>
                   </div>
               </div>
           )}

           {/* Shop Info */}
           <div className="mb-10 pt-8 border-t border-slate-100">
               <h3 className="text-xl font-bold text-slate-900 mb-4">About the Shop</h3>
               <div className="space-y-3 text-slate-600 font-medium">
                  <div className="flex items-start bg-slate-50 p-4 rounded-2xl">
                     <MapPin className="h-5 w-5 mr-3 text-slate-400 mt-0.5" />
                     <span>{shop.address}, {shop.location.district}, {shop.location.state}</span>
                  </div>
                  <div className="flex items-center bg-slate-50 p-4 rounded-2xl">
                     <Clock className="h-5 w-5 mr-3 text-slate-400" />
                     <span>10:00 AM - 09:00 PM (Standard)</span>
                  </div>
               </div>
           </div>

           {/* Action */}
           <div className="pt-4">
              {applied ? (
                 <div className="bg-green-100 border border-green-200 text-green-800 p-6 rounded-3xl flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 mr-3" />
                    <span className="font-bold text-lg">Application Sent! Owner will contact you.</span>
                 </div>
              ) : (
                 <button 
                    onClick={handleApply}
                    className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold text-xl hover:bg-slate-800 shadow-xl shadow-slate-200 hover:shadow-2xl transform active:scale-[0.98] transition-all flex items-center justify-center"
                 >
                    Apply Now
                 </button>
              )}
              {!applied && (
                 <p className="text-center text-xs text-slate-400 mt-4 font-medium">
                    Your contact details will be shared with {shop.ownerName} immediately.
                 </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
