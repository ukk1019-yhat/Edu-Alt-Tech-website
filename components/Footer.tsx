import React from 'react';
import { Link } from 'react-router-dom';
import { LINKS } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bento-card" style={{ marginTop: 60 }}>
      <div className="footer-grid" style={{ marginBottom: '32px' }}>
        <div>
          <div className="flex items-center gap-8 mb-12">
            <span aria-hidden="true" className="navbar-logo-dot" />
            <span className="font-display font-bold">
              EduAltTech
            </span>
          </div>
          <p className="text-sm text-ink-soft" style={{ lineHeight: 1.6 }}>
            Education technology partner building curriculum-driven platforms and alternative skill pathways for the modern digital learner.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          <h4 className="mb-4">Services</h4>
          <Link to="/services" className="text-sm text-ink-soft">Web Development</Link>
          <Link to="/services" className="text-sm text-ink-soft">Mobile Apps</Link>
          <Link to="/services" className="text-sm text-ink-soft">School ERP</Link>
          <Link to="/services" className="text-sm text-ink-soft">AI Solutions</Link>
        </div>

        <div className="flex flex-col gap-8">
          <h4 className="mb-4">Quick Links</h4>
          <Link to="/" className="text-sm text-ink-soft">Home</Link>
          <Link to="/about" className="text-sm text-ink-soft">About Us</Link>
          <Link to="/resources" className="text-sm text-ink-soft">Resources</Link>
          <Link to="/courses" className="text-sm text-ink-soft">Courses</Link>
          <Link to="/contact" className="text-sm text-ink-soft">Contact</Link>
        </div>

        <div className="flex flex-col gap-8">
          <h4 className="mb-4">Contact</h4>
          <p className="text-sm text-ink-soft">info@edualttech.com</p>
          <p className="text-sm text-ink-soft">+91 9121505879</p>
          <p className="text-sm text-ink-soft">India</p>
        </div>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-12 border-top" style={{ paddingTop: 20 }}>
        <span className="text-xs font-mono text-ink-mute">
          &copy; {new Date().getFullYear()} EduAltTech
        </span>
        <div className="flex gap-12">
          <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-xs">
            Instagram
          </a>
          <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-xs">
            LinkedIn
          </a>
          <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-xs">
            WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
