import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  runTransaction
} from 'firebase/firestore';
import { Review, Resource } from '../types';
import { Star, MessageSquare, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewSystemProps {
  resource: Resource;
  isUnlocked: boolean;
}

export default function ReviewSystem({ resource, isUnlocked }: ReviewSystemProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    if (!showReviews) return;

    const q = query(
      collection(db, 'resources', resource.id, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });

    return () => unsubscribe();
  }, [resource.id, showReviews]);

  const handleSubmitReview = async (e: any) => {
    e.preventDefault();
    if (!auth.currentUser || rating === 0 || !comment.trim() || !isUnlocked) return;

    setLoading(true);
    try {
      const reviewData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous User',
        rating,
        comment,
        createdAt: serverTimestamp()
      };

      await runTransaction(db, async (transaction) => {
        const resourceRef = doc(db, 'resources', resource.id);
        const resourceDoc = await transaction.get(resourceRef);
        
        if (!resourceDoc.exists()) throw new Error("Resource does not exist!");

        const data = resourceDoc.data();
        const currentCount = data.reviewCount || 0;
        const currentRating = data.averageRating || 0;
        
        const newCount = currentCount + 1;
        const newAverage = ((currentRating * currentCount) + rating) / newCount;

        transaction.set(doc(collection(db, 'resources', resource.id, 'reviews')), reviewData);
        transaction.update(resourceRef, {
          reviewCount: newCount,
          averageRating: newAverage
        });
      });

      setRating(0);
      setComment('');
      alert('Review posted! Your feedback helps the community.');
    } catch (error) {
      console.error('Error posting review:', error);
      alert('Could not post review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-50">
      <button 
        onClick={() => setShowReviews(!showReviews)}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>{resource.reviewCount || 0} Reviews</span>
        {resource.averageRating && (
          <div className="flex items-center gap-1 ml-2 text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span>{resource.averageRating.toFixed(1)}</span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {showReviews && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-6 space-y-6">
              {isUnlocked && auth.currentUser ? (
                <form onSubmit={handleSubmitReview} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Rate & Review</span>
                  
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="transition-transform active:scale-95"
                      >
                        <Star 
                          className={`w-6 h-6 ${s <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} 
                        />
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts on this resource..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[100px] resize-none"
                    />
                    <button
                      disabled={loading || rating === 0 || !comment.trim()}
                      className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-400 uppercase text-center tracking-[0.2em]">
                  {isUnlocked ? "Sign in to leave a review" : "Unlock content to leave a review"}
                </div>
              )}

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
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
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400">No reviews yet. Be the first!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
