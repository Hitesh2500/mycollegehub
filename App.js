import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updateProfile
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    onSnapshot, 
    collection, 
    addDoc, 
    query, 
    updateDoc,
    arrayUnion,
    deleteDoc,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';

// --- SVG Icons (Memoized for performance) ---
const DashboardIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>);
const ContributeIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>);
const GameIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const ChatbotIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>);
const EventsIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const LeaderboardIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
const ForumIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V10a2 2 0 012-2h8z" /></svg>);
const ResourcesIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>);
const TodoIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>);
const LogoutIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
const StudyGroupIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a3.001 3.001 0 015.644 0M12 12a3 3 0 100-6 3 3 0 000 6z" /></svg>);
const ProfileIcon = memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBS8X7Q4O6mBKGglW2Gn6IyDRBaK0EQDB0",
  authDomain: "my-college-hub-78b06.firebaseapp.com",
  projectId: "my-college-hub-78b06",
  storageBucket: "my-college-hub-78b06.appspot.com",
  messagingSenderId: "817385072299",
  appId: "1:817385072299:web:d1de9716cdf34b7421b9ee",
  measurementId: "G-NPHCWZ1BST"
};

// --- App Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Static Data (Moved outside component for optimization) ---
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'profile', label: 'My Profile', icon: <ProfileIcon /> },
    { id: 'contribute', label: 'Contribute', icon: <ContributeIcon /> },
    { id: 'resources', label: 'Resources', icon: <ResourcesIcon /> },
    { id: 'forum', label: 'Forum', icon: <ForumIcon /> },
    { id: 'study-groups', label: 'Study Groups', icon: <StudyGroupIcon /> },
    { id: 'todo', label: 'To-Do List', icon: <TodoIcon /> },
    { id: 'game', label: 'Game', icon: <GameIcon /> },
    { id: 'chatbot', label: 'Chatbot', icon: <ChatbotIcon /> },
    { id: 'events', label: 'Events', icon: <EventsIcon /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <LeaderboardIcon /> },
];

