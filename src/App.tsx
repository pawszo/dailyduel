import { useState, useMemo, useEffect } from 'react';
import { Search, Gamepad2, Users, Keyboard, Play, X, Info, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  const [isGameOpen, setIsGameOpen] = useState(false);

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
        
        if (data && data.length > 0) {
          setGames(data);
        } else {
          setGames(fallbackGames);
        }
      } catch (err: any) {
        console.error('Error fetching games:', err);
        // Don't block the UI, just use fallbacks and show a subtle warning
        setGames(fallbackGames);
        setError('Using local collection (Supabase not connected)');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  const filteredGames = useMemo(() => {
    return games.filter(game => 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [games, searchQuery]);

  const handlePlay = (game: Game) => {
    setSelectedGame(game);
    setIsGameOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-orange-500/10 to-transparent pt-16 pb-24">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="outline" className="border-orange-500/50 text-orange-500 bg-orange-500/5 px-3 py-1">
                <Users className="w-3 h-3 mr-2" />
                Local Multiplayer
              </Badge>
              <Badge variant="outline" className="border-white/20 text-white/60 bg-white/5 px-3 py-1">
                <Keyboard className="w-3 h-3 mr-2" />
                One Device
              </Badge>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 uppercase leading-[0.85]">
              DuoPlay <span className="text-orange-500">Arcade</span>
            </h1>
            <p className="text-xl text-white/60 max-w-xl leading-relaxed">
              Instant local multiplayer games for you and a friend. No downloads, no accounts, just pure gaming on one keyboard.
            </p>
          </motion.div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-orange-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/2 w-96 h-96 bg-blue-500 rounded-full blur-[150px]" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 -mt-12 pb-24">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-16">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-white/40" />
          </div>
          <Input
            type="text"
            placeholder="Search games or categories..."
            className="w-full h-16 pl-12 pr-4 bg-white/5 border-white/10 rounded-2xl text-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-white/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <p className="text-white/40 font-medium">Loading arcade collection...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Connection Error</h3>
            <p className="text-white/60 mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-white text-black hover:bg-white/90"
            >
              Retry Connection
            </Button>
          </div>
        )}

        {/* Games Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="group bg-white/5 border-white/10 overflow-hidden hover:border-orange-500/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-orange-500 text-white border-none">{game.category}</Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-2xl font-bold tracking-tight text-white group-hover:text-orange-500 transition-colors">
                          {game.title}
                        </CardTitle>
                        <div className="flex items-center text-white/40 text-sm">
                          <Users className="w-4 h-4 mr-1" />
                          {game.players}
                        </div>
                      </div>
                      <CardDescription className="text-white/50 text-base leading-relaxed mt-2">
                        {game.description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col items-stretch gap-4 pt-0">
                      <div className="flex items-center gap-2 text-xs font-mono text-white/30 bg-white/5 p-3 rounded-lg border border-white/5">
                        <Keyboard className="w-4 h-4" />
                        {game.controls}
                      </div>
                      <Button 
                        onClick={() => handlePlay(game)}
                        className="w-full h-12 bg-white text-black hover:bg-orange-500 hover:text-white transition-all font-bold text-lg rounded-xl group/btn"
                      >
                        <Play className="w-5 h-5 mr-2 fill-current group-hover/btn:scale-110 transition-transform" />
                        PLAY NOW
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && !error && filteredGames.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <Gamepad2 className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white/40">No games found matching "{searchQuery}"</h3>
            <Button 
              variant="link" 
              className="text-orange-500 mt-2"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          </motion.div>
        )}
      </main>

      {/* Game Player Dialog */}
      <Dialog open={isGameOpen} onOpenChange={setIsGameOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] bg-[#0a0a0a] border-white/10 p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 border-b border-white/10 flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-orange-500" />
                {selectedGame?.title}
              </DialogTitle>
              <DialogDescription className="text-white/40">
                {selectedGame?.controls}
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsGameOpen(false)}
              className="hover:bg-white/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-black relative">
            {selectedGame && (
              <iframe
                src={selectedGame.url}
                className="w-full h-full border-none"
                title={selectedGame.title}
              />
            )}
          </div>
          <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Info className="w-4 h-4" />
                Press F11 for Fullscreen
              </div>
            </div>
            <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setIsGameOpen(false)}>
              Back to Arcade
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-black tracking-tighter uppercase">DuoPlay</span>
          </div>
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} DuoPlay Arcade. Built for local multiplayer fun.
          </p>
        </div>
      </footer>
    </div>
  );
}
