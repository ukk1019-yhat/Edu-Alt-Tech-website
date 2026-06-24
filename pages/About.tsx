import React from 'react';
import { Helmet } from 'react-helmet-async';
import { TEAM, SUPPORTING_TEAM } from '../constants';

const About: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>About Us | EduAltTech</title>
        <meta name="description" content="Why we built EduAltTech and our mission to provide alternative skills and curriculum-driven tech ecosystems." />
      </Helmet>

      <section className="viewport-content">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <span className="flabel">About Us</span>
            <h2>Why We Built Edu Alt Tech</h2>
          </div>
        </div>

        {/* Mission statement */}
        <div className="section-header">
          <p>
            We believe the future of education is hybrid, accessible, and deeply technical. Edu Alt Tech bridges the gap between traditional academic curricula and industry-demanded alternative skills.
          </p>
        </div>

        <div className="asc" />

        {/* Pillars */}
        <div className="grid-3">
          <div className="bento-card bento-card-accent">
            <span className="flabel">[1] Accessibility</span>
            <h3 style={{ marginTop: 8 }}>Accessible Education</h3>
            <p>
              Multi-lingual platforms serving all backgrounds, regions, and languages to break down geographic barriers.
            </p>
          </div>
          <div className="bento-card bento-card-accent">
            <span className="flabel">[2] Industry</span>
            <h3 style={{ marginTop: 8 }}>Future Skills</h3>
            <p>
              Cutting-edge training in AI, full-stack web development, and creative-industry pathways designed for immediate execution.
            </p>
          </div>
          <div className="bento-card bento-card-accent">
            <span className="flabel">[3] Scaling</span>
            <h3 style={{ marginTop: 8 }}>Institutional Support</h3>
            <p>
              Powering schools with school OS, customized ERPs, native mobile apps, and administrative intelligence dashboards.
            </p>
          </div>
        </div>

        <div className="asc" />

        {/* Core Team */}
        <div className="section-header">
          <span className="flabel">Core Team</span>
          <h2>Meet the Innovators</h2>
        </div>

        <div className="grid-3">
          {TEAM.map((member, idx) => (
            <div key={idx} className="bento-card" style={{ gap: 8 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '4px',
                  border: '2px solid var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  background: 'var(--bg-surface)',
                  overflow: 'hidden',
                  marginBottom: 8,
                }}
              >
                {member.image ? (
                  <img src={member.image} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  member.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              <h4>{member.name}</h4>
              <span className="flabel">{member.role}</span>
              <p style={{ marginTop: 8 }}>{member.bio}</p>
            </div>
          ))}
        </div>

        {/* Supporting Team */}
        {SUPPORTING_TEAM && SUPPORTING_TEAM.length > 0 && (
          <>
            <div className="asc" />
            <div className="section-header">
              <span className="flabel">Supporting Team</span>
              <h2>Behind the Scenes</h2>
            </div>
            <div className="grid-2">
              {SUPPORTING_TEAM.map((member, idx) => (
                <div key={idx} className="bento-card bento-card-compact" style={{ gap: 4 }}>
                  <h3>{member.name}</h3>
                  <span className="badge">{member.role}</span>
                  <p>{member.bio}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
};

export default About;
