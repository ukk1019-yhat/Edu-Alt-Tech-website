import React, { useState, useEffect } from 'react';
import { db, auth, collection, getDocs, query, orderBy, doc, deleteDoc, onAuthStateChanged } from '../lib/firebase';
import { PatchNote } from '../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const PatchNotes: React.FC = () => {
  const [notes, setNotes] = useState<PatchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const ADMIN_EMAILS = ['ukkukk97@gmail.com', 'umakrishnakanthchokkapu15@gmail.com'];
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsAdmin(!!currentUser?.email && ADMIN_EMAILS.includes(currentUser.email));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const q = query(collection(db, 'patch_notes'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as PatchNote)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const handleDeleteNote = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'patch_notes', id));
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success('Patch note deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete patch note');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 16 }}>
        <div className="skeleton skeleton-title" style={{ width: 140 }} />
        <div className="skeleton skeleton-text" style={{ width: 220 }} />
        <div className="skeleton skeleton-card" style={{ height: 120 }} />
        <div className="skeleton skeleton-card" style={{ height: 100 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex" style={{ alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} className="btn btn-sm btn-secondary flex items-center gap-2">
          Back
        </button>
      </div>

      <div className="page-header">
        <div className="flex" style={{ alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>
            
          </div>
          <div>
            <h1>System Updates</h1>
            <p>Latest changelogs, features, and fixes for the platform.</p>
          </div>
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="flex flex-col" style={{ gap: 16 }}>
          {notes.map((note, idx) => (
            <div key={note.id} className="bento-card relative">
              <div className="flex" style={{ gap: 16, alignItems: 'flex-start' }}>
                {/* Timeline marker */}
                <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>
                    <span className="font-semibold" style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{note.version || `v${notes.length - idx}`}</span>
                  </div>
                  {idx < notes.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--ink)', minHeight: 24 }} />}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 style={{ margin: 0 }}>{note.title || 'Platform Update'}</h3>
                      <span className="flabel">
                        {note.createdAt && ('toDate' in note.createdAt) ? note.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                      </span>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteNote(note.id)} className="btn btn-sm" style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }} title="Delete Patch Note">
                        🗑
                      </button>
                    )}
                  </div>
                  <div className="bento-card-compact" style={{ padding: 16 }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{note.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span style={{ fontSize: 48, color: 'var(--ink-mute)' }}>📄</span>
          <h3>No updates yet</h3>
          <p>System changelogs will appear here when new features ship.</p>
        </div>
      )}
    </div>
  );
};

export default PatchNotes;
