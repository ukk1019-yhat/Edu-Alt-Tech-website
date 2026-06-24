import React, { useState, useEffect, useRef } from 'react';
import { auth, db, onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword, doc, onSnapshot, setDoc } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { UserObject } from '../types';
import { toast } from 'react-hot-toast';

const Profile: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editClass, setEditClass] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const isGoogleUser = user?.isGoogleUser === true;

  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) { navigate('/login'); return; }

      const unsubProfile = onSnapshot(doc(db, 'users', u.uid), (docObj) => {
        if (docObj.exists()) {
          const data = docObj.data() as UserObject;
          setUserProfile({ ...data, uid: docObj.id });
          if (!saving && editClass === '') {
            setEditClass(data.classLevel || '');
            setEditLocation(data.location || '');
            setEditInterests((data.preferences || []).join(', '));
          }
        } else {
          setUserProfile({ uid: u.uid, email: u.email || '', name: u.displayName || 'User', role: 'student' } as unknown as UserObject);
        }
        setLoading(false);
      }, (err) => { console.warn("Profile snapshot closed", err); setLoading(false); });

      return () => unsubProfile();
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      let newPicUrl = userProfile?.profilePic;
      if (selectedFile) {
        const reader = new FileReader();
        newPicUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const prefArray = editInterests.split(',').map(s => s.trim()).filter(s => s.length > 0);

      await setDoc(doc(db, 'users', user.uid), {
        classLevel: editClass,
        location: editLocation,
        preferences: prefArray,
        name: userProfile?.name || user.displayName || 'User',
        email: user.email,
        ...(newPicUrl && { profilePic: newPicUrl })
      }, { merge: true });

      setUserProfile(prev => prev ? { ...prev, classLevel: editClass, location: editLocation, preferences: prefArray, ...(newPicUrl && { profilePic: newPicUrl }) } : prev);
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setSelectedFile(null);
    } catch (e: any) {
      console.error("Error updating profile", e);
      toast.error(e?.message || "Failed to update profile.");
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    if (newPassword !== confirmNewPassword) { toast.error("New passwords do not match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(newPassword);
      toast.success("Password updated successfully!");
      setShowPasswordSection(false);
      setOldPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.code === 'auth/wrong-password' ? "Incorrect old password" : "Failed to update password.");
    } finally { setPasswordLoading(false); }
  };

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 16 }}>
        <div className="skeleton skeleton-title" style={{ width: 140 }} />
        <div className="skeleton skeleton-card" style={{ height: 200 }} />
        <div className="skeleton skeleton-card" style={{ height: 160 }} />
      </div>
    );
  }

  if (!userProfile) return null;

  const avatarLetter = (userProfile.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="viewport-content">
      <div className="flex" style={{ alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-sm btn-secondary flex items-center gap-2">
          Dashboard
        </button>
      </div>

      <div className="bento-card" ref={containerRef} style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ margin: 0 }}>Your Profile</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn btn-sm flex items-center gap-2">
              Edit Profile
            </button>
          ) : null}
        </div>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative" style={{ width: 80, height: 80, border: '2px solid var(--ink)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: '#fff', fontSize: '2rem' }}>
            {selectedFile ? (
              <img src={URL.createObjectURL(selectedFile)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : userProfile.profilePic ? (
              <img src={userProfile.profilePic} alt="current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{avatarLetter}</span>
            )}
            {isEditing && (
              <label className="btn btn-sm" style={{ position: 'absolute', bottom: -12, right: -12, padding: 6, cursor: 'pointer', background: 'var(--bg-surface)', border: '2px solid var(--ink)' }}>
                📷
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files && e.target.files[0]) { setSelectedFile(e.target.files[0]); setSuccessMsg(''); } }}
                />
              </label>
            )}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{userProfile.name}</h3>
            <p className="flabel">{userProfile.email || user?.email}</p>
            <span className="badge">{userProfile.role || 'student'}</span>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col" style={{ gap: 20 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">🏛 Education</label>
              {isEditing ? (
                <input className="input" type="text" value={editClass} onChange={(e) => { setEditClass(e.target.value); setSuccessMsg(''); }} placeholder="e.g. B.Tech / High School" />
              ) : (
                <p className="font-semibold">{userProfile.classLevel || <span className="flabel">Not specified</span>}</p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">📍 Location</label>
              {isEditing ? (
                <input className="input" type="text" value={editLocation} onChange={(e) => { setEditLocation(e.target.value); setSuccessMsg(''); }} placeholder="e.g. Bangalore" />
              ) : (
                <p className="font-semibold">{userProfile.location || <span className="flabel">Not specified</span>}</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">🏷 Interests & Preferences</label>
            {isEditing ? (
              <input className="input" type="text" value={editInterests} onChange={(e) => { setEditInterests(e.target.value); setSuccessMsg(''); }} placeholder="e.g. Math, Coding, Art (comma-separated)" />
            ) : (
              <div className="flex" style={{ gap: 4, flexWrap: 'wrap' }}>
                {userProfile.preferences && userProfile.preferences.length > 0 ? (
                  userProfile.preferences.map((pref, i) => <span key={i} className="badge">{pref}</span>)
                ) : (
                  <span className="flabel">No interests specified</span>
                )}
              </div>
            )}
          </div>

          {successMsg && !isEditing && (
            <div className="flex items-center gap-2" style={{ padding: 12, border: '2px solid var(--accent)', background: 'var(--accent-soft)' }}>
              <span style={{ color: 'var(--accent)' }}>✓</span>
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <div className="asc" />

        {/* Security Section */}
        <div className="bento-card-compact" style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 style={{ margin: 0 }}>Security</h4>
              <p className="flabel">{isGoogleUser ? 'Signed in with Google — password not applicable.' : 'Manage your account credentials.'}</p>
            </div>
            {!isGoogleUser && (
              <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="btn btn-sm">
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </button>
            )}
          </div>

          {showPasswordSection && (
            <form onSubmit={handleChangePassword}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Old Password</label>
                  <input className="input" type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="input" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="input" type="password" required value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={passwordLoading} className="btn btn-primary">
                {passwordLoading ? '⏳' : null}
                Update Password
              </button>
            </form>
          )}
        </div>

        {/* Actions */}
        <div className="flex" style={{ gap: 8 }}>
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); setSuccessMsg(''); }} className="btn" disabled={saving}>Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary flex items-center gap-2">
                {saving ? '⏳' : '💾'}
                Save Changes
              </button>
            </>
          ) : (
            <button onClick={handleLogout} className="btn flex items-center gap-2" style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}>
              Logout Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
