
import React from 'react';
import { Helmet } from 'react-helmet-async';

import HeroSection from '../components/sections/HeroSection';
import ProblemSection from '../components/sections/ProblemSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import CurriculumSection from '../components/sections/CurriculumSection';
import CaseStudySection from '../components/sections/CaseStudySection';
import PricingSection from '../components/sections/PricingSection';
import CtaSection from '../components/sections/CtaSection';

const Home: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>
          Edu Alt Tech | AI Learning Platform, Courses & Educational Tools
        </title>

        <meta
          name="description"
          content="Edu Alt Tech provides AI-powered learning resources, courses, educational tools, and technology solutions for students, educators, and institutions."
        />

        <link rel="canonical" href="https://www.edualttech.com/" />

        <meta property="og:title" content="Edu Alt Tech" />

        <meta
          property="og:description"
          content="AI Learning Platform, Courses, Educational Tools and School Technology Solutions."
        />

        <meta
          property="og:image"
          content="https://www.edualttech.com/og-image.jpg"
        />

        <meta
          property="og:url"
          content="https://www.edualttech.com/"
        />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Edu Alt Tech",
            url: "https://www.edualttech.com",
            logo: "https://www.edualttech.com/edulogo.png",
            description:
              "Learning Resources, Courses, AI Tools and School Technology Solutions",
            sameAs: [
              "https://in.linkedin.com/company/edu-alt-tech",
              "https://www.instagram.com/edu_alt_tech/"
            ]
          })}
        </script>
      </Helmet>

      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <CurriculumSection />
        <CaseStudySection />
        <PricingSection />
        <CtaSection />
      </main>
    </>
  );
};

export default Home;

