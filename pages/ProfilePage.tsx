
import React, { useState } from 'react';
import { AuthUser, UserRole, JobRole, ShopType, Language } from '../types';
import { User, MapPin, Mail, Phone, Book, Briefcase, Award, Globe, Clock, IndianRupee, Edit2, Save, X, Camera, ArrowLeft, Store, AlignLeft, ShieldCheck, Home, FileText, CreditCard, Coffee } from 'lucide-react';
import { LOCATIONS } from '../data/mockData';
import { DASHBOARD_DATA } from '../data/localization';
import { VoiceBtn } from '../components/VoiceBtn';

interface FormSectionProps {
  title: string;
  icon: any;
  children?: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, icon: Icon, children }) => (
  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center border-b border-slate-200 pb-3">
          <Icon className="h-5 w-5 mr-2 text-lime-600" /> {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {children}
      </div>
  </div>
);

interface InputFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: string;
  placeholder?: string;
  fullWidth?: boolean;
  options?: string[];
  multiline?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, type = "text", placeholder = "", fullWidth = false, options = [], multiline = false }) => (
  <div className={`${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {options.length > 0 ? (
          <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all">
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
      ) : multiline ? (
          <textarea 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all placeholder-slate-300 resize-none h-24"
          />
      ) : (
          <input 
            type={type} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all placeholder-slate-300" 
          />
      )}
  </div>
);

interface ProfilePageProps {
  user: AuthUser;
  onUpdate: (updatedUser: AuthUser) => void;
  onBack?: () => void;
  language?: Language;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate, onBack, language = 'en' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const t = DASHBOARD_DATA.data.profile_screen;
  
  const COMMON_ALLOWANCES = ['Free Tea/Snacks', 'Meals Included', 'Travel Allowance', 'Accommodation', 'Overtime Pay', 'Performance Bonus', 'Wifi'];

  // Initial state populated from user profile
  const [formData, setFormData] = useState({
      // Personal
      fullName: user.profile?.fullName || user.name,
      bio: user.profile?.bio || '',
      age: user.profile?.age || '',
      dob: user.profile?.dob || '',
      gender: user.profile?.gender || 'Male',
      maritalStatus: user.profile?.maritalStatus || 'Single',
      aadhaar: user.profile?.aadhaar || '',
      
      // Contact
      email: user.profile?.email || '',
      whatsapp: user.profile?.whatsapp || '',
      altContact: user.profile?.altContact || '',
      contact: user.contact,
      
      // Address
      houseNumber: user.profile?.currentAddress.houseNumber || '',
      street: user.profile?.currentAddress.street || '',
      landmark: user.profile?.currentAddress.landmark || '',
      city: user.profile?.currentAddress.city || LOCATIONS[0].districts[0],
      state: user.profile?.currentAddress.state || LOCATIONS[0].state,
      pincode: user.profile?.currentAddress.pincode || '',

      // Professional (Worker)
      education: user.profile?.education || '10th Pass',
      experienceYears: user.profile?.experienceYears || '0',
      skills: user.profile?.skills || [],
      languages: user.profile?.languages || [],
      preferredSalaryMin: user.profile?.preferredSalaryMin || '',
      preferredShift: user.profile?.preferredShift || 'Day Shift',

      // Shop Owner
      shopName: user.profile?.shopName || '',
      shopType: user.profile?.shopType || ShopType.Grocery,
      shopDescription: user.profile?.shopDescription || '',
      gstNumber: user.profile?.gstNumber || '',
      shopAllowances: user.profile?.shopAllowances || [],
      employeeCount: user.profile?.employeeCount || '0',
      openTime: user.profile?.workingHours?.open || '09:00',
      closeTime: user.profile?.workingHours?.close || '21:00',
      weeklyOff: user.profile?.workingHours?.weeklyOff || 'Sunday',
  });

  const availableDistricts = LOCATIONS.find(l => l.state === formData.state)?.districts || [];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'skills' | 'languages' | 'shopAllowances', item: string) => {
      setFormData(prev => {
          const current = prev[field] || [];
          const updated = current.includes(item) 
              ? current.filter((i: string) => i !== item)
              : [...current, item];
          return { ...prev, [field]: updated };
      });
  };

  const handleSave = () => {
      const updatedUser: AuthUser = {
          ...user,
          name: formData.fullName,
          contact: formData.contact,
          profile: {
              ...user.profile!,
              // Personal
              fullName: formData.fullName,
              bio: formData.bio,
              age: formData.age,
              dob: formData.dob,
              gender: formData.gender,
              maritalStatus: formData.maritalStatus,
              aadhaar: formData.aadhaar,
              
              // Contact
              email: formData.email,
              whatsapp: formData.whatsapp,
              altContact: formData.altContact,
              contact: formData.contact,
              
              // Address
              currentAddress: {
                  houseNumber: formData.houseNumber,
                  street: formData.street,
                  landmark: formData.landmark,
                  city: formData.city,
                  state: formData.state,
                  pincode: formData.pincode
              },
              
              // Professional
              education: formData.education,
              experienceYears: formData.experienceYears,
              skills: formData.skills,
              languages: formData.languages,
              preferredSalaryMin: formData.preferredSalaryMin,
              preferredShift: formData.preferredShift,
              
              // Shop Owner
              shopName: formData.shopName,
              shopType: formData.shopType,
              shopDescription: formData.shopDescription,
              gstNumber: formData.gstNumber,
              shopAllowances: formData.shopAllowances,
              employeeCount: formData.employeeCount,
              workingHours: {
                  open: formData.openTime,
                  close: formData.closeTime,
                  weeklyOff: formData.weeklyOff
              },
              shopAddress: {
                  ...user.profile!.currentAddress, 
                  street: formData.street,
                  city: formData.city,
                  state: formData.state,
                  pincode: formData.pincode
              },
              district: formData.city,
              state: formData.state
          }
      };
      
      onUpdate(updatedUser);
      setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
         if(event.target?.result) {
            onUpdate({...user, profile: {...user.profile!, profilePic: event.target.result as string}});
         }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 font-sans">
        {onBack && (
            <button 
                onClick={onBack}
                className="flex items-center text-slate-500 mb-6 hover:text-slate-900 font-bold transition-colors"
            >
                <ArrowLeft className="h-5 w-5 mr-2" /> Back to Dashboard
            </button>
        )}

        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
            {/* Header / Cover */}
            <div className="h-48 bg-slate-900 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1674&q=80')] opacity-10 bg-cover bg-center"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            </div>

            <div className="px-8 pb-10">
                <div className="relative flex flex-col md:flex-row justify-between items-end -mt-16 mb-10 gap-6">
                    <div className="flex items-end">
                        <div className="bg-white p-2 rounded-[2rem] shadow-xl relative z-10">
                            <div className="h-32 w-32 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100 relative overflow-hidden group">
                                {user.profile?.profilePic ? (
                                    <img src={user.profile.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user.role === 'OWNER' ? <Store className="h-16 w-16" /> : <User className="h-16 w-16" />
                                )}
                                {isEditing && (
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity">
                                        <Camera className="h-8 w-8 text-white opacity-80" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="mb-4 ml-4 hidden md:block">
                             <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                                {user.profile?.fullName || user.name}
                                {language !== 'en' && <VoiceBtn text={language === 'hi' ? t.label_name.voice_text_hi : t.label_name.voice_text_mr} />}
                             </h1>
                             <p className="text-slate-500 font-medium">{user.role === 'WORKER' ? 'Job Seeker' : 'Shop Owner'} • {user.profile?.currentAddress?.city || user.profile?.district}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 mb-2 w-full md:w-auto">
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 md:flex-none bg-slate-100 text-slate-600 px-6 py-3 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors flex items-center justify-center"
                                >
                                    <X className="h-4 w-4 mr-2" /> Cancel
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="flex-1 md:flex-none bg-lime-400 text-slate-900 px-6 py-3 rounded-full text-sm font-bold hover:bg-lime-300 transition-colors flex items-center justify-center shadow-lg shadow-lime-200"
                                >
                                    <Save className="h-4 w-4 mr-2" /> Save Profile
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center shadow-lg"
                            >
                                <Edit2 className="h-4 w-4 mr-2" /> Edit Details
                            </button>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 1. Personal Information */}
                        <FormSection title={t.label_name[language]} icon={User}>
                            <InputField label="Full Name" value={formData.fullName} onChange={(v: any) => handleInputChange('fullName', v)} fullWidth />
                            <InputField label="About Me / Bio" value={formData.bio} onChange={(v: any) => handleInputChange('bio', v)} fullWidth multiline />
                            <InputField label="Age" value={formData.age} onChange={(v: any) => handleInputChange('age', v)} type="number" />
                            <InputField label="Gender" value={formData.gender} onChange={(v: any) => handleInputChange('gender', v)} options={['Male', 'Female', 'Other']} />
                            <InputField label="Aadhaar Number" value={formData.aadhaar} onChange={(v: any) => handleInputChange('aadhaar', v)} fullWidth placeholder="For Verification" />
                        </FormSection>
                        
                        {/* 2. Contact */}
                        <FormSection title={t.label_phone[language]} icon={Phone}>
                             <InputField label="Primary Contact" value={formData.contact} onChange={(v: any) => handleInputChange('contact', v)} />
                             <InputField label="WhatsApp" value={formData.whatsapp} onChange={(v: any) => handleInputChange('whatsapp', v)} />
                             <InputField label="Email" value={formData.email} onChange={(v: any) => handleInputChange('email', v)} fullWidth />
                        </FormSection>

                        {/* 3. Address */}
                        <FormSection title="Address" icon={MapPin}>
                             <InputField label="House/Shop No" value={formData.houseNumber} onChange={(v: any) => handleInputChange('houseNumber', v)} />
                             <InputField label="Street/Area" value={formData.street} onChange={(v: any) => handleInputChange('street', v)} />
                             <InputField label="State" value={formData.state} onChange={(v: any) => handleInputChange('state', v)} options={LOCATIONS.map(l => l.state)} />
                             <InputField label="City/District" value={formData.city} onChange={(v: any) => handleInputChange('city', v)} options={availableDistricts} />
                        </FormSection>

                        {/* 4. Role Specific Sections */}
                        {user.role === 'WORKER' ? (
                            <FormSection title="Professional" icon={Briefcase}>
                                <InputField label="Education" value={formData.education} onChange={(v: any) => handleInputChange('education', v)} options={['None', 'Below 10th', '10th Pass', '12th Pass', 'ITI / Diploma', 'Graduate']} />
                                <InputField label="Experience (Years)" value={formData.experienceYears} onChange={(v: any) => handleInputChange('experienceYears', v)} type="number" />
                                
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Skills</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.values(JobRole).map(s => (
                                            <button 
                                                key={s} type="button" 
                                                onClick={() => toggleArrayItem('skills', s)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${formData.skills.includes(s) ? 'bg-lime-500 text-white border-lime-600' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </FormSection>
                        ) : (
                            <>
                                <FormSection title="Shop Details" icon={Store}>
                                    <InputField label="Shop Name" value={formData.shopName} onChange={(v: any) => handleInputChange('shopName', v)} fullWidth />
                                    <InputField label="Shop Type" value={formData.shopType} onChange={(v: any) => handleInputChange('shopType', v)} options={Object.values(ShopType)} />
                                    <InputField label="Total Staff" value={formData.employeeCount} onChange={(v: any) => handleInputChange('employeeCount', v)} type="number" />
                                    <InputField label="Description" value={formData.shopDescription} onChange={(v: any) => handleInputChange('shopDescription', v)} fullWidth multiline />
                                    <InputField label="Opening Time" value={formData.openTime} onChange={(v: any) => handleInputChange('openTime', v)} type="time" />
                                    <InputField label="Closing Time" value={formData.closeTime} onChange={(v: any) => handleInputChange('closeTime', v)} type="time" />
                                </FormSection>

                                <FormSection title="Benefits & Allowances" icon={Coffee}>
                                     <div className="col-span-1 md:col-span-2">
                                        <p className="text-sm text-slate-500 mb-4">Select the standard benefits you offer to employees. These will be shown on your shop profile and new job posts.</p>
                                        <div className="flex flex-wrap gap-3">
                                            {COMMON_ALLOWANCES.map(allowance => (
                                                <button 
                                                    key={allowance} type="button" 
                                                    onClick={() => toggleArrayItem('shopAllowances', allowance)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors flex items-center ${formData.shopAllowances?.includes(allowance) ? 'bg-lime-500 text-white border-lime-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-lime-400'}`}
                                                >
                                                    {formData.shopAllowances?.includes(allowance) && <CheckCircle className="h-4 w-4 mr-2" />}
                                                    {allowance}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </FormSection>
                            </>
                        )}
                    </div>
                ) : (
                    // VIEW MODE
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                        {/* 1. Basic Info Card */}
                        <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 h-full">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <AlignLeft className="h-6 w-6 mr-3 text-slate-400" /> Basic Details
                            </h3>
                            <div className="space-y-5">
                                <div className="flex justify-between border-b border-slate-200/60 pb-3">
                                    <span className="text-slate-500 font-medium">{t.label_name[language]}</span>
                                    <span className="text-slate-900 font-bold">{user.profile?.fullName}</span>
                                </div>
                                {user.profile?.bio && (
                                     <div className="border-b border-slate-200/60 pb-3">
                                        <span className="text-slate-500 font-medium block mb-1">About</span>
                                        <p className="text-slate-900 text-sm leading-relaxed">{user.profile.bio}</p>
                                    </div>
                                )}
                                <div className="flex justify-between border-b border-slate-200/60 pb-3">
                                    <span className="text-slate-500 font-medium">Age / Gender</span>
                                    <span className="text-slate-900 font-bold">{user.profile?.age} yrs • {user.profile?.gender}</span>
                                </div>
                                {user.role === 'OWNER' && user.profile?.shopAllowances && user.profile.shopAllowances.length > 0 && (
                                    <div className="border-b border-slate-200/60 pb-3">
                                        <span className="text-slate-500 font-medium block mb-2">Benefits Offered</span>
                                        <div className="flex flex-wrap gap-2">
                                            {user.profile.shopAllowances.map(a => (
                                                <span key={a} className="px-2 py-1 bg-lime-100 text-lime-800 rounded text-xs font-bold">{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Contact & Address Card */}
                        <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 h-full">
                             <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <MapPin className="h-6 w-6 mr-3 text-slate-400" /> Contact & Location
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <Phone className="h-5 w-5 mr-3 text-green-600" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">{t.label_phone[language]}</p>
                                        <p className="text-slate-900 font-bold">{user.contact}</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">Location</p>
                                        <p className="text-slate-900 font-bold">{user.profile?.currentAddress.city}, {user.profile?.currentAddress.state}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
import { CheckCircle } from 'lucide-react';
