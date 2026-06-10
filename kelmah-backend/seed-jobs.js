/**
 * Kelmah Platform — Job Data Fix & Seed Script
 * 
 * 1. Fixes existing 7 jobs (missing fields, structure issues)
 * 2. Seeds 30+ new realistic Ghanaian vocational jobs across all categories, regions, hirers
 */

require('../kelmah-backend/dns-fix');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const URI = process.env.MONGODB_URI;

// Hirer IDs from the database (22 hirers)
const HIRERS = [
  { _id: '6891595768c3cdade00f564f', name: 'Gifty Afisa' },
  { _id: '6892b8fc66a1e818f0c46155', name: 'Samuel Osei' },
  { _id: '6892b90666a1e818f0c4615d', name: 'Akosua Mensah' },
  { _id: '6892f4c56c0c9f13ca24e14b', name: 'Kwame Boateng' },
  { _id: '6892f4c96c0c9f13ca24e14f', name: 'Ama Asante' },
  { _id: '6892f4cc6c0c9f13ca24e153', name: 'Kofi Adjei' },
  { _id: '6892f4d06c0c9f13ca24e157', name: 'Yaw Opoku' },
  { _id: '6892f4d46c0c9f13ca24e15b', name: 'Abena Owusu' },
  { _id: '6892f4d86c0c9f13ca24e15f', name: 'Kwaku Darko' },
  { _id: '6892f4db6c0c9f13ca24e163', name: 'Margaret Agyei' },
  { _id: '6892f4df6c0c9f13ca24e167', name: 'Joseph Appiah' },
  { _id: '6892f4e36c0c9f13ca24e16b', name: 'Grace Adomako' },
  { _id: '6892f4e66c0c9f13ca24e16f', name: 'Daniel Ofori' },
  { _id: '6892f4ea6c0c9f13ca24e173', name: 'Rebecca Boadu' },
  { _id: '6892f4ee6c0c9f13ca24e177', name: 'Charles Nkrumah' },
  { _id: '6892f4f26c0c9f13ca24e17b', name: 'Comfort Amponsah' },
  { _id: '6892f4f66c0c9f13ca24e17f', name: 'Emmanuel Tetteh' },
  { _id: '6892f4fa6c0c9f13ca24e183', name: 'Vivian Asiedu' },
  { _id: '6892f4fd6c0c9f13ca24e187', name: 'Francis Hayford' },
  { _id: '6892f5016c0c9f13ca24e18b', name: 'Sarah Kuffour' },
  { _id: '6892f5046c0c9f13ca24e18f', name: 'Isaac Obeng' },
];

const REGIONS = ["Greater Accra", "Ashanti", "Western", "Eastern", "Central", "Volta", "Northern", "Upper East", "Upper West", "Brong-Ahafo"];

const CITIES_BY_REGION = {
  "Greater Accra": ["Accra", "Tema", "Madina", "Achimota", "East Legon", "Adenta", "Teshie", "Kasoa"],
  "Ashanti": ["Kumasi", "Obuasi", "Ejisu", "Konongo", "Bekwai", "Mampong"],
  "Western": ["Takoradi", "Sekondi", "Tarkwa", "Axim", "Prestea"],
  "Eastern": ["Koforidua", "Nkawkaw", "Akosombo", "Akim Oda", "Suhum"],
  "Central": ["Cape Coast", "Winneba", "Elmina", "Kasoa", "Mankessim"],
  "Volta": ["Ho", "Keta", "Hohoe", "Aflao", "Kpando"],
  "Northern": ["Tamale", "Yendi", "Damongo", "Salaga"],
  "Upper East": ["Bolgatanga", "Navrongo", "Bawku"],
  "Upper West": ["Wa", "Lawra", "Tumu"],
  "Brong-Ahafo": ["Sunyani", "Techiman", "Berekum", "Wenchi"]
};

