import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/yourCowboyHorseImage.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Semi-transparent overlay to improve text legibility */}
      <div className="absolute inset-0 bg-black/20" />
      
      <Card className="relative w-[90%] max-w-md border-2 border-amber-800 bg-black/50 text-white shadow-2xl z-10">
        <CardContent className="pt-6 text-center">
          <h1 className="text-4xl font-bold mb-2 text-amber-500">Western Frogger</h1>
          <p className="mb-4 text-amber-200">
            Help your cowboy navigate through the dangerous wild west. Avoid obstacles and reach the goals!
          </p>

          <div className="mb-6 text-left bg-black/40 border border-amber-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2 text-amber-300">How to Play:</h2>
            <ul className="list-disc pl-5 text-amber-200">
              <li>Use arrow keys or WASD to move your cowboy</li>
              <li>Avoid horses, trains, and tumbleweeds</li>
              <li>Collect gold coins for extra points</li>
              <li>Reach the green goal areas at the top</li>
              <li>Complete levels by filling all goals</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            size="lg" 
            className="w-[200px] bg-amber-700 hover:bg-amber-600 text-white border border-amber-500"
            onClick={onStart}
          >
            Start Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StartScreen;
