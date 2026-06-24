import React from "react";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  return (
    <section className="viewport-content">
      <div className="hero-grid grid-cols-12 gap-8 lg:gap-12">

        {/* LEFT SIDE */}
        <div className="hero-copy">
          <div className="flabel mb-12">
            Curriculum-driven learning systems
          </div>

          <h1>
            Future-proofed
            <br />
            <span className="text-accent">
              educational
              <br />
              networks.
            </span>
          </h1>

          <p className="hero-description">
            We design robust, curriculum-driven learning tools,
            responsive interfaces, and alternative skill pipelines
            for modular digital schools.
          </p>

          <div className="hero-actions">
            <Link to="/courses" className="btn btn-primary">
              Explore Syllabus
            </Link>

            <Link to="/contact" className="btn btn-secondary">
              Partner with us
            </Link>
          </div>

          <div className="asc"></div>

          <div className="hero-trust">
            <p className="text-xs text-ink-mute mb-8">
              Trusted by modern tech classrooms
            </p>

            <div className="hero-logos">
              <span>Basecamp</span>
              <span>Linear</span>
              <span>Stripe</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="hero-orbit-wrapper">
          <div className="orbit-sphere">

            {/* Rings */}
            <div className="orbit-ring ring-1"></div>
            <div className="orbit-ring ring-2"></div>
            <div className="orbit-ring ring-3"></div>

            {/* Center */}
            <div className="orbit-center">
              Alt
              <br />
              Edu
            </div>

            {/* Rotating Language Nodes */}
            <div className="orbit-track track-1">
              <div className="orbit-node node-1">
                Hindi
              </div>
            </div>

            <div className="orbit-track track-2">
              <div className="orbit-node node-2">
                Telugu
              </div>
            </div>

            <div className="orbit-track track-3">
              <div className="orbit-node node-3">
                Bengali
              </div>
            </div>

            <div className="orbit-track track-4">
              <div className="orbit-node node-4">
                Kashmiri
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Metrics */}
      <div className="grid-3">

        <div className="bento-card">
          <div className="stat-value">
            98%
          </div>

          <p className="text-sm text-ink-soft mt-8">
            Student completion rate across all cohorts
          </p>
        </div>

        <div className="bento-card">
          <div className="stat-value">
            +150 hr
          </div>

          <p className="text-sm text-ink-soft mt-8">
            Active hands-on building labs
          </p>
        </div>

        <div className="bento-card">
          <div className="stat-value">
            12+
          </div>

          <p className="text-sm text-ink-soft mt-8">
            Partner universities hosting custom nodes
          </p>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;