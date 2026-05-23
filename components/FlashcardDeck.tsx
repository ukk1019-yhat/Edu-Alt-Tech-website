import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Sparkles, Loader2, Shuffle } from 'lucide-react';
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
      <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-[#020617]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">AI Flashcards</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Enter any topic to generate a deck of flashcards</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex gap-3">
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. Quantum Physics, JavaScript Basics, World History..."
                disabled={loading}
                className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-medium border border-transparent focus:border-emerald-500 transition-all"
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate
              </button>
            </div>
            {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-[#020617]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => { setCards([]); setTopic(''); setDeckTitle(''); }}
            className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors"
          >
            &larr; New Topic
          </button>
          <div className="flex items-center gap-3">
            <button onClick={shuffleCards} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <Shuffle className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-500">{current + 1} / {cards.length}</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 text-center tracking-tight">{deckTitle}</h2>

        {/* Flashcard */}
        <div className="relative cursor-pointer" style={{ perspective: '1200px' }} onClick={() => setFlipped(!flipped)}>
          <div
            className="relative w-full transition-all duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: '320px',
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center justify-center p-10"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">Question</span>
              <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center leading-relaxed">{cards[current].front}</p>
              <span className="mt-auto text-[10px] text-slate-400 font-medium">Tap to flip</span>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-10"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-6">Answer</span>
              <p className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed">{cards[current].back}</p>
              <span className="mt-auto text-[10px] text-white/50 font-medium">Tap to flip back</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={prevCard}
            disabled={current === 0}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-30"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>

          <button
            onClick={() => setFlipped(!flipped)}
            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <RotateCw className="w-5 h-5" /> Flip
          </button>

          <button
            onClick={nextCard}
            disabled={current === cards.length - 1}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-30"
          >
            <ChevronRight className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardDeck;
