import { motion } from 'motion/react';
import { Sparkles, Trophy, BookOpen, GraduationCap } from 'lucide-react';

export default function Hero() {
  return (
    <section id="hero" className="pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-8 border border-indigo-100"
        >
          <Sparkles className="w-3 h-3" />
          <span>Elevate Your Learning Journey</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-black leading-[0.9] tracking-tight mb-8 text-slate-900"
        >
          The Archive of <br />
          <span className="text-slate-400 font-medium">Educational Excellence.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-slate-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
        >
          Access a premium collection of exams, comprehensive books, and structured lesson plans designed by top educators. Everything you need to excel, in one vault.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-8 text-slate-400"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-semibold">Top Exam Past Papers</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-semibold">Curated Textbooks</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            <span className="text-sm font-semibold">Expert Lesson Plans</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
