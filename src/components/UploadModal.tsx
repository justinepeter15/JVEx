import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, Book, ClipboardList, Link as LinkIcon, BadgeCheck, Sparkles } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ResourceType } from '../types';
import { cn } from '../lib/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'book' as ResourceType,
    fileUrl: '',
    thumbnailUrl: '',
    isPremium: true,
    price: 0
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'resources'), {
        ...formData,
        price: Number(formData.price || 0),
        authorId: auth.currentUser.uid,
        downloadCount: Math.floor(Math.random() * 500),
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden my-auto"
        >
          <div className="absolute top-6 right-6">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-12">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                 <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-black tracking-tight text-slate-900">Upload Resource</h2>
                <p className="text-sm text-slate-400 font-medium">Contribute to the OPTIMA community library.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(s => ({ ...s, title: e.target.value }))}
                    placeholder="E.g. Computer Science Past Paper 2024"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'exam', icon: ClipboardList },
                      { id: 'book', icon: Book },
                      { id: 'lesson_plan', icon: FileText },
                      { id: 'other', icon: Sparkles }
                    ] as const).map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFormData(s => ({ ...s, type: id }))}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all",
                          formData.type === id 
                            ? "bg-indigo-600 text-white border-indigo-600" 
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="capitalize">{id.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Access Tier</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(s => ({ ...s, isPremium: false }))}
                      className={cn(
                        "flex-1 py-3 rounded-xl border text-xs font-bold transition-all",
                        !formData.isPremium ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-400 border-slate-200"
                      )}
                    >
                      Free Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(s => ({ ...s, isPremium: true }))}
                      className={cn(
                        "flex-1 py-3 rounded-xl border text-xs font-bold transition-all",
                        formData.isPremium ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-400 border-slate-200"
                      )}
                    >
                      Premium Only
                    </button>
                  </div>
                </div>

                {formData.isPremium && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Individual Price (TSh / Local Currency)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData(s => ({ ...s, price: Number(e.target.value) }))}
                      placeholder="Enter price (e.g. 1000)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Leave 0 to only allow Premium Subscribers.</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData(s => ({ ...s, description: e.target.value }))}
                    placeholder="Short summary of what this resource covers..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">File URL (PDF/Link)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      required
                      type="url"
                      value={formData.fileUrl}
                      onChange={e => setFormData(s => ({ ...s, fileUrl: e.target.value }))}
                      placeholder="https://example.com/file.pdf"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Thumbnail URL (Image)</label>
                   <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="url"
                      value={formData.thumbnailUrl}
                      onChange={e => setFormData(s => ({ ...s, thumbnailUrl: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between gap-4">
               <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                  <BadgeCheck className="w-4 h-4" />
                  <span>Quality Guaranteed Review</span>
               </div>
               <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Publish to Vault'}
                </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
