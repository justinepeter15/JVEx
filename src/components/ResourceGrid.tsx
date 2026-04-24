import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { Resource, UserProfile } from '../types';
import ResourceCard from './ResourceCard';
import { Search, Filter, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ResourceGridProps {
  user: UserProfile | null;
  isAdmin: boolean;
  onSubscribe: (resource: Resource | null) => void;
  onUpload: () => void;
}

export default function ResourceGrid({ user, isAdmin, onSubscribe, onUpload }: ResourceGridProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'exam' | 'book' | 'lesson_plan'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      setResources(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredResources = resources.filter(r => {
    const matchesFilter = filter === 'all' || r.type === filter;
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                          r.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleView = async (resource: Resource) => {
    try {
      await updateDoc(doc(db, 'resources', resource.id), {
        downloadCount: increment(1)
      });
    } catch (error) {
      console.error('Error updating download count:', error);
    }
    window.open(resource.fileUrl, '_blank');
  };

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="space-y-4">
          <h2 className="text-4xl font-display font-black tracking-tight text-slate-900">Academic Resources.</h2>
          <div className="flex flex-wrap gap-2">
            {(['all', 'exam', 'book', 'lesson_plan'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                  filter === t 
                    ? "bg-slate-100 text-slate-900 shadow-sm" 
                    : "bg-white text-slate-400 border border-slate-200 hover:border-slate-300"
                )}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-6">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-full py-3 pl-12 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
            />
          </div>
          
          {isAdmin && (
            <button
              onClick={onUpload}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-slate-200 h-[400px] animate-pulse" />
          ))}
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isUnlocked={user?.isPremium || user?.purchasedResources?.includes(resource.id) || false}
                onView={handleView}
                onSubscribe={() => onSubscribe(resource)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-40 bg-white border border-slate-200 flex flex-col items-center">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8">
              <Filter className="w-10 h-10 text-slate-200" />
           </div>
           <h3 className="text-2xl font-display font-black mb-2 text-slate-900">No resources found.</h3>
           <p className="text-slate-400 font-medium">Try adjusting your filters or search query.</p>
        </div>
      )}
    </section>
  );
}
