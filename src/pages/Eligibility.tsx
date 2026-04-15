import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { generateEligibilityExplanation } from '../services/aiService';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const Eligibility = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    income: '',
    category: 'General',
    location: '',
    education: 'High School'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const categories = ['General', 'OBC', 'SC', 'ST', 'EWS'];
  const educationLevels = ['High School', 'Undergraduate', 'Postgraduate', 'Diploma'];

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Call Backend for Rule-based logic
      const response = await fetch('/api/eligibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: Number(formData.age),
          income: Number(formData.income),
          category: formData.category,
          education: formData.education
        })
      });
      
      const data = await response.json();
      const firstResult = data.results[0]; // Just take the first scheme for demo

      // 2. Call Gemini for AI Explanation
      const aiExplanation = await generateEligibilityExplanation(
        firstResult.schemeName,
        formData,
        firstResult.isEligible
      );

      const finalResult = {
        ...firstResult,
        ...aiExplanation,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid
      };

      // 3. Save to Firestore
      if (auth.currentUser) {
        const path = `users/${auth.currentUser.uid}/eligibilityResults`;
        try {
          await addDoc(collection(db, path), finalResult);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }

      setResult({ ...finalResult, timestamp: new Date().toISOString() }); // For UI display
      setStep(3);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Eligibility Check</h1>
        <p className="text-on-surface-variant mt-1">Answer a few questions to find matching schemes.</p>
      </header>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="e.g. 21"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">Annual Income (₹)</label>
                  <input
                    type="number"
                    value={formData.income}
                    onChange={(e) => setFormData({...formData, income: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="e.g. 300000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFormData({...formData, category: cat})}
                      className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
                        formData.category === cat 
                          ? 'bg-primary text-white border-primary shadow-sm' 
                          : 'bg-surface text-on-surface-variant border-outline-variant hover:border-primary/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">Highest Education</label>
                <select
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface"
                >
                  {educationLevels.map(edu => (
                    <option key={edu} value={edu}>{edu}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Next Step <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">Location (City/District)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. Chennai"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <Info size={20} className="text-primary shrink-0" />
                <p className="text-xs text-primary/80 leading-relaxed font-medium">
                  We use your location to find regional schemes specific to your state or district.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-surface text-on-surface-variant font-bold py-4 rounded-xl border border-outline-variant hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} /> Back
                </button>
                <button
                  onClick={handleCheck}
                  disabled={loading}
                  className="flex-[2] bg-primary text-white font-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  ) : (
                    <>Check Eligibility <ClipboardCheck size={20} /></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className={`p-8 rounded-3xl border shadow-sm ${
              result.isEligible ? 'bg-green-50 border-green-100' : 'bg-rose-50 border-rose-100'
            }`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  result.isEligible ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {result.isEligible ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                </div>
                <div>
                  <h2 className={`text-2xl font-black ${
                    result.isEligible ? 'text-green-800' : 'text-rose-800'
                  }`}>
                    {result.isEligible ? 'Eligible!' : 'Not Eligible'}
                  </h2>
                  <p className="text-on-surface-variant font-medium">{result.schemeName}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Sparkles size={18} />
                    <h4 className="font-bold text-xs uppercase tracking-widest">AI Explanation</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface">{result.explanationEn}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-sm">
                  <p className="text-sm leading-relaxed text-on-surface font-medium">{result.explanationTa}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setStep(1); setResult(null); }}
              className="w-full bg-on-surface text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all"
            >
              Check Another Scheme
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Eligibility;
