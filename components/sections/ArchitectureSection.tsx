import React from "react";

const ArchitectureSection: React.FC = () => {
  return (
    <section className="viewport-content">
      <div style={{ maxWidth: 600, margin: '0 auto 48px', textAlign: 'center' }}>
        <h2 style={{ marginTop: 12 }}>Architecture overview</h2>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="bento-card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontWeight: 600, marginTop: 8 }}>Mobile Apps</div>
          <p style={{ fontSize: '0.85rem', marginTop: 4, color: 'var(--ink-soft)' }}>
            Student and teacher native mobile interfaces
          </p>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--ink-mute)' }}>
          ↓ API Gateway ↓
        </div>

        <div className="bento-card" style={{ textAlign: 'center', padding: 20, borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
          <div style={{ fontWeight: 600, marginTop: 8 }}>EduAltTech Core</div>
          <p style={{ fontSize: '0.85rem', marginTop: 4, color: 'var(--ink-soft)' }}>
            Translation pipeline, AI assistant, and sync engine
          </p>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--ink-mute)' }}>
          ↓ Database ↓
        </div>

        <div className="bento-card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontWeight: 600, marginTop: 8 }}>Data Layer</div>
          <p style={{ fontSize: '0.85rem', marginTop: 4, color: 'var(--ink-soft)' }}>
            Authentication, storage, and curriculum databases
          </p>
        </div>

      </div>
    </section>
  );
};

export default ArchitectureSection;
