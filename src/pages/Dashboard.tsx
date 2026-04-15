import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  TrendingUp,
  FileText,
  Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0 });
  const [recentResult, setRecentResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      const userId = auth.currentUser.uid;
      
      try {
        // Fetch documents stats
        const docsPath = `users/${userId}/documents`;
        const docsSnap = await getDocs(collection(db, docsPath));
        const docs = docsSnap.docs.map(d => d.data());
        
        setStats({
          total: docs.length,
          verified: docs.filter(d => d.status === 'verified').length,
          pending: docs.filter(d => d.status === 'pending').length
        });

        // Fetch recent eligibility result
        const resultsPath = `users/${userId}/eligibilityResults`;
        const q = query(collection(db, resultsPath), orderBy('timestamp', 'desc'), limit(1));
        const resultsSnap = await getDocs(q);
        if (!resultsSnap.empty) {
          setRecentResult(resultsSnap.docs[0].data());
        }
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        // We don't necessarily want to crash the whole dashboard if one part fails, 
        // but we should log it.
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-white rounded-3xl border border-outline-variant" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-3xl border border-outline-variant" />)}
    </div>
  </div>;

  const progress = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Welcome back, {auth.currentUser?.displayName}</h1>
        <p className="text-on-surface-variant mt-1">Here's an overview of your application status.</p>
      </header>

      {/* Progress Overview */}
      <section className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-surface"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={364}
              initial={{ strokeDashoffset: 364 }}
              animate={{ strokeDashoffset: 364 - (364 * progress) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="text-primary"
            />
          </svg>
          <span className="absolute text-2xl font-black text-on-surface">{progress}%</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-on-surface">Document Verification Progress</h3>
          <p className="text-on-surface-variant mt-2 max-w-md">
            You have verified {stats.verified} out of {stats.total} required documents. 
            Complete the remaining {stats.pending} to finalize your application.
          </p>
          <Link to="/documents" className="inline-flex items-center gap-2 text-primary font-bold mt-4 hover:underline">
            Manage Documents <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<CheckCircle2 className="text-green-600" />} 
          label="Verified" 
          value={stats.verified} 
          color="bg-green-50" 
        />
        <StatCard 
          icon={<AlertCircle className="text-rose-600" />} 
          label="Action Required" 
          value={stats.pending} 
          color="bg-rose-50" 
        />
        <StatCard 
          icon={<Clock className="text-primary" />} 
          label="Total Documents" 
          value={stats.total} 
          color="bg-blue-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Result */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-on-surface px-1">Recent Eligibility Check</h2>
          {recentResult ? (
            <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{recentResult.schemeName || 'General Scheme'}</h3>
                  <p className="text-xs text-on-surface-variant">{new Date(recentResult.timestamp).toLocaleDateString()}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  recentResult.result === 'Eligible' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {recentResult.result}
                </span>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-surface rounded-2xl border border-outline-variant/50">
                  <p className="text-sm leading-relaxed">{recentResult.explanationEn}</p>
                </div>
                <div className="p-4 bg-surface rounded-2xl border border-outline-variant/50">
                  <p className="text-sm leading-relaxed font-medium text-on-surface/80">{recentResult.explanationTa}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-outline-variant text-center">
              <TrendingUp size={48} className="mx-auto text-on-surface-variant/30 mb-4" />
              <p className="text-on-surface-variant font-medium">No checks performed yet.</p>
              <Link to="/eligibility" className="text-primary font-bold mt-2 inline-block hover:underline">
                Check Eligibility Now
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <div className="bg-primary text-white p-6 rounded-3xl shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={20} className="text-white/70" />
              <h3 className="font-bold text-sm uppercase tracking-widest">Quick Tip</h3>
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              Always keep your income certificate updated. Most schemes require a certificate issued within the last 6 months.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm">
            <h3 className="font-bold text-on-surface mb-2">Need Assistance?</h3>
            <p className="text-sm text-on-surface-variant mb-6">Our support team can help you with document verification.</p>
            <button className="w-full bg-on-surface text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <FileText size={18} />
              View Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm flex items-center gap-4">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-on-surface">{value}</p>
    </div>
  </div>
);

export default Dashboard;
