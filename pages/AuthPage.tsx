
import React, { useState, useEffect } from 'react';
import { Store, User, ArrowRight, Smartphone, Mail, ShieldCheck, UserCircle, MapPin, Briefcase, ArrowLeft, CheckSquare, Globe, Camera, FileText, CreditCard } from 'lucide-react';
import { UserRole, AuthUser, ShopType, JobRole, UserProfile, Language } from '../types';
import { LOCATIONS } from '../data/mockData';
import { storageService } from '../services/storageService';
import { ONBOARDING_DATA, APP_STRINGS } from '../data/localization';
import { VoiceBtn } from '../components/VoiceBtn';

interface AuthPageProps {
  onLogin: (user: AuthUser) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Reusable Input Component for the form
const FormInput = ({ label, value, onChange, type = "text", placeholder = "", options = [] as string[], required = false }: any) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {options.length > 0 ? (
            <div className="relative">
                <select 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-lime-400 appearance-none transition-shadow"
                >
                    <option value="" disabled>Select {label}</option>
                    {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        ) : (
            <input 
                type={type} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-lime-400 placeholder:text-slate-400 transition-shadow"
                required={required}
            />
        )}
    </div>
);

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, language, setLanguage }) => {
  // Steps: 0: Language, 1: Role, 2: Login, 3: OTP, 4: Profile
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  
  const [role, setRole] = useState<UserRole | null>(null);
  const [method, setMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [existingUser, setExistingUser] = useState<AuthUser | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // --- Profile Creation State ---
  const [profileData, setProfileData] = useState({
      fullName: '',
      profilePic: '', // Base64
      bio: '',
      dob: '',
      age: '',
      gender: 'Male',
      maritalStatus: 'Single',
      aadhaar: '',
      
      // Contact
      email: '',
      whatsapp: '',
      altContact: '',
      
      // Address
      houseNumber: '',
      street: '',
      landmark: '',
      state: 'Maharashtra',
      city: 'Mumbai Suburban',
      pincode: '',

      // Worker Specific
      education: '10th Pass',
      experienceYears: '0',
      skills: [] as string[],
      languages: [] as string[],
      preferredSalaryMin: '',
      preferredShift: 'Day Shift',

      // Shop Specific
      shopName: '',
      shopType: ShopType.Grocery,
      shopDescription: '',
      gstNumber: '',
      employeeCount: '',
      openTime: '09:00',
      closeTime: '21:00',
      weeklyOff: 'Sunday'
  });

  useEffect(() => {
      const savedContact = storageService.getRememberedContact();
      if (savedContact) {
          setContact(savedContact);
      }
  }, []);

  const handleLangSelect = (selectedLang: Language) => {
      setLanguage(selectedLang);
      setStep(1);
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleCheckUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setLoading(true);
    setTimeout(() => {
        const user = storageService.findUserByContact(contact);
        if (user) {
            setExistingUser(user);
            setRole(user.role); 
        } else {
            setExistingUser(null);
        }
        setLoading(false);
        setStep(3);
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    // Simulate generic OTP verification (Any 4 digits)
    if (otp.length !== 4) {
        setLoading(false);
        setErrorMsg(ONBOARDING_DATA.data.otp_verification_screen.error_msg_wrong_otp[language]);
        return;
    }

    setTimeout(() => {
        setLoading(false);
        if (existingUser) {
            // Existing user with profile -> Login
            storageService.loginUser(existingUser, rememberMe);
            onLogin(existingUser);
        } else {
            // New user -> Go to Profile Creation
            setProfileData(prev => ({
                ...prev,
                email: method === 'EMAIL' ? contact : '',
                whatsapp: method === 'PHONE' ? contact : ''
            }));
            setStep(4); 
        }
    }, 1000);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      const userId = 'user-' + Date.now();
      
      const newProfile: UserProfile = {
          fullName: profileData.fullName,
          profilePic: profileData.profilePic,
          bio: profileData.bio,
          age: profileData.age,
          dob: profileData.dob,
          gender: profileData.gender,
          maritalStatus: profileData.maritalStatus,
          aadhaar: profileData.aadhaar,
          
          email: profileData.email,
          contact: contact,
          whatsapp: profileData.whatsapp,
          altContact: profileData.altContact,
          
          currentAddress: {
              houseNumber: profileData.houseNumber,
              street: profileData.street,
              landmark: profileData.landmark,
              city: profileData.city,
              state: profileData.state,
              pincode: profileData.pincode
          },
          
          // Worker Fields
          education: profileData.education,
          experienceYears: profileData.experienceYears,
          skills: profileData.skills,
          languages: profileData.languages,
          preferredSalaryMin: profileData.preferredSalaryMin,
          preferredShift: profileData.preferredShift,
          
          // Shop Fields
          shopName: profileData.shopName,
          shopType: profileData.shopType as ShopType,
          shopDescription: profileData.shopDescription,
          gstNumber: profileData.gstNumber,
          employeeCount: profileData.employeeCount,
          workingHours: {
              open: profileData.openTime,
              close: profileData.closeTime,
              weeklyOff: profileData.weeklyOff
          },
          // Map district for search compatibility
          district: profileData.city,
          state: profileData.state
      };

      const newUser: AuthUser = {
          id: userId,
          name: profileData.fullName,
          role: role!,
          contact: contact,
          profile: newProfile,
          createdAt: Date.now()
      };

      setTimeout(() => {
        storageService.registerUser(newUser);
        storageService.loginUser(newUser, rememberMe);
        onLogin(newUser);
      }, 1500);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
         if (event.target?.result) {
            setProfileData(prev => ({ ...prev, profilePic: event.target!.result as string }));
         }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const toggleArrayItem = (field: 'skills' | 'languages', item: string) => {
      setProfileData(prev => {
          const current = prev[field];
          const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
          return { ...prev, [field]: updated };
      });
  };

  const availableDistricts = LOCATIONS.find(l => l.state === profileData.state)?.districts || [];
  const LANGUAGES = ["Hindi", "English", "Marathi", "Gujarati", "Kannada", "Tamil", "Telugu", "Bhojpuri"];

  // --- LOCALIZED TEXT HELPERS ---
  const t_lang = ONBOARDING_DATA.data.language_selection_screen;
  const t_login = ONBOARDING_DATA.data.login_screen;
  const t_otp = ONBOARDING_DATA.data.otp_verification_screen;
  const strings = APP_STRINGS.auth; // Helper for new strings

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-y-auto">
      
      {/* Background Decorations */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-lime-400 rounded-full opacity-20 blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full opacity-20 blur-3xl pointer-events-none"></div>

      <div className={`w-full z-10 relative transition-all duration-500 ${step === 4 ? 'max-w-3xl my-10' : 'max-w-md'}`}>
        
        {step !== 4 && (
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Rozgaar<span className="text-lime-400">Link</span></h1>
                <p className="text-slate-400">Connecting local talent with opportunities.</p>
            </div>
        )}

        <div className={`bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl ${step === 4 ? 'p-8 md:p-10' : 'p-8'}`}>
          
          {/* STEP 0: LANGUAGE SELECTION */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                <div className="bg-lime-400/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Globe className="h-10 w-10 text-lime-400" />
                </div>
                <h2 className="text-2xl font-bold mb-8 flex items-center justify-center">
                    {t_lang.heading[language]}
                    {language !== 'en' && <VoiceBtn text={language === 'hi' ? t_lang.heading.voice_text_hi : t_lang.heading.voice_text_mr} />}
                </h2>
                <div className="space-y-4">
                    <button onClick={() => handleLangSelect('en')} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${language === 'en' ? 'border-lime-400 bg-lime-400/10' : 'border-slate-600 bg-slate-900 hover:border-slate-500'}`}>
                        <div className="flex items-center"><span className="text-2xl mr-4">🇬🇧</span><span className="font-bold text-lg">{t_lang.btn_english.label}</span></div>
                    </button>
                    <button onClick={() => handleLangSelect('hi')} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${language === 'hi' ? 'border-lime-400 bg-lime-400/10' : 'border-slate-600 bg-slate-900 hover:border-slate-500'}`}>
                        <div className="flex items-center"><span className="text-2xl mr-4">🇮🇳</span><span className="font-bold text-lg">{t_lang.btn_hindi.label}</span></div>
                    </button>
                    <button onClick={() => handleLangSelect('mr')} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${language === 'mr' ? 'border-lime-400 bg-lime-400/10' : 'border-slate-600 bg-slate-900 hover:border-slate-500'}`}>
                        <div className="flex items-center"><span className="text-2xl mr-4">🚩</span><span className="font-bold text-lg">{t_lang.btn_marathi.label}</span></div>
                    </button>
                </div>
            </div>
          )}

          {/* STEP 1: Role Selection */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button onClick={() => setStep(0)} className="text-sm text-slate-400 mb-6 hover:text-white flex items-center transition-colors"><ArrowLeft className="h-4 w-4 mr-1"/> {APP_STRINGS.common.back[language]}</button>
              <h2 className="text-2xl font-bold mb-6">{strings.select_role[language]}</h2>
              <div className="space-y-4">
                <button onClick={() => handleRoleSelect('OWNER')} className="w-full p-5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-lime-400 rounded-2xl flex items-center transition-all group">
                  <div className="bg-lime-400/10 p-3 rounded-xl mr-4 group-hover:bg-lime-400 group-hover:text-slate-900 transition-colors"><Store className="h-6 w-6 text-lime-400 group-hover:text-slate-900" /></div>
                  <div className="text-left flex-1"><h3 className="font-bold text-lg">{strings.role_owner[language]}</h3><p className="text-sm text-slate-400">{strings.role_owner_desc[language]}</p></div><ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-lime-400" />
                </button>
                <button onClick={() => handleRoleSelect('WORKER')} className="w-full p-5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-purple-400 rounded-2xl flex items-center transition-all group">
                  <div className="bg-purple-400/10 p-3 rounded-xl mr-4 group-hover:bg-purple-400 group-hover:text-slate-900 transition-colors"><User className="h-6 w-6 text-purple-400 group-hover:text-slate-900" /></div>
                  <div className="text-left flex-1"><h3 className="font-bold text-lg">{strings.role_worker[language]}</h3><p className="text-sm text-slate-400">{strings.role_worker_desc[language]}</p></div><ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-purple-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Login */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button onClick={() => setStep(1)} className="text-sm text-slate-400 mb-6 hover:text-white flex items-center transition-colors"><ArrowLeft className="h-4 w-4 mr-1"/> {APP_STRINGS.common.back[language]}</button>
              <h2 className="text-2xl font-bold mb-2 flex items-center">{t_login.welcome_text[language]}</h2>
              <p className="text-slate-400 mb-8 flex items-center">{t_login.instruction_text[language]}</p>
              <form onSubmit={handleCheckUser}>
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Smartphone className="h-5 w-5 text-slate-400" /></div>
                    <span className="absolute inset-y-0 left-11 flex items-center text-slate-300 text-sm font-bold border-r border-slate-600 pr-3 my-3">+91</span>
                    <input type="tel" className="block w-full rounded-2xl bg-slate-900 border border-slate-600 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 text-white placeholder-slate-500 py-4 pl-24 transition-all" placeholder={t_login.input_placeholder[language]} value={contact} onChange={(e) => setContact(e.target.value)} required />
                  </div>
                </div>
                <div className="flex items-center mb-8 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                    <div className={`h-5 w-5 mr-3 flex items-center justify-center border rounded-lg transition-all ${rememberMe ? 'bg-lime-400 border-lime-400' : 'bg-transparent border-slate-600 group-hover:border-lime-400'}`}>{rememberMe && <CheckSquare className="h-3.5 w-3.5 text-slate-900" />}</div>
                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Remember me</span>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-lime-400 text-slate-900 py-4 rounded-2xl font-bold text-lg hover:bg-lime-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(163,230,53,0.3)] flex items-center justify-center gap-2">{loading ? APP_STRINGS.common.loading[language] : t_login.btn_get_otp[language]}</button>
              </form>
            </div>
          )}

          {/* STEP 3: Verify OTP */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
               <button onClick={() => setStep(2)} className="text-sm text-slate-400 mb-6 hover:text-white flex items-center transition-colors"><ArrowLeft className="h-4 w-4 mr-1"/> {APP_STRINGS.common.back[language]}</button>
               <div className="text-center mb-8">
                 <div className="bg-lime-400/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-lime-400/30"><ShieldCheck className="h-10 w-10 text-lime-400" /></div>
                 <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">{t_otp.title[language]}</h2>
                 <p className="text-slate-400">Code sent to {contact}</p>
               </div>
               <form onSubmit={handleVerifyOtp}>
                 <div className="mb-4">
                   <input type="text" className="block w-full text-center text-3xl tracking-[0.5em] font-bold rounded-2xl bg-slate-900 border border-slate-600 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 text-white py-4" placeholder="XXXX" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} required />
                   <p className="text-center text-xs text-slate-500 mt-4">Use <span className="text-white font-mono bg-slate-800 px-1 rounded">1234</span> for demo</p>
                 </div>
                 {errorMsg && <div className="mb-4 text-center text-red-400 text-sm font-bold flex items-center justify-center gap-2">{errorMsg}</div>}
                 <button type="submit" disabled={loading} className="w-full bg-lime-400 text-slate-900 py-4 rounded-2xl font-bold text-lg hover:bg-lime-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(163,230,53,0.3)] flex items-center justify-center gap-2">{loading ? 'Verifying...' : t_otp.btn_verify[language]}</button>
               </form>
            </div>
          )}

          {/* STEP 4: MANDATORY PROFILE CREATION */}
          {step === 4 && (
             <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-8">
                     <h2 className="text-3xl font-bold mb-2 text-white">{strings.complete_profile[language]}</h2>
                     <p className="text-slate-400">{strings.profile_subtext[language]}</p>
                </div>
                
                <form onSubmit={handleProfileSubmit} className="space-y-8">
                    
                    {/* SECTION 1: Personal Details */}
                    <div className="bg-white rounded-2xl p-6 text-slate-900">
                         {/* Profile Picture Upload */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative group cursor-pointer">
                                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                    {profileData.profilePic ? (
                                        <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="h-16 w-16 text-slate-300" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-lime-400 p-2 rounded-full cursor-pointer hover:bg-lime-500 transition-colors shadow-sm">
                                    <Camera className="h-4 w-4 text-slate-900" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </label>
                            </div>
                            <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-wide">{strings.upload_photo[language]}</p>
                        </div>

                        <h3 className="text-lg font-bold mb-4 flex items-center border-b border-slate-100 pb-2">
                            <UserCircle className="h-5 w-5 mr-2 text-lime-600" /> {strings.personal_details[language]}
                        </h3>
                        <FormInput label={strings.full_name[language]} value={profileData.fullName} onChange={(v:any) => setProfileData({...profileData, fullName: v})} required placeholder={strings.enter_full_name[language]} />
                        
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{strings.about_me[language]}</label>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-lime-400 placeholder:text-slate-400 resize-none h-24"
                                placeholder="..."
                                value={profileData.bio}
                                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormInput label={strings.dob[language]} type="date" value={profileData.dob} onChange={(v:any) => setProfileData({...profileData, dob: v})} required />
                            <FormInput label={strings.age[language]} type="number" value={profileData.age} onChange={(v:any) => setProfileData({...profileData, age: v})} required />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <FormInput label={strings.gender[language]} value={profileData.gender} onChange={(v:any) => setProfileData({...profileData, gender: v})} options={['Male', 'Female', 'Other']} />
                             <FormInput label={strings.marital_status[language]} value={profileData.maritalStatus} onChange={(v:any) => setProfileData({...profileData, maritalStatus: v})} options={['Single', 'Married', 'Divorced', 'Widowed']} />
                        </div>
                    </div>

                    {/* SECTION 2: Identity Verification */}
                    <div className="bg-white rounded-2xl p-6 text-slate-900">
                        <h3 className="text-lg font-bold mb-4 flex items-center border-b border-slate-100 pb-2">
                            <ShieldCheck className="h-5 w-5 mr-2 text-lime-600" /> Identity Verification
                        </h3>
                        <FormInput label={strings.aadhaar_label[language]} value={profileData.aadhaar} onChange={(v:any) => setProfileData({...profileData, aadhaar: v})} placeholder="XXXX XXXX XXXX" required />
                    </div>

                    {/* SECTION 3: Contact Details */}
                    <div className="bg-white rounded-2xl p-6 text-slate-900">
                        <h3 className="text-lg font-bold mb-4 flex items-center border-b border-slate-100 pb-2">
                            <Smartphone className="h-5 w-5 mr-2 text-lime-600" /> {strings.contact_info[language]}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label={strings.whatsapp[language]} value={profileData.whatsapp} onChange={(v:any) => setProfileData({...profileData, whatsapp: v})} placeholder="e.g. 9876543210" />
                            <FormInput label={strings.alt_contact[language]} value={profileData.altContact} onChange={(v:any) => setProfileData({...profileData, altContact: v})} placeholder="" />
                            <div className="col-span-1 md:col-span-2">
                                <FormInput label={strings.email[language]} type="email" value={profileData.email} onChange={(v:any) => setProfileData({...profileData, email: v})} placeholder="name@example.com" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: Address */}
                    <div className="bg-white rounded-2xl p-6 text-slate-900">
                        <h3 className="text-lg font-bold mb-4 flex items-center border-b border-slate-100 pb-2">
                            <MapPin className="h-5 w-5 mr-2 text-lime-600" /> {strings.current_address[language]}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                             <FormInput label={strings.house_no[language]} value={profileData.houseNumber} onChange={(v:any) => setProfileData({...profileData, houseNumber: v})} required />
                             <FormInput label={strings.pincode[language]} value={profileData.pincode} onChange={(v:any) => setProfileData({...profileData, pincode: v})} required />
                        </div>
                        <FormInput label={strings.street[language]} value={profileData.street} onChange={(v:any) => setProfileData({...profileData, street: v})} required />
                        <FormInput label={strings.landmark[language]} value={profileData.landmark} onChange={(v:any) => setProfileData({...profileData, landmark: v})} />
                        
                        <div className="grid grid-cols-2 gap-4">
                             <FormInput label={strings.state[language]} value={profileData.state} onChange={(v:any) => setProfileData({...profileData, state: v})} options={LOCATIONS.map(l => l.state)} />
                             <FormInput label={strings.district[language]} value={profileData.city} onChange={(v:any) => setProfileData({...profileData, city: v})} options={availableDistricts} />
                        </div>
                    </div>

                    {/* SECTION 5: Role Specific */}
                    {role === 'WORKER' ? (
                        <div className="bg-white rounded-2xl p-6 text-slate-900">
                            <h3 className="text-lg font-bold mb-4 flex items-center border-b border-slate-100 pb-2">
                                <Briefcase className="h-5 w-5 mr-2 text-lime-600" /> {strings.professional_details[language]}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label={strings.education[language]} value={profileData.education} onChange={(v:any) => setProfileData({...profileData, education: v})} options={['None', 'Below 10th', '10th Pass', '12th Pass', 'ITI / Diploma', 'Graduate']} required />
                                <FormInput label={strings.experience[language]} type="number" value={profileData.experienceYears} onChange={(v:any) => setProfileData({...profileData, experienceYears: v})} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label={strings.salary[language]} type="number" value={profileData.preferredSalaryMin} onChange={(v:any) => setProfileData({...profileData, preferredSalaryMin: v})} required />
                                <FormInput label={strings.shift[language]} value={profileData.preferredShift} onChange={(v:any) => setProfileData({...profileData, preferredShift: v})} options={['Day Shift', 'Night Shift', 'Rotational', 'Any']} />
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{strings.skills[language]}</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(JobRole).map(s => (
                                        <button 
                                            key={s} type="button" 
                                            onClick={() => toggleArrayItem('skills', s)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${profileData.skills.includes(s) ? 'bg-lime-500 text-white border-lime-600' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{strings.languages[language]}</label>
                                <div className="flex flex-wrap gap-2">
                                    {LANGUAGES.map(l => (
                                        <button 
                                            key={l} type="button" 
                                            onClick={() => toggleArrayItem('languages', l)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${profileData.languages.includes(l) ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-6 text-slate-900">
                             <h3 className="text-lg font-bold mb-4 flex items-center border-b border-slate-100 pb-2">
                                <Store className="h-5 w-5 mr-2 text-lime-600" /> {strings.shop_details[language]}
                            </h3>
                            <FormInput label={strings.shop_name[language]} value={profileData.shopName} onChange={(v:any) => setProfileData({...profileData, shopName: v})} required />
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label={strings.shop_type[language]} value={profileData.shopType} onChange={(v:any) => setProfileData({...profileData, shopType: v})} options={Object.values(ShopType)} />
                                <FormInput label={strings.total_staff[language]} type="number" value={profileData.employeeCount} onChange={(v:any) => setProfileData({...profileData, employeeCount: v})} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <FormInput label={strings.opening_time[language]} type="time" value={profileData.openTime} onChange={(v:any) => setProfileData({...profileData, openTime: v})} />
                                <FormInput label={strings.closing_time[language]} type="time" value={profileData.closeTime} onChange={(v:any) => setProfileData({...profileData, closeTime: v})} />
                            </div>
                            <FormInput label={strings.desc[language]} value={profileData.shopDescription} onChange={(v:any) => setProfileData({...profileData, shopDescription: v})} placeholder="" />
                            <FormInput label="GST Number (Optional)" value={profileData.gstNumber} onChange={(v:any) => setProfileData({...profileData, gstNumber: v})} placeholder="GSTIN" />
                        </div>
                    )}

                    <div className="pt-4 pb-12">
                         <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-lime-400 text-slate-900 py-4 rounded-2xl font-bold text-lg hover:bg-lime-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(163,230,53,0.3)] flex items-center justify-center"
                        >
                            {loading ? (
                                <span>{APP_STRINGS.common.loading[language]}</span>
                            ) : (
                                <>
                                    <ShieldCheck className="h-5 w-5 mr-2" /> {strings.verify_signup[language]}
                                </>
                            )}
                        </button>
                    </div>
                </form>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
