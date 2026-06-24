import React from "react";
const tags = [
  "Constant Innovation",
  "AI-Powered Analytics",
  "Multi-Language",
  "Scalable by Design",
];

const VisionSection: React.FC = () => {
  return (
    <section className="viewport-content">
      <div className="bento-card bento-card-accent" style={{ textAlign: 'center', maxWidth: 900, margin: '0 auto', padding: '32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <h2 style={{ maxWidth: 400 }}>
          Building India's first curriculum-driven school OS
        </h2>

        <p className="mt-12" style={{ maxWidth: 500, color: 'var(--ink-soft)' }}>
          A unified operating system that powers every aspect of the
          educational experience — from classroom to administration.
        </p>

        <div className="flex-wrap justify-center" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              className="badge badge-accent"
            >
              {tag}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
};

export default VisionSection;

