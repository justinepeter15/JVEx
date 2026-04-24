/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, Resource } from './types';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ResourceGrid from './components/ResourceGrid';
import AdminPanel from './components/AdminPanel';
import SubscriptionModal from './components/SubscriptionModal';
import UploadModal from './components/UploadModal';
import { Sparkles, CheckCircle2, LayoutDashboard, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'admin'>('home');
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedResourceForSub, setSelectedResourceForSub] = useState<Resource | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        alert("Screenshots are discouraged to protect OPTIMA resources.");
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
          if (doc.exists()) {
            setUser({ uid: firebaseUser.uid, ...doc.data() } as UserProfile);
          }
        });

        if (firebaseUser.email === 'justinepeter15@gmail.com') {
          setIsAdmin(true);
        }
        const unsubscribeAdmin = onSnapshot(doc(db, 'admins', firebaseUser.uid), (doc) => {
          if (doc.exists()) setIsAdmin(true);
        });

        return () => {
          unsubscribeUser();
          unsubscribeAdmin();
        };
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    // Seed data and make the current user an admin for the first time
    const setupDatabase = async () => {
      try {
        const snap = await getDocs(collection(db, 'resources'));
        if (snap.empty) {
          const demoData = [
            {
              title: "Advanced Mathematics Exam 2024",
              description: "Final term revision paper with detailed solution guide.",
              type: "exam",
              isPremium: true,
              fileUrl: "https://pdfobject.com/pdf/sample.pdf",
              thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
              downloadCount: 1240,
              createdAt: serverTimestamp()
            },
            {
              title: "Biology: The Cell Structure",
              description: "A comprehensive guide on cellular biology for grade 12.",
              type: "book",
              isPremium: false,
              fileUrl: "https://pdfobject.com/pdf/sample.pdf",
              thumbnailUrl: "https://images.unsplash.com/photo-1532187875605-2fe359520327?auto=format&fit=crop&q=80&w=800",
              downloadCount: 850,
              createdAt: serverTimestamp()
            },
            {
              title: "Physics Mechanics Lesson Plan",
              description: "A 5-day lesson plan covering Newtonian physics and motion.",
              type: "lesson_plan",
              isPremium: true,
              fileUrl: "https://pdfobject.com/pdf/sample.pdf",
              thumbnailUrl: "https://images.unsplash.com/photo-1516339901600-2e1a62986307?auto=format&fit=crop&q=80&w=800",
              downloadCount: 420,
              createdAt: serverTimestamp()
            }
          ];
          for (const item of demoData) {
            await addDoc(collection(db, 'resources'), item);
          }
        }
      } catch (e) {
        console.warn("Seeding failed (likely permissions):", e);
      }
    };
    setupDatabase();

    return () => unsubscribeAuth();
  }, []);

  const handleSubSuccess = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main>
        {currentView === 'home' ? (
          <>
            <Hero />
            <ResourceGrid 
              user={user} 
              isAdmin={isAdmin}
              onSubscribe={(res) => {
                setSelectedResourceForSub(res);
                setIsSubModalOpen(true);
              }}
              onUpload={() => setIsUploadModalOpen(true)}
            />
          </>
        ) : (
          <AdminPanel />
        )}
      </main>

      {isAdmin && (
        <div className="fixed bottom-8 right-8 z-[50]">
          <button
            onClick={() => setCurrentView(currentView === 'home' ? 'admin' : 'home')}
            className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] border border-slate-700"
          >
            {currentView === 'home' ? (
              <>
                <LayoutDashboard className="w-5 h-5" />
                <span>Admin Panel</span>
              </>
            ) : (
              <>
                <Home className="w-5 h-5" />
                <span>Back to Home</span>
              </>
            )}
          </button>
        </div>
      )}

      <footer className="py-20 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">OPTIMA Premium Platform</p>
          <p className="text-slate-300 text-xs">© 2026 Optima. All rights reserved. Empowerment through access.</p>
        </div>
      </footer>

      <SubscriptionModal 
        isOpen={isSubModalOpen} 
        onClose={() => {
          setIsSubModalOpen(false);
          setSelectedResourceForSub(null);
        }}
        onSuccess={handleSubSuccess}
        selectedResource={selectedResourceForSub}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-800"
          >
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Welcome to Premium!</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">All resources are now unlocked</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