// --- Main App Component ---
const App = () => {
  // --- State Management ---
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewLoading, setViewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const canvasRef = useRef(null);

  // --- Authentication State ---
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ email: '', password: '', displayName: '', branch: '', bio: '' });
  const [authError, setAuthError] = useState('');

  // --- Data States ---
  const [leaderboard, setLeaderboard] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [resources, setResources] = useState([]);
  const [todos, setTodos] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  
  // --- Auth State Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubUserData = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData({ uid: doc.id, ...doc.data() });
          }
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setLoading(false);
        });
        return () => unsubUserData();
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Data Subscription Effect ---
  useEffect(() => {
    if (!user || !user.uid) return;
    setViewLoading(true);

    const createSubscription = (collectionPath, queryConstraints, setData, collectionName) => {
        const q = query(collection(db, collectionPath), ...queryConstraints);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setViewLoading(false);
        }, (error) => {
            console.error(`Error fetching ${collectionName}:`, error);
            setViewLoading(false);
        });
        return unsubscribe;
    };
    
    const unsubLeaderboard = createSubscription('users', [orderBy('points', 'desc')], setLeaderboard, 'leaderboard');
    const unsubNotes = createSubscription('notes', [orderBy('timestamp', 'desc')], (allNotes) => {
        setUserNotes(allNotes.filter(note => note.uploaderId === user.uid));
    }, 'notes');
    const unsubEvents = createSubscription('events', [orderBy('date', 'asc')], setEvents, 'events');
    const unsubForum = createSubscription('forumPosts', [orderBy('createdAt', 'desc')], setForumPosts, 'forum posts');
    const unsubResources = createSubscription('resources', [orderBy('createdAt', 'desc')], setResources, 'resources');
    const unsubTodos = createSubscription(`users/${user.uid}/todos`, [orderBy('createdAt', 'asc')], setTodos, 'todos');
    const unsubGroups = createSubscription('studyGroups', [orderBy('createdAt', 'desc')], setStudyGroups, 'study groups');

    return () => {
        unsubLeaderboard();
        unsubNotes();
        unsubEvents();
        unsubForum();
        unsubResources();
        unsubTodos();
        unsubGroups();
    };
  }, [user, activeTab]); // Re-fetch on tab change to show loading skeleton

  // --- Canvas Background Animation ---
  useEffect(() => {
    // Canvas animation code...
  }, []);

  // --- Helper Functions (Optimized with useCallback) ---
  const addNotification = useCallback((message) => {
    const newNotif = { id: Date.now(), message };
    setNotifications(prev => [newNotif, ...prev]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  }, []);

  const addPoints = useCallback(async (pointsToAdd) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const currentPoints = userDoc.data().points || 0;
        const newPoints = currentPoints + pointsToAdd;
        await updateDoc(userDocRef, { points: newPoints });

        const achievements = userDoc.data().achievements || [];
        let newAchievement = null;
        if (newPoints >= 100 && !achievements.includes('Centurion')) newAchievement = 'Centurion';
        if (newPoints >= 500 && !achievements.includes('Veteran')) newAchievement = 'Veteran';
        if (newPoints >= 1000 && !achievements.includes('Master Contributor')) newAchievement = 'Master Contributor';

        if (newAchievement) {
            await updateDoc(userDocRef, { achievements: arrayUnion(newAchievement) });
            addNotification(`Achievement Unlocked: ${newAchievement}!`);
        }
    }
  }, [user, addNotification]);

  // --- Authentication Handlers ---
  const handleAuthChange = (e) => setAuthForm({ ...authForm, [e.target.name]: e.target.value });

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
        if (isLogin) {
            await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        } else {
            if (!authForm.displayName || !authForm.branch) {
                setAuthError("Display Name and Branch are required for sign up.");
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
            await updateProfile(userCredential.user, { displayName: authForm.displayName });
            
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: authForm.displayName,
                branch: authForm.branch,
                email: authForm.email,
                bio: authForm.bio || '',
                points: 0,
                achievements: []
            });
        }
    } catch (error) {
        setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
  };
  
  const handleProfileUpdate = async (updatedProfile) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
        await updateDoc(userDocRef, updatedProfile);
        if (updatedProfile.name && updatedProfile.name !== user.displayName) {
            await updateProfile(user, { displayName: updatedProfile.name });
        }
        addNotification("Profile updated successfully!");
    } catch (error) {
        addNotification("Error updating profile: " + error.message);
    }
  };

  // --- Render Logic ---
  if (loading) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="loader"></div>
        </div>
    );
  }

  if (!user) {
    return <AuthScreen canvasRef={canvasRef} isLogin={isLogin} setIsLogin={setIsLogin} authForm={authForm} authError={authError} setAuthError={setAuthError} handleAuthChange={handleAuthChange} handleAuthSubmit={handleAuthSubmit} />;
  }
  
  const renderContent = () => {
    if (viewLoading) {
        switch(activeTab) {
            case 'dashboard': return <DashboardSkeleton />;
            case 'events': return <GridSkeleton />;
            case 'resources': return <GridSkeleton />;
            case 'study-groups': return <GridSkeleton />;
            case 'forum': return <ListSkeleton />;
            case 'leaderboard': return <ListSkeleton />;
            case 'profile': return <ListSkeleton />;
            default: return <div className="w-full h-full flex items-center justify-center"><div className="loader"></div></div>;
        }
    }

    switch(activeTab) {
        case 'dashboard': return <DashboardView userData={userData} userNotes={userNotes} />;
        case 'profile': return <ProfileView userData={userData} onProfileUpdate={handleProfileUpdate} />;
        case 'contribute': return <ContributeView user={user} addPoints={addPoints} addNotification={addNotification} />;
        case 'game': return <GameView addPoints={addPoints} />;
        case 'chatbot': return <ChatbotView user={user} />;
        case 'events': return <EventsView user={user} events={events} addNotification={addNotification} />;
        case 'leaderboard': return <LeaderboardView leaderboard={leaderboard} currentUser={user} />;
        case 'forum': return <ForumView user={user} posts={forumPosts} addPoints={addPoints} addNotification={addNotification} />;
        case 'resources': return <ResourcesView user={user} resources={resources} addPoints={addPoints} addNotification={addNotification} />;
        case 'todo': return <TodoView user={user} todos={todos} addNotification={addNotification} />;
        case 'study-groups': return <StudyGroupsView user={user} groups={studyGroups} addNotification={addNotification} />;
        default: return <DashboardView userData={userData} userNotes={userNotes} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 text-gray-100 antialiased font-inter">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900/50"></div>
      <div className="fixed inset-0 noise-bg"></div>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 opacity-50"></canvas>
      <style>{`
        body { background-color: #0f172a; } /* bg-slate-900 */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .noise-bg { background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E'); opacity: 0.05; }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 24px 4px rgba(59, 130, 246, 0.6); }
        }
        .btn-glow { transition: all 0.3s ease; }
        .btn-glow:hover { animation: glow 1.5s infinite ease-in-out; }
        
        .card {
          background-color: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover {
          transform: translateY(-5px) perspective(1000px) rotateX(2deg) rotateY(-2deg);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .loader {
            width: 50px;
            height: 50px;
            border: 5px solid #4a5568;
            border-bottom-color: #60a5fa;
            border-radius: 50%;
            display: inline-block;
            box-sizing: border-box;
            animation: rotation 1s linear infinite;
        }
        @keyframes rotation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .animate-slide-up {
            animation: slideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div className="relative z-10 flex h-screen">
        <aside className="w-64 bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col border-r border-white/10">
            <h1 className="text-2xl font-extrabold text-blue-400 mb-10">College Hub</h1>
            <nav className="flex-grow space-y-2">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} 
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/10'}`}>
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-colors hover:bg-red-500/80">
                <LogoutIcon />
                <span>Logout</span>
            </button>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
            <header className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
                <div className="text-right">
                    <p className="font-semibold text-lg">{userData?.name || 'Loading...'}</p>
                    <p className="text-sm text-gray-400">{userData?.branch || 'N/A'}</p>
                    <p className="text-sm text-green-400 font-bold">{userData?.points || 0} Points</p>
                </div>
            </header>
            <div className="animate-fade-in">
                {renderContent()}
            </div>
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2 w-full max-w-sm">
        {notifications.map((note) => (
            <div key={note.id} className="p-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700 text-sm text-gray-300 animate-slide-up">
                {note.message}
            </div>
        ))}
      </div>
    </div>
  );
};


