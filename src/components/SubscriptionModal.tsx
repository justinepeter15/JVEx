import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ShieldCheck, Zap, Sparkles, Lock } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Resource } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedResource?: Resource | null;
}

export default function SubscriptionModal({ isOpen, onClose, onSuccess, selectedResource }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');

  // Automatically close modal after success
  useEffect(() => {
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        onClose();
        // Reset states after animation should be done
        setTimeout(() => {
          setPaymentSuccess(false);
          setTransactionRef('');
          setSelectedMethod(null);
        }, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, onClose]);

  const handlePayment = async (type: 'subscription' | 'single') => {
    if (!auth.currentUser || !selectedMethod) return;
    setLoading(true);
    try {
      // Simulate real delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      const ref = 'OPT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setTransactionRef(ref);
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      if (type === 'subscription') {
        await updateDoc(userRef, {
          isPremium: true,
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: serverTimestamp(),
          lastPaymentRef: ref
        });
      } else if (selectedResource) {
        await updateDoc(userRef, {
          purchasedResources: arrayUnion(selectedResource.id),
          updatedAt: serverTimestamp(),
          lastPaymentRef: ref
        });
      }
      
      setPaymentSuccess(true);
      onSuccess();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
        >
          {paymentSuccess ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-display font-black text-slate-900 mb-4 tracking-tight">Payment Successful!</h2>
              <p className="text-slate-500 font-medium mb-8">Your account has been updated. You can now access your content.</p>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 text-left">Transaction Reference</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{transactionRef}</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
              >
                Close & Explore
              </button>
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center max-h-[85vh] overflow-y-auto">
              {/* ... original content */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden" />
            
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>

            <h2 className="text-3xl font-display font-black tracking-tight mb-2 text-slate-900">
              {selectedResource ? "Unlock Resource" : "Go Premium"}
            </h2>
            
            <p className="text-slate-500 mb-8 font-medium leading-relaxed text-sm">
              {selectedResource 
                ? `You are about to unlock "${selectedResource.title}". Select your payment method below.`
                : "Join thousands of students and educators who are already using OPTIMA to its full potential."}
            </p>

            <div className="mb-8 overflow-hidden">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left mb-3">Select Payment Method</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'mpesa', name: 'M-Pesa Pay', color: 'text-green-600', icon: 'M' },
                  { id: 'yas', name: 'Mix by Yas', color: 'text-orange-500', icon: 'Y' },
                  { id: 'airtel', name: 'Airtel Money', color: 'text-red-600', icon: 'A' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    type="button"
                    className={cn(
                      "flex items-center justify-between p-4 bg-slate-50 border rounded-xl transition-all group",
                      selectedMethod === method.id ? "border-indigo-600 bg-indigo-50/30" : "border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs", 
                        method.id === 'mpesa' ? 'bg-green-600' : method.id === 'yas' ? 'bg-orange-500' : 'bg-red-600'
                      )}>
                        {method.icon}
                      </div>
                      <span className={cn("font-bold text-sm", method.color)}>{method.name}</span>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 transition-all",
                      selectedMethod === method.id ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                    )} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 mb-8 border border-slate-800">
               <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Access Pass</span>
                    <span className="text-xl font-black text-white">TSh 10,000<span className="text-xs font-medium text-slate-500">/mo</span></span>
                  </div>
                  <button
                    onClick={() => handlePayment('subscription')}
                    disabled={loading || !selectedMethod}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-all disabled:opacity-50"
                  >
                    Subscribe
                  </button>
               </div>

               {selectedResource && selectedResource.price && selectedResource.price > 0 && (
                 <div className="flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Single Buy</span>
                      <span className="text-xl font-black text-white">TSh {selectedResource.price}</span>
                    </div>
                    <button
                      onClick={() => handlePayment('single')}
                      disabled={loading || !selectedMethod}
                      className="px-4 py-2 border border-slate-700 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      Buy This Only
                    </button>
                 </div>
               )}
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" />
              Anti-Screenshot Protection Enabled
            </p>
          </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
