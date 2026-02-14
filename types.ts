
export enum ShopType {
  Restaurant = "Restaurant",
  Salon = "Salon",
  Grocery = "Grocery",
  Garage = "Garage",
  ClothingStore = "Clothing Store",
  StreetFood = "Street Food Stall",
  CyberCafe = "Cyber Cafe",
  CosmeticShop = "Cosmetic Shop"
}

export enum JobRole {
  Cook = "Cook",
  Helper = "Helper",
  Waiter = "Waiter",
  Cleaner = "Cleaner",
  Manager = "Manager",
  CounterStaff = "Counter Staff",
  HairCutter = "Hair Cutter",
  Stylist = "Stylist",
  Receptionist = "Receptionist",
  StockHandler = "Stock Handler",
  Mechanic = "Mechanic",
  SalesHelper = "Sales Helper",
  BillingStaff = "Billing Staff",
  Tailor = "Tailor",
  SystemOperator = "System Operator",
  CustomerSupport = "Customer Support"
}

export interface Location {
  state: string;
  district: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  type: ShopType;
  address: string;
  location: Location;
  ownerName: string;
  phone: string; // Hidden until interaction
  email: string;
  verified: boolean;
}

export type JobStatus = "Draft" | "Active" | "Paused" | "Closed" | "Filled" | "Expired";

export interface Job {
  id: string;
  shopId: string;
  role: JobRole;
  description: string;
  salaryMin: number;
  salaryMax: number;
  type: "Full-time" | "Part-time" | "Contractual";
  urgency: "Immediate" | "Standard" | "Relaxed";
  postedAt: string; // ISO String for display
  postedTimestamp: number; // Unix timestamp for sorting
  educationRequired: "None" | "10th" | "12th" | "ITI" | "Graduate";
  status: JobStatus;
  skillsRequired: string[];
  allowances?: string[]; // New field for benefits
  
  // Dashboard Metrics
  views: number;
  applications: number;
  isRecent: boolean;
}

export interface Worker {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  education: "None" | "10th" | "12th" | "ITI" | "Graduate";
  skills: string[]; // specific roles they can do
  experienceYears: number;
  location: Location;
  phone: string;
  availability: "Full-time" | "Part-time";
}

export type ApplicationStatus = "New" | "Reviewed" | "Shortlisted" | "Rejected" | "Interview Scheduled" | "Hired";

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  shopId: string;
  status: ApplicationStatus;
  appliedAt: string;
  matchScore: number;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert';
  read: boolean;
  timestamp: number;
}

export type ViewState = 'JOB_BOARD' | 'OWNER_DASHBOARD' | 'WORKER_PROFILE' | 'JOB_DETAILS' | 'APPLICANT_REVIEW';

export type UserRole = 'OWNER' | 'WORKER';

export type Language = 'en' | 'hi' | 'mr';

export interface Address {
  houseNumber?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface UserProfile {
  // Basic Info
  fullName: string;
  profilePic?: string; // Base64 or URL
  bio?: string;
  age: string; // Keeping as string to match form input easily, or can parse to number
  dob: string;
  gender: string;
  maritalStatus?: string;
  
  // Verification
  aadhaar?: string;

  // Contact Info
  email: string;
  contact: string;
  altContact?: string;
  whatsapp?: string;

  // Location
  currentAddress: Address;
  permanentAddress?: Address; // Optional, can be same as current

  // Worker Specific
  skills?: string[];
  education?: string; // Highest qualification
  experienceYears?: string;
  languages?: string[];
  preferredSalaryMin?: string;
  preferredSalaryMax?: string;
  preferredShift?: string;
  
  // Owner Specific
  shopName?: string;
  shopType?: ShopType;
  shopAddress?: Address;
  gstNumber?: string;
  shopDescription?: string;
  shopAllowances?: string[]; // Default benefits offered by shop
  employeeCount?: string;
  workingHours?: {
    open: string;
    close: string;
    weeklyOff: string;
  };
  district?: string;
  state?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  contact: string;
  profile?: UserProfile;
  // Session Persistence Metadata
  createdAt?: number;
  lastLogin?: number;
  sessionToken?: string;
}
