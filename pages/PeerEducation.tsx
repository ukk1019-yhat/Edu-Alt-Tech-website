import React from 'react';
import { Link } from 'react-router-dom';

const PeerEducation: React.FC = () => {
  return (
    <div className="viewport-content">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-2">
          
          <span className="flabel" style={{ color: 'var(--accent)' }}>Alternative Learning Model</span>
        </div>
        <h1>Peer-to-Peer <span style={{ color: 'var(--accent)' }}>Education</span></h1>
        <p>Step outside the traditional classroom. We connect passionate mentors with driven learners to create a collaborative, execution-focused ecosystem.</p>
      </div>

      {/* Dual Paths */}
      <div className="grid-2">
        {/* Student Path */}
        <div className="bento-card flex flex-col">
          <div className="flex items-center justify-center" style={{ width: 56, height: 56, border: '2px solid var(--ink)', background: 'var(--accent-soft)', marginBottom: 16 }}>
            
          </div>
          <h2 style={{ margin: '0 0 8px' }}>Learn as a Student</h2>
          <p style={{ flex: 1 }}>If you lack discipline or struggle with traditional curriculums, join as a learner. Get matched with peer-mentors, access structured Weekly Plans, and bridge your execution gap through accountability.</p>
          <ul style={{ padding: 0, margin: '0 0 24px', listStyle: 'none' }}>
            <li className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <span style={{ color: 'var(--accent)' }}>→</span> Real-time peer accountability
            </li>
            <li className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <span style={{ color: 'var(--accent)' }}>→</span> AI-generated structured roadmaps
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: 'var(--accent)' }}>→</span> Focus on deep execution
            </li>
          </ul>
          <Link to="/enroll/student" className="btn btn-primary flex items-center gap-2" style={{ textDecoration: 'none' }}>
            Enroll as a Student →
          </Link>
        </div>

        {/* Teacher Path */}
        <div className="bento-card flex flex-col">
          <div className="flex items-center justify-center" style={{ width: 56, height: 56, border: '2px solid var(--ink)', background: 'var(--accent-soft)', marginBottom: 16 }}>
            
          </div>
          <h2 style={{ margin: '0 0 8px' }}>Join as a Teacher</h2>
          <p style={{ flex: 1 }}>Share your expertise in a modern format. Whether you teach coding, languages, or core sciences, become a peer-mentor and monetize your skills while guiding students to absolute success.</p>
          <ul style={{ padding: 0, margin: '0 0 24px', listStyle: 'none' }}>
            <li className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <span style={{ color: 'var(--accent)' }}>→</span> Flexible, modern curriculum integration
            </li>
            <li className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <span style={{ color: 'var(--accent)' }}>→</span> Analytics dashboard to track student ROI
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: 'var(--accent)' }}>→</span> Grow your personal educator brand
            </li>
          </ul>
          <Link to="/enroll/teacher" className="btn btn-primary flex items-center gap-2" style={{ textDecoration: 'none' }}>
            Enroll as a Teacher →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PeerEducation;
