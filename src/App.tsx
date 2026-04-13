import { useState, useMemo, useEffect, useCallback, FormEvent } from 'react';
import { Search, Gamepad2, Users, Keyboard, Play, X, Info, Loader2, AlertCircle, Wallet, LogIn, User, Mail, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/src/lib/supabase';

interface Game {
  id: string;
  title: string;
  description: string;
  controls: string;
  players: string;
  category: string;
  url: string;
  thumbnail: string;
}

interface Profile {
  id: string;
  nick: string;
  coins: number;
  has_rewarded_email: boolean;
  email?: string;
}

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  // Auth & Wallet State
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ nick: '', password: '', email: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingNick, setIsCheckingNick] = useState(false);
  const [nickStatus, setNickStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch Profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  const checkNickAvailability = async () => {
    if (authForm.nick.length < 2) return;
    setIsCheckingNick(true);
    setNickStatus('idle');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nick')
        .eq('nick', authForm.nick)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      setNickStatus(data ? 'taken' : 'available');
    } catch (err) {
      console.error('Error checking nick:', err);
    } finally {
      setIsCheckingNick(false);
    }
  };

  useEffect(() => {
    // Initial Auth Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Coin Reward Listener
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'AWARD_COINS' && profile) {
        const amount = event.data.amount || 10;
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update({ coins: (profile.coins || 0) + amount })
            .eq('id', profile.id)
            .select()
            .single();
          
          if (error) throw error;
          setProfile(data);
          console.log(`Awarded ${amount} coins!`);
        } catch (err) {
          console.error('Error awarding coins:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [profile]);

  useEffect(() => {
    async function fetchGames() {
      const fallbackGames = [
        {
          id: 'pong',
          title: 'Retro Pong',
          description: 'The classic table tennis simulation. Fast-paced and addictive.',
          controls: 'P1: W/S | P2: Up/Down',
          players: '2 Players',
          category: 'Classic',
          url: '/games/pong.html',
          thumbnail: 'https://picsum.photos/seed/pong/400/250'
        },
        {
          id: 'snake',
          title: 'Dual Snake',
          description: 'Grow your snake and trap your opponent. Don\'t hit the walls!',
          controls: 'P1: WASD | P2: Arrows',
          players: '2 Players',
          category: 'Arcade',
          url: '/games/snake.html',
          thumbnail: 'https://picsum.photos/seed/snake/400/250'
        },
        {
          id: 'tictactoe',
          title: 'Tic Tac Toe',
          description: 'A game of wits and strategy. Three in a row wins.',
          controls: 'Mouse / Touch',
          players: '2 Players',
          category: 'Strategy',
          url: '/games/tictactoe.html',
          thumbnail: 'https://picsum.photos/seed/tictactoe/400/250'
        },
        {
          id: 'tanks',
          title: 'Tank Duel',
          description: 'Battle it out in armored vehicles. Aim, shoot, and destroy!',
          controls: 'P1: WASD + Q | P2: Arrows + M',
          players: '2 Players',
          category: 'Action',
          url: '/games/tanks.html',
          thumbnail: 'https://picsum.photos/seed/tanks/400/250'
        }
      ];

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .order('title');

        if (error) throw error;
        
        const gamesList = data && data.length > 0 ? data : fallbackGames;
        setGames(gamesList);
        // Auto-select first game
        if (gamesList.length > 0) setSelectedGame(gamesList[0]);
      } catch (err: any) {
        console.error('Error fetching games:', err);
        setGames(fallbackGames);
        if (fallbackGames.length > 0) setSelectedGame(fallbackGames[0]);
        setError('Using local collection (Supabase not connected)');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(games.map(game => game.category))];
    return cats;
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [games, searchQuery, selectedCategory]);

  const handlePlay = (game: Game) => {
    setSelectedGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authForm.nick.length < 2) {
      setAuthError('Nick must be at least 2 characters');
      return;
    }

    if (authForm.password.length < 5) {
      setAuthError('Password must be at least 5 characters');
      return;
    }

    // Generate a consistent dummy email for Supabase Auth based on the nick
    // This ensures we always use the same "email" for a given nick
    const sanitizedNick = authForm.nick.toLowerCase().replace(/[^a-z0-9]/g, 'x');
    const dummyEmail = `${sanitizedNick}_${authForm.nick.length}@dailyduel.space`;

    try {
      if (authMode === 'register') {
        // 1. Check uniqueness in profiles table (publicly readable)
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('nick')
          .eq('nick', authForm.nick)
          .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        if (existing) {
          setAuthError('Nick already taken');
          return;
        }

        // 2. Sign up with dummy email
        const { error: signUpError } = await supabase.auth.signUp({
          email: dummyEmail,
          password: authForm.password,
          options: {
            data: { nick: authForm.nick }
          }
        });

        if (signUpError) throw signUpError;
        setIsRegisterSuccess(true);
      } else {
        // Login with dummy email
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: authForm.password
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Invalid nick or password');
          }
          throw signInError;
        }
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err.message || 'An unexpected error occurred';
      
      if (message.includes('Email not confirmed')) {
        message = 'Registration successful! However, you must disable "Confirm email" in your Supabase Auth Settings to log in with a nick.';
      } else if (message.includes('rate limit exceeded')) {
        message = 'Rate limit exceeded. Please wait a few minutes, or increase the "Rate Limits" in your Supabase Auth Settings (Authentication > Settings > Rate Limits).';
      } else if (message.includes('Invalid login credentials')) {
        message = 'Invalid nick or password';
      }
      
      setAuthError(message);
    }
  };

  const handleUpdateEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !authForm.email) return;

    try {
      const reward = profile.has_rewarded_email ? 0 : 5;
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          email: authForm.email,
          coins: profile.coins + reward,
          has_rewarded_email: true
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      setIsProfileModalOpen(false);
    } catch (err: any) {
      console.error('Error updating email:', err);
      if (err.message?.includes('rate limit exceeded')) {
        alert('Rate limit exceeded. Please wait a few minutes before trying again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-black tracking-tighter uppercase">DailyDuel<span className="text-orange-500">.space</span></span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
              <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Local Multiplayer</span>
              <span className="flex items-center gap-2"><Keyboard className="w-4 h-4" /> One Keyboard</span>
            </div>

            {/* Wallet & Auth */}
            <div className="flex items-center gap-3">
              {profile && (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                  <Coins className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-orange-500">{profile.coins}</span>
                </div>
              )}

              {user ? (
                <Button 
                  variant="ghost" 
                  className="gap-2 text-white/60 hover:text-white hover:bg-white/5"
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{profile?.nick || 'Profile'}</span>
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-6"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Game Viewport Section */}
      <section className="bg-black border-b border-white/10 relative">
        <div className="w-full h-[60vh] min-h-[400px] lg:h-[75vh] relative group overflow-hidden">
          {selectedGame ? (
            <iframe
              src={selectedGame.url}
              className="w-full h-full border-none"
              title={selectedGame.title}
              key={selectedGame.id}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-orange-500/5 to-transparent">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <p className="text-white/40 font-display text-xl uppercase tracking-widest">Initializing Arcade...</p>
            </div>
          )}
          
          {/* Viewport Overlay Info */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <Badge className="bg-orange-500 text-white mb-3">{selectedGame?.category}</Badge>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">{selectedGame?.title}</h2>
                <p className="text-white/60 max-w-2xl text-lg">{selectedGame?.description}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Controller Mapping</p>
                <p className="text-sm font-bold text-orange-500 whitespace-nowrap">{selectedGame?.controls}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <Input
                type="text"
                placeholder="Search games..."
                className="w-full h-12 pl-12 bg-white/5 border-white/10 rounded-xl focus:ring-orange-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {error && (
              <Badge variant="outline" className="border-orange-500/20 text-orange-500/60 bg-orange-500/5 py-2 px-4 rounded-full">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </Badge>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${
                  selectedCategory === category
                    ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => handlePlay(game)}
                  className={`group cursor-pointer overflow-hidden transition-all duration-500 ${
                    selectedGame?.id === game.id 
                    ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' 
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    {selectedGame?.id === game.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-orange-500/20 backdrop-blur-[2px]">
                        <Badge className="bg-orange-500 text-white animate-pulse">NOW PLAYING</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg font-bold tracking-tight flex items-center justify-between">
                      {game.title}
                      <Play className={`w-4 h-4 ${selectedGame?.id === game.id ? 'text-orange-500 fill-current' : 'text-white/20'}`} />
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{game.category} • {game.players}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-black tracking-tighter uppercase">DailyDuel<span className="text-orange-500">.space</span></span>
          </div>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Quick local multiplayer games for one keyboard or device. No downloads, no accounts, just pure gaming.
          </p>
          <div className="mt-8 pt-8 border-t border-white/5 text-white/20 text-xs">
            &copy; {new Date().getFullYear()} DailyDuel.space. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <Dialog open={isAuthModalOpen} onOpenChange={(open) => {
        setIsAuthModalOpen(open);
        if (!open) {
          setIsRegisterSuccess(false);
          setAuthError(null);
        }
      }}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-sm">
          {!isRegisterSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                  {authMode === 'login' ? 'Welcome Back' : 'Join the Arena'}
                </DialogTitle>
                <DialogDescription className="text-white/40">
                  {authMode === 'login' ? 'Enter your credentials to continue.' : 'Create an account to start earning coins.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAuth} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Nick</label>
                  <div className="flex gap-2">
                    <Input 
                      required
                      placeholder="Enter your nick"
                      className={`bg-white/5 border-white/10 ${nickStatus === 'available' ? 'border-green-500/50' : nickStatus === 'taken' ? 'border-red-500/50' : ''}`}
                      value={authForm.nick}
                      onChange={(e) => {
                        setAuthForm({ ...authForm, nick: e.target.value });
                        setNickStatus('idle');
                      }}
                    />
                    {authMode === 'register' && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="border-white/10 text-xs"
                        onClick={checkNickAvailability}
                        disabled={isCheckingNick || authForm.nick.length < 2}
                      >
                        {isCheckingNick ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check'}
                      </Button>
                    )}
                  </div>
                  {nickStatus === 'available' && <p className="text-[10px] text-green-500 font-bold uppercase">Nick is available!</p>}
                  {nickStatus === 'taken' && <p className="text-[10px] text-red-500 font-bold uppercase">Nick is already taken</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Password</label>
                  <Input 
                    required
                    type="password"
                    placeholder="Min 5 characters"
                    className="bg-white/5 border-white/10"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>
                {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest">
                  {authMode === 'login' ? 'Login' : 'Register'}
                </Button>
              </form>
              <div className="text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-xs text-white/40 hover:text-orange-500 transition-colors"
                >
                  {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-orange-500">
                  Welcome, {authForm.nick}!
                </DialogTitle>
                <DialogDescription className="text-white/40">
                  Your account has been created successfully.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-orange-500 mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Account Recovery</span>
                  </div>
                  <p className="text-xs text-white/60 mb-4">
                    Add an email for account recovery. We promise <span className="text-white font-bold">no spam</span>, just security.
                  </p>
                  <p className="text-xs text-orange-500 font-bold mb-4 flex items-center gap-1">
                    <Coins className="w-3 h-3" /> Get 5 COINS for adding it now!
                  </p>
                  <form onSubmit={handleUpdateEmail} className="flex gap-2">
                    <Input 
                      type="email"
                      placeholder="your@email.com"
                      className="bg-black/50 border-white/10 h-9 text-sm"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    />
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold">Claim</Button>
                  </form>
                </div>
                <Button 
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
                >
                  Skip for now
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
              Your Profile
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Manage your account and rewards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Nick</p>
                <p className="text-xl font-black text-orange-500">{profile?.nick}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Balance</p>
                <div className="flex items-center gap-1 text-xl font-black">
                  <Coins className="w-5 h-5 text-orange-500" />
                  {profile?.coins}
                </div>
              </div>
            </div>

            {!profile?.has_rewarded_email && (
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Email Reward</span>
                </div>
                <p className="text-xs text-white/60 mb-4">Add an email for recovery and get <span className="text-orange-500 font-bold">100 COINS</span> instantly!</p>
                <form onSubmit={handleUpdateEmail} className="flex gap-2">
                  <Input 
                    type="email"
                    placeholder="your@email.com"
                    className="bg-black/50 border-white/10 h-9 text-sm"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  />
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold">Claim</Button>
                </form>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
