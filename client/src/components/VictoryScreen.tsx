import React from 'react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { PartyPopper, Trophy } from 'lucide-react';

interface VictoryScreenProps {
  finalScore: number;
  onRestart: () => void;
  showLeaderboard: () => void;
}

const VictoryScreen: React.FC<VictoryScreenProps> = ({ 
  finalScore, 
  onRestart,
  showLeaderboard
}) => {
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/VictoryBackground.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Semi-transparent overlay to improve text legibility */}
      <div className="absolute inset-0 bg-black/20" />
      
      <Card className="relative w-[90%] max-w-md border-2 border-amber-800 bg-black/50 text-white shadow-2xl z-10">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="h-16 w-16 text-amber-400" />
          </div>
          
          <h1 className="text-4xl font-bold mb-2 text-amber-500">VICTORY!</h1>
          <p className="text-lg mb-4 text-amber-200">You've escaped with the loot, outlaw!</p>
          
          <div className="flex justify-center mb-4">
            {[...Array(3)].map((_, i) => (
              <PartyPopper key={i} className="h-8 w-8 text-amber-400 mx-1" />
            ))}
          </div>

          <div className="bg-black/40 border border-amber-800 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2 text-amber-300">Final Score</h2>
            <p className="text-3xl font-bold text-amber-400">{finalScore}</p>
          </div>

          <p className="text-amber-200 italic">
            "The West will remember your name, partner. Your legend will echo through the canyons for generations to come."
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 items-center">
          <Button 
            size="lg" 
            onClick={onRestart} 
            className="w-[200px] bg-amber-700 hover:bg-amber-600 text-white border border-amber-500"
          >
            Play Again
          </Button>
          <Button 
            size="default" 
            onClick={showLeaderboard} 
            className="w-[200px] bg-amber-900 hover:bg-amber-800 text-white border border-amber-600"
          >
            View Leaderboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VictoryScreen;