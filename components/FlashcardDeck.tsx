import React, { useState } from 'react';

import { generateFlashcards } from '../lib/ai';

interface FlashCard {
  front: string;
  back: string;
}

const FlashcardDeck: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [deckTitle, setDeckTitle] = useState('');
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setFlipped(false);
    setCurrent(0);
    try {
      const result = await generateFlashcards(topic.trim());
      setCards(result.cards);
      setDeckTitle(result.title);
    } catch (err: any) {
      setError(err.message || 'Failed to generate flashcards');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (current < cards.length - 1) {
      setCurrent(c => c + 1);
      setFlipped(false);
    }
  };

  const prevCard = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
      setFlipped(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCards(shuffled);
    setCurrent(0);
    setFlipped(false);
  };

  if (cards.length === 0) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div className="bento-card" style={{ gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>

            </div>
            <h2>AI Flashcards</h2>
            <p>Enter any topic to generate a deck of flashcards</p>
          </div>

          <div className="form-group" style={{ gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. Quantum Physics, JavaScript Basics, World History..."
                disabled={loading}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                style={{ whiteSpace: 'nowrap' }}
              >
                {loading ? '...' : 'Generate'}
              </button>
            </div>
            {error && (
              <div className="badge badge-danger" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      <div className="bento-card" style={{ gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => { setCards([]); setTopic(''); setDeckTitle(''); }}
          >
            &larr; New Topic
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn btn-sm" onClick={shuffleCards}>
              Shuffle
            </button>
            <span className="flabel" style={{ fontSize: '0.7rem' }}>{current + 1} / {cards.length}</span>
          </div>
        </div>

        <h3 style={{ textAlign: 'center' }}>{deckTitle}</h3>

        <div
          className={`bento-card ${flipped ? 'bento-card-accent' : ''}`}
          onClick={() => setFlipped(!flipped)}
          style={{ cursor: 'pointer', minHeight: '180px', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '32px 24px', transition: 'background 0.2s, border-color 0.2s' }}
        >
          {!flipped ? (
            <div>
              <div className="flabel" style={{ fontSize: '0.65rem', marginBottom: '12px' }}>Question</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{cards[current].front}</p>
              <div className="flabel" style={{ fontSize: '0.6rem', marginTop: '20px', color: 'var(--ink-mute)' }}>Tap to flip</div>
            </div>
          ) : (
            <div>
              <div className="flabel" style={{ fontSize: '0.65rem', marginBottom: '12px' }}>Answer</div>
              <p style={{ fontSize: '1.05rem', color: 'var(--ink)', margin: 0 }}>{cards[current].back}</p>
              <div className="flabel" style={{ fontSize: '0.6rem', marginTop: '20px', color: 'var(--ink-mute)' }}>Tap to flip back</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
          <button
            className="btn"
            onClick={prevCard}
            disabled={current === 0}
            style={{ width: '44px', height: '44px', padding: 0 }}
          >
            ←
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setFlipped(!flipped)}
            style={{ gap: '6px' }}
          >
            Flip
          </button>
          <button
            className="btn"
            onClick={nextCard}
            disabled={current === cards.length - 1}
            style={{ width: '44px', height: '44px', padding: 0 }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardDeck;
