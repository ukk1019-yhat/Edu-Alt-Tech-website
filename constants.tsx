




export const LINKS = {
 enroll: "https://docs.google.com/forms/d/e/1FAIpQLSeQXyJQQjPwLJt-2E1P1PYBKC89z_NsX4UJewQymFPW0C0IIw/viewform",
   whatsapp: "https://wa.me/919121505879?text=Hi%20Edu%20Alt%20Tech!%20I%27d%20like%20to%20know%20more%20about%20your%20platform.",
 instagram: "https://www.instagram.com/edu_alt_tech/",
 linkedin: "https://www.linkedin.com/company/edu-alt-tech/"
};

export interface TeamMember {
 name: string;
 role: string;
 specialization: string;
 bio: string;
 email: string;
 image: string;
 linkedin?: string;
}

export interface Service {
 title: string;
 description: string;
 icon: string;
 features: string[];
}

export interface StatItem {
 value: string;
 label: string;
}

export const TEAM: TeamMember[] = [
 {
 name: "MOHAMMED AL RIHAB CHANDHINI",
 role: "Product Manager and AI Developer",
 specialization: "Product Strategy & AI Integration",
 bio: "Passionate about bridging technology and education. Guides the vision to create impactful AI-driven learning tools.",
 email: "alrihabchandhinimohammed@gmail.com",
 image: "/images/team/alrihab.jpg",
 linkedin: "https://www.linkedin.com/in/al-rihab-chandhini-mohammed-745160296/",
 },
 {
 name: "CH. Uma Krishna Kanth",
 role: "AI Designer and UI Designer",
 specialization: "User Experience & Visual Design",
 bio: "Crafts intuitive and beautiful interfaces. Believes that great design is the foundation of effective learning.",
 email: "ukkukk97@gmail.com",
 image: "/images/team/uma.jpg",
 linkedin: "https://www.linkedin.com/in/chokkapu-uma-krishna-kanth-50a502288/",
 },
 {
 name: "Srinivas Thalada",
 role: "App Developer",
 specialization: "Mobile & Web Applications",
 bio: "Transforms complex ideas into seamless applications. Dedicated to building robust and scalable platforms.",
 email: "thaladasrinivas2006@gmail.com",
 image: "/images/team/srinivas.jpeg",
 },
 {
 name: "Vinukonda Ranadeep",
 role: "Backend Developer",
 specialization: "System Architecture & APIs",
 bio: "The architect behind our data systems. Ensures everything runs quickly, securely, and without interruption.",
 email: "viranadeep@gmail.com",
 image: "/images/team/ranadeep.jpg",
 },
 {
 name: "Kakara Sandeep",
 role: "Customer Relationship Manager",
 specialization: "Community Engagement",
 bio: "Focuses on building strong connections with our users. Ensures every student's voice is heard and valued.",
 email: "sandeepkakara2005@gmail.com",
 image: "/images/team/sanju.jpeg"
 },
 {
 name: "Akula Venkat Surya Satyanarayana",
 role: "Front-end Developer",
 specialization: "Interactive Interfaces",
 bio: "Brings designs to life with clean and efficient code. Obsessed with pixel-perfect and responsive execution.",
 email: "akulasatish49@gmail.com",
 image: "/images/team/venkat.jpg",
 },
 {
 name: "Kavya Sri Vankayala",
 role: "Product Tester",
 specialization: "Quality Assurance",
 bio: "Meticulously tests every feature. Ensures our platforms meet the highest standards of quality before launch.",
 email: "vksvl2006@gmail.com",
 image: "/images/team/kavya.jpeg?v=2"
 },
 {
 name: "Gnana Sri Bathina",
 role: "Human Resources",
 specialization: "Talent & Culture",
 bio: "Shapes our company culture and recruits top talent. Believes a strong team is the core of any successful mission.",
  email: "gnanasribathina@gmail.com",
 image: "/images/team/gnanasri.jpg"
 }
];

export const SERVICES: Service[] = [
 {
 title: "School Website Development",
 description: "Custom, modern, responsive websites designed for schools and educational institutions with integrated portals.",
  icon: "🌐",
 features: ["Custom design & branding", "Student/parent portals", "Event calendars & newsletters", "SEO optimized", "Mobile responsive"]
 },
 {
 title: "Mobile App Development",
 description: "Native and cross-platform mobile applications for schools to connect with students, parents, and staff.",
  icon: "📱",
 features: ["iOS & Android apps", "Push notifications", "Fee payment integration", "Attendance tracking", "Real-time updates"]
 },
 {
 title: "School ERP Solutions",
 description: "Complete school management system to streamline administration, academics, and communication.",
  icon: "🧠",
 features: ["Student information system", "Timetable & attendance", "Exam & grade management", "Fee management", "Staff management"]
 },
 {
 title: "AI Solutions for Schools",
 description: "Cutting-edge AI tools to enhance teaching, learning, and administrative efficiency.",
  icon: "⚡",
 features: ["AI tutoring assistants", "Automated grading", "Learning analytics", "Smart content generation", "Behavior insights"]
 },
 {
 title: "Curriculum Support",
 description: "Digitally-enhanced curriculum materials and resources aligned with educational standards.",
  icon: "📚",
 features: ["Digital lesson plans", "Interactive content", "Assessment tools", "Multi-subject coverage", "Regular updates"]
 },
 {
 title: "Teacher Training Programs",
 description: "Professional development programs to empower educators with modern teaching tools and methodologies.",
  icon: "🎓",
 features: ["EdTech certification", "Workshop sessions", "Online & offline modes", "Ongoing support", "Pedagogy training"]
 }
];

export const STATS: StatItem[] = [
 { value: "50+", label: "Schools Partnered" },
 { value: "10K+", label: "Students Reached" },
 { value: "98%", label: "Satisfaction Rate" },
 { value: "24/7", label: "Support Available" }
];

export const SUPPORTING_TEAM: TeamMember[] = [
  {
    name: "Yuvaraj Nagireddy",
    role: "Data Scraper",
    specialization: "Data Extraction & Web Scraping",
    bio: "Specializes in extracting and organizing data to power informed decision-making across the platform.",
    email: "yuvarajnagireddy5@gmail.com",
    image: "/images/team/Yuva.jpeg",
    linkedin: "https://www.linkedin.com/in/yuvaraj-nagireddy-9048173b6?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
  {
    name: "Lavaraju",
    role: "Customer Service Manager",
    specialization: "Client Relations & Support",
    bio: "Dedicated to ensuring every client receives prompt, professional support and a seamless experience.",
    email: "lavaraju5751@gmail.com",
    image: "/images/team/lavaraju.jpg",
  },
];

export const HOW_IT_WORKS = [
 {
 title: "Consult & Assess",
 description: "We understand your school's unique needs, challenges, and goals through a detailed consultation.",
  icon: "🎯"
 },
 {
 title: "Design & Develop",
 description: "Our team creates custom solutions tailored to your institution's requirements and vision.",
  icon: "🧠"
 },
 {
 title: "Deploy & Train",
 description: "We implement the solution and train your staff to ensure smooth adoption and maximum impact.",
  icon: "⏰"
 },
 {
 title: "Support & Scale",
 description: "Ongoing support and continuous improvement to help your school grow and evolve.",
  icon: "🤝"
 }
];
