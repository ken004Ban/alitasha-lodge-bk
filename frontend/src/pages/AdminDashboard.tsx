import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Target,
  BarChart3,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  MapPin,
  Plus,
  Home,
  Lightbulb,
  TrendingUp,
  Globe,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import axios from 'axios';
import { useBranch } from '../context/BranchContext';

const COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

type Overview = {
  totalVisitors: number;
  totalBookings: number;
  conversionRate: string;
  branchBookings: number;
};

type BranchRow = { name: string; bookings: number };
type LocationRow = { name: string; value: number };

type RoomInfo = {
  room_number: string;
  room_type: string;
  price_per_night: number;
};

type Booking = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  branch_id: string;
  created_at: string;
  rooms: RoomInfo | null;
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const sidebarItems = [
  { icon: BarChart3, label: 'Analytics overview', key: 'analytics' },
  { icon: Users, label: 'Customer list', key: 'customers' },
  { icon: TrendingUp, label: 'Conversion tracking', key: 'conversion' },
  { icon: Settings, label: 'Branch settings', key: 'settings' },
] as const;

type ViewKey = (typeof sidebarItems)[number]['key'];

const AdminDashboard = () => {
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
  const [view, setView] = useState<ViewKey>('analytics');
  const [activeBranchId, setActiveBranchId] = useState('');

  useEffect(() => {
    setActiveBranchId(selectedBranchId ?? '');
  }, [selectedBranchId]);

  const [overview, setOverview] = useState<Overview>({
    totalVisitors: 0,
    totalBookings: 0,
    conversionRate: '0%',
    branchBookings: 0,
  });
  const [branchData, setBranchData] = useState<BranchRow[]>([]);
  const [locationData, setLocationData] = useState<LocationRow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError('');
      const q = activeBranchId ? `?branch_id=${activeBranchId}` : '';
      try {
        const [overviewRes, performanceRes, locationRes] = await Promise.all([
          axios.get<Overview>(`http://localhost:5000/api/analytics/overview${q}`),
          axios.get<BranchRow[]>(`http://localhost:5000/api/analytics/branch-performance${q}`),
          axios.get<LocationRow[]>(`http://localhost:5000/api/analytics/visitor-locations${q}`),
        ]);
        setOverview(overviewRes.data);
        setBranchData(performanceRes.data);
        setLocationData(locationRes.data);
      } catch (err) {
        setError('Could not load analytics. Make sure the backend server is running.');
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    void loadDashboardData();
  }, [activeBranchId]);

  useEffect(() => {
    if (view !== 'customers') return;
    const loadBookings = async () => {
      setBookingsLoading(true);
      try {
        const q = activeBranchId ? `?branch_id=${activeBranchId}&limit=50` : '?limit=50';
        const res = await axios.get<Booking[]>(`http://localhost:5000/api/bookings${q}`);
        setBookings(res.data);
      } catch {
        setBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };
    void loadBookings();
  }, [view, activeBranchId]);

  const activeBranchName = branches.find((b) => b.id === activeBranchId)?.name;

  const onBranchFilterChange = (value: string) => {
    setActiveBranchId(value);
    setSelectedBranchId(value || null);
  };

  const trendingBranch = branchData.length > 0
    ? [...branchData].sort((a, b) => b.bookings - a.bookings)[0].name
    : null;

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/bookings/${id}`, { status });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch {
      alert('Failed to update booking status.');
    }
  };

  const toggleBranchBookings = async (id: string, accepting: boolean) => {
    try {
      await axios.patch(`http://localhost:5000/api/branches/${id}`, { accepting_bookings: accepting });
      window.location.reload();
    } catch {
      alert('Failed to update branch settings.');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'confirmed') return <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle size={12} /> Confirmed</span>;
    if (status === 'pending') return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><Clock size={12} /> Pending</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><XCircle size={12} /> Cancelled</span>;
  };

  const viewTitle = view === 'analytics' ? 'Business Intelligence'
    : view === 'customers' ? 'Customer List'
    : view === 'conversion' ? 'Conversion Tracking'
    : 'Branch Settings';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col p-6" aria-label="Admin sidebar">
        <Link to="/" className="flex items-center gap-3 mb-8 hover:opacity-90 transition-opacity" title="Back to homepage">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutDashboard size={20} aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <span className="font-display text-2xl text-primary-gold block">Alitasha</span>
            <span className="text-xs uppercase tracking-widest text-slate-400">Admin</span>
          </div>
        </Link>

        <nav className="space-y-1 flex-grow" aria-label="Main navigation">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 mt-2 px-1">
            Main menu
          </div>
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              title={item.label}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all w-full text-left ${
                view === item.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} aria-hidden="true" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="space-y-3 mt-4">
          <Link
            to="/booking"
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-gold/90 hover:bg-primary-gold text-slate-900 font-bold rounded-xl transition-all text-sm"
            title="Create a new booking"
          >
            <Plus size={16} aria-hidden="true" /> New Booking
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all text-xs"
            title="Return to homepage"
          >
            <Home size={14} aria-hidden="true" /> Back to site
          </Link>
        </div>

        <div className="mt-4 p-4 bg-slate-800 rounded-2xl text-center border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1.5">
            <Lightbulb size={12} className="text-primary-gold" aria-hidden="true" /> Demo mode
          </p>
          <p className="text-[10px] text-slate-500">Data refreshes when branch filter changes.</p>
        </div>
      </aside>

      <main className="flex-grow p-6 lg:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{viewTitle}</h1>
            <p className="text-slate-500">
              {view === 'analytics' && 'Real-time insights for Alitasha Lodge branches.'}
              {view === 'customers' && 'Browse and manage guest bookings.'}
              {view === 'conversion' && 'Track how visitors become guests.'}
              {view === 'settings' && 'Manage your branch locations and details.'}
            </p>
            {activeBranchId && activeBranchName && (
              <p className="text-sm font-medium text-primary-blue mt-2">
                Viewing: <span className="font-semibold">{activeBranchName}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200" title="Filter dashboard by branch">
            <MapPin size={18} className="text-slate-400 ml-2 shrink-0" aria-hidden="true" />
            <select
              className="bg-transparent outline-none text-sm font-medium pr-4 max-w-[12rem]"
              value={activeBranchId}
              onChange={(e) => onBranchFilterChange(e.target.value)}
              aria-label="Filter by branch"
            >
              <option value="">All branches (global)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {view === 'analytics' && (loading ? (
          <div className="space-y-8" aria-label="Loading dashboard" role="status">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-32 w-full rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="skeleton h-[400px] w-full rounded-3xl" />
              <div className="skeleton h-[400px] w-full rounded-3xl" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md">
              <BarChart3 size={40} className="text-amber-400 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900 mb-2">Dashboard unavailable</h2>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:opacity-95 transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard
                index={0}
                title="Total visitors"
                value={overview.totalVisitors}
                icon={<Users />}
                trend="+12.5%"
                trendUp
                tooltip="Unique page visits across all branches"
              />
              <KpiCard
                index={1}
                title="Total bookings"
                value={overview.totalBookings}
                icon={<Target />}
                trend="+5.2%"
                trendUp
                tooltip="Total confirmed room bookings"
              />
              <KpiCard
                index={2}
                title="Conversion rate"
                value={overview.conversionRate}
                icon={<BarChart3 />}
                trend="-1.1%"
                trendUp={false}
                tooltip="Percentage of visitors who booked"
              />
              <KpiCard
                index={3}
                title={activeBranchId ? 'Branch bookings' : 'Branch bookings'}
                value={activeBranchId ? overview.branchBookings : '—'}
                icon={<MapPin />}
                trend={activeBranchId ? 'Filtered' : 'Select branch'}
                trendUp
                tooltip={activeBranchId ? `Bookings for ${activeBranchName}` : 'Select a branch to see scoped data'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <ChartContainer title="Branch performance (bookings)">
                  {branchData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={branchData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="bookings" fill="#1e3a8a" radius={[4, 4, 0, 0]} aria-label="Bookings per branch" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                      No booking data available for this view.
                    </div>
                  )}
                </ChartContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
              >
                <ChartContainer title="Visitor distribution by country">
                  {locationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={locationData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                        >
                          {locationData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                      No visitor location data available.
                    </div>
                  )}
                </ChartContainer>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-blue-500/20 p-1.5 rounded-lg text-blue-300">
                    <Lightbulb size={18} aria-hidden="true" />
                  </span>
                  Smart insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InsightBox
                    title="Trending branch"
                    icon={<TrendingUp size={14} aria-hidden="true" />}
                    message={
                      trendingBranch
                        ? `The ${trendingBranch} branch is performing best in this view.`
                        : 'Calculating trends…'
                    }
                  />
                  <InsightBox
                    title="Conversion"
                    icon={<Target size={14} aria-hidden="true" />}
                    message={`Current conversion is ${overview.conversionRate}. Consider targeted promotions for deluxe rooms.`}
                  />
                  <InsightBox
                    title="User behavior"
                    icon={<Globe size={14} aria-hidden="true" />}
                    message="Guests from Zambia show strong engagement with the Book Now flow across branches."
                  />
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-800 rounded-full opacity-50 blur-3xl" />
            </motion.div>
          </div>
        ))}

        {view === 'customers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">All Bookings</h3>
                <span className="text-xs text-slate-400">{bookings.length} records</span>
              </div>
              {bookingsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}
                </div>
              ) : bookings.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">No bookings found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="text-left px-6 py-4 font-medium">Guest</th>
                        <th className="text-left px-6 py-4 font-medium hidden md:table-cell">Room</th>
                        <th className="text-left px-6 py-4 font-medium hidden lg:table-cell">Contact</th>
                        <th className="text-left px-6 py-4 font-medium hidden lg:table-cell">Dates</th>
                        <th className="text-left px-6 py-4 font-medium">Status</th>
                        <th className="text-right px-6 py-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-blue/10 text-primary-blue flex items-center justify-center text-xs font-bold shrink-0">
                                {b.customer_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{b.customer_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            {b.rooms ? (
                              <div className="text-xs space-y-0.5">
                                <span className="font-mono font-bold text-slate-800">Rm {b.rooms.room_number}</span>
                                <p className="text-slate-500">{b.rooms.room_type}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <div className="text-slate-500 text-xs space-y-1">
                              <span className="flex items-center gap-1"><Mail size={11} /> {b.customer_email}</span>
                              <span className="flex items-center gap-1"><Phone size={11} /> {b.customer_phone}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <div className="text-xs text-slate-500 space-y-1">
                              <span className="flex items-center gap-1"><Calendar size={11} /> {b.check_in_date} → {b.check_out_date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{statusBadge(b.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {b.status !== 'confirmed' && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, 'confirmed')}
                                  className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-all"
                                  title="Confirm booking"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              {b.status !== 'cancelled' && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, 'cancelled')}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                                  title="Cancel booking"
                                >
                                  <XCircle size={15} />
                                </button>
                              )}
                              {b.status !== 'pending' && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, 'pending')}
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-all"
                                  title="Mark as pending"
                                >
                                  <Clock size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-800 mb-1">🛏️ Room Blocking</p>
              <p>Use the status actions (✓ / ✗ / ⏳) to manage bookings. Cancelled bookings free up the room for other guests. Go to <button onClick={() => setView('settings')} className="text-primary-blue font-medium hover:underline">Branch Settings</button> to toggle whether a branch accepts new bookings entirely.</p>
            </div>
          </div>
        )}

        {view === 'conversion' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiCard index={0} title="Total Visitors" value={overview.totalVisitors} icon={<Users />} trend="—" trendUp tooltip="All page visits" />
              <KpiCard index={1} title="Total Bookings" value={overview.totalBookings} icon={<Target />} trend="—" trendUp tooltip="Completed bookings" />
              <KpiCard index={2} title="Conversion Rate" value={overview.conversionRate} icon={<TrendingUp />} trend="—" trendUp tooltip="Visitors → Bookings" />
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Conversion Funnel</h3>
              <div className="space-y-4">
                <FunnelStep label="Website Visitors" value={overview.totalVisitors} pct={100} color="bg-blue-900" />
                <FunnelStep label="Visitors Who Browsed Rooms" value={Math.round(overview.totalVisitors * 0.65)} pct={65} color="bg-blue-700" />
                <FunnelStep label="Started Booking" value={Math.round(overview.totalBookings * 1.8)} pct={Math.round(overview.totalBookings * 1.8 / Math.max(overview.totalVisitors, 1) * 100)} color="bg-blue-500" />
                <FunnelStep label="Completed Booking" value={overview.totalBookings} pct={parseFloat(overview.conversionRate)} color="bg-green-500" />
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Branch Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {branches.map((branch, i) => (
                  <motion.div
                    key={branch.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      activeBranchId === branch.id
                        ? 'border-primary-blue bg-blue-50'
                        : 'border-slate-200 hover:border-primary-blue/40'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-blue-100 text-primary-blue rounded-xl flex items-center justify-center">
                        <MapPin size={20} />
                      </div>
                      <div className="flex items-center gap-2">
                        {activeBranchId === branch.id && (
                          <span className="text-[10px] font-bold text-primary-blue bg-blue-100 px-2 py-1 rounded-full">Active</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          (branch as any).accepting_bookings !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {(branch as any).accepting_bookings !== false ? 'Open' : 'Blocked'}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1">{branch.name}</h4>
                    <p className="text-sm text-slate-500 mb-4">{branch.location}</p>

                    <div className="space-y-2">
                      <button
                        onClick={() => onBranchFilterChange(branch.id)}
                        className="w-full py-2 text-xs font-semibold bg-slate-100 text-slate-600 rounded-xl hover:bg-primary-blue hover:text-white transition-all"
                      >
                        Filter dashboard
                      </button>
                      <button
                        onClick={() => toggleBranchBookings(branch.id, (branch as any).accepting_bookings === false)}
                        className={`w-full py-2 text-xs font-semibold rounded-xl transition-all ${
                          (branch as any).accepting_bookings !== false
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {(branch as any).accepting_bookings !== false ? '🔴 Block bookings' : '🟢 Accept bookings'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-800 mb-1">⚙️ How room blocking works</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><strong>Block bookings</strong> — stops the branch from accepting new reservations on the booking page.</li>
                <li><strong>Individual room blocking</strong> — cancel a booking in the Customer List view to free up that room.</li>
                <li>When a branch is blocked, guests will see a notice that the branch is not currently accepting bookings.</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const KpiCard = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  index,
  tooltip,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend: string;
  trendUp: boolean;
  index: number;
  tooltip?: string;
}) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="show"
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-blue/20 transition-all cursor-default"
    title={tooltip ?? title}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-100 text-slate-600 rounded-lg" aria-label={title}>
        {icon}
      </div>
      <div
        className={`flex items-center gap-1 text-xs font-bold ${
          trendUp ? 'text-green-600' : 'text-red-600'
        }`}
        title={`Trend: ${trend}`}
      >
        {trendUp ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
        <span>{trend}</span>
      </div>
    </div>
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
  </motion.div>
);

const ChartContainer = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-full">
    <h3 className="text-lg font-bold text-slate-900 mb-6">{title}</h3>
    {children}
  </div>
);

const InsightBox = ({ title, message, icon }: { title: string; message: string; icon?: ReactNode }) => (
  <div className="bg-blue-800/50 backdrop-blur-sm p-5 rounded-2xl border border-blue-700 hover:bg-blue-800/70 transition-colors cursor-default">
    <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
      {icon} {title}
    </p>
    <p className="text-white text-sm leading-relaxed">{message}</p>
  </div>
);

const FunnelStep = ({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-500">{value.toLocaleString()} ({pct}%)</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  </div>
);

export default AdminDashboard;
