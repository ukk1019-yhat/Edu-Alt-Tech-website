import React, { useState, useEffect, useRef } from 'react';
import { auth, db, onAuthStateChanged, doc, onSnapshot, collection, query, where, getDocs, orderBy, limit } from '../lib/firebase';
import { Loader2, BookOpen, Download, Award, FileText, GraduationCap, ArrowRight, Clock, Sparkles, Video, Users, Lightbulb, MessageSquare, Send, Code2, History, Bell, Calendar, Lock, ArrowUpCircle, Flame, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserObject, CourseEnrollment, Course, TeacherApplication, UserMetrics } from '../types';
import { motion } from 'framer-motion';
import { PLATFORM_COURSES } from '../data/platformCourses';
import { getLastReadTimestamps } from '../lib/chatNotifications';
import { getOrCreateMetrics, recordTimeSpent, updateConsistencyScore } from '../lib/userProgress';

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
};

const extractMeetingLink = (message: string | undefined, explicitLink?: string): string | null => {
  if (explicitLink) return explicitLink;
  if (!message) return null;
  const match = message.match(/\[Interview Link:\s*([^\]]+)\]/);
  return match ? match[1] ?? null : null;
};

const extractMeetingDate = (message: string | undefined, explicitDate?: any): string | null => {
  if (explicitDate) return typeof explicitDate === 'string' ? explicitDate : explicitDate?.toISOString?.() || null;
  if (!message) return null;
  const match = message.match(/\[Interview Date:\s*([^\]]+)\]/);
  return match ? match[1] ?? null : null;
};

