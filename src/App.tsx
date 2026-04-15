import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Eligibility from './pages/Eligibility';
import Documents from './pages/Documents';
import Profile from './pages/Profile';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/eligibility" element={<Eligibility />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
