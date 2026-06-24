import React from "react";

const stages = [
  {
    label: "Stage 1",
    title: "Systems & Query Logic",
    desc: "File systems, indexing, procedural logic",
    pct: "100%",
    completed: true,
  },
  {
    label: "Stage 2",
    title: "Encryption & Security",
    desc: "Authentication, encryption, data controls",
    pct: "62%",
    active: true,
  },
  {
    label: "Stage 3",
    title: "Replication & API Sync",
    desc: "Cloud clusters, server operations, realtime",
    pct: "0%",
  },
  {
    label: "Stage 4",
    title: "Distributed Systems",
    desc: "Sharding, load balancing, fault tolerance",
    pct: "0%",
  },
  {
    label: "Stage 5",
    title: "Capstone Project",
    desc: "Full-stack deployment",
    pct: "0%",
  },
];

const CurriculumSection: React.FC = () => {
  return (
    <section className="viewport-content">
      <div className="section-header" style={{ maxWidth: 600, marginBottom: 48 }}>
        <span className="flabel">Roadmap</span>
        <h2 className="mt-12">Learning Path</h2>
        <p className="mt-8" style={{ color: 'var(--ink-soft)' }}>Your journey from fundamentals to deployment</p>
      </div>

      <div className="path-track" style={{ maxWidth: 700 }}>
        {stages.map((stage, idx) => (
          <div
            key={idx}
            className={`path-step ${stage.completed ? 'completed' : ''} ${stage.active ? 'active' : ''}`}
          >
            <div className="path-step-body">
              <div style={{ flex: 1 }}>
                <div className="step-label">{stage.label}</div>
                <div className="step-title">{stage.title}</div>
                <div className="step-desc">{stage.desc}</div>
              </div>
              <div className="step-pct" style={!stage.completed && !stage.active ? { color: 'var(--ink-mute)' } : undefined}>
                {stage.pct}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CurriculumSection;