const DISTRICTS_BY_REGION = {
  "Greater Accra": ["Accra Metropolitan", "Tema Metropolitan", "Ga West", "La-Nkwantanang Madina", "Adentan Municipal"],
  "Ashanti": ["Kumasi Metropolitan", "Obuasi Municipal", "Ejisu Municipal", "Asante Akim North"],
  "Western": ["Sekondi-Takoradi Metropolitan", "Tarkwa-Nsuaem", "Prestea-Huni Valley"],
  "Eastern": ["New Juaben Municipal", "Kwahu West", "Abuakwa South"],
  "Central": ["Cape Coast Metropolitan", "Effutu Municipal", "Komenda-Edina Eguafo-Abirem"],
  "Volta": ["Ho Municipal", "Keta Municipal", "Hohoe Municipal"],
  "Northern": ["Tamale Metropolitan", "Yendi Municipal"],
  "Upper East": ["Bolgatanga Municipal", "Kassena-Nankana"],
  "Upper West": ["Wa Municipal"],
  "Brong-Ahafo": ["Sunyani Municipal", "Techiman Municipal"]
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysFromNow(days) { return new Date(Date.now() + days * 24 * 60 * 60 * 1000); }
function daysAgo(days) { return new Date(Date.now() - days * 24 * 60 * 60 * 1000); }

// New jobs to seed — realistic Ghanaian vocational jobs
const NEW_JOBS = [
  // ==================== Plumbing ====================
  {
    title: "Residential Plumbing Installation - 4 Bedroom House",
    description: "Complete plumbing installation for a new 4-bedroom house in East Legon. Work includes hot and cold water piping, drainage systems, bathroom fixtures installation (3 bathrooms), kitchen sink and dishwasher connections. Must use high-quality CPVC pipes. Previous experience with residential buildings required.",
    category: "Plumbing",
    skills: ["Plumbing", "Pipe Fitting", "Drainage Systems", "Fixture Installation"],
    budget: 8500,
    paymentType: "fixed",
    duration: { value: 3, unit: "week" },
    region: "Greater Accra",
    city: "Accra",
    experience: "advanced"
  },
  {
    title: "Emergency Pipe Repair - Burst Water Main",
    description: "Urgent repair needed for a burst water main at a commercial property in Tema Industrial Area. Water is flooding the basement. Need experienced plumber who can respond quickly, locate the burst, and repair or replace the damaged section. May need to work after hours.",
    category: "Plumbing",
    skills: ["Plumbing", "Pipe Repair", "Emergency Repairs", "Water Systems"],
    budget: 2500,
    paymentType: "fixed",
    duration: { value: 2, unit: "day" },
    region: "Greater Accra",
    city: "Tema",
    experience: "intermediate",
    urgent: true
  },
  {
    title: "Bathroom Renovation Plumbing - Hotel in Cape Coast",
    description: "Replumbing 8 hotel bathrooms as part of renovation project. Work includes removing old fixtures, installing new modern shower systems, toilets, and vanity units. Must coordinate with tiling and electrical teams. Hotel experience preferred.",
    category: "Plumbing",
    skills: ["Plumbing", "Bathroom Renovation", "Fixture Installation", "Hotel Maintenance"],
    budget: 12000,
    paymentType: "fixed",
    duration: { value: 1, unit: "month" },
    region: "Central",
    city: "Cape Coast",
    experience: "advanced"
  },

  // ==================== Electrical ====================
  {
    title: "Full House Electrical Wiring - New Build in Kumasi",
    description: "Complete electrical wiring for a new 5-bedroom house in Kumasi. Includes main distribution board, circuit wiring for all rooms, outdoor lighting, security camera wiring preparation, and solar panel pre-wiring. Must follow Ghana Standards Authority electrical codes. Licensed electrician only.",
    category: "Electrical",
    skills: ["Electrical Installation", "House Wiring", "Circuit Design", "Safety Protocols"],
    budget: 15000,
    paymentType: "fixed",
    duration: { value: 1, unit: "month" },
    region: "Ashanti",
    city: "Kumasi",
    experience: "expert"
  },
  {
    title: "Solar Panel Installation - Off-Grid System",
    description: "Install a 5kW off-grid solar system for a residence in Ada Foah. Includes mounting 12 solar panels on roof, installing inverter, charge controller, and battery bank (8x 200Ah batteries). Must include proper earthing and lightning protection. Solar installation certification required.",
    category: "Electrical",
    skills: ["Solar Installation", "Electrical", "Inverter Setup", "Battery Systems"],
    budget: 22000,
    paymentType: "fixed",
    duration: { value: 2, unit: "week" },
    region: "Greater Accra",
    city: "Tema",
    experience: "expert"
  },
  {
    title: "Office Electrical Maintenance Contract",
    description: "Monthly maintenance contract for a 3-storey office building in Osu. Includes regular inspection of electrical systems, replacing faulty switches/sockets, maintaining backup generator connections, and emergency callouts. Prefer electrician based in Accra who can respond within 2 hours.",
    category: "Electrical",
    skills: ["Electrical Maintenance", "Generator Systems", "Troubleshooting", "Commercial Buildings"],
    budget: 3000,
    paymentType: "hourly",
    duration: { value: 3, unit: "month" },
    region: "Greater Accra",
    city: "Accra",
    experience: "intermediate"
  },

  // ==================== Carpentry ====================
  {
    title: "Custom Kitchen Cabinets - Mahogany Wood",
    description: "Design and build custom kitchen cabinets using local mahogany wood for an upscale home in East Legon. L-shaped kitchen layout, approximately 15 linear feet of upper and lower cabinets. Must include soft-close hinges, pull-out drawers, and pantry unit. Bring your own tools and team.",
    category: "Carpentry",
    skills: ["Cabinet Making", "Carpentry", "Wood Finishing", "Kitchen Design"],
    budget: 18000,
    paymentType: "fixed",
    duration: { value: 1, unit: "month" },
    region: "Greater Accra",
    city: "Accra",
    experience: "expert"
  },
  {
    title: "Roof Truss Construction - Church Building",
    description: "Construct and install timber roof trusses for a new church building in Takoradi. Building dimensions: 25m x 15m. Must use treated timber and comply with building codes. Experience with large-span roof structures essential. Will work with roofing team for handover.",
    category: "Carpentry",
    skills: ["Roof Trusses", "Structural Carpentry", "Timber Work", "Construction"],
    budget: 25000,
    paymentType: "fixed",
    duration: { value: 3, unit: "week" },
    region: "Western",
    city: "Takoradi",
    experience: "expert"
  },
  {
    title: "Furniture Repair and Restoration - Antique Pieces",
    description: "Restore 6 antique wooden furniture pieces (2 chairs, 1 dining table, 1 cabinet, 2 side tables) for a collector in Kumasi. Pieces are 50-80 years old and need careful repair, refinishing, and polishing. Must have experience with antique restoration. Handle with extreme care.",
    category: "Carpentry",
    skills: ["Furniture Restoration", "Wood Repair", "Polishing", "Antique Care"],
    budget: 5000,
    paymentType: "fixed",
    duration: { value: 2, unit: "week" },
    region: "Ashanti",
    city: "Kumasi",
    experience: "advanced"
  },

  // ==================== Masonry ====================
  {
    title: "Compound Wall Construction - 200 Linear Meters",
    description: "Build a perimeter compound wall for a residential estate in Kasoa. 200 linear meters, 2.4m height with block and plastering. Includes vehicle gate columns, pedestrian gate, and decorative pillars every 10m. Must be experienced with large-scale wall construction.",
    category: "Masonry",
    skills: ["Block Laying", "Masonry", "Plastering", "Wall Construction"],
    budget: 35000,
    paymentType: "fixed",
    duration: { value: 2, unit: "month" },
    region: "Central",
    city: "Kasoa",
    experience: "advanced"
  },
  {
    title: "Tiling Work - 3 Bedroom Apartment",
    description: "Floor and wall tiling for a 3-bedroom apartment in Achimota. Approximately 120 square meters of floor tiling (porcelain tiles) and 45 square meters of wall tiling in bathrooms and kitchen. Tiles will be provided. Need neat, professional finish with proper waterproofing in wet areas.",
    category: "Masonry",
    skills: ["Tiling", "Floor Installation", "Waterproofing", "Wall Tiling"],
    budget: 6000,
    paymentType: "fixed",
    duration: { value: 2, unit: "week" },
    region: "Greater Accra",
    city: "Accra",
    experience: "intermediate"
  },
  {
    title: "Foundation and Blockwork - 6 Unit Apartment",
    description: "Foundation construction and block laying for a 6-unit apartment block in Koforidua. Includes excavation support, foundation concrete work, and block laying up to lintel level. Structural drawings provided. Must have team of at least 5 workers. Construction experience required.",
    category: "Masonry",
    skills: ["Block Laying", "Foundation Work", "Concrete Work", "Construction"],
    budget: 45000,
    paymentType: "fixed",
    duration: { value: 2, unit: "month" },
    region: "Eastern",
    city: "Koforidua",
    experience: "expert"
  },

  // ==================== Painting ====================
  {
    title: "Interior Painting - 10 Room Office Building",
    description: "Professional interior painting for a 10-room office building in Osu. Includes wall preparation (filling cracks, sanding), 2 coats of emulsion paint on walls, and 1 coat oil paint on doors/frames. Colors to be selected from Azar Paints Ghana catalogue. Clean, drip-free work expected.",
    category: "Painting",
    skills: ["Interior Painting", "Wall Preparation", "Emulsion Application", "Office Painting"],
    budget: 8000,
    paymentType: "fixed",
    duration: { value: 2, unit: "week" },
    region: "Greater Accra",
    city: "Accra",
    experience: "intermediate"
  },
  {
    title: "Exterior Building Painting - 3 Storey Commercial",
    description: "Complete exterior painting of a 3-storey commercial building on Oxford Street, Osu. Includes scaffolding setup, pressure washing, crack filling, primer coat, and 2 coats of weather-resistant exterior paint. Building is approximately 500 square meters of exterior surface. Safety equipment required.",
    category: "Painting",
    skills: ["Exterior Painting", "Scaffold Work", "Commercial Painting", "Weatherproofing"],
    budget: 20000,
    paymentType: "fixed",
    duration: { value: 3, unit: "week" },
    region: "Greater Accra",
    city: "Accra",
    experience: "advanced"
  },
  {
    title: "Decorative Wall Finishes - Luxury Home",
    description: "Apply decorative wall finishes (Venetian plaster, textured paint, accent walls) in a luxury home in Airport Residential Area. 5 rooms need decorative treatment. Must have portfolio of previous decorative work. Premium materials will be provided. Attention to detail is critical.",
    category: "Painting",
    skills: ["Decorative Painting", "Venetian Plaster", "Textured Finishes", "Luxury Interiors"],
    budget: 12000,
    paymentType: "fixed",
    duration: { value: 2, unit: "week" },
    region: "Greater Accra",
    city: "Accra",
    experience: "expert"
  },

  // ==================== Welding ====================
  {
    title: "Metal Gate and Railing Fabrication",
    description: "Design and fabricate a decorative sliding gate (5m wide) and matching pedestrian gate (1.2m) plus staircase railings for a 2-storey building in Tema Community 25. Modern design with security features. Includes installation. Must have welding certification and own equipment.",
    category: "Welding",
    skills: ["Metal Fabrication", "Welding", "Gate Installation", "Railing Design"],
    budget: 15000,
    paymentType: "fixed",
    duration: { value: 3, unit: "week" },
    region: "Greater Accra",
    city: "Tema",
    experience: "advanced"
  },
  {
    title: "Industrial Steel Structure - Warehouse Roof",
    description: "Fabricate and install steel roof structure for a 30m x 20m warehouse in Spintex Industrial Area. Includes steel columns, purlins, and roof sheeting support. Must read structural drawings. Heavy-duty welding experience required. Team of at least 3 welders needed.",
    category: "Welding",
    skills: ["Structural Welding", "Steel Fabrication", "Roof Structures", "Industrial Construction"],
    budget: 55000,
    paymentType: "fixed",
    duration: { value: 1, unit: "month" },
    region: "Greater Accra",
    city: "Tema",
    experience: "expert"
  },

  // ==================== HVAC ====================
  {
    title: "Air Conditioning Installation - 20 Unit Office",
    description: "Install split-unit air conditioning in 20 office rooms in a commercial building in Ridge, Accra. Each room needs a 2HP split unit. Includes copper piping, drainage, and electrical connections. Must be experienced with Samsung and LG units. Licensed HVAC technician preferred.",
    category: "HVAC",
    skills: ["AC Installation", "HVAC", "Split Unit Systems", "Copper Piping"],
    budget: 30000,
    paymentType: "fixed",
    duration: { value: 2, unit: "week" },
    region: "Greater Accra",
    city: "Accra",
    experience: "advanced"
  },
  {
    title: "Cold Room Repair - Restaurant Refrigeration",
    description: "Diagnose and repair a walk-in cold room that has stopped cooling at a restaurant in Labone. Unit is a 3m x 3m cold room with Copeland compressor. May need gas recharge or compressor replacement. Urgent - food stock at risk. Same-day response needed.",
    category: "HVAC",
    skills: ["Refrigeration", "Cold Room Repair", "HVAC", "Compressor Systems"],
    budget: 5000,
    paymentType: "fixed",
    duration: { value: 2, unit: "day" },
    region: "Greater Accra",
    city: "Accra",
    experience: "advanced",
    urgent: true
  },

  // ==================== Roofing ====================
  {
    title: "Complete Roofing - Aluminum Longspan",
    description: "Supply of labor for roofing a 4-bedroom house with aluminum longspan (0.55mm gauge). Approximately 250 square meters of roof area. Includes fascia board installation, gutter system, and ridge caps. Roofing sheets and materials will be provided by owner. Must have own scaffolding.",
    category: "Roofing",
    skills: ["Roofing", "Aluminum Roofing", "Gutter Installation", "Fascia Work"],
    budget: 10000,
    paymentType: "fixed",
    duration: { value: 1, unit: "week" },
    region: "Ashanti",
    city: "Kumasi",
    experience: "intermediate"
  },
  {
    title: "Roof Leak Repair and Waterproofing",
    description: "Fix multiple leak points on the roof of a 2-storey building in Ho. Rain causes water damage to ceiling and walls on the upper floor. Need assessment of leak source, repair of damaged sheets, and application of waterproofing treatment. Previous roof repair experience essential.",
    category: "Roofing",
    skills: ["Roof Repair", "Waterproofing", "Leak Detection", "Maintenance"],
    budget: 4000,
    paymentType: "fixed",
    duration: { value: 3, unit: "day" },
    region: "Volta",
    city: "Ho",
    experience: "intermediate"
  },

  // ==================== Flooring ====================
  {
    title: "Epoxy Floor Coating - Factory Floor",
    description: "Apply industrial epoxy floor coating to a 500 square meter factory floor in Tema Heavy Industrial Area. Includes surface preparation (grinding), primer application, and 2-coat epoxy system with anti-slip finish. Work must be done over weekend to minimize production downtime.",
    category: "Flooring",
    skills: ["Epoxy Coating", "Floor Preparation", "Industrial Flooring", "Surface Treatment"],
    budget: 18000,
    paymentType: "fixed",
    duration: { value: 1, unit: "week" },
    region: "Greater Accra",
    city: "Tema",
    experience: "advanced"
  },
  {
    title: "Terrazzo Floor Polishing - School Building",
    description: "Polish and restore terrazzo floors in a 12-classroom school building in Tamale. Approximately 800 square meters. Includes grinding, polishing, and sealing. Work should be done during school holidays. Terrazzo polishing experience required. Own polishing machine needed.",
    category: "Flooring",
    skills: ["Terrazzo Polishing", "Floor Restoration", "Grinding", "Sealing"],
    budget: 15000,
    paymentType: "fixed",
    duration: { value: 2, unit: "week" },
    region: "Northern",
    city: "Tamale",
    experience: "intermediate"
  },

  // ==================== Construction ====================
  {
    title: "Building Renovation - Complete House Makeover",
    description: "Full renovation of a 30-year-old 3-bedroom house in Dansoman. Scope includes: structural repairs, re-plastering, new electrical wiring, plumbing overhaul, window and door replacement, floor tiling, painting, and minor roofing repairs. Need a competent team leader who can manage sub-trades.",
    category: "Construction",
    skills: ["Renovation", "Construction Management", "Building Repair", "Multi-Trade"],
    budget: 80000,
    paymentType: "fixed",
    duration: { value: 3, unit: "month" },
    region: "Greater Accra",
    city: "Accra",
    experience: "expert"
  },
  {
    title: "Swimming Pool Construction",
    description: "Build a 10m x 5m residential swimming pool with tiling and filtration system in Trasacco Valley. Includes excavation, reinforced concrete shell, waterproofing, mosaic tiling, pump room, and filtration installation. Pool builder experience of at least 3 completed projects required.",
    category: "Construction",
    skills: ["Pool Construction", "Concrete Work", "Waterproofing", "Filtration Systems"],
    budget: 65000,
    paymentType: "fixed",
    duration: { value: 2, unit: "month" },
    region: "Greater Accra",
    city: "Accra",
    experience: "expert"
  },

  // ==================== General Repairs ====================
  {
    title: "Handyman Services - Multiple Small Repairs",
    description: "Need a reliable handyman for multiple small repairs in an apartment in Cantonments: fix leaking kitchen tap, replace broken door lock, repair cracked wall plaster, tighten loose cabinet hinges, and fix a squeaky door. All minor work but needs someone who can do it all in one visit.",
    category: "General Repairs",
    skills: ["Handyman", "General Repairs", "Minor Plumbing", "Door Repair"],
    budget: 800,
    paymentType: "fixed",
    duration: { value: 1, unit: "day" },
    region: "Greater Accra",
    city: "Accra",
    experience: "beginner"
  },
  {
    title: "Window and Door Replacement - Residential",
    description: "Replace all windows (12 casement windows) and 3 external doors in a house in Sunyani. Aluminum casement windows with tinted glass preferred. Doors should be solid wood or metal security doors. Include proper sealing and finishing around frames. Measurement and procurement assistance needed.",
    category: "General Repairs",
    skills: ["Window Installation", "Door Fitting", "Aluminum Work", "Carpentry"],
    budget: 14000,
    paymentType: "fixed",
    duration: { value: 1, unit: "week" },
    region: "Brong-Ahafo",
    city: "Sunyani",
    experience: "intermediate"
  },

  // ==================== Landscaping ====================
  {
    title: "Garden Landscaping and Paving",
    description: "Design and execute landscaping for a residential compound in Spintex. Includes lawn preparation, planting ornamental trees and shrubs, building raised flower beds, installing interlocking pavement for the driveway (200 sqm), and setting up a simple irrigation system. Compound is approximately 800 square meters.",
    category: "Landscaping",
    skills: ["Landscaping", "Paving", "Garden Design", "Irrigation"],
    budget: 20000,
    paymentType: "fixed",
    duration: { value: 1, unit: "month" },
    region: "Greater Accra",
    city: "Accra",
    experience: "intermediate"
  },

  // ==================== Interior Design ====================
  {
    title: "Interior Fit-Out - New Restaurant in Osu",
    description: "Complete interior fit-out for a new restaurant in Osu. Includes: custom booth seating, bar counter construction, decorative ceiling work (suspended gypsum ceiling with LED lighting design), wall paneling, and floor treatment. Modern African-inspired theme required. Must present concept sketches before starting.",
    category: "Interior Design",
    skills: ["Interior Design", "Ceiling Work", "Furniture Installation", "Lighting Design"],
    budget: 45000,
    paymentType: "fixed",
    duration: { value: 2, unit: "month" },
    region: "Greater Accra",
    city: "Accra",
    experience: "expert"
  },

  // ==================== Tiling ====================
  {
    title: "Swimming Pool Tiling - Mosaic Tiles",
    description: "Apply mosaic tiles to a 6m x 4m swimming pool in Trasacco. Pool shell is already constructed and waterproofed. Need precise tiling work with premium glass mosaic tiles (provided). Must include proper grouting with epoxy grout. Minimum 2 completed pool tiling projects as reference.",
    category: "Tiling",
    skills: ["Pool Tiling", "Mosaic Tiling", "Epoxy Grouting", "Waterproof Tiling"],
    budget: 8000,
    paymentType: "fixed",
    duration: { value: 2, unit: "week" },
    region: "Greater Accra",
    city: "Accra",
    experience: "expert"
  },
];

function buildJobDocument(jobData, hirerIndex) {
  const hirer = HIRERS[hirerIndex % HIRERS.length];
  const region = jobData.region || pick(REGIONS);
  const city = jobData.city || pick(CITIES_BY_REGION[region] || ["Accra"]);
  const districts = DISTRICTS_BY_REGION[region] || [];
  const district = districts.length > 0 ? pick(districts) : "";
  
  const budget = jobData.budget;
  const minBid = Math.max(1, Math.floor(budget * 0.8));
  const maxBid = Math.max(minBid, Math.ceil(budget * 1.2));
  
  const createdDaysAgo = randInt(1, 45);
  const createdAt = daysAgo(createdDaysAgo);
  
  // Generate unique jobId
  const randomHex = Math.random().toString(16).substring(2, 10);
  
  return {
    title: jobData.title,
    description: jobData.description,
    category: jobData.category,
    skills: jobData.skills,
    budget: budget,
    currency: "GHS",
    duration: jobData.duration,
    paymentType: jobData.paymentType,
    location: {
      type: pick(["onsite", "onsite", "onsite", "hybrid"]), // mostly onsite for vocational
      country: "Ghana",
      city: city
    },
    status: "open",
    visibility: "public",
    hirer: new mongoose.Types.ObjectId(hirer._id),
    employerName: hirer.name,
    proposalCount: randInt(0, 15),
    viewCount: randInt(5, 120),
    startDate: daysFromNow(randInt(3, 30)),
    endDate: daysFromNow(randInt(60, 180)),
    createdAt: createdAt,
    updatedAt: createdAt,
    bidding: {
      maxBidders: randInt(3, 10),
      currentBidders: randInt(0, 3),
      bidDeadline: daysFromNow(randInt(7, 30)),
      minBidAmount: minBid,
      maxBidAmount: maxBid,
      bidStatus: "open"
    },
    locationDetails: {
      region: region,
      district: district,
      searchRadius: 25
    },
    requirements: {
      primarySkills: getPrimarySkills(jobData.category),
      secondarySkills: [],
      experienceLevel: jobData.experience || "intermediate",
      certifications: [],
      tools: []
    },
    performanceTier: pick(["tier1", "tier2", "tier3", "tier3"]),
    expiresAt: daysFromNow(30),
    isFeatured: Math.random() > 0.8, // 20% featured
    jobId: `job_${randomHex}`,
    applicantsCount: 0,
    applicationCount: 0,
    requiredSkills: jobData.skills,
    salary: {
      amount: budget,
      type: jobData.paymentType
    }
  };
}

function getPrimarySkills(category) {
  const map = {
    'Plumbing': ['Plumbing'],
    'Electrical': ['Electrical'],
    'Carpentry': ['Carpentry'],
    'Masonry': ['Masonry'],
    'Welding': ['Welding'],
    'Painting': ['Painting'],
    'HVAC': ['HVAC'],
    'Roofing': ['Roofing'],
    'Tiling': ['Flooring'],
    'Flooring': ['Flooring'],
    'Construction': ['Construction'],
    'Interior Design': ['Painting'],
    'Landscaping': ['Construction'],
    'General Repairs': ['Construction'],
  };
  return map[category] || ['Construction'];
}

(async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const jobsCollection = db.collection('jobs');
  
  // ====== STEP 1: Fix existing 7 jobs ======
  console.log('\n=== STEP 1: Fixing existing jobs ===');
  
  const existingJobs = await jobsCollection.find({}).toArray();
  console.log(`Found ${existingJobs.length} existing jobs`);
  
  for (const job of existingJobs) {
    const updates = {};
    
    // Add missing employerName if not present
    if (!job.employerName) {
      // Look up hirer name
      if (job.hirer) {
        const hirer = await db.collection('users').findOne(
          { _id: job.hirer },
          { projection: { firstName: 1, lastName: 1 } }
        );
        if (hirer) {
          updates.employerName = `${hirer.firstName} ${hirer.lastName}`.trim();
        }
      }
    }
    
    // Add missing jobId
    if (!job.jobId) {
      const shortId = job._id.toString().slice(-8);
      updates.jobId = `job_${shortId}`;
    }
    
    // Add missing isFeatured
    if (job.isFeatured === undefined) {
      updates.isFeatured = false;
    }
    
    // Add missing applicantsCount
    if (job.applicantsCount === undefined) {
      updates.applicantsCount = 0;
    }
    if (job.applicationCount === undefined) {
      updates.applicationCount = 0;
    }
    
    // Add missing salary
    if (!job.salary) {
      updates.salary = {
        amount: job.budget || 0,
        type: job.paymentType || 'fixed'
      };
    }
    
    // Add missing requiredSkills
    if (!job.requiredSkills && job.skills) {
      updates.requiredSkills = job.skills;
    }
    
    // Add missing performanceTier
    if (!job.performanceTier) {
      updates.performanceTier = 'tier3';
    }
    
    // Add missing expiresAt
    if (!job.expiresAt) {
      updates.expiresAt = daysFromNow(30);
    }
    
    // Fix bidding if deadline is in the past
    if (job.bidding && job.bidding.bidDeadline && new Date(job.bidding.bidDeadline) < new Date()) {
      updates['bidding.bidDeadline'] = daysFromNow(14);
      updates['bidding.bidStatus'] = 'open';
    }
    
    // Fix missing locationDetails  
    if (!job.locationDetails || !job.locationDetails.region) {
      updates.locationDetails = {
        region: 'Greater Accra',
        district: '',
        searchRadius: 25
      };
    }
    
    // Fix missing requirements
    if (!job.requirements || !job.requirements.primarySkills || job.requirements.primarySkills.length === 0) {
      updates.requirements = {
        primarySkills: getPrimarySkills(job.category),
        secondarySkills: [],
        experienceLevel: 'intermediate',
        certifications: [],
        tools: []
      };
    }
    
    if (Object.keys(updates).length > 0) {
      await jobsCollection.updateOne({ _id: job._id }, { $set: updates });
      console.log(`  Fixed "${job.title}" — updated ${Object.keys(updates).length} fields: ${Object.keys(updates).join(', ')}`);
    } else {
      console.log(`  "${job.title}" — already well-structured ✓`);
    }
  }
  
  // ====== STEP 2: Seed new jobs ======
  console.log(`\n=== STEP 2: Seeding ${NEW_JOBS.length} new jobs ===`);
  
  const newDocs = NEW_JOBS.map((jobData, i) => buildJobDocument(jobData, i));
  
  const result = await jobsCollection.insertMany(newDocs);
  console.log(`Inserted ${result.insertedCount} new jobs`);
  
  // ====== STEP 3: Verification ======
  console.log('\n=== STEP 3: Verification ===');
  
  const totalAfter = await jobsCollection.countDocuments();
  const openPublic = await jobsCollection.countDocuments({ status: 'open', visibility: 'public' });
  const categories = await jobsCollection.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  const regions = await jobsCollection.aggregate([
    { $group: { _id: '$locationDetails.region', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  const hirerCounts = await jobsCollection.aggregate([
    { $group: { _id: '$employerName', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log(`Total jobs: ${totalAfter}`);
  console.log(`Open + Public (visible in marketplace): ${openPublic}`);
  console.log('\nJobs by category:');
  categories.forEach(c => console.log(`  ${c._id}: ${c.count}`));
  console.log('\nJobs by region:');
  regions.forEach(r => console.log(`  ${r._id}: ${r.count}`));
  console.log('\nJobs by hirer:');
  hirerCounts.forEach(h => console.log(`  ${h._id}: ${h.count}`));
  
  // Validate a random new job matches schema
  const sample = await jobsCollection.findOne({ title: NEW_JOBS[0].title });
  console.log('\n=== Sample new job structure ===');
  console.log(JSON.stringify(sample, null, 2));
  
  await mongoose.disconnect();
  console.log('\n✅ Done! Database populated successfully.');
})().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
