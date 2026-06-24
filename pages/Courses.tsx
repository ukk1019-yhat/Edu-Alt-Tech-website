import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { auth, onAuthStateChanged, db, collection, getDocs, query } from '../lib/firebase';
import { Course } from '../types';
import { normalizeSearch } from '../lib/search';
import { Link, useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';
import { PLATFORM_COURSES } from '../data/platformCourses';

const FOLDER_MAP: Record<string, 'education' | 'alternative'> = {
  'Core Education': 'education',
  'Language Skills': 'education',
  'Music': 'education',
  'Dance': 'education',
  'Arts & Creativity': 'education',
  'Life Skills': 'education',
  'Mind Sports': 'education',
  'Health & Wellness': 'education',
};

const EDUCATION_FOLDERS = new Set(['Core Education', 'Language Skills', 'Music', 'Dance', 'Arts & Creativity', 'Life Skills', 'Mind Sports', 'Health & Wellness']);

function getFallbackThumbnail(title: string, folder: string): string {
  const colors: Record<string, [string, string]> = {
    'Artificial Intelligence': ['#059669', '#10b981'],
    'Entrepreneurship': ['#7c3aed', '#a855f7'],
    'Career Development': ['#0284c7', '#38bdf8'],
    'Finance': ['#ca8a04', '#eab308'],
    'Innovation': ['#ea580c', '#f97316'],
    'Life Skills': ['#0891b2', '#22d3ee'],
    'Robotics': ['#4f46e5', '#818cf8'],
    'Cybersecurity': ['#1e293b', '#475569'],
    'Creator Economy': ['#be123c', '#f43f5e'],
    'Future Technologies': ['#6d28d9', '#8b5cf6'],
    'Technology': ['#0369a1', '#0ea5e9'],
    'Core Education': ['#0d9488', '#14b8a6'],
    'Language Skills': ['#d97706', '#f59e0b'],
    'Music': ['#9333ea', '#a855f7'],
    'Dance': ['#db2777', '#ec4899'],
    'Arts & Creativity': ['#e11d48', '#fb7185'],
    'Mind Sports': ['#15803d', 'var(--greenprint)'],
    'Health & Wellness': ['#059669', '#34d399'],
  };
  const [c1, c2] = colors[folder] || ['#6366f1', '#a855f7'];
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="200" text-anchor="middle" font-size="64" fill="rgba(255,255,255,0.2)">📚</text><text x="200" y="260" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.6)" font-weight="bold" font-family="sans-serif">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</text></svg>`)}`;
}

function getThumbnail(title: string, folder: string): string {
  const seed = encodeURIComponent((title || folder || 'course').replace(/\s+/g, '-').toLowerCase().slice(0, 50));
  return `https://picsum.photos/seed/${seed}/400/225`;
}

const PROVIDER_LOGOS: Record<string, string> = {
  'DeepLearningAI': 'https://www.deeplearning.ai/favicon.ico',
  'Hugging Face': 'https://huggingface.co/front/assets/huggingface_logo.svg',
};

