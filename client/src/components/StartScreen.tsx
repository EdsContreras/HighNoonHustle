import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-[90%] max-w-md">
        <CardContent className="pt-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Western Frogger</h1>
          <p className="mb-6">
            Help your cowboy navigate through the endless dangers of the wild west! See how far you can go in this infinite scrolling adventure.
          </p>

          <div className="mb-6 text-left">
            <h2 className="text-xl font-bold mb-2">How to Play:</h2>
            <ul className="list-disc pl-5">
              <li>Use arrow keys or WASD to move your cowboy</li>
              <li>Avoid horses, trains, and tumbleweeds</li>
              <li>Collect gold coins for extra points</li>
              <li>Travel as far as possible until you run out of lives</li>
              <li>The game gets more difficult the farther you go!</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            size="lg" 
            className="w-[200px]"
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
