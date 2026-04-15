import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ClipboardCheck, 
  Files, 
  User, 
  LogOut, 
  Bell,
  Menu,
  X
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/eligibility', icon: ClipboardCheck, label: 'Eligibility' },
    { path: '/documents', icon: Files, label: 'Documents' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-outline-variant fixed h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary tracking-tight">Scheme Navigator</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
                location.pathname === item.path
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-outline-variant">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-on-surface-variant hover:bg-rose-50 hover:text-rose-600 transition-all font-semibold text-sm"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-24 lg:pb-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-30 px-6 py-4 flex justify-between items-center lg:hidden">
          <h1 className="text-lg font-bold text-primary">Scheme Navigator</h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant px-4 py-3 flex justify-around items-center z-40 shadow-lg">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 ${
              location.pathname === item.path ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