// --- Skeleton Loaders ---
const SkeletonCard = () => (
    <div className="card p-6 rounded-2xl animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
    </div>
);
const DashboardSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
    </div>
);
const GridSkeleton = () => (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
);
const ListSkeleton = () => (
    <div className="space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="card p-5 rounded-xl animate-pulse h-20"></div>)}
    </div>
);


// --- Component Views & Modals (Memoized for performance) ---

const AuthScreen = memo(({ canvasRef, isLogin, setIsLogin, authForm, authError, setAuthError, handleAuthChange, handleAuthSubmit }) => (
     <div className="relative min-h-screen bg-slate-900 flex items-center justify-center text-gray-100 font-inter">
        <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0"></canvas>
        <div className="relative z-10 w-full max-w-md p-8 bg-gray-800/50 rounded-3xl border-2 border-gray-700/50 shadow-2xl backdrop-blur-lg">
            <h1 className="text-4xl font-extrabold text-center text-blue-400 mb-4">College Hub</h1>
            <p className="text-center text-gray-400 mb-8">{isLogin ? 'Welcome back, please log in.' : 'Create an account to join.'}</p>
            <form onSubmit={handleAuthSubmit} className="space-y-6">
                {!isLogin && (
                    <>
                        <input type="text" name="displayName" placeholder="Display Name" value={authForm.displayName} onChange={handleAuthChange} required className="w-full p-4 bg-gray-700/50 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/70"/>
                        <input type="text" name="branch" placeholder="Branch (e.g., CSE, ME)" value={authForm.branch} onChange={handleAuthChange} required className="w-full p-4 bg-gray-700/50 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/70"/>
                        <textarea name="bio" placeholder="A short bio about yourself..." value={authForm.bio} onChange={handleAuthChange} className="w-full p-4 bg-gray-700/50 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/70" rows="3"></textarea>
                    </>
                )}
                <input type="email" name="email" placeholder="Email" value={authForm.email} onChange={handleAuthChange} required className="w-full p-4 bg-gray-700/50 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/70"/>
                <input type="password" name="password" placeholder="Password" value={authForm.password} onChange={handleAuthChange} required className="w-full p-4 bg-gray-700/50 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/70"/>
                {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg btn-glow">{isLogin ? 'Log In' : 'Sign Up'}</button>
            </form>
            <p className="text-center mt-6 text-sm text-gray-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={() => { setIsLogin(!isLogin); setAuthError(''); }} className="font-semibold text-blue-400 hover:underline ml-2">
                    {isLogin ? 'Sign Up' : 'Log In'}
                </button>
            </p>
        </div>
    </div>
));

const Modal = memo(({ children, onClose }) => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
        <div className="card p-8 rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
));

