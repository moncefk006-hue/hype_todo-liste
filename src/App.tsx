import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CheckCircle, Circle, Sun, Moon, Instagram, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SiteEvaluation from './components/SiteEvaluation';

type Category = 'Study' | 'Work' | 'Sport' | 'Personal';

interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  category: Category;
  completed: boolean;
  notified?: boolean;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('hype_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('hype_dark');
    if (saved) return saved === 'true';
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [filterMode, setFilterMode] = useState<'All' | 'Completed' | 'Incomplete'>('All');
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('Personal');

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('hype_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('hype_dark', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Notifications
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      setTasks(prevTasks => {
        let updated = false;
        const newTasks = prevTasks.map(t => {
          if (!t.completed && !t.notified && t.date === currentDate && t.time === currentTimeStr) {
            updated = true;
            
            // Show toast
            setNotification(`Time for task: ${t.title}`);
            setTimeout(() => setNotification(null), 8000);
            
            // Native notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Task Reminder", {
                body: `It's time to: ${t.title}`
              });
            }
            
            return { ...t, notified: true };
          }
          return t;
        });
        return updated ? newTasks : prevTasks;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const openAddForm = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormDate('');
    setFormTime('');
    setFormCategory('Personal');
    setIsFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormDate(task.date);
    setFormTime(task.time);
    setFormCategory(task.category);
    setIsFormOpen(true);
  };

  const saveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title: formTitle,
        description: formDescription,
        date: formDate,
        time: formTime,
        category: formCategory,
        // Reset notification state if time/date changed
        notified: (t.date !== formDate || t.time !== formTime) ? false : t.notified
      } : t));
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: formTitle,
        description: formDescription,
        date: formDate,
        time: formTime,
        category: formCategory,
        completed: false,
        notified: false
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsFormOpen(false);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const filteredTasks = tasks.filter(t => {
    if (filterMode === 'Completed' && !t.completed) return false;
    if (filterMode === 'Incomplete' && t.completed) return false;
    if (filterCategory !== 'All' && t.category !== filterCategory) return false;
    return true;
  }).sort((a, b) => {
    // Basic sorting to show incomplete first, then by date/time
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const dateA = a.date + (a.time || "23:59");
    const dateB = b.date + (b.time || "23:59");
    if (dateA && dateB) return dateA.localeCompare(dateB);
    return 0;
  });

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans flex flex-col">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 z-50 bg-[#681A15] text-[#BBCAE1] px-6 py-3.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#BBCAE1]/20 flex items-center space-x-3 max-w-[90vw] md:max-w-md"
          >
            <Bell size={20} className="animate-pulse" />
            <span className="font-semibold">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-[#681A15] text-[#BBCAE1] shadow-lg shadow-[#681A15]/10 py-5 px-6 md:px-12 flex justify-between items-center sticky top-0 z-30">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HypeTo-Do</h1>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="relative flex items-center p-1 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-sm shadow-inner transition-all w-16 h-8 border border-white/5"
          aria-label="Toggle dark mode"
        >
          <motion.div 
            className="absolute top-1 bottom-1 w-6 bg-white dark:bg-[#BBCAE1] rounded-full shadow-sm"
            animate={{ left: isDarkMode ? 'calc(100% - 29px)' : '5px' }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
          <div className="relative z-10 flex justify-between w-full px-1.5 pointer-events-none">
            <Sun size={14} className={!isDarkMode ? "text-[#681A15]" : "text-white/60"} />
            <Moon size={14} className={isDarkMode ? "text-[#681A15]" : "text-white/60"} />
          </div>
        </button>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-4xl flex flex-col gap-8 md:gap-10">
        
        {/* Dashboard / Progress */}
        <section className="bg-white dark:bg-neutral-800 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center justify-between border border-neutral-200 dark:border-neutral-700">
          <div className="w-full md:w-3/5 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">Your Progress</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Keep up the good work!</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <span>Task Completion</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-3.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#BBCAE1] to-[#8FAACC]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto justify-center md:justify-end">
            <div className="bg-[#BBCAE1]/20 dark:bg-[#BBCAE1]/10 px-5 py-4 rounded-2xl text-center min-w-[100px] border border-[#BBCAE1]/20">
              <div className="text-3xl font-black text-[#681A15] dark:text-[#BBCAE1]">{totalCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">Total</div>
            </div>
            <div className="bg-[#681A15]/10 dark:bg-[#681A15]/20 px-5 py-4 rounded-2xl text-center min-w-[100px] border border-[#681A15]/10">
              <div className="text-3xl font-black text-[#681A15] dark:text-[#BBCAE1]">{completedCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">Done</div>
            </div>
          </div>
        </section>

        {/* Controls */}
        <section className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white/50 dark:bg-neutral-800/50 p-2 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto p-1">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="flex-1 md:flex-none bg-white dark:bg-neutral-800 border-none outline-none ring-1 ring-neutral-200 dark:ring-neutral-700/50 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 cursor-pointer shadow-sm focus:ring-[#BBCAE1]"
            >
              <option value="All">All Tasks</option>
              <option value="Incomplete">Incomplete</option>
              <option value="Completed">Completed</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="flex-1 md:flex-none bg-white dark:bg-neutral-800 border-none outline-none ring-1 ring-neutral-200 dark:ring-neutral-700/50 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 cursor-pointer shadow-sm focus:ring-[#BBCAE1]"
            >
              <option value="All">All Categories</option>
              <option value="Study">Study</option>
              <option value="Work">Work</option>
              <option value="Sport">Sport</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-[#681A15] hover:bg-[#52130f] text-[#BBCAE1] md:text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 justify-center m-1"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>New Task</span>
          </button>
        </section>

        {/* Task List */}
        <section className="space-y-3 md:space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-neutral-800/40 rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700"
              >
                <div className="bg-[#BBCAE1]/20 dark:bg-[#BBCAE1]/10 p-4 rounded-full mb-4">
                  <CheckCircle size={40} className="text-[#681A15] dark:text-[#BBCAE1]" />
                </div>
                <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-200 mb-2">All caught up!</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
                  There are no tasks to display. Try adjusting your filters or add a new task to get started.
                </p>
                <button 
                  onClick={openAddForm}
                  className="mt-6 text-[#681A15] dark:text-[#BBCAE1] font-semibold hover:underline"
                >
                  Create a task now
                </button>
              </motion.div>
            ) : (
              filteredTasks.map(task => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.25, type: 'spring', bounce: 0.2 }}
                  key={task.id}
                  className={`bg-white dark:bg-neutral-800 p-5 md:p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] dark:shadow-none border border-neutral-100 dark:border-neutral-700/80 flex flex-col md:flex-row gap-5 md:items-center justify-between group transition-all duration-300 hover:shadow-md ${task.completed ? 'opacity-60 bg-neutral-50/80 dark:bg-neutral-800/40 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 grayscale-[30%]' : ''}`}
                >
                  <div className="flex items-start gap-4 md:gap-5 flex-grow">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 text-[#681A15] dark:text-[#BBCAE1] hover:scale-110 active:scale-95 transition-transform shrink-0"
                      aria-label={task.completed ? "Mark as incomplete" : "Mark as completed"}
                    >
                      {task.completed ? 
                        <CheckCircle size={28} className="fill-[#681A15] text-white dark:fill-[#BBCAE1] dark:text-neutral-900" /> : 
                        <Circle size={28} strokeWidth={2} className="text-[#681A15] dark:text-[#BBCAE1]" />
                      }
                    </button>
                    
                    <div className={`flex flex-col gap-1.5 w-full ${task.completed ? 'line-through text-neutral-500 dark:text-neutral-400' : ''}`}>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-lg leading-tight text-neutral-800 dark:text-neutral-100">{task.title}</h3>
                        <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full bg-[#BBCAE1]/30 text-[#681A15] dark:bg-[#BBCAE1]/15 dark:text-[#BBCAE1]">
                          {task.category}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-neutral-600/90 dark:text-neutral-400/90 line-clamp-2 md:line-clamp-none pr-4 md:pr-0">
                          {task.description}
                        </p>
                      )}
                      
                      {(task.date || task.time) && (
                        <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500 mt-2 bg-neutral-100 dark:bg-neutral-900/50 self-start px-2.5 py-1 rounded-lg">
                          {task.date && <span>📅 {task.date}</span>}
                          {task.time && <span>⏰ {task.time}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center pt-3 md:pt-0 border-t border-neutral-100 dark:border-neutral-700/50 md:border-none w-full md:w-auto justify-end mt-2 md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditForm(task)}
                      className="p-2.5 text-neutral-500 hover:text-[#000000] dark:hover:text-[#ffffff] bg-neutral-100 dark:bg-neutral-800 md:dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xl transition-colors font-medium flex items-center gap-2"
                      aria-label="Edit task"
                    >
                      <Edit2 size={16} />
                      <span className="md:hidden text-xs">Edit</span>
                    </button>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-2.5 text-red-500 hover:text-white bg-red-50 dark:bg-red-900/10 hover:bg-red-500 rounded-xl transition-all font-medium flex items-center gap-2"
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
                      <span className="md:hidden text-xs">Delete</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </section>
        
        {/* Site Evaluation Component */}
        <SiteEvaluation />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-8 mt-auto px-4">
        <div className="container mx-auto max-w-4xl flex flex-col justify-center items-center text-center">
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex flex-wrap justify-center items-center gap-1.5">
            <span>&copy; {new Date().getFullYear()} Hype To-Do List. All rights reserved by</span>
            <a
              href="https://instagram.com/hype_moncef"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-bold text-[#681A15] dark:text-[#BBCAE1] hover:underline"
            >
              <Instagram size={14} />
              @hype_moncef
            </a>
          </div>
        </div>
      </footer>

      {/* Task Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-800 w-full max-w-lg rounded-[2rem] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <h2 className="text-2xl font-black mb-6 text-[#681A15] dark:text-[#BBCAE1]">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h2>
                <form onSubmit={saveTask} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Task Title *</label>
                    <input
                      required
                      type="text"
                      autoFocus
                      className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#681A15] dark:focus:ring-[#BBCAE1] transition-shadow text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
                      placeholder="e.g., Complete project presentation"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Description (Optional)</label>
                    <textarea
                      className="w-full resize-none bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#681A15] dark:focus:ring-[#BBCAE1] transition-shadow text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 h-28"
                      placeholder="Add any relevant details or notes here..."
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Date</label>
                      <input
                        type="date"
                        className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#681A15] dark:focus:ring-[#BBCAE1] transition-shadow text-neutral-800 dark:text-neutral-100 dark:[color-scheme:dark]"
                        value={formDate}
                        onChange={e => setFormDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Time</label>
                      <input
                        type="time"
                        className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#681A15] dark:focus:ring-[#BBCAE1] transition-shadow text-neutral-800 dark:text-neutral-100 dark:[color-scheme:dark]"
                        value={formTime}
                        onChange={e => setFormTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Category</label>
                     <select
                        className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#681A15] dark:focus:ring-[#BBCAE1] transition-shadow text-neutral-800 dark:text-neutral-100 cursor-pointer"
                        value={formCategory}
                        onChange={e => setFormCategory(e.target.value as Category)}
                      >
                        <option value="Personal">Personal</option>
                        <option value="Work">Work</option>
                        <option value="Study">Study</option>
                        <option value="Sport">Sport</option>
                      </select>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 mt-4 border-t border-neutral-100 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-6 py-3 rounded-xl font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl font-bold bg-[#681A15] hover:bg-[#52130f] text-white transition-colors shadow-lg shadow-[#681A15]/20 flex justify-center items-center"
                    >
                      {editingTask ? 'Save Changes' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

