
import React from 'react';
import { MapPin, Clock, Banknote, Building2, Calendar } from 'lucide-react';
import { Job, Shop } from '../types';

interface JobCardProps {
  job: Job;
  shop: Shop;
  onClick: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, shop, onClick }) => {
  
  const getRelativeTime = (isoDate: string) => {
    const now = new Date();
    const posted = new Date(isoDate);
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return posted.toLocaleDateString();
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-3xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 relative group"
    >
      {job.isRecent && (
          <div className="absolute top-6 right-6">
              <span className="bg-lime-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
                  NEW
              </span>
          </div>
      )}
      
      <div className="mb-4 pr-12">
        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-lime-600 transition-colors">{job.role}</h3>
        <div className="flex items-center text-slate-500 text-sm">
          <div className="bg-slate-100 p-1.5 rounded-lg mr-2">
            <Building2 className="h-4 w-4 text-slate-600" />
          </div>
          <span className="font-semibold">{shop.name}</span>
          {shop.verified && <span className="ml-2 text-blue-500 text-xs font-bold">● Verified</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-slate-50 text-slate-600">
             <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400" /> {shop.location.district}
        </span>
        <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-green-50 text-green-700">
             <Banknote className="h-3.5 w-3.5 mr-2" /> ₹{job.salaryMin/1000}k - ₹{job.salaryMax/1000}k
        </span>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
        <div className="flex items-center text-xs text-slate-400 font-medium">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            {getRelativeTime(job.postedAt)}
        </div>
        
        {job.urgency === 'Immediate' && (
            <span className="text-red-500 text-xs font-bold flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                Urgent
            </span>
        )}
      </div>
    </div>
  );
};
