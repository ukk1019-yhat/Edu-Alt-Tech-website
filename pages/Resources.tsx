import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

import { normalizeSearch } from '../lib/search';
import { Link, useNavigate } from 'react-router-dom';
import { auth, onAuthStateChanged, db, collection, getDocs } from '../lib/firebase';
import LoginModal from '../components/LoginModal';
import { getDriveSubfolders, getDriveDownloadUrl, getDriveFileCategory } from '../lib/drive';

export interface ResourceItem {
  title: string;
  description: string;
  type: 'pdf' | 'notes' | 'questions' | 'worksheet';
  category: string;
  premium: boolean;
  downloads: string;
  url?: string;
  classLevel?: string;
}

export const STATIC_RESOURCES: ResourceItem[] = [
  { title: "NON-CONVENTIONAL ENERGY SOURCES", description: "Complete notes on non-conventional energy sources for engineering students", type: "pdf", category: "Engineering", premium: false, downloads: "1.2K", url: "/resources/NON-CONVENTIONAL%20ENERGY%20SOURCES.pdf", classLevel: "College/Engineering" },
  { title: "OBJECT ORIENTED PROGRAMMING", description: "Comprehensive OOP concepts and programming notes", type: "pdf", category: "Computer Science", premium: false, downloads: "2.1K", url: "/resources/OBJECT%20ORIENTED%20PROGRAMMING.pdf", classLevel: "College/Engineering" },
  { title: "OPERATING SYSTEMS", description: "Detailed operating systems study material covering all key topics", type: "pdf", category: "Computer Science", premium: false, downloads: "1.8K", url: "/resources/OPERATING%20SYSTEMS.pdf", classLevel: "College/Engineering" },
  { title: "ORGANIZATIONAL BEHAVIOUR", description: "Organizational behaviour notes for management and engineering students", type: "pdf", category: "Management", premium: false, downloads: "1.5K", url: "/resources/ORGANIZATIONAL%20BEHAVIOUR.pdf", classLevel: "College/Engineering" },
  { title: "ARTIFICIAL INTELLIGENCE", description: "AI principles, algorithms, and applications study material", type: "pdf", category: "Computer Science", premium: false, downloads: "2.1K", url: "/resources/ARTIFICIAL%20INTELLIGENCE.pdf", classLevel: "College/Engineering" },
  { title: "BIG DATA ANALYTICS", description: "Big data technologies, analytics techniques, and tools", type: "pdf", category: "Computer Science", premium: false, downloads: "1.7K", url: "/resources/BIG%20DATA%20ANALYTICS.pdf", classLevel: "College/Engineering" },
  { title: "CLOUD COMPUTING", description: "Cloud computing concepts, architectures, and service models", type: "pdf", category: "Computer Science", premium: false, downloads: "1.9K", url: "/resources/CLOUD%20COMPUTING.pdf", classLevel: "College/Engineering" },
  { title: "CLOUD COMPUTING - Part 2", description: "Advanced cloud computing topics and case studies", type: "pdf", category: "Computer Science", premium: false, downloads: "1.4K", url: "/resources/CLOUD%20COMPUTING2.pdf", classLevel: "College/Engineering" },
  { title: "COMPILER DESIGN", description: "Compiler design principles, parsing, and code generation", type: "pdf", category: "Computer Science", premium: false, downloads: "1.6K", url: "/resources/COMPILER%20DESIGN.pdf", classLevel: "College/Engineering" },
  { title: "COMPILER DESIGN - Part 2", description: "Advanced compiler optimization and code generation techniques", type: "pdf", category: "Computer Science", premium: false, downloads: "1.2K", url: "/resources/COMPILER%20DESIGN2.pdf", classLevel: "College/Engineering" },
  { title: "COMPILER DESIGN - Part 3", description: "Compiler design advanced topics and implementation", type: "pdf", category: "Computer Science", premium: false, downloads: "1.1K", url: "/resources/COMPILER%20DESIGN3.pdf", classLevel: "College/Engineering" },
  { title: "COMPUTER NETWORKS", description: "Computer networks fundamentals, protocols, and architecture", type: "pdf", category: "Computer Science", premium: false, downloads: "1.9K", url: "/resources/COMPUTER%20NETWORKS.pdf", classLevel: "College/Engineering" },
  { title: "COMPUTER ORGANIZATION", description: "Computer organization and architecture study material", type: "pdf", category: "Computer Science", premium: false, downloads: "1.7K", url: "/resources/COMPUTER%20ORGANIZATION.pdf", classLevel: "College/Engineering" },
  { title: "CRYPTOGRAPHIC & NETWORK SECURITY", description: "Cryptography and network security principles and practices", type: "pdf", category: "Computer Science", premium: false, downloads: "1.5K", url: "/resources/CRYPTOGRAPHIC%20%26%20NETWORK%20SECURITY.pdf", classLevel: "College/Engineering" },
  { title: "DATA MINING", description: "Data mining concepts, techniques, and algorithms", type: "pdf", category: "Computer Science", premium: false, downloads: "1.6K", url: "/resources/DATA%20MINING.pdf", classLevel: "College/Engineering" },
  { title: "DATABASE MANAGEMENT SYSTEMS", description: "Comprehensive DBMS notes covering SQL, normalization, and transactions", type: "pdf", category: "Computer Science", premium: false, downloads: "2.2K", url: "/resources/DATABASE%20MANAGEMENT%20SYSTEMS.pdf", classLevel: "College/Engineering" },
  { title: "DESIGN & ANALYSIS OF ALGORITHMS", description: "Algorithm design techniques, analysis, and complexity", type: "pdf", category: "Computer Science", premium: false, downloads: "1.8K", url: "/resources/DESIGN%20%26%20ANALYSIS%20OF%20ALGORITHMS.pdf", classLevel: "College/Engineering" },
  { title: "DISCRETE MATHEMATICS", description: "Discrete mathematics concepts including logic, sets, graphs, and combinatorics", type: "pdf", category: "Mathematics", premium: false, downloads: "2K", url: "/resources/DISCRETE%20MATHEMATICS.pdf", classLevel: "College/Engineering" },
  { title: "DISTRIBUTED SYSTEMS", description: "Distributed systems principles, architectures, and middleware", type: "pdf", category: "Computer Science", premium: false, downloads: "1.5K", url: "/resources/DISTRIBUTED%20SYSTEMS.pdf", classLevel: "College/Engineering" },
  { title: "FORMAL LANGUAGES AND AUTOMATA THEORY", description: "Automata theory, formal languages, and computational models", type: "pdf", category: "Computer Science", premium: false, downloads: "1.6K", url: "/resources/FORMAL%20LANGUAGES%20AND%20AUTOMATA%20THEORY.pdf", classLevel: "College/Engineering" },
  { title: "FULL STACK DEVELOPMENT", description: "Full stack web development covering frontend, backend, and databases", type: "pdf", category: "Computer Science", premium: false, downloads: "2.3K", url: "/resources/FULL%20STACK%20DEVELOPMENT.pdf", classLevel: "College/Engineering" },
  { title: "HUMAN-COMPUTER INTERACTION", description: "HCI principles, user interface design, and usability evaluation", type: "pdf", category: "Computer Science", premium: false, downloads: "1.4K", url: "/resources/HUMAN-COMPUTER%20INTERACTION.pdf", classLevel: "College/Engineering" },
  { title: "INTERNET OF THINGS & ITS APPLICATIONS", description: "IoT concepts, protocols, and real-world applications", type: "pdf", category: "Computer Science", premium: false, downloads: "1.8K", url: "/resources/INTERNET%20OF%20THINGS%20%26%20ITS%20APPLICATIONS.pdf", classLevel: "College/Engineering" },
  { title: "MACHINE LEARNING", description: "Machine learning algorithms, models, and applications", type: "pdf", category: "Computer Science", premium: false, downloads: "2.5K", url: "/resources/MACHINE%20LEARNING.pdf", classLevel: "College/Engineering" },
  { title: "NATURAL LANGUAGE PROCESSING", description: "NLP techniques, text processing, and language models", type: "pdf", category: "Computer Science", premium: false, downloads: "1.7K", url: "/resources/NATURAL%20LANGUAGE%20PROCESSING.pdf", classLevel: "College/Engineering" },
  { title: "DevOps", description: "DevOps principles, CI/CD, and infrastructure as code", type: "pdf", category: "Computer Science", premium: false, downloads: "1.3K", url: "/resources/DevOps.pdf", classLevel: "College/Engineering" },
  { title: "ROBOTICS & AUTOMATION", description: "Robotics and automation study material covering fundamentals to advanced topics", type: "pdf", category: "Engineering", premium: false, downloads: "1.1K", url: "/resources/ROBOTICS%20%26%20AUTOMATION.pdf", classLevel: "College/Engineering" },
  { title: "SCRIPTING LANGUAGES", description: "Comprehensive notes on scripting languages including Python, Perl, and shell", type: "pdf", category: "Computer Science", premium: false, downloads: "1.3K", url: "/resources/SCRIPTING%20LANGUAGES.pdf", classLevel: "College/Engineering" },
  { title: "SOCIAL MEDIA SECURITY", description: "Social media security principles, threats, and best practices", type: "pdf", category: "Computer Science", premium: false, downloads: "980", url: "/resources/SOCIAL%20MEDIA%20SECURITY.pdf", classLevel: "College/Engineering" },
  { title: "SOFTWARE ENGINEERING", description: "Complete software engineering notes covering SDLC, design, and testing", type: "pdf", category: "Computer Science", premium: false, downloads: "2.5K", url: "/resources/SOFTWARE%20ENGINEERING.pdf", classLevel: "College/Engineering" },
  { title: "SOFTWARE PROCESS AND PROJECT MANAGEMENT", description: "Software project management principles, processes, and methodologies", type: "pdf", category: "Computer Science", premium: false, downloads: "1.6K", url: "/resources/SOFTWARE%20PROCESS%20AND%20PROJECT%20MANAGEMENT.pdf", classLevel: "College/Engineering" },
  { title: "SOFTWARE TESTING METHODOLOGIES", description: "Software testing techniques, strategies, and methodologies", type: "pdf", category: "Computer Science", premium: false, downloads: "1.4K", url: "/resources/SOFTWARE%20TESTING%20METHODOLOGIES.pdf", classLevel: "College/Engineering" },
  { title: "JEE Main Mathematics - Calculus", description: "Complete calculus coverage for JEE Main including limits, derivatives, and integration", type: "pdf", category: "Mathematics", premium: false, downloads: "5.2K", classLevel: "JEE Main" },
  { title: "JEE Main Mathematics - Algebra", description: "Algebra comprehensive notes covering matrices, determinants, permutations, and combinations", type: "pdf", category: "Mathematics", premium: false, downloads: "4.8K", classLevel: "JEE Main" },
  { title: "JEE Main Mathematics - Coordinate Geometry", description: "Coordinate geometry concepts and problem-solving techniques for JEE", type: "pdf", category: "Mathematics", premium: false, downloads: "4.1K", classLevel: "JEE Main" },
  { title: "JEE Main Physics - Mechanics", description: "Mechanics complete guide covering kinematics, laws of motion, work, energy, and power", type: "pdf", category: "Science", premium: false, downloads: "6.1K", classLevel: "JEE Main" },
  { title: "JEE Main Physics - Electrodynamics", description: "Electrostatics, current electricity, magnetism, and electromagnetic induction", type: "pdf", category: "Science", premium: false, downloads: "5.5K", classLevel: "JEE Main" },
  { title: "JEE Main Physics - Optics & Modern Physics", description: "Wave optics, ray optics, dual nature of matter, and atomic physics", type: "pdf", category: "Science", premium: false, downloads: "4.3K", classLevel: "JEE Main" },
  { title: "JEE Main Chemistry - Physical Chemistry", description: "Physical chemistry including thermodynamics, chemical kinetics, and equilibrium", type: "pdf", category: "Science", premium: false, downloads: "4.9K", classLevel: "JEE Main" },
  { title: "JEE Main Chemistry - Organic Chemistry", description: "Organic chemistry reaction mechanisms, nomenclature, and biomolecules", type: "pdf", category: "Science", premium: false, downloads: "5.7K", classLevel: "JEE Main" },
  { title: "JEE Main Chemistry - Inorganic Chemistry", description: "Periodic table, chemical bonding, coordination compounds, and metallurgy", type: "pdf", category: "Science", premium: false, downloads: "4.5K", classLevel: "JEE Main" },
  { title: "Class 10 Math Formula Sheet", description: "All essential formulas and concepts for Class 10 Board exams", type: "notes", category: "Mathematics", premium: false, downloads: "3.2K", classLevel: "Class 9-10" },
  { title: "Class 9 Physics Mechanics Worksheet", description: "Practice problems on force, laws of motion, and gravitation", type: "worksheet", category: "Science", premium: false, downloads: "1.5K", classLevel: "Class 9-10" },
  { title: "Class 12 Electrostatics Revision Notes", description: "Quick revision notes and key derivations for Electrostatics", type: "notes", category: "Science", premium: false, downloads: "4.1K", classLevel: "Class 11-12" },
  { title: "Class 11 Trigonometry Question Bank", description: "Comprehensive question bank covering trigonometric functions and identities", type: "questions", category: "Mathematics", premium: false, downloads: "2.8K", classLevel: "Class 11-12" },
  { title: "English Grammar & Writing Skills", description: "Guide to active/passive voice, tenses, and essay writing", type: "notes", category: "English", premium: false, downloads: "2.4K", classLevel: "Class 6-8" },
  { title: "French Vocabulary & Conversation Guide", description: "Basic vocabulary list and introductory phrases in French", type: "notes", category: "English", premium: false, downloads: "1.1K", classLevel: "Class 6-8" },
];
 title: string;
 description: string;
 type: 'pdf' | 'notes' | 'questions' | 'worksheet';
 category: string;
 premium: boolean;
 downloads: string;
 url?: string;
 viewUrl?: string;
 classLevel?: string;
}

