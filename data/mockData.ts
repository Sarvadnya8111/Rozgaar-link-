
import { Job, Shop, Worker, ShopType, JobRole, JobStatus, Application, ApplicationStatus } from '../types';

// 1. Master Configuration - Locations
export const LOCATIONS = [
  { 
    state: "Maharashtra", 
    districts: [
      "Ahmednagar", "Akola", "Amravati", "Aurangabad (Chhatrapati Sambhajinagar)",
      "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli",
      "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur",
      "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar",
      "Nashik", "Osmanabad (Dharashiv)", "Palghar", "Parbhani", "Pune",
      "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur",
      "Thane", "Wardha", "Washim", "Yavatmal"
    ] 
  },
  { state: "Karnataka", districts: ["Bengaluru Urban", "Mysuru", "Hubballi-Dharwad"] },
  { state: "Delhi", districts: ["Central Delhi", "South Delhi", "North Delhi"] },
  { state: "Gujarat", districts: ["Ahmedabad", "Surat", "Vadodara"] },
  { state: "Tamil Nadu", districts: ["Chennai", "Coimbatore"] }
];

// Helper to get random item
const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubarray = <T,>(arr: T[], size: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
};

// 2. Mock Shops (60 shops for better spread)
const SHOP_NAMES = ["Laxmi", "Sai", "Ganesh", "Royal", "New India", "Priya", "Maharaja", "Friends", "Om", "City", "Jay Bhavani", "Samarth", "Shiv", "Krishna", "Modern"];
const LAST_NAMES = ["Kirana", "Store", "Motors", "Salon", "Cafe", "Styles", "Garage", "Food Corner", "Restaurant", "Boutique", "Traders", "Enterprises", "Bakery"];
const OWNERS = [
    { name: "Ramesh Gupta", phone: "+91 9876543210" },
    { name: "Suresh Patil", phone: "+91 9812345678" },
    { name: "Priya Sharma", phone: "+91 9988776655" },
    { name: "Amit Singh", phone: "+91 9123456789" },
    { name: "Anita Desai", phone: "+91 9567890123" },
    { name: "Vikas Deshmukh", phone: "+91 9871234567" },
    { name: "Neha Kulkarni", phone: "+91 9988112233" }
];

export const MOCK_SHOPS: Shop[] = Array.from({ length: 60 }).map((_, i) => {
    // Bias towards Maharashtra for the demo
    const isMaharashtra = Math.random() > 0.2; 
    const loc = isMaharashtra ? LOCATIONS[0] : getRandom(LOCATIONS.slice(1));
    const district = getRandom(loc.districts);
    const type = getRandom(Object.values(ShopType));
    const owner = getRandom(OWNERS);
    
    return {
        id: `shop-${i + 1}`,
        ownerId: `owner-${i + 1}`,
        name: `${getRandom(SHOP_NAMES)} ${getRandom(LAST_NAMES)}`,
        type: type,
        location: { state: loc.state, district: district },
        address: `Shop No ${10 + i}, Main Market, ${district}`,
        ownerName: owner.name,
        phone: owner.phone,
        email: `owner${i}@example.com`,
        verified: Math.random() > 0.3 
    };
});

// 3. Mock Jobs (150 jobs for better density)
const ROLES_BY_TYPE: Record<ShopType, JobRole[]> = {
    [ShopType.Restaurant]: [JobRole.Cook, JobRole.Waiter, JobRole.Helper],
    [ShopType.Salon]: [JobRole.HairCutter, JobRole.Stylist, JobRole.Cleaner],
    [ShopType.Grocery]: [JobRole.Helper, JobRole.StockHandler, JobRole.CounterStaff],
    [ShopType.Garage]: [JobRole.Mechanic, JobRole.Helper],
    [ShopType.ClothingStore]: [JobRole.SalesHelper, JobRole.Tailor],
    [ShopType.StreetFood]: [JobRole.Cook, JobRole.Helper],
    [ShopType.CyberCafe]: [JobRole.SystemOperator],
    [ShopType.CosmeticShop]: [JobRole.SalesHelper, JobRole.CustomerSupport]
};

