import React from 'react';

const problems = [
  {
    title: 'Fragmented Systems',
    desc: 'Institutions maintain disconnected modules, creating bottlenecks, information silos, and security concerns.',
    accent: false,
  },
  {
    title: 'Outdated Tracking',
    desc: 'Static tracking models fail to measure practical learning progression, leaving teachers unaware of dropout risks.',
    accent: true,
  },
  {
    title: 'Language Barriers',
    desc: 'High-quality tech materials are confined to single-language textbooks, locking out students from diverse regions.',
    accent: false,
  },
];

const ProblemSection: React.FC = () => {
  return (
    <section className="viewport-content">
      <div style={{ maxWidth: 600, marginBottom: 40 }}>
        <h2 className="mt-12">Why legacy systems fail modern classrooms</h2>
        <p className="mt-12">
          Modern classrooms require distributed schemas, but standard administration tools rely on paper legacy structures.
        </p>
      </div>

      <div className="grid-3">
        <div className="bento-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Fragmented Systems</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
            Institutions maintain disconnected modules, creating bottlenecks, information silos, and security concerns.
          </p>
        </div>
        <div className="bento-card" style={{ background: 'var(--accent)', color: '#fff' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 12, color: '#fff' }}>Outdated Tracking</h3>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
            Static tracking models fail to measure practical learning progression, leaving teachers unaware of dropout risks.
          </p>
        </div>
        <div className="bento-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Language Barriers</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
            High-quality tech materials are confined to single-language textbooks, locking out students from diverse regions.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
