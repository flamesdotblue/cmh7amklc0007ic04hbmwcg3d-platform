import Spline from '@splinetool/react-spline';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative h-[340px] md:h-[420px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/41MGRk-UDPKO-l6W/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/90 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto h-full flex items-center justify-between px-4">
        <div className="max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900"
          >
            Modern Billing, Invoices and Analytics — Beautifully Animated
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="mt-3 text-slate-600 max-w-xl"
          >
            Create invoices, track expenses and taxes, and get real-time insights. Minimal, glass-morphic aesthetic with smooth transitions.
          </motion.p>
          <div className="mt-6 flex gap-3">
            <motion.a
              href="#invoices"
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center rounded-full bg-slate-900 text-white px-5 py-2.5 text-sm shadow hover:shadow-md"
            >
              + New Invoice
            </motion.a>
            <motion.a
              href="#analytics"
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center rounded-full bg-white text-slate-900 px-5 py-2.5 text-sm border border-slate-200 hover:bg-slate-50"
            >
              View Analytics
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
}
