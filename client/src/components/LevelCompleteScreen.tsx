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
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-[90%] max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-2">
            {[...Array(3)].map((_, i) => (
              <Sparkles key={i} className="h-12 w-12 text-yellow-500 mx-1" />
            ))}
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Level Complete!</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="text-sm font-semibold mb-1">Level</h2>
              <p className="text-2xl font-bold">{level}</p>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="text-sm font-semibold mb-1">Score</h2>
              <p className="text-2xl font-bold">{score}</p>
            </div>
          </div>
          
          <p className="text-lg mb-2">Get ready for the next challenge!</p>
          <p className="text-muted-foreground text-sm">
            The obstacles will move faster and there will be more to avoid.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            size="lg" 
            onClick={onContinue}
            className="w-[200px]"
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LevelCompleteScreen;
