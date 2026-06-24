import React, { useState } from 'react';
type TabType = 'students' | 'teachers' | 'parents';

const FEATURES: Record<TabType, { title: string; desc: string }[]> = {
  students: [
    { title: 'Syllabus Calendar', desc: 'Automatically structure homework targets and lesson plans inside a daily timeline widget.' },
    { title: 'Interactive Study Decks', desc: 'Review smart flashcards synced to your incorrect homework queries to target learning gaps.' },
    { title: 'Progress Metrics', desc: 'Check your daily engagement scores and benchmark metrics against your cohort.' },
  ],
  teachers: [
    { title: 'Attendance Management', desc: 'One-click attendance tracking synced instantly to the institution dashboard.' },
    { title: 'Assignment Uploads', desc: 'Distribute, collect, and grade homework efficiently with no paperwork.' },
    { title: 'Progress Tracking', desc: 'Monitor individual student learning outcomes seamlessly over time.' },
  ],
  parents: [
    { title: 'Real-Time Updates', desc: 'Know exactly what your child is learning, when, and how well.' },
    { title: 'Instant Notifications', desc: 'Instant alerts for absences, low performance, or praise.' },
    { title: 'Student Reports', desc: 'Detailed monthly performance deep-dives on a single dashboard.' },
  ],
};

const TABS: TabType[] = ['students', 'teachers', 'parents'];

const FeaturesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('students');

  return (
    <section className="viewport-content">
      <div className="section-header">
        <h2 className="mt-12">Features for everyone</h2>
      </div>

      <div className="tab-bar mb-32">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid-3">
        {FEATURES[activeTab].map((f, i) => (
          <div key={i} className="bento-card">
            <h4 style={{ margin: '8px 0' }}>{f.title}</h4>
            <p className="text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
