
import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Briefcase, CheckCircle, XCircle, Star, Phone, MessageCircle, Clock, ShieldCheck, Search, Filter, User } from 'lucide-react';
import { Job, Application, Worker, ApplicationStatus } from '../types';
import { storageService } from '../services/storageService';

interface ApplicantReviewProps {
  jobId: string;
  onBack: () => void;
}

interface EnrichedApplication extends Application {
  worker: Worker;
}

export const ApplicantReview: React.FC<ApplicantReviewProps> = ({ jobId, onBack }) => {
  const [job, setJob] = useState<Job | undefined>(undefined);
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'New' | 'Shortlisted' | 'Rejected'>('All');

  const loadData = () => {
    const jobData = storageService.getJobById(jobId);
    setJob(jobData);

    if (jobData) {
      const apps = storageService.getApplicationsByJobId(jobId);
      // Enrich applications with full worker details
      const enriched = apps.map(app => {
        const worker = storageService.getWorkerById(app.workerId);
        if (worker) return { ...app, worker };
        return null;
      }).filter((a): a is EnrichedApplication => a !== null);
      
      // Sort: New first, then by Match Score
      enriched.sort((a, b) => {
        if (a.status === 'New' && b.status !== 'New') return -1;
        if (a.status !== 'New' && b.status === 'New') return 1;
        return b.matchScore - a.matchScore;
      });

      setApplications(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Subscribe to changes (e.g., if another owner tab updates status)
    const unsubscribe = storageService.subscribe(loadData);
    return () => unsubscribe();
  }, [jobId]);

  const handleStatusChange = (app: EnrichedApplication, newStatus: ApplicationStatus) => {
    // 1. Update Status in Database
    const updatedApp = { ...app, status: newStatus };
    storageService.updateApplication(updatedApp);

    // 2. Send Notification if Shortlisted
    if (newStatus === 'Shortlisted') {
        const shop = storageService.getShopById(app.shopId);
        storageService.addNotification({
            id: `notif-${Date.now()}`,
            userId: app.workerId,
            title: "🎉 Application Shortlisted!",
            message: `Great news! ${shop?.name || 'The shop owner'} has shortlisted your application for the ${job?.role} role. They will contact you shortly.`,
            type: 'success',
            read: false,
            timestamp: Date.now()
        });
    }

    // 3. Refresh local state immediately (optimistic update + reload)
    loadData();
  };

  const filteredApps = applications.filter(app => {
      if (filter === 'All') return true;
      return app.status === filter;
  });

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!job) return <div className="p-8 text-center">Job not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <button 
                        onClick={onBack}
                        className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{job.role}</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            <span className="text-lime-600 font-bold">{applications.length} Candidates</span> Applied
                        </p>
                    </div>
                </div>
                
                {/* Filter */}
                <div className="relative hidden sm:block">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-lime-400 outline-none appearance-none cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="New">New</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>
        </div>

        {/* List Content */}
        <div className="max-w-3xl mx-auto px-4 py-6">
            
            {filteredApps.length === 0 ? (
                <div className="text-center py-16">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                        <User className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No applicants found</h3>
                    <p className="text-slate-500 text-sm">Wait for workers to apply for this job.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredApps.map((app) => (
                        <div 
                            key={app.id} 
                            className={`bg-white rounded-2xl p-5 border transition-all ${
                                app.status === 'New' 
                                ? 'border-lime-200 shadow-md shadow-lime-100 ring-1 ring-lime-400/20' 
                                : 'border-slate-200 shadow-sm'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                
                                {/* Worker Info */}
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 border-2 border-white shadow-sm shrink-0">
                                        {app.worker.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-slate-900">{app.worker.name}</h3>
                                            {app.status === 'New' && (
                                                <span className="bg-lime-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
                                            )}
                                            <div className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                app.matchScore >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                                                app.matchScore >= 50 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                <Star className="h-3 w-3 mr-1 fill-current" />
                                                {app.matchScore}% Match
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center">
                                                <MapPin className="h-3.5 w-3.5 mr-1" /> {app.worker.location.district}
                                            </span>
                                            <span className="flex items-center">
                                                <Briefcase className="h-3.5 w-3.5 mr-1" /> {app.worker.experienceYears} Years Exp.
                                            </span>
                                            <span className="flex items-center">
                                                <Clock className="h-3.5 w-3.5 mr-1" /> {app.worker.availability}
                                            </span>
                                        </div>

                                        {/* Skills Pills */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {app.worker.skills.slice(0, 4).map(skill => (
                                                <span key={skill} className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg border border-slate-100">
                                                    {skill}
                                                </span>
                                            ))}
                                            {app.worker.skills.length > 4 && (
                                                <span className="px-2 py-1 bg-slate-50 text-slate-400 text-xs font-bold rounded-lg border border-slate-100">
                                                    +{app.worker.skills.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions / Status */}
                                <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                                    {app.status === 'Shortlisted' ? (
                                        <div className="flex flex-col items-center sm:items-end w-full">
                                            <span className="flex items-center text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg mb-3">
                                                <CheckCircle className="h-4 w-4 mr-2" /> Shortlisted
                                            </span>
                                            
                                            {/* Contact Buttons (Revealed) */}
                                            <div className="flex gap-2 w-full">
                                                <a href={`tel:${app.worker.phone}`} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors">
                                                    <Phone className="h-3.5 w-3.5 mr-2" /> Call
                                                </a>
                                                <a href={`https://wa.me/${app.worker.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#20bd5a] transition-colors">
                                                    <MessageCircle className="h-3.5 w-3.5 mr-2" /> WhatsApp
                                                </a>
                                            </div>
                                        </div>
                                    ) : app.status === 'Rejected' ? (
                                        <div className="flex items-center justify-center sm:justify-end w-full h-full">
                                            <span className="flex items-center text-red-500 font-bold text-sm bg-red-50 px-3 py-1.5 rounded-lg">
                                                <XCircle className="h-4 w-4 mr-2" /> Rejected
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 w-full">
                                            <button 
                                                onClick={() => handleStatusChange(app, 'Rejected')}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-white border-2 border-slate-100 text-slate-500 text-sm font-bold rounded-xl hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange(app, 'Shortlisted')}
                                                className="flex-1 sm:flex-none px-6 py-2 bg-lime-400 text-slate-900 text-sm font-bold rounded-xl hover:bg-lime-300 shadow-lg shadow-lime-200 transition-colors flex items-center justify-center"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" /> Accept
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Verification Badge (Simulated) */}
                            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
                                <span className="flex items-center text-slate-400 font-medium">
                                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-blue-400" /> Identity Verified (Aadhaar)
                                </span>
                                <span className="text-slate-300 font-medium">Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
    