export const STATIC_RESOURCES: ResourceItem[] = [];

const typeIcons: Record<string, React.ReactNode> = {
 pdf: <FileText className="w-5 h-5" />,
 notes: <BookOpen className="w-5 h-5" />,
 questions: <Brain className="w-5 h-5" />,
 worksheet: <FileSpreadsheet className="w-5 h-5" />,
};

const typeLabels: Record<string, string> = {
  pdf: "PDF", notes: "Notes", questions: "Question Bank", worksheet: "Worksheet",
};

const categories = ["All", "Mathematics", "Science", "English", "Social Studies", "Computer Science", "Engineering", "Management"];

const Resources: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showPremium, setShowPremium] = useState<'all' | 'free' | 'premium'>('all');
  const [classFilter, setClassFilter] = useState('All');
  const [firebaseResources, setFirebaseResources] = useState<ResourceItem[]>([]);
  const [driveResources, setDriveResources] = useState<ResourceItem[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(true);
  const [user, setUser] = useState<any>(auth.currentUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const snap = await getDocs(collection(db, 'resources'));
        const items = snap.docs.map(d => {
          const data = d.data() as any;
          return { title: data.title || '', description: data.description || '', type: data.type || 'pdf', category: data.category || 'Computer Science', premium: data.premium || false, downloads: data.downloads || '0', url: data.url || '', classLevel: data.class_level || 'General' } as ResourceItem;
        });
        setFirebaseResources(items);
      } catch {}
    };
    fetchResources();
  }, []);

  useEffect(() => {
    const fetchDrive = async () => {
      try {
        const folders = await getDriveSubfolders();
        const items: ResourceItem[] = [];
        for (const folder of folders) {
          const category = getDriveFileCategory(folder.name);
          const folderLower = folder.name.toLowerCase();
          const isJee = folderLower.includes('jee') || folderLower.includes('iit') || folderLower.includes('jeee');
          for (const file of folder.files) {
            if (file.mimeType === 'application/vnd.google-apps.folder') continue;
            const name = file.name.replace(/\.pdf$/i, '');
            const sizeLabel = file.size ? ` (${(Number(file.size) / 1024 / 1024).toFixed(1)} MB)` : '';
            const fileLower = name.toLowerCase();
            const isJeeFile = fileLower.includes('jee') || fileLower.includes('iit') || fileLower.includes('advance') || fileLower.includes('mains') || (['physics', 'chemistry', 'mathematics', 'math'].includes(category.toLowerCase()) && (fileLower.includes('revision') || fileLower.includes('revison')));
            items.push({
              title: name, description: `${category} resource from Google Drive${sizeLabel}`, type: 'pdf', category, premium: false, downloads: '0',
              url: getDriveDownloadUrl(file.id), classLevel: isJee || isJeeFile ? 'JEE Main' : 'College/Engineering',
            });
          }
        }
        setDriveResources(items);
      } catch (e) { console.error('Failed to load Drive resources', e); }
      finally { setLoadingDrive(false); }
    };
    fetchDrive();
   const fetchDrive = async () => {
   try {
   const folders = await getDriveSubfolders();
   const items: ResourceItem[] = [];
   for (const folder of folders) {
   const category = getDriveFileCategory(folder.name);
   const folderLower = folder.name.toLowerCase();
   const isJee = folderLower.includes('jee') || folderLower.includes('iit') || folderLower.includes('jeee');
   for (const file of folder.files) {
   if (file.mimeType === 'application/vnd.google-apps.folder') continue;
   const name = file.name.replace(/\.pdf$/i, '');
   const sizeLabel = file.size ? ` (${(Number(file.size) / 1024 / 1024).toFixed(1)} MB)` : '';
   const fileLower = name.toLowerCase();
   const isJeeFile = fileLower.includes('jee') || fileLower.includes('iit') || fileLower.includes('advance') || fileLower.includes('mains') || (['physics', 'chemistry', 'mathematics', 'math'].includes(category.toLowerCase()) && (fileLower.includes('revision') || fileLower.includes('revison')));
   items.push({
   title: name,
   description: `${category} resource from Google Drive${sizeLabel}`,
   type: 'pdf',
   category,
   premium: false,
   downloads: '0',
   url: file.webContentLink || getDriveDownloadUrl(file.id),
   viewUrl: file.webViewLink || getDriveDownloadUrl(file.id).replace('uc?export=download', 'file/d') + '/view',
    classLevel: isJee || isJeeFile ? 'JEE Main' : 'College/Engineering',
   });
   }
   }
   setDriveResources(items);
  } catch (e) {
  console.error('Failed to load Drive resources', e);
  } finally {
  setLoadingDrive(false);
  }
  };
  fetchDrive();
  }, []);

  const allResources = useMemo(() => [...STATIC_RESOURCES, ...firebaseResources.filter(fr => !STATIC_RESOURCES.find(r => r.title === fr.title)), ...driveResources.filter(dr => !STATIC_RESOURCES.find(r => r.title === dr.title) && !firebaseResources.find(fr => fr.title === dr.title))], [firebaseResources, driveResources]);

  const trackDownload = async (item: ResourceItem) => {
    if (!auth.currentUser) return;
    try {
      await db.from('user_downloads').insert({
        user_id: auth.currentUser.uid, resource_title: item.title, resource_url: item.url || '', resource_type: item.type, downloaded_at: new Date().toISOString()
      });
    } catch (e) { console.error("Download track failed", e); }
  };

  const filtered = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);
    return allResources.filter(r => {
      const haystack = normalizeSearch(r.title + ' ' + r.description + ' ' + (r.category || '') + ' ' + (r.classLevel || ''));
      const matchSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      const matchCat = filter === 'All' || r.category === filter;
      const matchPremium = showPremium === 'all' || (showPremium === 'free' && !r.premium) || (showPremium === 'premium' && r.premium);
      const matchClass = classFilter === 'All' || r.classLevel === classFilter;
      return matchSearch && matchCat && matchPremium && matchClass;
    });
  }, [allResources, search, filter, showPremium, classFilter]);

  const displayedResources = useMemo(() => !user ? filtered.slice(0, 3) : filtered, [filtered, user]);

  return (
    <>
      <Helmet>
        <title>Learning Resources | Edu Alt Tech</title>
        <link rel="canonical" href="https://www.edualttech.com/#/resources" />
      </Helmet>
    <div className="viewport-content">
        {/* Header */}
        <div className="page-header" style={{ alignItems: 'start', border: 'none', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <span className="flabel" style={{ color: 'var(--accent)' }}>Learning Resources</span>
            <h1 style={{ marginTop: 8 }}>Free &amp; Premium Educational <span style={{ color: 'var(--accent)' }}>Resources</span></h1>
          </div>
          <input
            type="text"
            className="input"
            style={{ maxWidth: 300 }}
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="bento-card-compact" style={{ marginBottom: 24 }}>

          <div className="flex" style={{ gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className="btn btn-xs"
                style={{ background: filter === c ? 'var(--accent)' : 'transparent', color: filter === c ? '#fff' : 'var(--ink)', borderColor: filter === c ? 'var(--accent)' : 'var(--ink)' }}
              >{c}</button>
            ))}
          </div>

          <div className="flex" style={{ gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {(['all', 'free', 'premium'] as const).map(s => (
              <button key={s} onClick={() => setShowPremium(s)}
                className="btn btn-xs"
                style={{ background: showPremium === s ? 'var(--accent)' : 'transparent', color: showPremium === s ? '#fff' : 'var(--ink)', borderColor: showPremium === s ? 'var(--accent)' : 'var(--ink)' }}
              >{s === 'free' ? 'Free' : s === 'premium' ? 'Premium' : 'All'}</button>
            ))}
            <div className="flex" style={{ gap: 4, marginLeft: 12 }}>
              {['All', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'College/Engineering', 'JEE Main'].map(lvl => (
                <button key={lvl} onClick={() => setClassFilter(lvl)}
                  className="btn btn-xs"
                  style={{ background: classFilter === lvl ? 'var(--accent)' : 'transparent', color: classFilter === lvl ? '#fff' : 'var(--ink)', borderColor: classFilter === lvl ? 'var(--accent)' : 'var(--ink)' }}
                >{lvl}</button>
              ))}
            </div>
          </div>

          {(search || filter !== 'All' || showPremium !== 'all' || classFilter !== 'All') && (
            <button onClick={() => { setSearch(''); setFilter('All'); setShowPremium('all'); setClassFilter('All'); }}
              className="btn btn-xs flex items-center gap-1">
              × Clear All
            </button>
          )}
        </div>
 {/* Grid */}
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
 {displayedResources.map((item, idx) => (
 <motion.div
 key={idx} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
 className={`group bg-white border rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-2 ${
 item.premium
 ? 'border-amber-200 /50 hover:shadow-xl hover:shadow-amber-500/10'
 : 'border-slate-200 hover:shadow-xl hover:border-emerald-500'
 }`}
 >
 <div className="flex items-start justify-between mb-4">
 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
 item.premium ? 'bg-amber-50 /20 text-amber-500' : 'bg-emerald-50 /20 text-emerald-500'
 }`}>{typeIcons[item.type]}</div>
 <div className="flex gap-2 flex-wrap justify-end">
 {item.classLevel && (
 <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-100 /30 text-indigo-700 ">
 {item.classLevel}
 </span>
 )}
 <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
 item.premium
 ? 'bg-amber-100 /30 text-amber-700 '
 : 'bg-emerald-100 /30 text-emerald-700 '
 }`}>{typeLabels[item.type]}</span>
 {item.premium && (
 <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-100 /30 text-amber-700 flex items-center gap-1">
 <Lock className="w-3 h-3" /> Premium
 </span>
 )}
 </div>
 </div>
  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
   {!user ? (
    <span onClick={() => setIsAuthModalOpen(true)} className="cursor-pointer">
     {item.title}
    </span>
   ) : (item.viewUrl || item.url) ? (
    <a href={item.viewUrl || item.url} target="_blank" rel="noopener noreferrer">
     {item.title}
    </a>
   ) : (
    item.title
   )}
  </h3>
  <p className="text-sm text-slate-500 mb-4 leading-relaxed">{item.description}</p>
  <div className="flex items-center justify-between flex-wrap gap-2">
  <span className="text-xs text-slate-400">{item.downloads} downloads</span>
  <div className="flex gap-2">
  {!user ? (
   <>
    <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-colors bg-indigo-600 hover:bg-indigo-50 text-white shadow-lg shadow-indigo-600/20">
     <BookOpen className="w-3 h-3" /> View
    </button>
    <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-colors bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20">
     <Download className="w-3 h-3" /> Download
    </button>
   </>
  ) : (
   <>
    {(item.viewUrl || item.url) && (
     <a href={item.viewUrl || item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-colors bg-indigo-600 hover:bg-indigo-50 text-white shadow-lg shadow-indigo-600/20">
      <BookOpen className="w-3 h-3" /> View
     </a>
    )}
    {item.url ? (
     <a href={item.viewUrl || item.url} target="_blank" rel="noopener noreferrer" onClick={() => trackDownload(item)} className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
      item.premium
      ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20'
      : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
     }`}>
      <Download className="w-3 h-3" /> {item.premium ? 'Unlock' : 'Download'}
     </a>
    ) : (
     <button className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
      item.premium
      ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20'
      : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
     }`}>
      <Download className="w-3 h-3" /> {item.premium ? 'Unlock' : 'Download'}
     </button>
    )}
   </>
  )}
  </div>
  </div>
 </motion.div>
 ))}
 </div>

        {/* Resource Table */}
        {displayedResources.length > 0 ? (
          <div className="table-wrap bento-card bento-card-naked" style={{ marginBottom: 24 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Format</th>
                  <th>Stage</th>
                  <th>Downloads</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedResources.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="flex flex-col">
                        <strong className="td-title">{item.title}</strong>
                        <span className="text-xs text-ink-mute" style={{ marginTop: 2 }}>{item.description}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge flex items-center gap-6" style={{ width: 'fit-content', fontSize: '0.7rem' }}>
                        {typeLabels[item.type]}
                      </span>
                    </td>
                    <td>
                      {item.classLevel ? (
                        <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{item.classLevel}</span>
                      ) : (
                        <span className="text-ink-mute">—</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-xs">{item.downloads}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-8">
                        {item.premium && (
                          <span className="badge font-mono" style={{ fontSize: '0.65rem', color: 'var(--warning)', borderColor: 'var(--warning)', background: 'var(--warning-bg)' }}>
                            Premium
                          </span>
                        )}
                        {!user ? (
                          <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-xs flex items-center gap-4">
                            Download
                          </button>
                        ) : item.url ? (
                          <a href={item.url} download onClick={() => trackDownload(item)} className="btn btn-xs btn-primary flex items-center gap-4" style={{ textDecoration: 'none' }}>
                            {item.premium ? 'Unlock' : 'Download'}
                          </a>
                        ) : (
                          <button className="btn btn-xs flex items-center gap-4">
                            {item.premium ? 'Unlock' : 'Download'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            
            <h3>No resources found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Unlock CTA for unauthenticated */}
        {!user && filtered.length > 3 && (
          <div className="bento-card" style={{ textAlign: 'center', marginTop: 32 }}>
            
            <h2>Unlock {filtered.length - 3} More Resources</h2>
            <p>Join our premium community to gain full access to all worksheets, revision notes, question banks, and learning materials.</p>
            <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary">
              Unlock All Resources
            </button>
          </div>
        )}

        {/* Premium CTA */}
        <div className="bento-card" style={{ marginTop: 24 }}>
          <h2>Want Access to Premium Resources?</h2>
          <p>Enroll in our courses to unlock premium resources, question banks, and personalized study materials.</p>
          <Link to="/courses" className="btn btn-primary flex items-center gap-2" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            Browse Courses
          </Link>
        </div>
      </div>
      <LoginModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Resources;