export const MOCK_JOBS: Job[] = Array.from({ length: 150 }).map((_, i) => {
    const shop = getRandom(MOCK_SHOPS);
    const possibleRoles = ROLES_BY_TYPE[shop.type] || [JobRole.Helper];
    const role = getRandom(possibleRoles);
    
    // Generate timestamps
    const daysAgo = Math.floor(Math.random() * 60); // 0 to 60 days ago
    const postedDate = new Date(Date.now() - daysAgo * 86400000);
    
    // Determine status based on age
    let status: JobStatus = "Active";
    if (daysAgo > 45) status = "Expired";
    else if (daysAgo > 30) status = Math.random() > 0.5 ? "Filled" : "Active";
    else if (Math.random() > 0.9) status = "Paused";

    // Metrics
    const views = Math.floor(Math.random() * 500) + (60 - daysAgo) * 2; // Newer jobs might have fewer views unless viral, older have more
    const applications = Math.floor(views * (0.05 + Math.random() * 0.1)); // 5-15% conversion

    return {
        id: `job-${i + 1}`,
        shopId: shop.id,
        role: role,
        description: `We are hiring a ${role} for ${shop.name}. Good salary and working environment. Previous experience preferred but freshers can also apply.`,
        salaryMin: Math.floor(Math.random() * 5 + 8) * 1000, // 8k to 13k
        salaryMax: Math.floor(Math.random() * 8 + 15) * 1000, // 15k to 23k
        type: Math.random() > 0.2 ? "Full-time" : "Part-time",
        urgency: Math.random() > 0.6 ? "Immediate" : "Standard",
        postedAt: postedDate.toISOString(),
        postedTimestamp: postedDate.getTime(),
        educationRequired: getRandom(["None", "10th", "12th", "ITI"]),
        status: status,
        skillsRequired: [role, "Local Language"],
        views: views,
        applications: applications,
        isRecent: daysAgo <= 7
    };
});

// 4. Mock Workers (60 workers)
const WORKER_NAMES = ["Rahul", "Vijay", "Sunil", "Asha", "Meena", "Karan", "Pooja", "Vikram", "Ravi", "Sanjay", "Deepak", "Anjali"];
const SURNAMES = ["Kumar", "Singh", "Yadav", "Verma", "Mishra", "Jha", "Reddy", "Nair", "Das", "Roy"];

export const MOCK_WORKERS: Worker[] = Array.from({ length: 60 }).map((_, i) => {
    const loc = getRandom(LOCATIONS);
    const district = getRandom(loc.districts);
    
    const allRoles = Object.values(JobRole);
    const skills = getRandomSubarray(allRoles, Math.floor(Math.random() * 3) + 1);

    return {
        id: `worker-${i + 1}`,
        name: `${getRandom(WORKER_NAMES)} ${getRandom(SURNAMES)}`,
        age: 18 + Math.floor(Math.random() * 25),
        gender: Math.random() > 0.7 ? "Female" : "Male",
        education: getRandom(["None", "10th", "12th", "ITI"]),
        skills: skills,
        experienceYears: Math.floor(Math.random() * 10),
        location: { state: loc.state, district: district },
        phone: "+91 7000000000",
        availability: Math.random() > 0.3 ? "Full-time" : "Part-time"
    };
});

// 5. Mock Applications
export const MOCK_APPLICATIONS: Application[] = [];

// Generate applications for active jobs
MOCK_JOBS.filter(j => j.status === 'Active' && j.applications > 0).forEach(job => {
    // Pick random workers for this job
    const applicants = getRandomSubarray(MOCK_WORKERS, Math.min(job.applications, 8)); // Limit to 8 for realistic mock
    
    applicants.forEach((worker, idx) => {
        // Calculate a fake match score
        const hasRoleSkill = worker.skills.includes(job.role);
        const baseScore = hasRoleSkill ? 70 : 40;
        const randomVar = Math.floor(Math.random() * 30);
        const matchScore = Math.min(100, baseScore + randomVar);

        // Determine status
        const statuses: ApplicationStatus[] = ["New", "New", "New", "Reviewed", "Shortlisted", "Rejected"];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        MOCK_APPLICATIONS.push({
            id: `app-${job.id}-${worker.id}`,
            jobId: job.id,
            workerId: worker.id,
            shopId: job.shopId,
            status: status,
            appliedAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 86400000).toISOString(),
            matchScore: matchScore,
            notes: ""
        });
    });
});
