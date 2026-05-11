import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Mail, Phone, BedDouble, CheckCircle, MapPin, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import axios from 'axios';
import { useBranch } from '../context/BranchContext';

type Room = {
  id: string;
  branch_id: string;
  room_number: string;
  room_type: string;
  price_per_night: number;
};

const emptyForm = {
  branch_id: '',
  room_id: '',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  check_in_date: '',
  check_out_date: '',
};

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const { selectedBranchId, setSelectedBranchId, branches } = useBranch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ ...emptyForm });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const branchParam = searchParams.get('branch');

  useEffect(() => {
    if (!branchParam) return;
    setFormData((prev) => ({
      ...prev,
      branch_id: branchParam,
      room_id: prev.branch_id === branchParam ? prev.room_id : '',
    }));
    setSelectedBranchId(branchParam);
  }, [branchParam, setSelectedBranchId]);

  useEffect(() => {
    if (branchParam || step !== 1 || !selectedBranchId) return;
    setFormData((prev) => ({
      ...prev,
      branch_id: selectedBranchId,
      room_id: '',
    }));
  }, [branchParam, selectedBranchId, step]);

  useEffect(() => {
    if (formData.branch_id) {
      setRoomsLoading(true);
      axios
        .get<Room[]>(`http://localhost:5000/api/rooms?branch_id=${formData.branch_id}`)
        .then((res) => setRooms(res.data))
        .catch(() => setRooms([]))
        .finally(() => setRoomsLoading(false));
    } else {
      setRooms([]);
    }
  }, [formData.branch_id]);

  const selectedBranch = branches.find((b) => b.id === formData.branch_id);

  const selectBranch = (id: string) => {
    setFormData((prev) => ({ ...prev, branch_id: id, room_id: '' }));
    setSelectedBranchId(id);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/bookings', formData);
      setStep(3);
    } catch {
      setError('Booking failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Select Location', 'Guest Details', 'Confirmation'];

  return (
    <div className="py-16 md:py-20 px-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Book your stay at{' '}
          <span className="font-display text-primary-gold text-4xl md:text-5xl">Alitasha</span>
        </h1>
        <p className="text-slate-500">Luxury details, tailored to your chosen branch.</p>
      </motion.div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100" role="tablist" aria-label="Booking steps">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              role="tab"
              aria-selected={step === i}
              aria-label={`Step ${i}: ${stepLabels[i - 1]}`}
              className={`flex-1 py-4 text-center text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                step === i
                  ? 'bg-blue-50 text-primary-blue border-b-2 border-primary-blue'
                  : 'text-slate-400'
              }`}
            >
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                step === i ? 'bg-primary-blue text-white' : 'bg-slate-200 text-slate-500'
              }`} aria-hidden="true">
                {i}
              </span>
              <span className="hidden sm:inline">{stepLabels[i - 1]}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleBooking} className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.28 }}
                className="space-y-6"
              >
                <label className="block text-sm font-semibold text-slate-700">
                  Select a branch to begin
                </label>
                <div className="grid grid-cols-1 gap-4">
                  {branches.map((branch) => {
                    const blocked = branch.accepting_bookings === false;
                    return (
                    <motion.button
                      key={branch.id}
                      type="button"
                      whileHover={blocked ? {} : { scale: 1.01 }}
                      whileTap={blocked ? {} : { scale: 0.99 }}
                      onClick={() => !blocked && selectBranch(branch.id)}
                      title={blocked ? `${branch.name} is not accepting bookings` : `Select ${branch.name} — ${branch.location}`}
                      className={`p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center w-full ${
                        blocked
                          ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                          : formData.branch_id === branch.id
                            ? 'border-primary-blue bg-blue-50 ring-2 ring-blue-200'
                            : 'border-slate-200 hover:border-primary-blue/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin size={20} className={`mt-0.5 shrink-0 ${blocked ? 'text-slate-400' : 'text-primary-blue'}`} aria-hidden="true" />
                        <div>
                          <p className="font-bold text-slate-800">{branch.name}</p>
                          <p className="text-xs text-slate-500">{branch.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {blocked ? (
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                            Not available
                          </span>
                        ) : formData.branch_id === branch.id ? (
                          <span className="text-xs font-semibold text-primary-blue bg-blue-100 px-3 py-1 rounded-full">
                            Selected
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 group-hover:text-primary-blue transition-colors">
                            Select
                          </span>
                        )}
                        <CheckCircle
                          size={20}
                          className={formData.branch_id === branch.id && !blocked ? 'text-primary-blue' : 'text-transparent'}
                          aria-hidden="true"
                        />
                      </div>
                    </motion.button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={!formData.branch_id}
                  onClick={() => setStep(2)}
                  title={formData.branch_id ? `Continue to guest details for ${selectedBranch?.name}` : 'Please select a branch first'}
                  className="w-full py-4 bg-primary-blue text-white rounded-xl font-bold disabled:bg-slate-300 disabled:text-slate-500 transition-all hover:opacity-95 inline-flex items-center justify-center gap-2"
                >
                  Next: Guest Details <ArrowRight size={18} aria-hidden="true" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28 }}
                className="space-y-6"
              >
                {selectedBranch && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                    <MapPin size={18} className="text-primary-blue shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selectedBranch.name}</p>
                      <p className="text-xs text-slate-500">{selectedBranch.location}</p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-primary-blue font-medium hover:underline">
                      Change
                    </button>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4" role="alert">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2" title="Your full name">
                      <User size={16} aria-hidden="true" /> Full name
                    </label>
                    <input
                      required
                      className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-blue outline-none"
                      placeholder="John Doe"
                      value={formData.customer_name}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2" title="Email address for confirmation">
                      <Mail size={16} aria-hidden="true" /> Email
                    </label>
                    <input
                      required
                      type="email"
                      className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-blue outline-none"
                      placeholder="john@example.com"
                      value={formData.customer_email}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2" title="Phone number with country code">
                      <Phone size={16} aria-hidden="true" /> Phone
                    </label>
                    <input
                      required
                      className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-blue outline-none"
                      placeholder="+260 …"
                      value={formData.customer_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2" title="Choose room type">
                      <BedDouble size={16} aria-hidden="true" /> Room type
                    </label>
                    {roomsLoading ? (
                      <div className="skeleton h-[50px] w-full" />
                    ) : (
                      <select
                        required
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-blue outline-none"
                        value={formData.room_id}
                        onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                      >
                        <option value="">Select a room</option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.room_type} (Rm {room.room_number}) — K{room.price_per_night}/night
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2" title="Check-in date">
                      <Calendar size={16} aria-hidden="true" /> Check-in
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-blue outline-none"
                      value={formData.check_in_date}
                      onChange={(e) =>
                        setFormData({ ...formData, check_in_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2" title="Check-out date">
                      <Calendar size={16} aria-hidden="true" /> Check-out
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-blue outline-none"
                      value={formData.check_out_date}
                      onChange={(e) =>
                        setFormData({ ...formData, check_out_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all inline-flex items-center justify-center gap-2"
                    title="Go back to branch selection"
                  >
                    <ArrowLeft size={18} aria-hidden="true" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-4 bg-primary-blue text-white rounded-xl font-bold hover:opacity-95 transition-all shadow-lg disabled:opacity-60 inline-flex items-center justify-center gap-2"
                    title="Confirm your booking"
                  >
                    {loading ? (
                      <>Processing&hellip;</>
                    ) : (
                      <><CheckCircle size={18} aria-hidden="true" /> Confirm booking</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32 }}
                className="text-center py-10"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle size={40} aria-hidden="true" />
                </motion.div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Booking confirmed
                </h2>
                <p className="text-slate-500 mb-2">
                  Thank you for choosing{' '}
                  <span className="font-display text-primary-gold text-2xl">Alitasha</span>.
                </p>
                <p className="text-slate-400 text-sm mb-8">
                  A confirmation will be sent to{' '}
                  <span className="font-medium text-slate-600">{formData.customer_email}</span>.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setFormData({ ...emptyForm });
                    }}
                    className="px-8 py-3 bg-primary-blue text-white rounded-xl font-bold hover:opacity-95 transition-all inline-flex items-center gap-2"
                    title="Make another booking"
                  >
                    <CheckCircle size={18} aria-hidden="true" /> New booking
                  </button>
                  <Link
                    to="/"
                    className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all inline-flex items-center gap-2"
                    title="Return to homepage"
                  >
                    <Home size={18} aria-hidden="true" /> Back to Home
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;
