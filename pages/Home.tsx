import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MotionDiv, MotionH1, MotionP } from '../src/shared/hooks/useMotion';
import { PLATFORM_COURSES } from '../data/platformCourses';
  import { 
  ArrowRight, CheckCircle, GraduationCap, Globe, Smartphone, Brain, Zap, BookOpen, 
  Users, Star, Download, FileText, Award, Lightbulb, Code2, 
  TrendingUp, Calculator, Atom, Music, Palette, Briefcase, Compass, Sparkles, 
  Play, Hammer, MapPin, MessageCircle, Code, Rocket, RefreshCw, Target, 
  School, Sparkle
} from 'lucide-react';
import Button from '../components/Button';
import AnimatedCounter from '../components/AnimatedCounter';



const Home: React.FC = () => {

  return (
    <>
    <Helmet>
      <title>Edu Alt Tech | Learning Resources, Courses & AI Tools</title>
      <meta name="description" content="Edu Alt Tech provides learning resources, online courses, AI tools, educational websites and technology solutions." />
      <link rel="canonical" href="https://www.edualttech.com/" />
      <meta property="og:title" content="Edu Alt Tech" />
      <meta property="og:description" content="Learning Resources, Courses, AI Tools & School Technology Solutions" />
      <meta property="og:image" content="https://www.edualttech.com/og-image.jpg" />
      <meta property="og:url" content="https://www.edualttech.com/" />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Edu Alt Tech",
          "url": "https://www.edualttech.com",
          "logo": "https://www.edualttech.com/logo.png",
          "description": "Learning Resources, Courses, AI Tools and School Technology Solutions",
          "sameAs": [
            "https://in.linkedin.com/company/edu-alt-tech",
            "https://www.instagram.com/edu_alt_tech/"
          ]
        })}
      </script>
    </Helmet>
    <div className="bg-slate-50 :bg-gray-900 text-slate-900 :text-white overflow-hidden min-h-screen relative">
      
      {/* ═══════════════════════════════════════════════════════ Hero Section (Spatial Design) */}
      <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-grid-pattern mask-radial-fade opacity-60 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-emerald-400/10 blur-[120px] rounded-full animate-morph-blob" />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full animate-morph-blob" style={{ animationDelay: '-5s' }} />
          <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-amber-400/5 blur-[100px] rounded-full animate-morph-blob" style={{ animationDelay: '-10s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left: Rich Typography & Staggered Elements */}
          <div className="lg:col-span-7 text-left space-y-8">


            <MotionH1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 :text-white tracking-tighter leading-[0.9]"
            >
              Learn. Build.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 animate-shimmer-text">
                Innovate.
              </span>
            </MotionH1>

            <MotionP 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 :text-slate-300 leading-relaxed max-w-xl font-medium"
            >
              Learn real-world skills with mentor-guided courses, AI-powered assistance, and industry-aligned projects — designed for students who want to build, not just study.
            </MotionP>

            <MotionDiv 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Button variant="dark" to="/courses">
                Explore Courses <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="ghost" to="/contact">
                Partner With Us
              </Button>
            </MotionDiv>

            {/* Quick Metrics */}
            <MotionDiv 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="flex flex-wrap gap-8 pt-8 border-t border-slate-200 :border-slate-700/60 max-w-xl"
            >
              {[
                { value: 11, label: "Partner Schools" },
                { value: 1000, label: "Students Reached", suffix: "+" },
                { value: 100, label: "Study Resources", suffix: "+" },
                { value: 98, label: "Satisfaction Rate", suffix: "%" },
              ].map((stat, i) => (
                <div key={i} className="min-w-[100px]">
                  <div className="text-3xl font-black text-slate-900 :text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} />
                  </div>
                  <div className="text-xs text-slate-500 :text-slate-400 :text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </MotionDiv>
          </div>

          {/* Hero Right: Interactive Floating Skill Sphere */}
          <div className="hidden md:flex lg:col-span-5 relative justify-center items-center h-[500px] lg:h-[600px]">
            <MotionDiv 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[420px] md:h-[420px] rounded-full bg-gradient-to-br from-emerald-500/10 to-blue-500/10 flex items-center justify-center border border-emerald-500/20 shadow-2xl backdrop-blur-xl"
              style={{ willChange: 'transform' }}
            >
              {/* Central Logo Orb */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full bg-white :bg-gray-900 flex items-center justify-center shadow-2xl border border-slate-100 :border-slate-700 z-20 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img src="/logo.png" loading="lazy" decoding="async" alt="EduAltTech Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain z-10 animate-float" />
              </div>

              {/* Orbiting Language Characters representing barrier breaking */}
              <div className="hidden md:block absolute inset-0 w-full h-full pointer-events-none">
                <div className="absolute inset-0 animate-orbit-1 flex items-center justify-center">
                  <span className="bg-white :bg-gray-900 px-4 py-2 rounded-full border border-slate-100 :border-slate-700 shadow-md font-bold text-emerald-600 :text-emerald-400 text-base flex items-center gap-1.5 select-none pointer-events-auto">
                    <span>अ</span> <span className="text-xs text-slate-400 :text-slate-400 font-medium">Hindi</span>
                  </span>
                </div>
                <div className="absolute inset-0 animate-orbit-2 flex items-center justify-center">
                  <span className="bg-white :bg-gray-900 px-4 py-2 rounded-full border border-slate-100 :border-slate-700 shadow-md font-bold text-blue-600 text-base flex items-center gap-1.5 select-none pointer-events-auto">
                    <span>ड</span> <span className="text-xs text-slate-400 :text-slate-400 font-medium">Dogri (Jammu)</span>
                  </span>
                </div>
                <div className="absolute inset-0 animate-orbit-3 flex items-center justify-center">
                  <span className="bg-white :bg-gray-900 px-4 py-2 rounded-full border border-slate-100 :border-slate-700 shadow-md font-bold text-teal-600 text-base flex items-center gap-1.5 select-none pointer-events-auto">
                    <span>అ</span> <span className="text-xs text-slate-400 :text-slate-400 font-medium">Telugu</span>
                  </span>
                </div>
                <div className="absolute inset-0 animate-orbit-4 flex items-center justify-center">
                  <span className="bg-white :bg-gray-900 px-4 py-2 rounded-full border border-slate-100 :border-slate-700 shadow-md font-bold text-purple-600 text-base flex items-center gap-1.5 select-none pointer-events-auto">
                    <span>ک</span> <span className="text-xs text-slate-400 :text-slate-400 font-medium">Kashmiri</span>
                  </span>
                </div>
                <div className="absolute inset-0 animate-orbit-5 flex items-center justify-center">
                  <span className="bg-white :bg-gray-900 px-4 py-2 rounded-full border border-slate-100 :border-slate-700 shadow-md font-bold text-amber-600 text-base flex items-center gap-1.5 select-none pointer-events-auto">
                    <span>অ</span> <span className="text-xs text-slate-400 :text-slate-400 font-medium">Bengali</span>
                  </span>
                </div>
              </div>

              {/* Orbital Path rings */}
              <div className="hidden md:block absolute w-[400px] h-[400px] rounded-full border border-emerald-500/10 pointer-events-none" />
              <div className="hidden md:block absolute w-[480px] h-[480px] rounded-full border border-blue-500/5 pointer-events-none" />
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ Featured Learning Programs (Cards Redesign) */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          
          <MotionDiv 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="text-center mb-20 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 :text-emerald-300 font-bold uppercase tracking-widest text-[10px]">
              <Star className="w-4 h-4 text-emerald-600" />
              Empowering Skillsets
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 :text-white tracking-tighter leading-[0.9]">
              Featured Learning Programs
            </h2>
            <p className="text-lg text-slate-500 :text-slate-400 :text-slate-400 max-w-xl mx-auto font-medium">
              Join industry-led training modules designed to prepare you for building real solutions.
            </p>
          </MotionDiv>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {(() => {
              const featured = [
                { title: "Artificial Intelligence Fundamentals", icon: <Brain className="w-6 h-6" />, color: "from-emerald-500 to-teal-500", glow: "rgba(16, 185, 129, 0.15)", courseIdx: 0 },
                { title: "Full Stack Development", icon: <Code2 className="w-6 h-6" />, color: "from-blue-500 to-indigo-500", glow: "rgba(59, 130, 246, 0.15)", courseIdx: 1 },
                { title: "Entrepreneurship & Startups", icon: <Lightbulb className="w-6 h-6" />, color: "from-amber-500 to-orange-500", glow: "rgba(245, 158, 11, 0.15)", courseIdx: 3 },
                { title: "Digital Marketing Growth", icon: <TrendingUp className="w-6 h-6" />, color: "from-purple-500 to-pink-500", glow: "rgba(168, 85, 247, 0.15)", courseIdx: 2 },
                { title: "Advanced Mathematics", icon: <Calculator className="w-6 h-6" />, color: "from-red-500 to-rose-500", glow: "rgba(239, 68, 68, 0.15)", courseIdx: 7 },
                { title: "Physics Excellence Module", icon: <Atom className="w-6 h-6" />, color: "from-cyan-500 to-blue-500", glow: "rgba(6, 182, 212, 0.15)", courseIdx: 8 },
                { title: "Music & Creative Arts", icon: <Music className="w-6 h-6" />, color: "from-violet-500 to-purple-500", glow: "rgba(139, 92, 246, 0.15)", courseIdx: 9 },
                { title: "Creative Digital Design", icon: <Palette className="w-6 h-6" />, color: "from-pink-500 to-rose-500", glow: "rgba(236, 72, 153, 0.15)", courseIdx: 5 },
              ];
              return featured.map((course, idx) => {
                const courseId = `pc-${course.courseIdx}`;
                const courseData = PLATFORM_COURSES[course.courseIdx];
                return (
                  <Link key={idx} to={`/courses/${courseId}`} className="block">
                    <MotionDiv
                      initial={{ opacity: 0, y: 35 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.06, duration: 0.6 }}
                      whileHover={{ 
                        y: -10,
                        boxShadow: `0 20px 40px ${course.glow}`,
                        scale: 1.02
                      }}
                      className="group bg-white :bg-gray-900 border border-slate-200 :border-slate-700/80 rounded-[2.5rem] p-7 transition-all duration-300 hover:border-slate-300 relative flex flex-col justify-between h-[280px]"
                    >
                      <div>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/5 group-hover:scale-110 transition-transform duration-300`}>
                          {course.icon}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 :text-white tracking-tight leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-400 :text-slate-400 font-semibold mt-2">
                          {courseData?.duration || 'Industry aligned curriculum'}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100 :border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 :text-slate-400 uppercase tracking-widest">
                          Level: {courseData?.level || 'Beginner-Adv'}
                        </span>
                        <span className="text-xs font-black text-emerald-600 :text-emerald-400 group-hover:text-emerald-500 inline-flex items-center gap-1">
                          Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </MotionDiv>
                  </Link>
                );
              });
            })()}
          </div>

          <MotionDiv 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="text-center mt-16"
          >
            <Button variant="dark" to="/courses">
              View All Courses <ArrowRight className="w-5 h-5" />
            </Button>
          </MotionDiv>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ Learning Categories */}
      <section className="py-32 px-6 bg-slate-100/ :bg-gray-800/50 border-y border-slate-200 :border-slate-700/40 relative">
        <div className="max-w-7xl mx-auto">
          
          <MotionDiv 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="text-center mb-20 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 :text-emerald-300 font-bold uppercase tracking-widest text-[10px]">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Structured Tracks
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 :text-white tracking-tighter leading-[0.9]">
              Explore by Subject
            </h2>
            <p className="text-lg text-slate-500 :text-slate-400 :text-slate-400 max-w-xl mx-auto font-medium">
              From academic mastery to high-growth career tracks, discover tailored curriculum structures.
            </p>
          </MotionDiv>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <BookOpen className="w-5 h-5" />, title: "Academic Subjects", color: "from-emerald-500 to-teal-500",
                items: ["Mathematics Mastery", "Conceptual Physics", "Core Chemistry", "English Language Studies"]
              },
              {
                icon: <Zap className="w-5 h-5" />, title: "Future Tech Skills", color: "from-blue-500 to-indigo-500",
                items: ["Artificial Intelligence", "Full Stack Development", "Information Security", "Analytics & Databases"]
              },
              {
                icon: <Briefcase className="w-5 h-5" />, title: "Professional Careers", color: "from-amber-500 to-orange-500",
                items: ["Digital Marketing Hub", "Public Speaking", "Personal Finance", "Startup Incubation"]
              },
              {
                icon: <Palette className="w-5 h-5" />, title: "Creative Fields", color: "from-purple-500 to-pink-500",
                items: ["Instrumental Music", "Choreography & Dance", "Visual UI/UX Design", "Cinematography Basics"]
              },
            ].map((cat, idx) => (
              <MotionDiv
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white :bg-gray-900 border border-slate-200 :border-slate-700/80 rounded-[2.5rem] p-8 hover:shadow-xl transition-all duration-300 hover:border-slate-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-6 shadow-md`}>
                    {cat.icon}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 :text-white mb-5 tracking-tight">{cat.title}</h3>
                  <ul className="space-y-4">
                    {cat.items.map((item, i) => (
                      <li key={i} className="text-slate-600 :text-slate-300 font-bold text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-8 mt-8 border-t border-slate-100 :border-slate-700 flex items-center justify-between text-xs font-bold text-slate-400 :text-slate-400">
                  <span>Syllabus Available</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ School Tech Solutions (Interactive Dashboard Redesign) */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Context */}
            <div className="lg:col-span-5 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 :text-emerald-300 font-bold uppercase tracking-widest text-[10px]">
                <School className="w-4 h-4 text-emerald-600" />
                School Technology Solutions
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 :text-white tracking-tighter leading-[0.9]">
                Complete Education Technology Partner
              </h2>
              <p className="text-lg text-slate-600 :text-slate-300 leading-relaxed font-medium">
                We design custom websites, ERP platforms, and responsive mobile apps tailored for schools, administrators, students, and parents.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Bespoke Portals", text: "Custom web development tailored for schools." },
                  { label: "ERP Systems", text: "Admissions, grading, and finance dashboards." },
                  { label: "Mobile Apps", text: "Cross-platform access for school updates." },
                  { label: "Curriculum Sync", labelIcon: <Sparkle className="w-4.5 h-4.5 text-emerald-500 inline mr-1" />, text: "Digital study material integration." }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white :bg-gray-900 p-4 rounded-2xl border border-slate-200 :border-slate-700/80 space-y-1">
                    <div className="font-bold text-slate-900 :text-white text-sm">{item.label}</div>
                    <div className="text-xs text-slate-500 :text-slate-400 :text-slate-400 font-medium">{item.text}</div>
                  </div>
                ))}
              </div>

              <Button variant="dark" to="/services">
                Explore Tech Services <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Right Column: Interactive ERP Mockup Panel */}
            <div className="lg:col-span-7">
              <div className="glow-card rounded-[2.5rem] border border-slate-200 :border-slate-700/60 overflow-hidden shadow-2xl bg-white :bg-gray-900 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Mock ERP header */}
                <div className="flex items-center justify-between border-b border-slate-100 :border-slate-700 pb-4 sm:pb-5">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                      <School className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 :text-white tracking-tight">Genesis Portal</h4>
                      <span className="text-[9px] sm:text-[10px] text-emerald-600 :text-emerald-400 font-bold uppercase tracking-wider block">Alt-Tech ERP Active</span>
                    </div>
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 :text-slate-400 bg-slate-100 :bg-gray-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase">
                    Admin Panel
                  </span>
                </div>

                {/* Dashboard Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[
                    { title: "Admissions", val: "1,240", change: "+12% this term", color: "text-emerald-600" },
                    { title: "Platform Active", val: "94.6%", change: "Real-time sync", color: "text-blue-600" },
                    { title: "Course Progress", val: "88.2%", change: "+4.2% average", color: "text-purple-600" }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-50 :bg-gray-900 p-2.5 sm:p-4 rounded-2xl border border-slate-200 :border-slate-700/50 flex flex-col justify-between">
                      <div className="text-[10px] sm:text-xs text-slate-500 :text-slate-400 :text-slate-400 font-semibold leading-tight">{stat.title}</div>
                      <div className={`text-base sm:text-2xl font-black ${stat.color} my-1`}>{stat.val}</div>
                      <div className="text-[8px] sm:text-[10px] text-slate-400 :text-slate-400 font-bold leading-none">{stat.change}</div>
                    </div>
                  ))}
                </div>

                {/* ERP Activity log Simulator */}
                <div className="bg-slate-950 text-white rounded-2xl p-3.5 sm:p-5 border border-slate-800 space-y-2.5 sm:space-y-3 font-mono text-[10px] sm:text-xs">
                  <div className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Edu-Alt-Tech ERP Database Logs
                  </div>
                  <div className="space-y-1 sm:space-y-1.5 text-slate-300">
                    <div className="break-words">[09:20:41] <span className="text-emerald-400">SUCCESS</span>: Synchronized class recordings (Physics L3)</div>
                    <div className="break-words">[09:25:12] <span className="text-emerald-400">SUCCESS</span>: Subtitle translations generated (Hindi, Telugu)</div>
                    <div className="break-words">[09:31:00] <span className="text-blue-400">INFO</span>: Pushed grade reports to 542 parent mobile applications</div>
                    <div className="break-words">[09:40:02] <span className="text-emerald-400">SUCCESS</span>: ERP Billing gateway resolved. System online.</div>
                  </div>
                </div>

                {/* Connected Node Diagram teaser */}
                <div className="border border-slate-200 :border-slate-700/80 rounded-2xl p-3 sm:p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-slate-50">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 :text-slate-400 :text-slate-400 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700">Integrate Website + Parents Mobile Apps</span>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 :text-slate-400 :text-slate-400">Dual Node Connected</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ Why Edu Alt Tech */}
      <section className="py-32 px-6 relative bg-white :bg-gray-900 border-y border-slate-200 :border-slate-700/50">
        <div className="max-w-7xl mx-auto">
          
          <MotionDiv 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="text-center mb-20 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 :text-emerald-300 font-bold uppercase tracking-widest text-[10px]">
              <Award className="w-4 h-4 text-emerald-600" />
              Educational Paradigm
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 :text-white tracking-tighter leading-[0.9]">
              One Ecosystem. Endless Opportunities.
            </h2>
          </MotionDiv>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              "Immersive Future Skills",
              "Hands-On Project Labs",
              "Global Industry Mentors",
              "Dynamic Learning Pace",
              "Bespoke School Platforms",
              "Verified Degree Pathways",
            ].map((item, idx) => (
              <MotionDiv
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="flex items-center gap-4 p-6 bg-white :bg-gray-900 border border-slate-200 :border-slate-700/80 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-bold text-slate-900 :text-white text-sm">{item}</span>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ Free & Premium Resources */}
      <section className="py-32 px-6 relative bg-slate-50/ :bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          
          <MotionDiv 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 :text-emerald-300 font-bold uppercase tracking-widest text-[10px] mb-4">
                <Download className="w-4 h-4 text-emerald-600" />
                Curated Materials
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 :text-white tracking-tighter leading-[0.9]">
                Everything You Need<br />to Excel
              </h2>
            </div>
            <Link to="/resources" className="inline-flex items-center gap-2 text-emerald-600 :text-emerald-400 font-black hover:text-emerald-500 transition-colors">
              Browse All Resources <ArrowRight className="w-5 h-5 animate-pulse-soft" />
            </Link>
          </MotionDiv>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <FileText className="w-6 h-6" />, title: "Free Textbook PDFs", desc: "Download high-quality curated textbook notes and guides." },
              { icon: <BookOpen className="w-6 h-6" />, title: "Topic Question Banks", desc: "Sharpen knowledge with comprehensive practice questionnaires." },
              { icon: <Brain className="w-6 h-6" />, title: "Conceptual Worksheets", desc: "Printable review exercises designed to foster deep intuition." },
              { icon: <Download className="w-6 h-6" />, title: "Academic Mock Exams", desc: "Evaluate performance using board-aligned diagnostic papers." },
              { icon: <Compass className="w-6 h-6" />, title: "Professional Roadmaps", desc: "Follow progressive flowcharts for engineering and design tracks." },
              { icon: <Sparkles className="w-6 h-6" />, title: "AI Learning Manuals", desc: "Unlock prompt guidelines, tutorial sheets, and code logs." },
            ].map((item, i) => (
              <MotionDiv
                key={i} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: i * 0.08 }}
                className="bg-white :bg-gray-900 border border-slate-200 :border-slate-700/80 rounded-[2rem] p-8 hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-xl text-left flex flex-col justify-between h-[230px] hover:border-slate-300"
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 :text-emerald-400 mb-5">{item.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 :text-white mb-2 leading-tight">{item.title}</h3>
                  <p className="text-xs text-slate-400 :text-slate-400 font-semibold leading-relaxed">{item.desc}</p>
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ Process Walkthrough */}
      <section className="py-32 px-6 relative bg-white :bg-gray-900 border-y border-slate-200 :border-slate-700/50">
        <div className="max-w-7xl mx-auto">
          
          <MotionDiv 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="text-center mb-24 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 :text-emerald-300 font-bold uppercase tracking-widest text-[10px]">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Strategic Implementation
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 :text-white tracking-tighter leading-[0.9]">
              Your Path to Success
            </h2>
          </MotionDiv>

          {/* For Students */}
          <div className="mb-24">
            <h3 className="text-2xl font-black text-slate-900 :text-white mb-12 text-center flex items-center justify-center gap-2">
              <GraduationCap className="w-7 h-7 text-emerald-500" />
              For Students
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: 1, icon: <MapPin className="w-6 h-6" />, title: "1. Select Skill Paths", desc: "Choose from our catalog of engineering and conceptual courses." },
                { step: 2, icon: <Play className="w-6 h-6" />, title: "2. Join Active Sessions", desc: "Participate in lectures translated in your native tongue." },
                { step: 3, icon: <Hammer className="w-6 h-6" />, title: "3. Complete Lab Projects", desc: "Translate theoretical learning into working software or systems." },
                { step: 4, icon: <Award className="w-6 h-6" />, title: "4. Earn Qualifications", desc: "Secure industry-recognized credits and build portfolio assets." },
              ].map((item, idx) => (
                <MotionDiv
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center relative"
                >
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                    {item.icon}
                  </div>
                  {idx < 3 && <div className="hidden lg:block absolute top-8 left-[60%] w-[calc(100%-80px)] h-px bg-slate-200" />}
                  <h4 className="text-lg font-black text-slate-900 :text-white mb-2 leading-tight">{item.title}</h4>
                  <p className="text-xs text-slate-500 :text-slate-400 :text-slate-400 leading-relaxed font-semibold">{item.desc}</p>
                </MotionDiv>
              ))}
            </div>
          </div>

          {/* For Schools */}
          <div>
            <h3 className="text-2xl font-black text-slate-900 :text-white mb-12 text-center flex items-center justify-center gap-2">
              <School className="w-7 h-7 text-emerald-500" />
              For Schools
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: 1, icon: <MessageCircle className="w-6 h-6" />, title: "1. Consultation", desc: "Audit existing administration workflows and portal requirements." },
                { step: 2, icon: <Code className="w-6 h-6" />, title: "2. Custom Development", desc: "Tailor the ERP engine and school application interfaces." },
                { step: 3, icon: <Rocket className="w-6 h-6" />, title: "3. Deployment & Training", desc: "Setup portal directories and onboard academic departments." },
                { step: 4, icon: <RefreshCw className="w-6 h-6" />, title: "4. Core Support", desc: "Provide secure cloud hosting and regular patch updates." },
              ].map((item, idx) => (
                <MotionDiv
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center relative"
                >
                  <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-950/10">
                    {item.icon}
                  </div>
                  {idx < 3 && <div className="hidden lg:block absolute top-8 left-[60%] w-[calc(100%-80px)] h-px bg-slate-200" />}
                  <h4 className="text-lg font-black text-slate-900 :text-white mb-2 leading-tight">{item.title}</h4>
                  <p className="text-xs text-slate-500 :text-slate-400 :text-slate-400 leading-relaxed font-semibold">{item.desc}</p>
                </MotionDiv>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ Impact Metrics */}
      <section className="py-32 px-6 relative bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-drift" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 animate-drift-reverse" />
        <div className="max-w-7xl mx-auto relative z-10">
          
          <MotionDiv 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="text-center mb-20 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-emerald-300 font-bold uppercase tracking-widest text-[10px]">
              <Target className="w-4 h-4 text-emerald-400" />
              Success Metrics
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]">
              Our Global Footprint
            </h2>
          </MotionDiv>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: 11, label: "Partner Schools", icon: <Globe className="w-6 h-6" /> },
              { value: 500, label: "Students Enrolled", icon: <Users className="w-6 h-6" />, suffix: "+" },
              { value: 100, label: "Learning Roadmaps", icon: <BookOpen className="w-6 h-6" />, suffix: "+" },
              { value: 20, label: "Expert Instructors", icon: <Star className="w-6 h-6" />, suffix: "+" },
            ].map((metric, idx) => (
              <MotionDiv
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 backdrop-blur-md"
              >
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-6 border border-white/10">
                  {metric.icon}
                </div>
                <div className="text-5xl font-black text-white mb-2 tracking-tight">
                  <AnimatedCounter value={metric.value} suffix={metric.suffix || ''} />
                </div>
                <div className="text-xs text-emerald-300/80 font-bold uppercase tracking-wider">{metric.label}</div>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ Final CTA */}
      <section className="py-32 px-6 relative bg-white">
        <div className="max-w-7xl mx-auto">
          <MotionDiv 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-[3rem] p-12 lg:p-20 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-drift" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3 animate-drift-reverse" />

            <div className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <GraduationCap className="w-8 h-8" />
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                Ready to Redefine Education?
              </h2>
              
              <p className="text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
                Join our custom tracks as a student to acquire engineering skillsets, or reach out to partner as an institution to leverage our ERP and web services.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button to="/courses" size="lg">
                  Explore Learning Portal
                </Button>
                <Button variant="secondary" to="/contact" size="lg">
                  Consult Tech Department
                </Button>
              </div>
            </div>
          </MotionDiv>
        </div>
      </section>

    </div>
    </>
  );
};

export default Home;
