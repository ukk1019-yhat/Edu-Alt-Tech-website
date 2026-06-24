import React from 'react';
import { Link } from 'react-router-dom';

const CtaSection: React.FC = () => {
  return (
    <section className="viewport-content">
      <div className="bento-card bento-card-accent items-center" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <span className="flabel mb-8">Transform Your Institution</span>
        <h2 style={{ maxWidth: 400 }}>
          Ready to <span className="text-accent">level up?</span>
        </h2>
        <p style={{ maxWidth: 500 }} className="mt-12">
          Join forward-thinking institutions that have already unlocked the full power of the EduAltTech operating system.
        </p>
        <div className="flex gap-12 flex-wrap justify-center mt-24">
          <Link to="/contact" className="btn btn-primary">Book a free demo</Link>
          <Link to="/courses" className="btn btn-secondary">Explore courses</Link>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
