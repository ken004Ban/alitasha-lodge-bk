import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { BedDouble, MapPin, Coffee, Wifi, ArrowRight, ChevronDown } from 'lucide-react';
import { useBranch } from '../context/BranchContext';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const iconLabels: Record<string, string> = {
  BedDouble: 'Luxurious bed and accommodation',
  Coffee: 'Gourmet dining and beverages',
  Wifi: 'High-speed internet connectivity',
};

const FeatureCard = ({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  index: number;
}) => (
  <motion.div
    custom={index}
    variants={fadeUp}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-40px' }}
    whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-primary-blue/20 transition-shadow group cursor-pointer"
    title={`Learn more about ${title}`}
  >
    <div className="w-12 h-12 bg-blue-50 text-primary-blue rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-blue group-hover:text-white transition-colors" title={iconLabels[Icon.displayName ?? Icon.name] ?? title}>
      <Icon size={24} aria-hidden="true" />
    </div>
    <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 leading-relaxed mb-3">{desc}</p>
    <span className="text-xs font-medium text-primary-blue opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
      Learn more <ArrowRight size={12} aria-hidden="true" />
    </span>
  </motion.div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const { branches, branchesLoading, branchesError, setSelectedBranchId } = useBranch();

  return (
    <div>
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-slate-900">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 opacity-45">
            <img
              src="https://images.unsplash.com/photo-1566073776246-483ef60db690?auto=format&fit=crop&w=1600&q=80"
              alt="Lodge"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-primary-gold font-semibold tracking-[0.35em] uppercase text-xs mb-5 block"
          >
            Welcome
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight"
          >
            Experience the elegance of{' '}
            <span className="font-display text-5xl md:text-7xl lg:text-8xl text-primary-gold block md:inline md:ml-2 mt-2 md:mt-0">
              Alitasha
            </span>
            <span className="block text-slate-200 font-light text-2xl md:text-3xl tracking-[0.25em] uppercase mt-2">
              Lodge
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            A sanctuary of luxury and peace, blending modern comfort with the timeless beauty of nature.
            Your home away from home in the heart of Zambia.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-blue text-white rounded-full font-semibold text-lg shadow-xl"
                title="Go to booking page"
              >
                Reserve Your Stay <ArrowRight size={20} aria-hidden="true" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <a
                href="#destinations"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/95 text-slate-900 rounded-full font-semibold text-lg shadow-lg border border-white/20"
                title="Explore our branch locations"
              >
                Explore Destinations <ChevronDown size={20} aria-hidden="true" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Why stay with <span className="font-display text-primary-gold text-4xl md:text-5xl">Alitasha</span>?
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            World-class hospitality designed to rejuvenate your mind and spirit.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            index={0}
            icon={BedDouble}
            title="Luxury Rooms"
            desc="From deluxe suites to cozy doubles, every room is designed for maximum comfort."
          />
          <FeatureCard
            index={1}
            icon={Coffee}
            title="Gourmet Dining"
            desc="Savor exquisite local and international cuisine prepared by our award-winning chefs."
          />
          <FeatureCard
            index={2}
            icon={Wifi}
            title="Seamless Connectivity"
            desc="Stay connected with high-speed fiber internet across all our branches."
          />
        </div>
      </section>

      <section id="destinations" className="py-20 bg-gradient-to-b from-slate-50 to-white px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <motion.h2
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-4xl font-bold text-slate-900 mb-2"
            >
              Choose your{' '}
              <span className="font-display text-primary-gold text-5xl">destination</span>
            </motion.h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              Three distinct locations—each with its own character. Select a branch to begin your
              booking; your choice is remembered for a seamless experience.
            </p>
            {branchesError && (
              <p className="text-amber-700 text-sm mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                {branchesError} Start the backend to load live branches, or browse amenities above.
              </p>
            )}
            <div className="space-y-4">
              {branchesLoading && (
                <div className="space-y-3" aria-label="Loading branches" role="status">
                  <div className="skeleton h-16 w-full" />
                  <div className="skeleton h-16 w-full" />
                  <div className="skeleton h-16 w-full" />
                </div>
              )}
              {!branchesLoading &&
                branches.map((branch, idx) => (
                  <motion.button
                    key={branch.id}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06, duration: 0.35 }}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      setSelectedBranchId(branch.id);
                      navigate(`/booking?branch=${branch.id}`);
                    }}
                    className="w-full text-left flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-gold/60 hover:shadow-md transition-all cursor-pointer group"
                    title={`Book a room at ${branch.name}`}
                  >
                    <div className="mt-1 text-primary-blue" title={`${branch.name} location`}>
                      <MapPin size={22} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 group-hover:text-primary-blue transition-colors">
                        {branch.name}
                      </h4>
                      <p className="text-slate-500 text-sm">{branch.location}</p>
                    </div>
                    <span className="shrink-0 self-center text-xs font-semibold text-primary-gold bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-full inline-flex items-center gap-1 group-hover:bg-amber-100 transition-colors">
                      Book now <ArrowRight size={12} aria-hidden="true" />
                    </span>
                  </motion.button>
                ))}
            </div>
          </div>
          <motion.div
            className="md:w-1/2 grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="https://images.unsplash.com/photo-1582719478250-7141a6565b6c?auto=format&fit=crop&w=400&q=80"
              className="rounded-2xl shadow-lg"
              alt="Lodge interior"
            />
            <img
              src="https://images.unsplash.com/photo-1571896263585-216d58267555?auto=format&fit=crop&w=400&q=80"
              className="rounded-2xl shadow-lg lg:mt-8 max-lg:mt-0"
              alt="Resort"
            />
            <img
              src="https://images.unsplash.com/photo-1520257506278-f75b8a0b716c?auto=format&fit=crop&w=400&q=80"
              className="rounded-2xl shadow-lg lg:-mt-8 max-lg:mt-0"
              alt="Pool"
            />
            <img
              src="https://images.unsplash.com/photo-1445019422651-779d7f06669c?auto=format&fit=crop&w=400&q=80"
              className="rounded-2xl shadow-lg"
              alt="Landscape"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
