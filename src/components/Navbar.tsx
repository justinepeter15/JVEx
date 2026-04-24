import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { LogIn, LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
        } else {
          const newUser: Partial<UserProfile> = {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName,
            isPremium: false,
            createdAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser({ uid: firebaseUser.uid, ...newUser } as UserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [signingIn, setSigningIn] = useState(false);

  const login = async () => {
    if (signingIn) return;
    setSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        alert('SignIn popup was blocked by your browser. Please allow popups for this site or try clicking again.');
      } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error('Login failed:', error);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const logout = () => signOut(auth);

  return (
    <nav id="navbar" className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center font-bold text-white text-xl">O</div>
            <span className="text-xl font-bold tracking-tight">OPTIMA</span>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-900">{user.displayName}</span>
                  {user.isPremium && (
                    <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">Premium Member</span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-all group"
                  title="Sign Out"
                >
                  <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">Logout</span>
                  <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                disabled={signingIn}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-500 transition-all active:scale-95",
                  signingIn && "opacity-70 cursor-not-allowed"
                )}
              >
                <LogIn className="w-4 h-4" />
                <span>{signingIn ? 'Checking...' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