const DashboardView = memo(({ userData, userNotes }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="card p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-200 mb-4">Profile</h3>
            <p><strong>Name:</strong> {userData?.name}</p>
            <p><strong>Branch:</strong> {userData?.branch}</p>
            <p><strong>Email:</strong> {userData?.email}</p>
            <p><strong>Points:</strong> <span className="text-green-400 font-bold">{userData?.points}</span></p>
        </div>
        <div className="card p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-200 mb-4">Achievements</h3>
            <ul className="list-disc list-inside space-y-1">
                {userData?.achievements?.length > 0 ? userData.achievements.map(ach => <li key={ach} className="text-green-400">{ach}</li>) : <p className="text-gray-400">No achievements yet.</p>}
            </ul>
        </div>
        <div className="card p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-200 mb-4">Your Notes</h3>
            <ul className="space-y-2">
                {userNotes.length > 0 ? userNotes.slice(0, 5).map(note => <li key={note.id} className="p-2 bg-slate-700/50 rounded">{note.title}</li>) : <p className="text-gray-400">You haven't contributed any notes yet.</p>}
            </ul>
        </div>
    </div>
));

const ProfileView = memo(({ userData, onProfileUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', branch: '', bio: '' });

    useEffect(() => {
        if (userData) {
            setProfileForm({
                name: userData.name || '',
                branch: userData.branch || '',
                bio: userData.bio || ''
            });
        }
    }, [userData]);

    const handleSave = () => {
        onProfileUpdate(profileForm);
        setIsEditing(false);
    };

    return (
        <div className="card max-w-4xl mx-auto p-8 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">My Profile</h2>
                <button onClick={() => setIsEditing(true)} className="py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg btn-glow">Edit Profile</button>
            </div>
            
            {isEditing && (
                <Modal onClose={() => setIsEditing(false)}>
                    <h3 className="text-2xl font-bold mb-6">Edit Your Profile</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Your Name" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="text" placeholder="Your Branch" value={profileForm.branch} onChange={e => setProfileForm({...profileForm, branch: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <textarea placeholder="Your Bio" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} rows="4" className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                        <button onClick={handleSave} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg btn-glow">Save Changes</button>
                    </div>
                </Modal>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold">Details</h3>
                    <p><strong>Name:</strong> {userData?.name}</p>
                    <p><strong>Email:</strong> {userData?.email}</p>
                    <p><strong>Branch:</strong> {userData?.branch}</p>
                    <h4 className="font-semibold mt-4">Bio:</h4>
                    <p className="text-gray-300">{userData?.bio || "No bio set."}</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold">Stats</h3>
                    <p><strong>Points:</strong> <span className="text-green-400 font-bold">{userData?.points}</span></p>
                    <h4 className="font-semibold mt-4">Achievements:</h4>
                    <ul className="list-disc list-inside">
                        {userData?.achievements?.length > 0 ? userData.achievements.map(ach => <li key={ach} className="text-green-400">{ach}</li>) : <li>No achievements yet.</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
});

const ContributeView = memo(({ user, addPoints, addNotification }) => {
    const [noteTitle, setNoteTitle] = useState('');
    const [noteSubject, setNoteSubject] = useState('');
    const [noteContent, setNoteContent] = useState('');

    const handleNoteSubmit = async (e) => {
        e.preventDefault();
        if (!noteTitle || !noteSubject || !noteContent) return;
        try {
            await addDoc(collection(db, 'notes'), {
                title: noteTitle,
                subject: noteSubject,
                content: noteContent,
                uploaderId: user.uid,
                uploaderName: user.displayName,
                timestamp: serverTimestamp()
            });
            addPoints(10);
            addNotification("Note submitted successfully! +10 points.");
            setNoteTitle(''); setNoteSubject(''); setNoteContent('');
        } catch (error) { addNotification("Error submitting note: " + error.message); }
    };

    return (
        <div className="card max-w-2xl mx-auto p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">Contribute Notes</h2>
            <form onSubmit={handleNoteSubmit} className="space-y-4">
                <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note Title" className="w-full p-3 bg-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" value={noteSubject} onChange={(e) => setNoteSubject(e.target.value)} placeholder="Subject" className="w-full p-3 bg-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows="5" placeholder="Content or Link..." className="w-full p-3 bg-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg btn-glow">Upload & Get 10 Points</button>
            </form>
        </div>
    );
});

const GameView = memo(({ addPoints }) => {
    const predefinedRiddles = [
        { riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "ECHO" },
        { riddle: "What has an eye, but cannot see?", answer: "NEEDLE" },
        { riddle: "What is full of holes but still holds water?", answer: "SPONGE" },
    ];
    const [gameRiddle, setGameRiddle] = useState('');
    const [gameAnswer, setGameAnswer] = useState('');
    const [userGuess, setUserGuess] = useState('');
    const [gameMessage, setGameMessage] = useState('');
    const [showGame, setShowGame] = useState(false);

    const handleStartGame = () => {
        const { riddle, answer } = predefinedRiddles[Math.floor(Math.random() * predefinedRiddles.length)];
        setGameRiddle(riddle); setGameAnswer(answer); setUserGuess('');
        setGameMessage('Riddle loaded! Good luck.'); setShowGame(true);
    };

    const handleGuessSubmit = (e) => {
        if (e.key === 'Enter') {
            if (userGuess.toUpperCase() === gameAnswer) {
                addPoints(20);
                setGameMessage('Correct! You earned 20 points!');
                setShowGame(false);
            } else {
                setGameMessage('Incorrect. Try again!');
            }
        }
    };
    return (
        <div className="card max-w-2xl mx-auto text-center p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">Riddle Game</h2>
            {!showGame ? (
                <button onClick={handleStartGame} className="py-3 px-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg btn-glow">Start Riddle & Win Points</button>
            ) : (
                <div className="space-y-4">
                    <p className="text-lg p-4 bg-slate-700/50 rounded-lg">{gameRiddle}</p>
                    <input type="text" value={userGuess} onChange={(e) => setUserGuess(e.target.value)} onKeyDown={handleGuessSubmit} placeholder="Type your answer and press Enter" className="w-full p-3 bg-slate-700/80 rounded-lg text-center uppercase focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
            )}
            {gameMessage && <p className="mt-4 font-medium">{gameMessage}</p>}
        </div>
    );
});

const ChatbotView = memo(({ user }) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const apiKey = "PASTE_YOUR_GEMINI_API_KEY_HERE"; 

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || chatLoading || !apiKey.startsWith("AIza")) {
            if (!apiKey.startsWith("AIza")) {
                alert("Please add your Gemini API Key in the code to use the chatbot.");
            }
            return;
        }

        const userMessage = { role: 'user', text: chatInput };
        setChatHistory(prev => [...prev, userMessage]);
        setChatInput('');
        setChatLoading(true);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: `You are a helpful college assistant for a student named ${user.displayName}. Keep responses concise and friendly. User asks: ${chatInput}` }] }] })
            });

            if (!response.ok) throw new Error('API request failed');
            
            const result = await response.json();
            const botResponseText = result.candidates[0].content.parts[0].text;
            setChatHistory(prev => [...prev, { role: 'bot', text: botResponseText }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="card h-[75vh] flex flex-col max-w-3xl mx-auto p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">AI Assistant</h2>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <p className={`max-w-xs md:max-w-md p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-600'}`}>{msg.text}</p>
                    </div>
                ))}
                {chatLoading && <div className="text-center text-gray-400">Assistant is typing...</div>}
            </div>
            <form onSubmit={handleChatSubmit} className="flex space-x-2 mt-4">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask anything..." className="flex-1 p-3 bg-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg btn-glow" disabled={chatLoading || !apiKey.startsWith("AIza")}>Send</button>
            </form>
        </div>
    );
});

