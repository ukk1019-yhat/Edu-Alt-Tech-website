
import React from 'react';
import { Users, Target, BookOpen, Brain, Zap, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';
import { StatItem } from './types';

export const LINKS = {
  enroll: "https://docs.google.com/forms/d/e/1FAIpQLSeQXyJQQjPwLJt-2E1P1PYBKC89z_NsX4UJewQymFPW0C0IIw/viewform",
  whatsapp: "https://chat.whatsapp.com/Bzd430nwAtb6pP0lJUam35",
  instagram: "https://www.instagram.com/edu_alt_tech/"
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

export interface FeatureCard {
  title: string;
  description: string;
  icon: string;
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
    image: "/images/team/kavya.jpeg"
  },
  
  {
    name: "Gnana Sri Bathina",
    role: "Human Resources",
    specialization: "Talent & Culture",
    bio: "Shapes our company culture and recruits top talent. Believes a strong team is the core of any successful mission.",
    email: "gnanasribathinagmail.com",
    image: "/images/team/gnanasri.jpg"
  }
];

export const HOW_IT_WORKS: FeatureCard[] = [
  {
    title: "Peer-to-peer teaching",
    description: "Learn by teaching others, solidifying your own understanding while helping peers grow.",
    icon: "Users"
  },
  {
    title: "Mentor-guided accountability",
    description: "Get personalized guidance and stay on track with dedicated mentors who care about your success.",
    icon: "Target"
  },
  {
    title: "Structured planning",
    description: "Follow a clear, actionable roadmap designed to bridge the gap between learning and doing.",
    icon: "Calendar"
  },
  {
    title: "Assistive AI",
    description: "Leverage cutting-edge AI tools to enhance your learning experience and boost productivity.",
    icon: "Zap"
  }
];


export const COMPARISON = [
  { feature: "Primary Focus", traditional: "Content Heavy", altTech: "System Heavy" },
  { feature: "Accountability", traditional: "Low Accountability", altTech: "High Accountability" },
  { feature: "Learning Mode", traditional: "Passive Learning", altTech: "Active Participation" },
  { feature: "Approach", traditional: "AI-First", altTech: "Human-First" }
];
