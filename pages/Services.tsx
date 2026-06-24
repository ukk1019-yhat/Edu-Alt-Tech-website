import React from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';

const Services: React.FC = () => {
  return (
    <div className="viewport-content">
      <div className="section-header">
        <span className="flabel">[ OUR SERVICES ]</span>
        <h1>
          Technology Solutions<br />for <span style={{ color: 'var(--accent)' }}>Modern Schools</span>
        </h1>
        <p>
          Comprehensive digital solutions designed to empower educational institutions with cutting-edge technology.
        </p>
      </div>

      <div className="grid-3">
        {SERVICES.map((service, idx) => (
          <div key={idx} className="bento-card" style={{ gap: 16 }}>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <div className="asc-sm" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {service.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="asc" />

      {/* CTA Section */}
      <div className="bento-card bento-card-accent" style={{ alignItems: 'center', textAlign: 'center', gap: 16, padding: '48px 32px' }}>
        <span className="flabel">Ready to Get Started?</span>
        <h2>
          Technology Solutions for Education
        </h2>
        <p style={{ maxWidth: 500 }}>
          Schedule a free consultation and discover how we can transform your school with modern, curriculum-aligned systems.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/contact" className="btn btn-primary">
            Get a Free Consultation
          </Link>
          <Link to="/resources" className="btn btn-secondary">
            Explore Resources
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;
