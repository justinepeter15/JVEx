import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, getDocs, runTransaction } from 'firebase/firestore';
import { Resource, Review } from '../types';
import { Trash2, FileText, Download, TrendingUp, Users, Shield, ShieldOff, DollarSign, Search, MessageSquare, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [resourceReviews, setResourceReviews] = useState<Record<string, Review[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    downloads: 0,
    premium: 0,
    estimatedRevenue: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      setResources(data);
      
      const totalDownloads = data.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);
      const premiumCount = data.filter(r => r.isPremium).length;
      
      // Simulated revenue: 10% of downloads paid at average TSh 5000
      const estimatedRevenue = (totalDownloads * 0.1) * 5000;
      
      setStats({
        total: data.length,
        downloads: totalDownloads,
        premium: premiumCount,
        estimatedRevenue
      });
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await deleteDoc(doc(db, 'resources', id));
      } catch (error) {
        console.error("Error deleting resource:", error);
      }
    }
  };

  const togglePremium = async (resource: Resource) => {
    try {
      await updateDoc(doc(db, 'resources', resource.id), {
        isPremium: !resource.isPremium
      });
    } catch (error) {
      console.error("Error toggling premium:", error);
    }
  };

  const loadReviews = async (resourceId: string) => {
    if (expandedResource === resourceId) {
      setExpandedResource(null);
      return;
    }

    try {
      const q = query(collection(db, 'resources', resourceId, 'reviews'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setResourceReviews(prev => ({ ...prev, [resourceId]: reviews }));
      setExpandedResource(resourceId);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  const handleDeleteReview = async (resourceId: string, reviewId: string) => {
    if (window.confirm('Delete this review?')) {
      try {
        await runTransaction(db, async (transaction) => {
          const resourceRef = doc(db, 'resources', resourceId);
          const reviewRef = doc(db, 'resources', resourceId, 'reviews', reviewId);
          
          const resourceDoc = await transaction.get(resourceRef);
          const reviewDoc = await transaction.get(reviewRef);

          if (!resourceDoc.exists()) throw new Error("Resource not found");
          if (!reviewDoc.exists()) throw new Error("Review not found");

          const resourceData = resourceDoc.data();
          const reviewData = reviewDoc.data();

          const currentCount = resourceData.reviewCount || 0;
          const currentRating = resourceData.averageRating || 0;
          const deletedRating = reviewData.rating;

          let newCount = Math.max(0, currentCount - 1);
          let newAverage = 0;

          if (newCount > 0) {
            newAverage = ((currentRating * currentCount) - deletedRating) / newCount;
          }

          transaction.delete(reviewRef);
          transaction.update(resourceRef, {
            reviewCount: newCount,
            averageRating: newAverage
          });
        });

        setResourceReviews(prev => ({
          ...prev,
          [resourceId]: prev[resourceId]?.filter(r => r.id !== reviewId) || []
        }));
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter(resource => 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resources, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight mb-2">Admin Control</h2>
          <p className="text-slate-500 font-medium tracking-tight">Manage your learning repository and insights.</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Est. Revenue: TSh {stats.estimatedRevenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm">
            <Users className="w-4 h-4" />
            <span>Admin Session Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Resources</span>
          <span className="text-4xl font-black text-slate-900">{stats.total}</span>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
            <Download className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Downloads</span>
          <span className="text-4xl font-black text-slate-900">{stats.downloads.toLocaleString()}</span>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Premium Ratio</span>
          <span className="text-4xl font-black text-slate-900">{Math.round((stats.premium / stats.total) * 100) || 0}%</span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Manage Content</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update status & visibility</span>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          <AnimatePresence>
            {filteredResources.map((resource) => (
              <motion.div 
                key={resource.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 flex flex-col hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-20 rounded-xl bg-slate-100 overflow-hidden relative flex-shrink-0">
                      <img src={resource.thumbnailUrl} alt={resource.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{resource.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded">
                          {resource.type}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {resource.downloadCount} downloads
                        </span>
                        {resource.price && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            TSh {resource.price}
                          </span>
                        )}
                        {resource.averageRating && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3 h-3 fill-amber-500" />
                            <span className="text-xs font-bold">{resource.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadReviews(resource.id)}
                      className={`p-3 rounded-full transition-all ${
                        expandedResource === resource.id
                          ? "text-indigo-600 bg-indigo-50"
                          : "text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                      }`}
                      title="View Reviews"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => togglePremium(resource)}
                      className={`p-3 rounded-full transition-all ${
                        resource.isPremium 
                          ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" 
                          : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                      }`}
                      title={resource.isPremium ? "Make Free" : "Make Premium"}
                    >
                      {resource.isPremium ? <Shield className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedResource === resource.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 pl-20 pr-6 py-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">User Reviews</h5>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{resourceReviews[resource.id]?.length || 0} Total</span>
                        </div>
                        
                        <div className="space-y-4">
                          {resourceReviews[resource.id]?.length > 0 ? (
                            resourceReviews[resource.id].map((review) => (
                              <div key={review.id} className="flex items-start justify-between bg-white p-4 rounded-xl border border-slate-100">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="text-xs font-bold text-slate-900">{review.userName}</span>
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`w-2.5 h-2.5 ${i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium">{review.comment}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteReview(resource.id, review.id)}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-4"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-xs text-slate-400 font-medium">No reviews found for this resource.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredResources.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">
                {searchQuery ? `No resources matching "${searchQuery}"` : "No resources found in database."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
