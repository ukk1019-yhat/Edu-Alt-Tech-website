import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, collection, query, where, getDocs } from '../lib/firebase';
import type { User } from '../lib/firebase';
import Chat from '../components/Chat';

const Messages: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isAdmin = currentUser.email === 'ukkukk97@gmail.com' || currentUser.email === 'umakrishnakanthchokkapu15@gmail.com' || currentUser.email === 'admin@edualttech.com';
        if (isAdmin) {
          setRole('admin');
        } else {
          try {
            const sq = query(collection(db, 'enrollments'), where('userId', '==', currentUser.uid), where('role', '==', 'teacher'));
            const sSnap = await getDocs(sq);
            setRole(sSnap.empty ? 'student' : 'teacher');
          } catch { setRole('student'); }
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="viewport-content">
      <div className="skeleton skeleton-card" />
    </div>
  );

  if (!user) return (
    <div className="viewport-content">
      <div className="empty-state">
        <h3>Sign in to access Messages</h3>
      </div>
    </div>
  );

  return (
    <div className="viewport-content">
      <div className="page-header">
        <h1>Messages</h1>
      </div>
      <Chat user={user} role={role} />
    </div>
  );
};

export default Messages;
