import React from "react";

const stats = [
  { value: "45%", label: "Increase in Engagement" },
  { value: "12 hrs", label: "Admin Time Saved / Week" },
  { value: "98%", label: "Parent Satisfaction" },
];

const CaseStudySection: React.FC = () => {
  return (
    <section className="viewport-content">
      <div className="grid-2" style={{ alignItems: 'center' }}>

        {/* Left — Testimonial */}
        <div className="bento-card" style={{ minHeight: '100%' }}>
          <div className="flabel" style={{ marginBottom: 16 }}>
            Case Study
          </div>

          <h3 style={{ marginBottom: 24 }}>
            Helping schools improve student
            engagement and transparency
          </h3>

          <p>
            Before Edu Alt Tech, we relied on disconnected
            WhatsApp groups, paper diaries and spreadsheets.
            There was no visibility into how students were
            progressing.
          </p>

          <p className="mt-16">
            After implementing School OS, teachers spend
            less time on administration and more time
            teaching. Parents now have real-time visibility
            through the mobile application.
          </p>

          <div className="case-study-author">
            <div className="case-avatar">DS</div>
            <div>
              <h4>Dr. Sharma</h4>
              <p className="text-sm text-ink-mute" style={{ margin: 0 }}>
                Principal, Modern High School
              </p>
            </div>
          </div>
        </div>

        {/* Right — Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="flabel">Results</div>
            <h2 className="mt-12">Measurable impact</h2>
            <p className="mt-12" style={{ color: 'var(--ink-soft)' }}>
              Schools adopting Edu Alt Tech experience
              higher engagement and dramatically lower
              administrative overhead.
            </p>
          </div>

          {stats.map((stat, i) => (
            <div key={i} className="bento-card" style={{ padding: 28 }}>
              <div className="stat-value accented" style={{ marginBottom: 8 }}>
                {stat.value}
              </div>
              <p style={{ margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudySection;
