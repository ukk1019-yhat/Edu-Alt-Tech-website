
import React, { useState } from "react";

const transcripts: Record<string, string> = {
  English:
    "Welcome to today's live classroom session. Today, we will explore how we design scalable systems and why clean architecture is essential for large-scale web development.",
  Hindi:
    "आज के लाइव क्लास सत्र में आपका स्वागत है। आज, हम यह पता लगाएंगे कि हम स्केलेबल सिस्टम कैसे डिजाइन करते हैं और बड़े पैमाने पर वेब विकास के लिए स्वच्छ वास्तुकला क्यों आवश्यक है।",
  Telugu:
    "ఈరోజు ప్రత్యక్ష తరగతి సెషన్‌కు స్వాగతం. ఈరోజు, మేము స్కేలబుల్ సిస్టమ్‌లను ఎలా డిజైన్ చేస్తాము మరియు పెద్ద ఎత్తున వెబ్ అభివృద్ధికి క్లీన్ ఆర్కిటెక్చర్ ఎందుకు అవసరమో అన్వేషిస్తాము.",
  Spanish:
    "Bienvenidos a la sesión de clase en vivo de hoy. Hoy exploraremos cómo diseñamos sistemas escalables y por qué la arquitectura limpia es esencial para el desarrollo web a gran escala.",
  Bengali:
    "আজকের লাইভ ক্লাসরুম সেশনে স্বাগতম। আজ, আমরা অন্বেষণ করব কীভাবে আমরা স্কেলযোগ্য সিস্টেমগুলি ডিজাইন করি এবং কেন বড় আকারের ওয়েব বিকাশের জন্য পরিষ্কার আর্কিটেকচার অপরিহার্য।",
};

const translations: Record<string, string> = {
  English: "Translated content → appears here in your language",
  Hindi: "क्वेरी स्कीमा → डेटाबेस स्कीमा संरचना",
  Telugu: "ప్రశ్న స్కీమా → డేటాబేస్ స్కీమా నిర్మాణం",
  Spanish: "Esquema de consulta → Estructura del esquema de base de datos",
  Bengali: "কোয়েরি স্কিমা → ডেটাবেস স্কিমা স্ট্রাকচার",
};

const sideCards = [
  {
    title: "Synchronized Audio",
    desc: "Listen to classroom lectures in localized regional dialects without lag.",
  },
  {
    title: "Multi-language Resources",
    desc: "Download textbooks compiled in Hindi, Telugu, and Dogri formats.",
  },
  {
    title: "AI Learning Assistant",
    desc: "Ask programming questions in your local dialect. Our agent answers in the same language.",
  },
];

const SolutionSection: React.FC = () => {
  const [activeLang, setActiveLang] = useState<string>("English");

  return (
    <section className="viewport-content">
      <div className="section-header mb-12">
        <div className="flabel">Translation Engine</div>

        <h2 className="mt-3">
          Real-time translation pipeline
        </h2>

        <p className="mt-4 max-w-2xl text-ink-soft">
          We translate study files, audio guides, and classroom discussions
          to bridge language barriers and make technical education accessible
          to every learner.
        </p>
      </div>

      <div className="grid-2">

        {/* Main Card */}
        <div className="bento-card" style={{ padding: 0 }}>

          <div style={{ background: 'var(--bg-surface)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--ink)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Live Transcriber
            </span>

            <span style={{ fontSize: '0.75rem', color: 'var(--ink-mute)' }}>
              AI Sync
            </span>
          </div>

          <div style={{ padding: 24 }}>

            {/* Language Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {Object.keys(transcripts).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={
                    activeLang === lang
                      ? "btn btn-primary"
                      : "btn"
                  }
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Transcript */}
            <div style={{ background: 'var(--bg)', border: '2px solid var(--ink)', padding: 16, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 16 }}>
              &ldquo;{transcripts[activeLang]}&rdquo;
            </div>

            {/* Translation Output */}
            <div style={{ background: 'var(--accent-soft)', borderLeft: '3px solid var(--accent)', padding: 12 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 4 }}>
                Translation
              </div>

              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {translations[activeLang]}
              </p>
            </div>

          </div>
        </div>

        {/* Side Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {sideCards.map((card) => (
            <div
              key={card.title}
              className="bento-card"
              style={{ padding: 20 }}
            >
              <h4 style={{ fontSize: '1rem', marginBottom: 4 }}>
                {card.title}
              </h4>

              <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                {card.desc}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default SolutionSection;

