import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface LevelCompleteScreenProps {
  level: number;
  score: number;
  onContinue: () => void;
}

const LevelCompleteScreen: React.FC<LevelCompleteScreenProps> = ({ 
  level, 
  score, 
  onContinue 
}) => {
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/IntroBackground.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Semi-transparent overlay to improve text legibility */}
      <div className="absolute inset-0 bg-black/20" />
      
      <Card className="relative w-[90%] max-w-md border-2 border-amber-800 bg-black/50 text-white shadow-2xl z-10">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-2">
            {[...Array(3)].map((_, i) => (
              <Sparkles key={i} className="h-12 w-12 text-amber-400 mx-1" />
            ))}
          </div>
          
          <h1 className="text-4xl font-bold mb-4 text-amber-500">Escaped Level {level}!</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/40 border border-amber-800 p-4 rounded-lg">
              <h2 className="text-sm font-semibold mb-1 text-amber-300">Level</h2>
              <p className="text-2xl font-bold text-amber-400">{level}</p>
            </div>
            
            <div className="bg-black/40 border border-amber-800 p-4 rounded-lg">
              <h2 className="text-sm font-semibold mb-1 text-amber-300">Score</h2>
              <p className="text-2xl font-bold text-amber-400">{score}</p>
            </div>
          </div>
          
          <p className="text-lg mb-2 text-amber-200">The sheriff is hot on your trail!</p>
          <p className="text-amber-300/80 text-sm">
            The next town will be more dangerous. Stay alert, pardner!
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            size="lg" 
            onClick={onContinue}
            className="w-[200px] bg-amber-700 hover:bg-amber-600 text-white border border-amber-500"
          >
            Continue to Level {level + 1}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LevelCompleteScreen;
