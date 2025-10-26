import Spline from '@splinetool/react-spline';
import { motion } from 'framer-motion';

export default function HeroCover({ onCTA }) {
  return (
    <section className="relative h-[60vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/IKzHtP5ThSO83edK/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/40 to-slate-950 pointer-events-none" />
      <div className="relative z-10 h-full max-w-7xl mx-auto flex items-center px-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-semibold tracking-tight text-white"
          >
            Elegant Billing for Modern Businesses
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="mt-4 max-w-2xl text-slate-200"
          >
            Create invoices, track expenses, and stay tax-compliant with an animated, delightful experience.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-8 flex gap-3"
          >
            <button onClick={onCTA} className="px-5 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition">
              + New Invoice
            </button>
            <a href="#dashboard" className="px-5 py-3 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-white font-medium transition">
              View Dashboard
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
