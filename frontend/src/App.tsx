import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, MapPin, ArrowRight, Shield } from 'lucide-react';
import HomePage from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import BookingPage from './pages/BookingPage';
import useVisitorTracker from './hooks/useVisitorTracker';
import { useBranch } from './context/BranchContext';

function VisitorTracker() {
  useVisitorTracker();
  return null;
}

function BranchNavSelect() {
  const { branches, selectedBranchId, setSelectedBranchId, branchesLoading } = useBranch();

  return (
    <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5" title="Filter by branch">
      <MapPin size={16} className="text-primary-blue shrink-0" aria-hidden="true" />
      <select
        className="bg-transparent text-sm font-medium text-slate-700 outline-none max-w-[10rem] md:max-w-[14rem] cursor-pointer"
        value={selectedBranchId ?? ''}
        disabled={branchesLoading}
        onChange={(e) => setSelectedBranchId(e.target.value || null)}
        aria-label="Filter by branch"
      >
        <option value="">All branches</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}

const App = () => {
  return (
    <Router>
      <VisitorTracker />
      <div className="min-h-screen flex flex-col">
        <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200 px-4 md:px-6 py-3 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-50">
          <Link to="/" className="flex items-baseline gap-2 shrink-0" title="Home — Alitasha Lodge">
            <span className="font-display text-3xl md:text-4xl text-primary-gold leading-none drop-shadow-sm">
              Alitasha
            </span>
            <span className="text-slate-600 font-light tracking-[0.2em] text-xs md:text-sm uppercase">
              Lodge
            </span>
          </Link>

          <div className="flex items-center gap-3 md:gap-6 flex-wrap justify-end">
            <BranchNavSelect />
            <Link
              to="/"
              className="text-slate-600 hover:text-primary-blue font-medium transition-colors text-sm md:text-base"
              title="Home page"
            >
              Home
            </Link>
            <Link
              to="/booking"
              className="bg-primary-blue text-white px-4 py-2 rounded-full text-sm font-semibold hover:opacity-95 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-1.5"
              title="Start a new booking"
            >
              Book Now <ArrowRight size={16} className="hidden sm:inline" aria-hidden="true" />
            </Link>
            <Link
              to="/admin"
              className="p-1.5 pr-3 rounded-full bg-slate-100 text-slate-500 hover:text-primary-blue hover:bg-blue-50 transition-all inline-flex items-center gap-1.5"
              aria-label="Admin dashboard"
              title="Admin dashboard & analytics"
            >
              <LayoutDashboard size={18} aria-hidden="true" />
              <span className="text-xs font-semibold hidden sm:inline">Admin</span>
            </Link>
          </div>
        </nav>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>

        <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-center border-t border-slate-800">
          <p className="flex flex-wrap items-baseline justify-center gap-2 text-slate-300">
            <span className="font-display text-3xl text-primary-gold">Alitasha</span>
            <span className="text-sm tracking-widest uppercase text-slate-500">Lodge</span>
          </p>
          <p className="mt-3 text-sm">&copy; 2026 Alitasha Lodge Smart Systems. All Rights Reserved.</p>
          <p className="text-xs mt-2 text-slate-500">Designed for high-performance hospitality management.</p>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-blue-900/50 text-blue-300 text-[10px] font-mono px-3 py-1 rounded-full border border-blue-800">
            <Shield size={10} aria-hidden="true" /> Demo Mode
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