// Custom premium Progress Ring Component
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number; colorClass?: string; glowClass?: string }> = ({
  progress,
  size = 54,
  strokeWidth = 5,
  colorClass = "text-emerald-500",
  glowClass = "drop-shadow-[0_0_3px_rgba(16,185,129,0.25)]"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-slate-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${colorClass} ${glowClass} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

// Mini Sparkline SVG for study time activity visualization
const Sparkline: React.FC = () => {
  return (
    <svg className="w-12 h-6 text-indigo-500 shrink-0" viewBox="0 0 60 20">
      <path
        d="M0,15 Q10,2 20,12 T40,5 T60,15"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const Dashboard: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  useEffect(() => { userIdRef.current = user?.uid ?? null; }, [user?.uid]);
  const [enrollments, setEnrollments] = useState<(CourseEnrollment & { courseData?: Course })[]>([]);
  const [teachingEnrollments, setTeachingEnrollments] = useState<(CourseEnrollment & { courseData?: Course })[]>([]);
  const [myApplications, setMyApplications] = useState<(TeacherApplication & { courseTitle?: string })[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; content: string; role: string; created_at: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [, setLoading] = useState(true);
  const [, setRejectionCounts] = useState<Record<string, number>>({});
  const [leetcodeCount, setLeetcodeCount] = useState(0);
  const [englishCount, setEnglishCount] = useState(0);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [chatUnreadCounts, setChatUnreadCounts] = useState<Record<string, number>>({});
  const [firstClassLocked, setFirstClassLocked] = useState(false);
  const [firstClassLockedCourse, setFirstClassLockedCourse] = useState<string | null>(null);

  // New real-time metrics states
  const [userMetrics, setUserMetrics] = useState<UserMetrics[]>([]);
  const [downloadsCount, setDownloadsCount] = useState(0);
  const [allResources, setAllResources] = useState<any[]>([]);
  const [sessionTime, setSessionTime] = useState(0);

  const accumulatedTime = useRef(0);
  const enrolledCoursesRef = useRef<string[]>([]);
  const userIdRef = useRef<string | null>(null);

  // Track session duration spent on site live
  // Flush accumulated time to Firestore every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => {
        accumulatedTime.current += 1;
        return prev + 1;
      });
    }, 1000);

    const flushInterval = setInterval(() => {
      const timeToFlush = accumulatedTime.current;
      const uid = userIdRef.current;
      if (timeToFlush < 10 || !uid) return;
      accumulatedTime.current = 0;
      enrolledCoursesRef.current.forEach(courseId => {
        recordTimeSpent(uid, courseId, timeToFlush).catch(() => {});
      });
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(flushInterval);
    };
  }, []);

  const formatSessionTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll chat window to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Main real-time database syncing
  useEffect(() => {
    let cancelled = false;
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      // Clean up previous listeners
      unsubs.forEach(fn => fn());
      unsubs = [];

      setUser(u);
      if (!u) {
        navigate('/login');
        return;
      }

      setLoading(true);

      try {
        // Fetch courses metadata once (rarely changes, okay to load statically once)
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const coursesMap = new Map<string, Course>();
        coursesSnap.docs.forEach(d => coursesMap.set(d.id, { id: d.id, ...d.data() } as Course));
        PLATFORM_COURSES.forEach((pc, i) => {
          const id = `pc-${i}`;
          if (!coursesMap.has(id)) coursesMap.set(id, { id, ...pc } as Course);
        });

        // 1. Profile Real-time Sync
        const unsubProfile = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists() && !cancelled) {
            setUserProfile({ uid: docSnap.id, ...docSnap.data() } as UserObject);
          }
        });
        unsubs.push(unsubProfile);

        // 2. Enrollments & Locking Real-time Sync
        const unsubEnrollments = onSnapshot(
          query(collection(db, 'enrollments'), where('userId', '==', u.uid)),
          (snap) => {
            const studentEnr: any[] = [];
            const teacherEnr: any[] = [];
            snap.forEach((ds: any) => {
              const data = ds.data();
              const course = coursesMap.get(data.courseId);
              const enrObj = { id: ds.id, ...data, courseData: course };
              if (data.role === 'teacher') {
                teacherEnr.push(enrObj);
              } else {
                studentEnr.push(enrObj);
              }
            });

            if (!cancelled) {
              setEnrollments(studentEnr);
              setTeachingEnrollments(teacherEnr);

              // Initialize metrics and course refs for time tracking
              const allCourseIds = [...new Set([...studentEnr.map((e: any) => e.courseId), ...teacherEnr.map((e: any) => e.courseId)])];
              enrolledCoursesRef.current = allCourseIds;
              if (u && allCourseIds.length > 0) {
                allCourseIds.forEach(async (courseId: string) => {
                  try {
                    await getOrCreateMetrics(u.uid, courseId, 1);
                    await updateConsistencyScore(u.uid, courseId);
                  } catch (e) { console.error('Dashboard: Failed to initialize metrics for course', e); }
                });
              }

              // 24h block logic for first_class trial
              const lockedFc = studentEnr.find(e => {
                if (e.plan !== 'first_class') return false;
                const raw = e.createdAt;
                if (!raw) return false;
                const created = raw?.toDate ? raw.toDate() : new Date(raw);
                return (Date.now() - created.getTime()) > 24 * 60 * 60 * 1000;
              });
              setFirstClassLocked(!!lockedFc);
              setFirstClassLockedCourse(lockedFc?.courseId || null);
            }
          }
        );
        unsubs.push(unsubEnrollments);

        // 3. Teacher Applications Real-time Sync
        const unsubApps = onSnapshot(
          query(collection(db, 'teacher_applications'), where('userId', '==', u.uid)),
          (snap) => {
            const apps = snap.docs.map((d: any) => {
              const data = d.data() as TeacherApplication;
              const courseIdVal = data.qualification || '';
              const course = coursesMap.get(courseIdVal) || (() => {
                const idx = PLATFORM_COURSES.findIndex((_, i) => `pc-${i}` === courseIdVal);
                return idx !== -1 ? { id: `pc-${idx}`, ...PLATFORM_COURSES[idx] } as Course : null;
              })();
              return {
                ...data,
                id: d.id,
                courseTitle: course?.title || 'Unknown Course',
                userName: data.name || 'Unknown',
                userEmail: data.email || ''
              };
            });

            if (!cancelled) {
              setMyApplications(apps);

              const rejectMap: Record<string, number> = {};
              apps.forEach((a: any) => {
                if (a.status === 'rejected') {
                  const key = a.qualification || '';
                  rejectMap[key] = (rejectMap[key] || 0) + 1;
                }
              });
              setRejectionCounts(rejectMap);
            }
          }
        );
        unsubs.push(unsubApps);

        // 4. Admin Chat Messages Real-time Sync
        const unsubChat = onSnapshot(
          query(collection(db, 'chat_messages'), where('userId', '==', u.uid), orderBy('createdAt', 'asc')),
          (snap) => {
            const msgs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));
            if (!cancelled) setChatMessages(msgs);
          }
        );
        unsubs.push(unsubChat);

        // 5. User Downloads Count Real-time Sync
        const unsubDownloads = onSnapshot(
          query(collection(db, 'user_downloads'), where('userId', '==', u.uid)),
          (snap) => {
            if (!cancelled) setDownloadsCount(snap.size);
          }
        );
        unsubs.push(unsubDownloads);

        // 6. Resources Library Real-time Sync (for dynamic count filtering)
        const unsubResources = onSnapshot(collection(db, 'resources'), (snap) => {
          const allRes = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));
          if (!cancelled) setAllResources(allRes);
        });
        unsubs.push(unsubResources);

        // 7. Practice History & Problem Counts Real-time Sync
        const unsubPractice = onSnapshot(
          query(collection(db, 'practice_history'), where('userId', '==', u.uid), orderBy('openedAt', 'desc')),
          (snap) => {
            const history = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));
            if (!cancelled) {
              setPracticeHistory(history);
              const lc = history.filter((h: any) => h.practiceType === 'leetcode').length;
              const eng = history.filter((h: any) => h.practiceType === 'english').length;
              setLeetcodeCount(lc);
              setEnglishCount(eng);
            }
          }
        );
        unsubs.push(unsubPractice);

        // 8. Notifications Real-time Sync
        const unsubNotifications = onSnapshot(
          query(collection(db, 'notifications'), where('userId', '==', u.uid), orderBy('createdAt', 'desc'), limit(20)),
          (snap) => {
            const notifs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));
            if (!cancelled) setNotifications(notifs);
          }
        );
        unsubs.push(unsubNotifications);

        // 9. User Metrics Real-time Sync
        const unsubMetrics = onSnapshot(
          query(collection(db, 'user_metrics'), where('userId', '==', u.uid)),
          (snap) => {
            const metrics = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as UserMetrics));
            if (!cancelled) setUserMetrics(metrics);
          }
        );
        unsubs.push(unsubMetrics);

      } catch (err) {
        console.error("Dashboard subscription failed", err);
      }

      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();
      unsubs.forEach(fn => fn());
    };
  }, []);

  // 10. Sync chat unread badge counts in real-time
  useEffect(() => {
    if (!user || enrollments.length === 0) return;

    const enrolledCourseIds = enrollments.map(e => e.courseId).filter(Boolean);
    if (enrolledCourseIds.length === 0) return;

    const timestamps = getLastReadTimestamps(user.uid);

    const unsubChatCounts = onSnapshot(
      query(
        collection(db, 'course_chat_messages'),
        where('courseId', 'in', enrolledCourseIds)
      ),
      (snap) => {
        const counts: Record<string, number> = {};
        const allMsgs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));

        enrollments.forEach(enr => {
          if (!enr.courseId) return;
          const lastRead = timestamps[enr.courseId] || '1970-01-01';
          const unreadCount = allMsgs.filter((m: any) => m.courseId === enr.courseId && m.createdAt > lastRead).length;
          if (unreadCount > 0) {
            counts[enr.courseId] = unreadCount;
          }
        });
        setChatUnreadCounts(counts);
      }
    );

    return () => unsubChatCounts();
  }, [user, enrollments]);

  // 11. Sync upcoming classes for enrolled courses in real-time
  useEffect(() => {
    if (!user || enrollments.length === 0) {
      setUpcomingClasses([]);
      return;
    }

    const enrolledCourseIds = enrollments.map(e => e.courseId).filter(Boolean);
    if (enrolledCourseIds.length === 0) {
      setUpcomingClasses([]);
      return;
    }

    const unsubClasses = onSnapshot(
      query(
        collection(db, 'scheduled_classes'),
        where('courseId', 'in', enrolledCourseIds),
        orderBy('scheduledAt', 'asc')
      ),
      (snap) => {
        const nowStr = new Date().toISOString();
        const classes = snap.docs
          .map((d: any) => ({ id: d.id, ...d.data() } as any))
          .filter((cls: any) => !cls.scheduledAt || cls.scheduledAt >= nowStr)
          .slice(0, 10);
        setUpcomingClasses(classes);
      }
    );

    return () => unsubClasses();
  }, [user, enrollments]);

  // Send message helper
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user) return;
    setSendingMessage(true);
    try {
      const { error } = await db.from('chat_messages').insert({
        user_id: user.uid,
        content: chatInput,
        role: 'user',
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      setChatInput('');
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setSendingMessage(false);
    }
  };

  // Dynamic calculations from real-time states
  const totalTeaching = teachingEnrollments.length;
  const totalApplications = myApplications.length;
  const pendingApps = myApplications.filter(a => a.status === 'pending').length;
  const approvedApps = myApplications.filter(a => a.status === 'approved').length;

  const enrolledCourseIds = [...new Set([...enrollments.map(e => e.courseId), ...teachingEnrollments.map(e => e.courseId)])];
  const courseResCount = allResources.filter(r => enrolledCourseIds.includes(r.courseId)).length;
  const resourceCount = downloadsCount + courseResCount;

  // Study insights calculation
  const totalStudyTimeSeconds = userMetrics.reduce((sum, m) => sum + (m.totalTimeSpent || 0), 0);
  const studyHours = Math.floor(totalStudyTimeSeconds / 3600);
  const studyMinutes = Math.floor((totalStudyTimeSeconds % 3600) / 60);
  const studyTimeFormatted = studyHours > 0 ? `${studyHours}h ${studyMinutes}m` : `${studyMinutes}m`;

  const averageConsistency = userMetrics.length > 0
    ? Math.round(userMetrics.reduce((sum, m) => sum + (m.consistencyScore || 0), 0) / userMetrics.length)
    : 0;

  // Next steps action items builder
  const nextSteps: string[] = [];
  if (enrollments.length === 0 && myApplications.length === 0) {
    nextSteps.push('Browse courses and enroll to start learning');
  }
  if (myApplications.some(a => a.status === 'pending')) {
    nextSteps.push('Your teacher application is pending review — our team will reach out');
  }
  const scheduledApp = myApplications.find(a => a.status === 'scheduled');
  if (scheduledApp && extractMeetingLink(scheduledApp.message, scheduledApp.meetingLink)) {
    nextSteps.push('Join your scheduled interview session using the active link below');
  }
  if (myApplications.some(a => a.status === 'approved') && teachingEnrollments.length === 0) {
    nextSteps.push('Your application was approved! The administrator will assign your courses shortly');
  }
  if (teachingEnrollments.length > 0) {
    nextSteps.push('Head over to the Teacher Panel to build course content and interact with students');
  }
  if (enrollments.length > 0) {
    nextSteps.push('Keep up the momentum! Pick up right where you left off in your classroom');
  }

  // Custom interactive SVG bar chart showing completion progress
  const renderSVGChart = () => {
    const chartData = enrollments.map(enr => {
      const metrics = userMetrics.find(m => m.courseId === enr.courseId);
      const progress = metrics ? Math.round(((metrics.completedModules || 0) / (metrics.totalModules || 1)) * 100) : 0;
      return {
        title: enr.courseData?.title || 'Course',
        progress
      };
    });

    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs text-center border border-dashed border-slate-200 rounded-3xl">
          <BarChart3 className="w-10 h-10 mb-3 opacity-30 text-emerald-500" />
          <span className="font-semibold text-slate-500">Analytics Sandbox Empty</span>
          <span className="text-[10px] mt-0.5 max-w-[200px] text-slate-400">Metrics will dynamically plot once you begin learning</span>
        </div>
      );
    }

    const width = 500;
    const height = 240;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const barGroupWidth = Math.min(80, chartWidth / chartData.length);
    const barWidth = Math.max(20, barGroupWidth * 0.55);
    const gap = (chartWidth - barGroupWidth * chartData.length) / (chartData.length + 1);

    return (
      <div className="w-full h-full min-h-[220px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-slate-600 font-sans">
          {/* Y Axis Grid lines */}
          {[0, 25, 50, 75, 100].map((val, idx) => {
            const y = paddingTop + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={paddingLeft - 10} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-400">{val}%</text>
              </g>
            );
          })}

          {/* Render Bars */}
          {chartData.map((data, idx) => {
            const groupX = paddingLeft + gap + idx * (barGroupWidth + gap);
            const xProgress = groupX + (barGroupWidth - barWidth) / 2;

            const progressHeight = (data.progress / 100) * chartHeight;
            const progressY = paddingTop + chartHeight - progressHeight;

            return (
              <g key={idx} className="group">
                {/* Progress Bar (Emerald) */}
                <rect
                  x={xProgress}
                  y={progressY}
                  width={barWidth}
                  height={Math.max(4, progressHeight)}
                  rx="4"
                  fill="url(#progressGradient)"
                  className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                />

                {/* Tooltip on hover */}
                <title>{`${data.title}\nModule Progress: ${data.progress}%`}</title>

                {/* X Axis Label */}
                <text
                  x={groupX + barGroupWidth / 2}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  className="text-[9px] font-extrabold fill-slate-500"
                >
                  {data.title.length > 18 ? data.title.substring(0, 15) + '..' : data.title}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  // Entrance Framer Motion variants typed as any to prevent TS signature errors
  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 sm:pb-20 px-3 sm:px-4 md:px-8 bg-slate-50/50">
      <div className="max-w-7xl mx-auto">

        {/* ── Glowing Header welcoming section ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-900/10 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10"><GraduationCap className="w-64 h-64 text-white" /></div>
          <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-[80px]" />
          <div className="absolute right-12 bottom-0 w-64 h-64 rounded-full bg-teal-400/25 blur-[100px]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 p-0.5 overflow-hidden shadow-inner flex items-center justify-center font-black text-xl text-white">
                {userProfile?.profilePic ? (
                  <img src={userProfile.profilePic} loading="lazy" decoding="async" alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  userProfile?.name?.charAt(0) || 'U'
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight !text-white font-display">
                  {getGreeting()}, {userProfile?.name || 'Learner'}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-0.5 bg-white/20 border border-white/10 !text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                    {userProfile?.role || 'Student'}
                  </span>
                  {averageConsistency >= 70 && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-400/25 border border-amber-400/35 !text-amber-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                      <Flame className="w-3 h-3 text-amber-300 fill-amber-300" /> Super Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/10 rounded-full text-xs font-bold !text-white backdrop-blur-md shadow-sm">
                <BookOpen className="w-3.5 h-3.5 text-white" /> {enrollments.length} Enrolled
              </span>
              {totalTeaching > 0 && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/10 rounded-full text-xs font-bold !text-white backdrop-blur-md shadow-sm">
                  <Users className="w-3.5 h-3.5 text-white" /> {totalTeaching} Teaching
                </span>
              )}
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/10 rounded-full text-xs font-bold !text-white backdrop-blur-md shadow-sm">
                <Download className="w-3.5 h-3.5 text-white" /> {resourceCount} resources
              </span>
              <Link to="/practice" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white !text-emerald-700 rounded-full text-xs font-black shadow-md hover:shadow-lg hover:bg-emerald-50 hover:scale-[1.03] transition-all duration-300">
                <Code2 className="w-3.5 h-3.5 text-emerald-600" /> Practice Hub
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Active Interview Panel ── */}
        {scheduledApp && extractMeetingLink(scheduledApp.message, scheduledApp.meetingLink) && (() => {
          const mLink = extractMeetingLink(scheduledApp.message, scheduledApp.meetingLink)!;
          const mDate = extractMeetingDate(scheduledApp.message, scheduledApp.meetingDate);
          return (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="absolute top-0 right-0 p-3 opacity-5"><Video className="w-32 h-32" /></div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-lg backdrop-blur-sm"><Video className="w-6 h-6" /></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-white/25 rounded-full text-[9px] font-black uppercase tracking-wider">Interview Scheduled</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight !text-white">Teacher Application Review</h2>
                    <p className="text-indigo-100 text-xs mt-0.5">{scheduledApp.courseTitle}{mDate ? <> — <strong>{new Date(mDate).toLocaleString()}</strong></> : ''}</p>
                  </div>
                </div>
                <a href={mLink.startsWith('http') ? mLink : `https://${mLink}`} target="_blank" rel="noreferrer"
                  className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-700 font-extrabold rounded-xl hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all shadow-md text-sm">
                  <Video className="w-4 h-4" /> Start Interview
                </a>
              </div>
            </motion.div>
          );
        })()}

        {/* ── Next Steps Widget ── */}
        {!scheduledApp && nextSteps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5"><Lightbulb className="w-24 h-24 text-emerald-500" /></div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0"><Lightbulb className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h2 className="text-sm font-black text-slate-800 tracking-tight mb-2">Next Steps</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {nextSteps.slice(0, 2).map((step, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-705 text-xs">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                        <span className="font-semibold leading-tight text-slate-655">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── First Class Trial Lock Panel ── */}
        {firstClassLocked && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
            <div className="bg-white rounded-[2.5rem] border-2 border-rose-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 to-rose-700 p-8 sm:p-12 text-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-5 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                    <Lock className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black !text-white tracking-tight mb-2">Trial Period Ended</h2>
                  <p className="text-rose-100 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                    Your 24-hour trial for this course has completed. Upgrade to full access to unlock the full potential of your dashboard.
                  </p>
                </div>
              </div>
              <div className="p-6 text-center bg-rose-50/50">
                <button
                  onClick={() => { if (firstClassLockedCourse) navigate(`/classroom/${firstClassLockedCourse}`); }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-95"
                >
                  <ArrowUpCircle className="w-6 h-6" /> Unlock Full Course Access — ₹{(() => {
                    const course = enrollments.find(e => e.courseId === firstClassLockedCourse)?.courseData;
                    return course?.price || '—';
                  })()}/mo
                </button>
                <p className="text-[11px] text-slate-400 mt-4 font-semibold">
                  Full enrollment opens interactive coding sandboxes, group mentoring sessions, and full syllabi contents.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Key Performance Indicators (KPIs) Redesigned Stat Grid ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* 1. Consistency */}
          <motion.div variants={itemVariants} className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-amber-50/30 border border-slate-200/80 rounded-3xl p-5 hover:border-amber-400 hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Consistency</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight block">
                {averageConsistency > 0 ? `${averageConsistency}%` : '—'}
              </span>
              <span className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500 stroke-none" /> Streak Habits
              </span>
            </div>
            <ProgressRing progress={averageConsistency || 0} size={54} strokeWidth={4.5} colorClass="text-amber-500" glowClass="drop-shadow-[0_0_3px_rgba(245,158,11,0.3)]" />
          </motion.div>

          {/* 2. Study Time */}
          <motion.div variants={itemVariants} className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/30 border border-slate-200/80 rounded-3xl p-5 hover:border-indigo-400 hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Study Duration</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight block">
                {studyTimeFormatted}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Study Time
              </span>
            </div>
            <Sparkline />
          </motion.div>

          {/* 3. Session Duration */}
          <motion.div variants={itemVariants} className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/30 border border-slate-200/80 rounded-3xl p-5 hover:border-emerald-400 hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Session Active</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight block font-mono">
                {formatSessionTime(sessionTime)}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-pulse" /> Time on site
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </motion.div>

          {/* 4. Solved Problems */}
          <motion.div variants={itemVariants} className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-purple-50/30 border border-slate-200/80 rounded-3xl p-5 hover:border-purple-400 hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Practiced</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight block">
                {leetcodeCount + englishCount > 0 ? `${leetcodeCount + englishCount}` : '0'}
              </span>
              <span className="text-[10px] font-bold text-purple-600 mt-1 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5" /> Solved problems
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main Dashboard grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ===== LEFT & CENTRAL PORTION ===== */}
          <div className="lg:col-span-2 space-y-6">

            {/* My Learning Deck */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-500" /> Active Classrooms
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Resume your studies</p>
                </div>
                {enrollments.length > 0 && (
                  <Link to="/courses" className="text-xs font-black text-emerald-600 hover:text-emerald-500 transition-colors">
                    Find More Courses
                  </Link>
                )}
              </div>

              {enrollments.length === 0 ? (
                <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-3xl p-8 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Your learning tray is empty</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">Unlock interactive modules, coding problems, and personalized mentorship by enrolling in a course.</p>
                  <Link to="/courses" className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-emerald-600/10">
                    Explore courses catalog <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enr: any) => {
                    const metrics = userMetrics.find(m => m.courseId === enr.courseId);
                    const completed = metrics?.completedModules || 0;
                    const total = metrics?.totalModules || 1;
                    const progressPercent = Math.round((completed / total) * 100);

                    return (
                      <div
                        key={enr.id}
                        onClick={() => navigate(`/classroom/${enr.courseId}`)}
                        className="group relative bg-slate-50/50 hover:bg-white border border-slate-200/80 hover:border-emerald-500 rounded-2xl p-4 hover:shadow-md cursor-pointer transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-black text-base shadow-md shrink-0">
                              {enr.courseData?.title?.charAt(0) || 'C'}
                            </div>
                            <div className="min-w-0">
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-black uppercase tracking-wider">
                                {enr.courseData?.category || 'General'}
                              </span>
                              <h3 className="text-sm font-black text-slate-800 truncate mt-1 group-hover:text-emerald-600 transition-colors">
                                {enr.courseData?.title || 'Course Details'}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-auto">
                            <div className="hidden sm:block text-right">
                              <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Completed</span>
                              <span className="text-xs font-bold text-slate-700">{completed}/{total} Modules</span>
                            </div>

                            {(chatUnreadCounts[enr.courseId] ?? 0) > 0 && (
                              <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full shrink-0 animate-pulse">
                                {chatUnreadCounts[enr.courseId]} new
                              </span>
                            )}

                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 rounded-xl font-bold text-xs transition-all">
                              Resume Classroom
                            </span>
                          </div>
                        </div>

                        {/* Interactive Course Progress Bar */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200/60 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 shrink-0">{progressPercent}% done</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Custom Interactive SVG Analytics (Study Dynamics) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm"
            >
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-850 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" /> Study Dynamics
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Module Completion Progress</p>
              </div>
              <div className="mt-6">
                {renderSVGChart()}
              </div>
              {enrollments.length > 0 && (
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-extrabold text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Completion Progress (%)</span>
                </div>
              )}
            </motion.div>

            {/* Practice timeline activity log */}
            {practiceHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-500" /> Recent Activities
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Practice history log</p>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  <div className="relative pl-6 border-l border-slate-100 space-y-4 py-2">
                    {practiceHistory.slice(0, 10).map((h: any) => (
                      <div key={h.id} className="relative">
                        <div className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                          h.practiceType === 'leetcode' ? 'bg-blue-500' : 'bg-indigo-500'
                        }`} />
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block leading-tight">{h.itemTitle}</span>
                            <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                              {h.practiceType === 'leetcode' ? 'LeetCode Practice' : 'English Exercise'} · #{h.itemId}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {new Date(h.openedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* ===== RIGHT COLUMN SIDEBAR ===== */}
          <div className="space-y-6">

            {/* Profile Avatar Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shrink-0 overflow-hidden">
                  {userProfile?.profilePic ? (
                    <img src={userProfile.profilePic} loading="lazy" decoding="async" alt="" className="w-full h-full object-cover" />
                  ) : (
                    userProfile?.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-800 text-sm truncate">{userProfile?.name || 'Student Account'}</h3>
                  <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">{userProfile?.email}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    {userProfile?.role || 'Student'}
                  </span>
                </div>
              </div>
              <Link to="/profile" className="flex items-center justify-between w-full mt-4 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black text-slate-600 hover:text-slate-900 transition-colors">
                Configure Profile Settings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* Live Upcoming classes */}
            {upcomingClasses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm"
              >
                <div className="mb-3">
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" /> Scheduled Live Sessions
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Real-time calendar updates</p>
                </div>
                <div className="space-y-3">
                  {upcomingClasses.map((cls) => (
                    <div key={cls.id} className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/40">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                          <Calendar className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-slate-800 leading-snug">{cls.title}</h4>
                          <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">{cls.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] font-black text-indigo-700">
                            <span>
                              {new Date(cls.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span>·</span>
                            <span>
                              {new Date(cls.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {cls.meetingLink && (
                            <a
                              href={cls.meetingLink.startsWith('http') ? cls.meetingLink : `https://${cls.meetingLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] transition-all hover:scale-[1.02] shadow-sm"
                            >
                              <Video className="w-3 h-3" /> Join Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Live Message Center */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 bg-white">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" /> Admin Help Center
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Real-time instant communication</p>
              </div>

              {/* Message tray */}
              <div className="h-60 overflow-y-auto p-4 space-y-3 bg-slate-50/50 custom-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-500 font-bold text-xs">Sandbox Help Room</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Inquire about curriculum options below</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-xs font-semibold leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200/60 rounded-bl-none'
                      }`}>
                        <p>{msg.content}</p>
                        <span className={`text-[8px] font-bold block mt-1 text-right ${
                          msg.role === 'user' ? 'text-emerald-200' : 'text-slate-400'
                        }`}>
                          {new Date(msg.created_at || (msg as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input field */}
              <div className="p-3 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Ask admin support..."
                    className="flex-grow px-3 py-2 bg-slate-50 rounded-xl outline-none font-semibold text-xs border border-transparent focus:border-emerald-500 focus:bg-white transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !chatInput.trim()}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center shrink-0"
                  >
                    {sendingMessage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Panel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm"
            >
              <h3 className="font-black text-slate-800 text-sm mb-3">Resources & Shortcuts</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/practice" className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/40 hover:shadow-md transition-all duration-300 group">
                  <Code2 className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-slate-700">Coding practice</span>
                </Link>
                <Link to="/practice" className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/40 hover:shadow-md transition-all duration-300 group">
                  <BookOpen className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-slate-700">English skills</span>
                </Link>
                <Link to="/resources" className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-amber-50/50 border border-amber-100/40 hover:shadow-md transition-all duration-300 group">
                  <Download className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-slate-700">Files library</span>
                </Link>
                <Link to="/courses" className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-rose-50/50 border border-rose-100/40 hover:shadow-md transition-all duration-300 group">
                  <GraduationCap className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-slate-700">Explore catalog</span>
                </Link>
              </div>

              {/* Mentorship shortcut application */}
              <Link to="/teacher-application" className="mt-3 block w-full p-4 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-105 transition-transform shrink-0">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-black text-xs tracking-tight">Become a Teacher</p>
                    <p className="text-[10px] text-white/70 font-semibold mt-0.5">Instruct classes & earn compensation</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse shrink-0" />
                </div>
              </Link>
            </motion.div>

            {/* Applications history tracker */}
            {totalApplications > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm"
              >
                <h3 className="font-black text-slate-850 text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" /> Teaching Review Desk
                </h3>
                <div className="space-y-2">
                  {pendingApps > 0 && (
                    <div className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-100/35 rounded-xl text-xs font-bold text-amber-800">
                      <span>Applications Pending</span>
                      <span className="font-black text-amber-600">{pendingApps}</span>
                    </div>
                  )}
                  {approvedApps > 0 && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100/35 rounded-xl text-xs font-bold text-emerald-800">
                      <span>Applications Approved</span>
                      <span className="font-black text-emerald-600">{approvedApps}</span>
                    </div>
                  )}
                  {(approvedApps > 0 || totalTeaching > 0) && (
                    <Link to="/teacher-panel" className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md">
                      <Users className="w-4 h-4" /> Open Teacher Panel
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

            {/* Real-time System Alert / Notifications banner */}
            {notifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-white">
                  <h3 className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500 animate-bounce" /> Inbox Notifications
                  </h3>
                  <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-[9px] font-black">{notifications.length}</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                  {notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors bg-white">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 text-xs shadow-inner">
                        {n.type === 'schedule' ? <Calendar className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-850">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[8px] font-bold text-slate-400 mt-1 block">
                          {new Date(n.created_at || n.createdAt).toLocaleDateString()} {new Date(n.created_at || n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