const providerIcons: Record<string, React.ReactNode> = {}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'education' | 'alternative'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [user, setUser] = useState<any>(auth.currentUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'));
        const querySnapshot = await getDocs(q);
        const fetchedCourses: Course[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const folder = data.folder || data.category || '';
          fetchedCourses.push({
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            category: FOLDER_MAP[folder] || 'alternative',
            price: data.price ?? 0,
            thumbnailUrl: data.thumbnailUrl || getThumbnail(data.title || 'Course', folder),
            folder,
            duration: data.duration,
            level: data.level,
            classLevel: data.classLevel || data.class_level || 'General',
            comingSoon: data.comingSoon ?? data.coming_soon ?? false,
            createdAt: data.createdAt || data.created_at,
            createdBy: data.createdBy || '',
          } as Course);
        });
        AI_COURSES.forEach((provider, pi) => {
          provider.courses.forEach((course, ci) => {
            const courseTitle = typeof course === 'string' ? course : course.title;
            const courseUrl = typeof course === 'string' ? provider.url : course.url;
            fetchedCourses.push({
              id: `ai-${pi}-${ci}`,
              title: courseTitle,
              description: `Free course from ${provider.name}. Master ${courseTitle.toLowerCase()} with industry-leading curriculum.`,
              category: 'alternative',
              price: 0,
              thumbnailUrl: `https://picsum.photos/seed/${provider.name.toLowerCase().replace(/\s+/g, '-')}-${ci}/400/225`,
              folder: 'Artificial Intelligence',
              duration: 'Self-paced',
              level: 'beginner',
              classLevel: 'General',
              comingSoon: false,
              provider: provider.name,
              externalUrl: courseUrl,
              createdAt: new Date().toISOString(),
              createdBy: 'provider',
            } as Course & { provider?: string });
          });
        });
        const { data: overrideRows } = await db.from('platform_overrides').select('*');
        const dbOverrides: Record<string, any> = {};
        const deletedIds = new Set<string>();
        if (overrideRows) {
          for (const row of overrideRows) {
            if (row.data?.__deleted) { deletedIds.add(row.id); continue; }
            dbOverrides[row.id] = row.data;
          }
        }
        const existingIds = new Set(fetchedCourses.map((c: any) => c.id));
        let platformCourses = PLATFORM_COURSES.map((pc, pi) => {
          const id = `pc-${pi}`;
          const base = { id, ...pc } as Course;
          return dbOverrides[id] ? { ...base, ...dbOverrides[id] } : base;
        }).filter(c => !existingIds.has(c.id) && !deletedIds.has(c.id));
        try {
          const raw = localStorage.getItem('platformCourseOverrides');
          if (raw) {
            const localOverrides = JSON.parse(raw);
            platformCourses = platformCourses.map(c => localOverrides[c.id] ? { ...c, ...localOverrides[c.id] } : c);
          }
          const localDeleted = JSON.parse(localStorage.getItem('platformCourseDeletions') || '[]');
          platformCourses = platformCourses.filter(c => !localDeleted.includes(c.id));
        } catch {}
        fetchedCourses.push(...platformCourses);
        const providerCourses = fetchedCourses.filter(c => c.id.startsWith('ai-'));
        const dbCourses = fetchedCourses.filter(c => !c.id.startsWith('ai-') && !c.id.startsWith('pc-'));
        const plCourses = fetchedCourses.filter(c => c.id.startsWith('pc-'));
        setCourses([...providerCourses, ...plCourses, ...dbCourses]);
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = normalizeSearch(searchTerm);
    return courses.filter(course => {
      if ((course.folder || '') === 'Marketing') return false;
      const matchesSearch = !normalizedSearch ||
        normalizeSearch(course.title).includes(normalizedSearch) ||
        normalizeSearch(course.description || '').includes(normalizedSearch) ||
        normalizeSearch(course.provider || '').includes(normalizedSearch) ||
        normalizeSearch(course.folder || '').includes(normalizedSearch) ||
        normalizeSearch(course.category || '').includes(normalizedSearch);

      let matchesCategory = true;
      if (activeFilter === 'education') {
        matchesCategory = EDUCATION_FOLDERS.has(course.folder || '');
      } else if (activeFilter === 'alternative') {
        matchesCategory = !EDUCATION_FOLDERS.has(course.folder || '');
      }

      let matchesPrice = true;
      const price = course.price ?? -1;
      if (priceFilter === 'free') matchesPrice = price === 0;
      else if (priceFilter === 'paid') matchesPrice = price > 0;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [courses, searchTerm, activeFilter, priceFilter]);

  const providerCourses = useMemo(() => filteredCourses.filter(c => c.id.startsWith('ai-')), [filteredCourses]);
  const dbCourses = useMemo(() => filteredCourses.filter(c => !c.id.startsWith('ai-')), [filteredCourses]);

  const displayedCourses = useMemo(() => filteredCourses, [filteredCourses]);

  return (
    <div className="viewport-content">
      <Helmet>
        <title>Courses | Edu Alt Tech</title>
        <link rel="canonical" href="https://www.edualttech.com/#/courses" />
      </Helmet>

      {/* Page Header */}
      <div className="page-header">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <span className="flabel">Course Catalog</span>
          <h1>
            Explore Our Learning Pathways.
          </h1>
          <p>
            Curated courses from top providers and our own curriculum. Master in-demand skills with structured learning paths.
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bento-card bento-card-compact" style={{ marginBottom: 24, gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input
              type="text"
              className="input"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          {(searchTerm || activeFilter !== 'all' || priceFilter !== 'all') && (
            <button className="btn btn-sm btn-secondary" onClick={() => { setSearchTerm(''); setActiveFilter('all'); setPriceFilter('all'); }} style={{ gap: 4 }}>
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Courses' },
            { id: 'education', label: 'Subjective' },
            { id: 'alternative', label: 'Alternative' },
          ].map((f) => (
            <button
              key={f.id}
              className={`btn btn-sm ${activeFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveFilter(f.id as any)}
              style={{ gap: 4 }}
            >
              {f.label}
            </button>
          ))}

          <div className="asc-sm" style={{ width: 1, height: 28, margin: '0 4px', background: 'var(--rule-soft)', alignSelf: 'center' }} />

          {[
            { id: 'all', label: 'All Prices' },
            { id: 'free', label: 'Free' },
            { id: 'paid', label: 'Paid' },
          ].map((f) => (
            <button
              key={f.id}
              className={`btn btn-sm ${priceFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPriceFilter(f.id as any)}
              style={{ gap: 4 }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bento-card" style={{ gap: 12 }}>
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCourses.length === 0 && (
        <div className="empty-state">
            <div className="empty-icon"></div>
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && filteredCourses.length > 0 && (
        <>
          {/* DB Courses */}
          {dbCourses.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>
                  
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Available Now</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>Enroll and start learning today</span>
                </div>
              </div>
              <div className="grid-3">
                {displayedCourses.filter(c => !c.id.startsWith('ai-')).map((course) => (
                  <div key={course.id} className="bento-card" style={{ gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ width: 28, height: 28, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
                        
                      </div>
                      <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                        {course.folder || course.category}
                      </span>
                      {course.classLevel && (
                        <span className="badge" style={{ fontSize: '0.7rem' }}>
                          {course.classLevel}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600 }}>
                        {course.comingSoon ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Coming Soon</span>
                        ) : course.price === 0 ? (
                          <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>Free</span>
                        ) : (
                          <span className="badge" style={{ fontSize: '0.7rem' }}>₹{course.price}/month</span>
                        )}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem' }}>{course.title}</h3>
                    <p style={{ fontSize: '0.82rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description}
                    </p>
                    <div style={{ marginTop: 'auto' }}>
                      {course.comingSoon ? (
                        <button className="btn btn-sm btn-secondary" disabled style={{ fontSize: '0.75rem' }}>
                          Coming Soon
                        </button>
                      ) : !user ? (
                        <button className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => setIsAuthModalOpen(true)}>
                          Explore Course →
                        </button>
                      ) : course.externalUrl ? (
                        <a href={course.externalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem', gap: 4 }}>
                          Start Free
                        </a>
                      ) : (
                        <Link to={`/courses/${course.id}`} className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem' }}>
                          Explore Course →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider Courses */}
          {providerCourses.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>
                    
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>Free Courses</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>From industry leaders</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)', fontWeight: 600 }}>{providerCourses.length} courses</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {AI_COURSES.slice(0, 5).map((p, i) => (
                      <img key={i} src={p.logo} loading="lazy" decoding="async" alt={p.name}
                        style={{ width: 24, height: 24, border: '1px solid var(--rule-soft)', borderRadius: 2 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid-3">
                {providerCourses.map((course) => {
                  const provider = course.provider || '';
                  return (
                    <div key={course.id} className="bento-card bento-card-compact" style={{ gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                          {PROVIDER_LOGOS[provider] ? (
                            <img src={PROVIDER_LOGOS[provider]} loading="lazy" decoding="async" alt={provider}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const p = (e.target as HTMLImageElement).parentElement!; p.innerHTML = '<span style="font-size:12px;font-weight:bold;">' + provider.charAt(0) + '</span>'; }} />
                          ) : (
                            <span>{provider.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{provider}</span>
                          <p style={{ fontSize: '0.7rem', margin: 0 }}>{course.duration}</p>
                        </div>
                      </div>
                      <h3 style={{ fontSize: '0.95rem' }}>{course.title}</h3>
                      <p style={{ fontSize: '0.78rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {course.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <span className="badge badge-accent" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          Free
                        </span>
                        {!user ? (
                          <button className="btn btn-xs btn-primary" onClick={() => setIsAuthModalOpen(true)} style={{ gap: 4 }}>
                            Start Free
                          </button>
                        ) : (
                          <a href={course.externalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-primary" style={{ gap: 4 }}>
                            Start Free
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <LoginModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

const AI_COURSES = [
  { name: "DeepLearningAI", url: "https://www.deeplearning.ai/courses/", logo: "https://www.deeplearning.ai/favicon.ico", courses: [
    { title: "AI Prompting for Everyone", url: "https://www.deeplearning.ai/courses/ai-prompting-for-everyone/" },
    { title: "Build with Andrew", url: "https://www.deeplearning.ai/courses/build-with-andrew/" },
    { title: "Agentic AI", url: "https://www.deeplearning.ai/courses/agentic-ai/" },
    { title: "AI Python for Beginners", url: "https://www.deeplearning.ai/courses/ai-python-for-beginners/" },
    { title: "AI for Everyone", url: "https://www.deeplearning.ai/courses/ai-for-everyone/" },
    { title: "Generative AI for Everyone", url: "https://www.deeplearning.ai/courses/generative-ai-for-everyone/" },
    { title: "Machine Learning in Production", url: "https://www.deeplearning.ai/courses/machine-learning-in-production/" },
    { title: "RAG", url: "https://www.deeplearning.ai/courses/retrieval-augmented-generation-rag/" },
    { title: "Fast and Efficient LLM Inference with vLLM", url: "https://www.deeplearning.ai/courses/fast-and-efficient-llm-inference-with-vllm/" },
    { title: "ChatGPT Prompt Engineering for Developers", url: "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/" },
    { title: "LangChain for LLM Application Development", url: "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/" },
    { title: "Building Systems with ChatGPT API", url: "https://www.deeplearning.ai/short-courses/building-systems-with-chatgpt/" },
    { title: "Building and Evaluating Advanced RAG", url: "https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/" },
    { title: "Functions, Tools and Agents with LangChain", url: "https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/" },
    { title: "Finetuning Large Language Models", url: "https://www.deeplearning.ai/short-courses/finetuning-large-language-models/" },
    { title: "Building GenAI Apps with Gradio", url: "https://www.deeplearning.ai/short-courses/building-generative-ai-applications-with-gradio/" },
    { title: "Vector Databases: From Embeddings to Applications", url: "https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/" },
    { title: "LLMs with Semantic Search", url: "https://www.deeplearning.ai/short-courses/large-language-models-semantic-search/" },
    { title: "How Diffusion Models Work", url: "https://www.deeplearning.ai/short-courses/how-diffusion-models-work/" },
    { title: "Building Apps with Vector Databases", url: "https://www.deeplearning.ai/short-courses/building-applications-vector-databases/" },
    { title: "Pretraining LLMs", url: "https://www.deeplearning.ai/short-courses/pretraining-llms/" },
    { title: "Generative AI with Large Language Models", url: "https://www.deeplearning.ai/courses/generative-ai-with-large-language-models/" },
    { title: "Prompt Engineering with Llama 2", url: "https://www.deeplearning.ai/short-courses/prompt-engineering-with-llama-2/" },
    { title: "Building and Evaluating Data Agents", url: "https://www.deeplearning.ai/short-courses/building-and-evaluating-data-agents/" },
    { title: "Automated Testing for LLMOps", url: "https://www.deeplearning.ai/short-courses/automated-testing-for-llmops/" },
    { title: "Quality and Safety for LLM Applications", url: "https://www.deeplearning.ai/short-courses/quality-safety-llm-applications/" },
    { title: "LangChain Chat with Your Data", url: "https://www.deeplearning.ai/short-courses/langchain-chat-with-your-data/" },
    { title: "Evaluating and Debugging Generative AI", url: "https://www.deeplearning.ai/short-courses/evaluating-debugging-generative-ai/" },
    { title: "Knowledge Graphs for RAG", url: "https://www.deeplearning.ai/short-courses/knowledge-graphs-rag/" },
    { title: "Multi AI Agent Systems with CrewAI", url: "https://www.deeplearning.ai/short-courses/multi-ai-agent-systems-with-crewai/" },
    { title: "AI Agentic Design Patterns with AutoGen", url: "https://www.deeplearning.ai/short-courses/ai-agentic-design-patterns-with-autogen/" },
    { title: "Building Agentic RAG with LlamaIndex", url: "https://www.deeplearning.ai/short-courses/building-agentic-rag-with-llamaindex/" },
    { title: "Serverless Agentic Workflows with Amazon Bedrock", url: "https://www.deeplearning.ai/short-courses/serverless-agentic-workflows-amazon-bedrock/" },
    { title: "AI Agents in LangGraph", url: "https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/" },
    { title: "Reasoning with o1", url: "https://www.deeplearning.ai/short-courses/reasoning-with-o1/" },
    { title: "Open Source Models with Hugging Face", url: "https://www.deeplearning.ai/short-courses/open-source-models-hugging-face/" },
    { title: "LLMOps", url: "https://www.deeplearning.ai/short-courses/llmops/" },
    { title: "AI Agents and Agentic AI", url: "https://www.deeplearning.ai/short-courses/ai-agents-and-agentic-ai/" },
    { title: "Building Code Agents with Hugging Face", url: "https://www.deeplearning.ai/short-courses/building-code-agents-hugging-face/" },
    { title: "Building Towards Computer Use with Anthropic", url: "https://www.deeplearning.ai/short-courses/building-towards-computer-use-anthropic/" },
    { title: "MCP: Build Rich-Context AI Apps with Anthropic", url: "https://www.deeplearning.ai/short-courses/mcp-build-rich-context-ai-apps-with-anthropic/" },
    { title: "Build and Train an LLM with JAX", url: "https://www.deeplearning.ai/short-courses/build-and-train-an-llm-with-jax/" },
    { title: "Building Live Voice Agents with Google's ADK", url: "https://www.deeplearning.ai/short-courses/building-live-voice-agents-with-googles-adk/" },
    { title: "Fast Prototyping of GenAI Apps with Streamlit", url: "https://www.deeplearning.ai/short-courses/fast-prototyping-of-genai-apps-with-streamlit/" },
    { title: "Fine-tuning & RL for LLMs: Intro to Post-training", url: "https://www.deeplearning.ai/short-courses/fine-tuning-rl-for-llms-intro-to-post-training/" },
    { title: "Design, Develop and Deploy Multi-Agent Systems with CrewAI", url: "https://www.deeplearning.ai/short-courses/design-develop-deploy-multi-agent-systems-crewai/" },
    { title: "Build Apps with Windsurf's AI Coding Agents", url: "https://www.deeplearning.ai/short-courses/build-apps-with-windsurfs-ai-coding-agents/" },
    { title: "Prompt Engineering for Vision Models", url: "https://www.deeplearning.ai/short-courses/prompt-engineering-for-vision-models/" },
    { title: "Efficiently Serving LLMs", url: "https://www.deeplearning.ai/short-courses/efficiently-serving-llms/" },
    { title: "Building AI Browser Agents", url: "https://www.deeplearning.ai/short-courses/building-ai-browser-agents/" },
    { title: "Event Driven Agentic Document Workflows", url: "https://www.deeplearning.ai/short-courses/event-driven-agentic-document-workflows/" },
    { title: "Practical Multi AI Agents and Advanced Use Cases", url: "https://www.deeplearning.ai/short-courses/practical-multi-ai-agents/" },
    { title: "Building AI Powered Search Systems", url: "https://www.deeplearning.ai/short-courses/building-ai-powered-search-systems/" },
    { title: "Embedding Models From Theory to Practice", url: "https://www.deeplearning.ai/short-courses/embedding-models-from-theory-to-practice/" },
    { title: "Advanced Retrieval for AI Applications", url: "https://www.deeplearning.ai/short-courses/advanced-retrieval-for-ai-applications/" },
    { title: "Building Agent Memory Systems", url: "https://www.deeplearning.ai/short-courses/building-agent-memory-systems/" },
    { title: "Evaluating AI Agents", url: "https://www.deeplearning.ai/short-courses/evaluating-ai-agents/" },
    { title: "Building AI Applications with Open Source Models", url: "https://www.deeplearning.ai/short-courses/building-ai-applications-open-source-models/" },
    { title: "Production RAG Systems", url: "https://www.deeplearning.ai/short-courses/production-rag-systems/" },
    { title: "Agent Communication Protocols", url: "https://www.deeplearning.ai/short-courses/agent-communication-protocols/" },
  ] },
  { name: "Hugging Face", url: "https://huggingface.co/learn", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", courses: [
    { title: "LLM Course", url: "https://huggingface.co/learn/llm-course" },
    { title: "Agents Course", url: "https://huggingface.co/learn/agents-course" },
    { title: "Computer Vision Course", url: "https://huggingface.co/learn/computer-vision-course" },
    { title: "Deep Reinforcement Learning Course", url: "https://huggingface.co/learn/deep-rl-course" },
    { title: "Diffusion Course", url: "https://huggingface.co/learn/diffusion-course" },
    { title: "ML for Games Course", url: "https://huggingface.co/learn/ml-games-course" },
    { title: "Robotics Course", url: "https://huggingface.co/learn/robotics-course" },
    { title: "a smol course", url: "https://huggingface.co/learn/smol-course" },
    { title: "Open-Source AI Cookbook", url: "https://huggingface.co/learn/cookbook" },
  ] },
];

export default Courses;
