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
            Help your cowboy navigate through the dangerous wild west. Avoid obstacles and reach the goals!
          </p>

          <div className="mb-6 text-left">
            <h2 className="text-xl font-bold mb-2">How to Play:</h2>
            <ul className="list-disc pl-5">
              <li>Use arrow keys or WASD to move your cowboy</li>
              <li>Avoid horses, stagecoaches, and tumbleweeds</li>
              <li>Reach the green goal areas at the top</li>
              <li>Complete levels by filling all goals</li>
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
