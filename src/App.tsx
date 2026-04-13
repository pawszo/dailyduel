import { useState, useMemo, useEffect } from 'react';
import { Search, Gamepad2, Users, Keyboard, Play, X, Info, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

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

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-black tracking-tighter uppercase">DailyDuel<span className="text-orange-500">.space</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
            <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Local Multiplayer</span>
            <span className="flex items-center gap-2"><Keyboard className="w-4 h-4" /> One Keyboard</span>
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
    </div>
  );
}
