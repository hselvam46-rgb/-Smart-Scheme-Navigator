import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { LogIn, UserPlus, ShieldCheck, Chrome } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user doc exists, if not create it
      const path = `users/${user.uid}`;
      try {
        const userDoc = await getDoc(doc(db, path));
        if (!userDoc.exists()) {
          await setDoc(doc(db, path), {
            name: user.displayName || 'User',
            email: user.email,
            createdAt: new Date().toISOString(),
            age: 0,
            income: 0,
            category: 'General',
            location: '',
            education: ''
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Initialize user doc
        const path = `users/${userCredential.user.uid}`;
        try {
          await setDoc(doc(db, path), {
            name,
            email,
            createdAt: new Date().toISOString(),
            age: 0,
            income: 0,
            category: 'General',
            location: '',
            education: ''
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Smart Scheme Navigator</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {isLogin ? 'Welcome back! Please login' : 'Create an account to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 px-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 px-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 px-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-medium border border-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Login' : 'Sign Up'}
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-on-surface-variant font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-on-surface font-bold py-4 rounded-xl border border-outline-variant hover:bg-surface transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Chrome size={20} />
            Google
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold text-sm hover:underline"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