const EventsView = memo(({ user, events, addNotification }) => {
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '' });

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.date) return;
        try {
            await addDoc(collection(db, 'events'), {
                ...newEvent,
                organizerId: user.uid,
                organizerName: user.displayName,
                createdAt: serverTimestamp()
            });
            addNotification("Event created successfully!");
            setShowModal(false);
            setNewEvent({ title: '', description: '', date: '' });
        } catch (error) {
            addNotification("Error creating event.");
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Upcoming Events</h2>
                <button onClick={() => setShowModal(true)} className="py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg btn-glow">Create Event</button>
            </div>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <h3 className="text-2xl font-bold mb-6">Create New Event</h3>
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                        <input type="text" placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <textarea placeholder="Event Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} rows="4" className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                        <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg btn-glow">Submit Event</button>
                    </form>
                </Modal>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                    <div key={event.id} className="card p-5 rounded-xl">
                        <h4 className="font-bold text-lg text-blue-400">{event.title}</h4>
                        <p className="text-sm text-gray-300 font-semibold">{new Date(event.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-400 mt-2">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-3">Organized by: {event.organizerName}</p>
                    </div>
                ))}
            </div>
        </div>
    );
});

const LeaderboardView = memo(({ leaderboard, currentUser }) => (
    <div className="card p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">Top Contributors</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left font-semibold rounded-tl-lg">Rank</th>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Branch</th>
                        <th className="px-4 py-3 text-left font-semibold rounded-tr-lg">Points</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((u, index) => (
                        <tr key={u.id} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${u.id === currentUser.uid ? 'bg-blue-500/10' : ''}`}>
                            <td className="px-4 py-3 font-bold">{index + 1}</td>
                            <td className="px-4 py-3">{u.name}</td>
                            <td className="px-4 py-3">{u.branch}</td>
                            <td className="px-4 py-3 font-bold text-green-400">{u.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
));

const ForumView = memo(({ user, posts, addPoints, addNotification }) => {
    const [showModal, setShowModal] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (!selectedPost) return;
        const q = query(collection(db, 'forumPosts', selectedPost.id, 'comments'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [selectedPost]);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.title || !newPost.content) return;
        try {
            await addDoc(collection(db, 'forumPosts'), {
                ...newPost,
                authorId: user.uid,
                authorName: user.displayName,
                createdAt: serverTimestamp()
            });
            addPoints(5);
            addNotification("Post created! +5 points.");
            setShowModal(false);
            setNewPost({ title: '', content: '' });
        } catch (error) { addNotification("Error creating post."); }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await addDoc(collection(db, 'forumPosts', selectedPost.id, 'comments'), {
                text: newComment,
                authorId: user.uid,
                authorName: user.displayName,
                createdAt: serverTimestamp()
            });
            setNewComment('');
        } catch (error) { addNotification("Error adding comment."); }
    };

    if (selectedPost) {
        return (
            <div>
                <button onClick={() => setSelectedPost(null)} className="mb-4 text-blue-400 hover:underline">&larr; Back to Forum</button>
                <div className="card p-6 rounded-xl">
                    <h2 className="text-2xl font-bold">{selectedPost.title}</h2>
                    <p className="text-sm text-gray-400 mb-4">by {selectedPost.authorName}</p>
                    <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                </div>
                <div className="mt-6">
                    <h3 className="text-xl font-bold mb-4">Comments</h3>
                    <div className="space-y-4 mb-6">
                        {comments.map(comment => (
                            <div key={comment.id} className="card p-4 rounded-lg !transform-none !shadow-none">
                                <p className="font-semibold text-blue-300">{comment.authorName}</p>
                                <p>{comment.text}</p>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleAddComment} className="flex space-x-2">
                        <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 p-3 bg-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity btn-glow">Post</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Community Forum</h2>
                <button onClick={() => setShowModal(true)} className="py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity btn-glow">Start Discussion</button>
            </div>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <h3 className="text-2xl font-bold mb-6">Create New Post</h3>
                    <form onSubmit={handleCreatePost} className="space-y-4">
                        <input type="text" placeholder="Post Title" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <textarea placeholder="What's on your mind?" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} rows="5" className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                        <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity btn-glow">Create Post</button>
                    </form>
                </Modal>
            )}
            <div className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} onClick={() => setSelectedPost(post)} className="card p-5 rounded-xl cursor-pointer">
                        <h4 className="font-bold text-lg text-blue-400">{post.title}</h4>
                        <p className="text-sm text-gray-500">by {post.authorName}</p>
                    </div>
                ))}
            </div>
        </div>
    );
});

const ResourcesView = memo(({ user, resources, addPoints, addNotification }) => {
    const [showModal, setShowModal] = useState(false);
    const [newResource, setNewResource] = useState({ title: '', subject: '', link: '' });

    const handleCreateResource = async (e) => {
        e.preventDefault();
        if (!newResource.title || !newResource.link) return;
        try {
            await addDoc(collection(db, 'resources'), {
                ...newResource,
                uploaderId: user.uid,
                uploaderName: user.displayName,
                createdAt: serverTimestamp()
            });
            addPoints(15);
            addNotification("Resource added! +15 points.");
            setShowModal(false);
            setNewResource({ title: '', subject: '', link: '' });
        } catch (error) { addNotification("Error adding resource."); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Resource Hub</h2>
                <button onClick={() => setShowModal(true)} className="py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity btn-glow">Add Resource</button>
            </div>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <h3 className="text-2xl font-bold mb-6">Add New Resource</h3>
                    <form onSubmit={handleCreateResource} className="space-y-4">
                        <input type="text" placeholder="Resource Title" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="text" placeholder="Subject (e.g., Physics, CS)" value={newResource.subject} onChange={e => setNewResource({...newResource, subject: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="url" placeholder="Link to Resource (Drive, Dropbox, etc.)" value={newResource.link} onChange={e => setNewResource({...newResource, link: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity btn-glow">Submit Resource</button>
                    </form>
                </Modal>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map(res => (
                    <div key={res.id} className="card p-5 rounded-xl">
                        <p className="text-xs text-blue-400 font-semibold">{res.subject.toUpperCase()}</p>
                        <h4 className="font-bold text-lg">{res.title}</h4>
                        <p className="text-xs text-gray-500 mt-2">Shared by: {res.uploaderName}</p>
                        <a href={res.link} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 py-1 px-3 bg-blue-600/50 rounded-full text-sm hover:bg-blue-600 transition-colors">View Resource</a>
                    </div>
                ))}
            </div>
        </div>
    );
});

const TodoView = memo(({ user, todos, addNotification }) => {
    const [task, setTask] = useState('');

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!task.trim()) return;
        try {
            await addDoc(collection(db, 'users', user.uid, 'todos'), {
                text: task,
                completed: false,
                createdAt: serverTimestamp()
            });
            setTask('');
        } catch (error) { addNotification("Error adding task."); }
    };

    const toggleComplete = async (todo) => {
        const todoRef = doc(db, 'users', user.uid, 'todos', todo.id);
        await updateDoc(todoRef, { completed: !todo.completed });
    };

    const deleteTask = async (id) => {
        const todoRef = doc(db, 'users', user.uid, 'todos', id);
        await deleteDoc(todoRef);
    };

    return (
        <div className="card max-w-2xl mx-auto p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">My To-Do List</h2>
            <form onSubmit={handleAddTask} className="flex space-x-2 mb-6">
                <input type="text" value={task} onChange={(e) => setTask(e.target.value)} placeholder="Add a new task..." className="flex-1 p-3 bg-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity btn-glow">Add</button>
            </form>
            <ul className="space-y-3">
                {todos.map(todo => (
                    <li key={todo.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span onClick={() => toggleComplete(todo)} className={`cursor-pointer ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                            {todo.text}
                        </span>
                        <button onClick={() => deleteTask(todo.id)} className="text-red-500 hover:text-red-400">Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
});

const StudyGroupsView = memo(({ user, groups, addNotification }) => {
    const [showModal, setShowModal] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', subject: '' });
    const [selectedGroup, setSelectedGroup] = useState(null);
    // In a real app, you'd fetch messages for the selected group
    
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if(!newGroup.name || !newGroup.subject) return;
        try {
            await addDoc(collection(db, 'studyGroups'), {
                ...newGroup,
                creatorId: user.uid,
                creatorName: user.displayName,
                members: [user.uid],
                createdAt: serverTimestamp()
            });
            addNotification("Study group created!");
            setShowModal(false);
            setNewGroup({ name: '', subject: '' });
        } catch (error) {
            addNotification("Error creating group.");
        }
    };

    const handleJoinGroup = async (groupId) => {
        const groupRef = doc(db, 'studyGroups', groupId);
        await updateDoc(groupRef, {
            members: arrayUnion(user.uid)
        });
        addNotification("You've joined the group!");
    };

    if (selectedGroup) {
        // This would be the detailed view for a single group with chat
        return (
            <div>
                <button onClick={() => setSelectedGroup(null)} className="mb-4 text-blue-400">&larr; Back to Groups</button>
                <h2 className="text-2xl font-bold">{selectedGroup.name} - {selectedGroup.subject}</h2>
                <p className="text-sm text-gray-400">Created by {selectedGroup.creatorName}</p>
                <div className="mt-6 card p-4 rounded-xl">
                    <h3 className="font-bold mb-2">Group Chat</h3>
                    {/* Chat implementation would go here */}
                    <p className="text-center text-gray-500">Chat feature coming soon!</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Study Groups</h2>
                <button onClick={() => setShowModal(true)} className="py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity btn-glow">Create Group</button>
            </div>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <h3 className="text-2xl font-bold mb-6">Create New Study Group</h3>
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                        <input type="text" placeholder="Group Name" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg" />
                        <input type="text" placeholder="Subject" value={newGroup.subject} onChange={e => setNewGroup({...newGroup, subject: e.target.value})} className="w-full p-3 bg-slate-700 rounded-lg" />
                        <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold">Create Group</button>
                    </form>
                </Modal>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => (
                    <div key={group.id} className="card p-5 rounded-xl">
                        <h4 className="font-bold text-lg text-blue-400">{group.name}</h4>
                        <p className="text-sm font-semibold">{group.subject}</p>
                        <p className="text-xs text-gray-500 mt-3">Created by: {group.creatorName}</p>
                        <div className="mt-4">
                            {group.members.includes(user.uid) ? (
                                <button onClick={() => setSelectedGroup(group)} className="w-full py-2 bg-green-600/50 rounded-full text-sm">View Group</button>
                            ) : (
                                <button onClick={() => handleJoinGroup(group.id)} className="w-full py-2 bg-blue-600/50 rounded-full text-sm hover:bg-blue-600">Join Group</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});


export default App;

