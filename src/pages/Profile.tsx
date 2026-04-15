import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Mail, Calendar, Wallet, MapPin, GraduationCap, Save } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const path = `users/${auth.currentUser.uid}`;
      try {
        const docRef = doc(db, path);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProfile(snap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    setSuccess(false);

    const path = `users/${auth.currentUser.uid}`;
    try {
      await updateDoc(doc(db, path), profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-6">
    <div className="h-40 bg-white rounded-3xl border border-outline-variant" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-outline-variant" />)}
    </div>
  </div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">User Profile</h1>
        <p className="text-on-surface-variant mt-1">Manage your personal information and preferences.</p>
      </header>

      <form onSubmit={handleUpdate} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <User size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface">{profile.name}</h3>
              <p className="text-on-surface-variant flex items-center gap-2 text-sm">
                <Mail size={14} /> {profile.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileInput 
              icon={<Calendar size={18} />} 
              label="Age" 
              type="number"
              value={profile.age}
              onChange={(val: any) => setProfile({...profile, age: Number(val)})}
            />
            <ProfileInput 
              icon={<Wallet size={18} />} 
              label="Annual Income (₹)" 
              type="number"
              value={profile.income}
              onChange={(val: any) => setProfile({...profile, income: Number(val)})}
            />
            <ProfileInput 
              icon={<MapPin size={18} />} 
              label="Location" 
              type="text"
              value={profile.location}
              onChange={(val: any) => setProfile({...profile, location: val})}
            />
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">Category</label>
              <select
                value={profile.category}
                onChange={(e) => setProfile({...profile, category: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface"
              >
                {['General', 'OBC', 'SC', 'ST', 'EWS'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {success && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-green-600 text-sm font-bold flex items-center gap-1"
              >
                <Save size={16} /> Profile updated successfully!
              </motion.span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              <>Save Changes <Save size={20} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const ProfileInput = ({ icon, label, type, value, onChange }: any) => (
  <div>
    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface"
      />
    </div>
  </div>
);

export default Profile;
