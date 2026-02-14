
import { Job, Shop, JobStatus, AuthUser, ShopType, Application, Worker, Notification, Language } from '../types';
import { MOCK_JOBS, MOCK_SHOPS, MOCK_APPLICATIONS, MOCK_WORKERS } from '../data/mockData';

const JOBS_KEY = 'rozgaar_jobs_v1';
const SHOPS_KEY = 'rozgaar_shops_v1';
const WORKERS_KEY = 'rozgaar_workers_v1';
const APPLICATIONS_KEY = 'rozgaar_applications_v1';
const USERS_DB_KEY = 'rozgaar_users_db_v1'; // Stores all registered users
const SESSION_KEY = 'rozgaar_session_v1';   // Stores currently logged in user ID/Token
const REMEMBER_ME_KEY = 'rozgaar_remember_contact';
const NOTIFICATIONS_KEY = 'rozgaar_notifications_v1';
const LANGUAGE_KEY = 'rozgaar_language_v1';

// Real-time Event Name
const DATA_CHANGE_EVENT = 'rozgaar-data-change';

export const storageService = {
  // --- REAL-TIME DATA LAYER ---
  
  // Dispatch event for same-tab updates
  triggerChange: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(DATA_CHANGE_EVENT));
    }
  },

  // Subscribe to changes (both same-tab and cross-tab)
  subscribe: (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    
    const handler = () => callback();
    
    // Listen for local changes
    window.addEventListener(DATA_CHANGE_EVENT, handler);
    // Listen for cross-tab changes
    window.addEventListener('storage', handler);
    
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  },

  // Initialize data if empty
  init: () => {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem(JOBS_KEY)) {
      localStorage.setItem(JOBS_KEY, JSON.stringify(MOCK_JOBS));
    }
    if (!localStorage.getItem(SHOPS_KEY)) {
      localStorage.setItem(SHOPS_KEY, JSON.stringify(MOCK_SHOPS));
    }
    if (!localStorage.getItem(WORKERS_KEY)) {
      localStorage.setItem(WORKERS_KEY, JSON.stringify(MOCK_WORKERS));
    }
    if (!localStorage.getItem(APPLICATIONS_KEY)) {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(MOCK_APPLICATIONS));
    }
    if (!localStorage.getItem(USERS_DB_KEY)) {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    }
  },

  // --- LANGUAGE SETTINGS ---
  getLanguage: (): Language | null => {
      return localStorage.getItem(LANGUAGE_KEY) as Language | null;
  },

  setLanguage: (lang: Language) => {
      localStorage.setItem(LANGUAGE_KEY, lang);
      storageService.triggerChange();
  },

  // --- USER AUTHENTICATION & PERSISTENCE ---

  findUserByContact: (contact: string): AuthUser | undefined => {
      const users: AuthUser[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
      return users.find(u => u.contact === contact || u.profile?.email === contact);
  },

  registerUser: (user: AuthUser) => {
      const users: AuthUser[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
      const index = users.findIndex(u => u.id === user.id);
      if (index >= 0) {
          users[index] = { ...user, createdAt: users[index].createdAt || Date.now() };
      } else {
          users.push({ ...user, createdAt: Date.now() });
      }
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      
      if (user.role === 'OWNER') {
          storageService.ensureShopExists(user);
      }
      storageService.triggerChange();
  },

  updateUser: (user: AuthUser) => {
    const users: AuthUser[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
        users[index] = { ...users[index], ...user };
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

        if (user.role === 'OWNER' && user.profile) {
            const shops: Shop[] = JSON.parse(localStorage.getItem(SHOPS_KEY) || '[]');
            const shopIndex = shops.findIndex(s => s.ownerId === user.id);
            
            if (shopIndex >= 0) {
                shops[shopIndex] = {
                    ...shops[shopIndex],
                    name: user.profile.shopName || shops[shopIndex].name,
                    type: user.profile.shopType || shops[shopIndex].type,
                    address: user.profile.shopAddress?.street || shops[shopIndex].address,
                    location: {
                        state: user.profile.state || shops[shopIndex].location.state,
                        district: user.profile.district || user.profile.currentAddress.city || shops[shopIndex].location.district
                    },
                    ownerName: user.name,
                    phone: user.contact,
                    email: user.profile.email || shops[shopIndex].email
                };
                localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
            }
        }
        storageService.triggerChange();
    }
  },

  ensureShopExists: (user: AuthUser) => {
      const shop = storageService.getShopByOwnerId(user.id);
      if (!shop && user.profile) {
          const newShop: Shop = {
              id: `shop-${user.id}`,
              ownerId: user.id,
              name: user.profile.shopName || 'My Shop',
              type: user.profile.shopType || ShopType.Grocery,
              address: user.profile.shopAddress?.street || '',
              location: {
                  state: user.profile.state || '',
                  district: user.profile.district || user.profile.currentAddress.city
              },
              ownerName: user.name,
              phone: user.contact,
              email: user.profile.email,
              verified: false
          };
          storageService.createShop(newShop);
      }
  },

  loginUser: (user: AuthUser, rememberMe: boolean = false) => {
      const sessionData = {
          userId: user.id,
          token: `token_${Date.now()}_${Math.random().toString(36).substr(2)}`,
          expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) 
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      
      const users: AuthUser[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
      const index = users.findIndex(u => u.id === user.id);
      if (index >= 0) {
          users[index].lastLogin = Date.now();
          localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      }

      if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, user.contact);
      } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
      }
      storageService.triggerChange();
  },

  logoutUser: () => {
      localStorage.removeItem(SESSION_KEY);
      storageService.triggerChange();
  },

  getCurrentUser: (): AuthUser | null => {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) return null;

      try {
          const session = JSON.parse(sessionStr);
          if (Date.now() > session.expiry) {
              localStorage.removeItem(SESSION_KEY);
              return null;
          }

          const users: AuthUser[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
          return users.find(u => u.id === session.userId) || null;
      } catch (e) {
          return null;
      }
  },

  getRememberedContact: (): string => {
      return localStorage.getItem(REMEMBER_ME_KEY) || '';
  },

  // --- NOTIFICATIONS ---
  getNotifications: (userId: string): Notification[] => {
      const all: Notification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
      return all.filter(n => n.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  },

  addNotification: (notification: Notification) => {
      const all: Notification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
      all.push(notification);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
      storageService.triggerChange();
  },

  markNotificationRead: (notificationId: string) => {
      const all: Notification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
      const index = all.findIndex(n => n.id === notificationId);
      if (index >= 0) {
          all[index].read = true;
          localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
          storageService.triggerChange();
      }
  },

  markAllNotificationsRead: (userId: string) => {
      const all: Notification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
      const updated = all.map(n => n.userId === userId ? { ...n, read: true } : n);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      storageService.triggerChange();
  },

  // --- JOB OPERATIONS ---
  getJobs: (): Job[] => {
    const data = localStorage.getItem(JOBS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getJobById: (id: string): Job | undefined => {
    const jobs = storageService.getJobs();
    return jobs.find(j => j.id === id);
  },

  getJobsByShopId: (shopId: string): Job[] => {
    const jobs = storageService.getJobs();
    return jobs.filter(j => j.shopId === shopId).sort((a, b) => b.postedTimestamp - a.postedTimestamp);
  },

  saveJob: (job: Job) => {
    const jobs = storageService.getJobs();
    const index = jobs.findIndex(j => j.id === job.id);
    if (index >= 0) {
      jobs[index] = job;
    } else {
      jobs.unshift(job);
    }
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
    storageService.triggerChange();
  },

  deleteJob: (jobId: string) => {
    const jobs = storageService.getJobs();
    const newJobs = jobs.filter(j => j.id !== jobId);
    localStorage.setItem(JOBS_KEY, JSON.stringify(newJobs));
    storageService.triggerChange();
  },

  // --- SHOP OPERATIONS ---
  getShops: (): Shop[] => {
    const data = localStorage.getItem(SHOPS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getShopById: (id: string): Shop | undefined => {
    const shops = storageService.getShops();
    return shops.find(s => s.id === id);
  },

  getShopByOwnerId: (ownerId: string): Shop | undefined => {
    const shops = storageService.getShops();
    return shops.find(s => s.ownerId === ownerId);
  },

  createShop: (shop: Shop) => {
    const shops = storageService.getShops();
    const exists = shops.find(s => s.ownerId === shop.ownerId);
    if (!exists) {
        shops.push(shop);
        localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
        storageService.triggerChange();
    }
  },

  // --- WORKER & APPLICATION OPERATIONS ---
  
  getWorkerById: (id: string): Worker | undefined => {
      const workers: Worker[] = JSON.parse(localStorage.getItem(WORKERS_KEY) || '[]');
      const mockWorker = workers.find(w => w.id === id);
      if (mockWorker) return mockWorker;

      const users: AuthUser[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
      const user = users.find(u => u.id === id);

      if (user) {
          return {
              id: user.id,
              name: user.name,
              age: parseInt(user.profile?.age || '25'),
              gender: (user.profile?.gender as any) || 'Male',
              education: (user.profile?.education as any) || 'None',
              skills: user.profile?.skills || [],
              experienceYears: parseInt(user.profile?.experienceYears || '0'),
              location: {
                  state: user.profile?.state || '',
                  district: user.profile?.district || user.profile?.currentAddress?.city || ''
              },
              phone: user.contact,
              availability: 'Full-time'
          };
      }
      return undefined;
  },

  getApplicationsByJobId: (jobId: string): Application[] => {
      const apps: Application[] = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
      return apps.filter(a => a.jobId === jobId);
  },

  hasUserApplied: (jobId: string, workerId: string): boolean => {
      const apps: Application[] = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
      return apps.some(a => a.jobId === jobId && a.workerId === workerId);
  },

  createApplication: (app: Application): boolean => {
    const apps = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    if (apps.some((a: Application) => a.jobId === app.jobId && a.workerId === app.workerId)) {
        return false;
    }
    apps.push(app);
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));

    const jobs = storageService.getJobs();
    const jobIndex = jobs.findIndex(j => j.id === app.jobId);
    if (jobIndex >= 0) {
        jobs[jobIndex].applications += 1;
        localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
    }
    storageService.triggerChange();
    return true;
  },

  updateApplication: (updatedApp: Application) => {
      const apps: Application[] = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
      const index = apps.findIndex(a => a.id === updatedApp.id);
      if (index >= 0) {
          apps[index] = updatedApp;
          localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
          storageService.triggerChange();
      }
  }
};
