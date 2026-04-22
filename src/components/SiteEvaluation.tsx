import { useState, useEffect } from 'react';
import { Star, LogOut, LogIn, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, loginWithGoogle, logout } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Evaluation {
  userId: string;
  rating: number;
  createdAt: any;
}

export default function SiteEvaluation() {
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [message, setMessage] = useState('');
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch existing rating
        try {
          const docRef = doc(db, 'evaluations', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRating(docSnap.data().rating);
            setHasRated(true);
          }
        } catch (error) {
          console.error("Error fetching rating:", error);
        }

        // Check if admin
        if (currentUser.email === 'moncefk006@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setShowAdmin(false);
        }
      } else {
        setRating(0);
        setHasRated(false);
        setIsAdmin(false);
        setShowAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'evaluations'));
      const evals: Evaluation[] = [];
      querySnapshot.forEach((doc) => {
        evals.push(doc.data() as Evaluation);
      });
      setEvaluations(evals);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    }
  };

  const toggleAdmin = () => {
    if (!showAdmin) fetchEvaluations();
    setShowAdmin(!showAdmin);
  };

  const handleRating = async (value: number) => {
    if (!user) {
      await loginWithGoogle();
      return;
    }

    setRating(value);
    setIsSubmitting(true);
    setMessage('');

    try {
      const docRef = doc(db, 'evaluations', user.uid);
      await setDoc(docRef, {
        rating: value,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setHasRated(true);
      setMessage('Thank you for your rating!');
      setTimeout(() => setMessage(''), 4000);
      
      if (showAdmin) fetchEvaluations(); // Refresh list if admin panel is open
    } catch (error) {
      console.error("Error submitting rating:", error);
      setMessage('Error submitting rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = evaluations.length > 0 
    ? (evaluations.reduce((acc, curr) => acc + curr.rating, 0) / evaluations.length).toFixed(1)
    : 0;

  return (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center text-center mt-8">
      <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Rate this App</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md">
        Your feedback helps us improve. {hasRated ? "You have already rated, but you can change it anytime!" : "Leave a 5-star rating if you enjoy using it!"}
      </p>

      <div className="flex gap-2 mb-4" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={isSubmitting}
            onMouseEnter={() => setHoverRating(star)}
            onClick={() => handleRating(star)}
            className="focus:outline-none transition-transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
            aria-label={`Rate ${star} stars`}
          >
            <Star
              size={36}
              className={`transition-colors duration-200 ${
                (hoverRating || rating) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-neutral-300 dark:text-neutral-600'
              }`}
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-semibold text-[#681A15] dark:text-[#BBCAE1] mb-2"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap justify-center items-center gap-3 mt-4">
        {user ? (
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-full">
            <span>Signed in as {user.email?.split('@')[0]}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1 font-bold text-[#681A15] dark:text-[#BBCAE1] hover:underline ml-1"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="text-xs font-bold text-[#681A15] dark:text-[#BBCAE1] flex items-center gap-1 hover:underline bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-full"
          >
            <LogIn size={12} />
            Sign in to rate
          </button>
        )}

        {isAdmin && (
          <button
            onClick={toggleAdmin}
            className="text-xs font-bold text-white flex items-center gap-1 hover:bg-neutral-800 bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <Users size={12} />
            {showAdmin ? 'Hide Stats' : 'View Stats'}
          </button>
        )}
      </div>

      {isAdmin && showAdmin && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-700 w-full text-left"
        >
          <div className="flex justify-between items-end mb-4">
            <h4 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">Evaluations Overview</h4>
            <div className="text-right">
              <div className="font-black text-2xl text-[#681A15] dark:text-[#BBCAE1]">{avgRating} <span className="text-sm font-medium text-neutral-400">/ 5</span></div>
              <div className="text-xs text-neutral-500">Average from {evaluations.length} total rating{evaluations.length !== 1 && 's'}</div>
            </div>
          </div>
          
          {evaluations.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
              {[...evaluations].sort((a, b) => b.rating - a.rating).map((ev, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900 p-3 rounded-xl text-sm border border-neutral-100 dark:border-neutral-800">
                  <span className="font-mono text-xs text-neutral-400 truncate w-32">{ev.userId.slice(0,8)}...</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-neutral-700 dark:text-neutral-200">{ev.rating}</span>
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl">No evaluations yet.</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
