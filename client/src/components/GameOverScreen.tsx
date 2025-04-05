import React, { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skull } from "lucide-react";

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
  showLeaderboard: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  onRestart,
  showLeaderboard,
}) => {
  const [qualifiesForHighScore, setQualifiesForHighScore] = useState(false);
  
  // Check if player qualifies for high score entry
  useEffect(() => {
    const isQualified = sessionStorage.getItem('qualifiesForHighScore') === 'true';
    setQualifiesForHighScore(isQualified);
    
    if (isQualified) {
      console.log("Game over screen: Player qualifies for high score entry");
    }
  }, []);
  
  // Handler for "Next" button - redirects to high score entry
  const handleNextClick = () => {
    console.log("Next button clicked, redirecting to high score entry");
    // Trigger high score state in Game component
    window.dispatchEvent(new CustomEvent('show-high-score-entry'));
  };
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/EndBackground.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Semi-transparent overlay to improve text legibility */}
      <div className="absolute inset-0 bg-black/20" />
      
      <Card className="relative w-[90%] max-w-md border-2 border-amber-800 bg-black/50 text-white shadow-2xl z-10">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-2">
            <Skull className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-amber-500">High Noon Hustle</h1>
          <p className="text-lg mb-4 text-amber-200">GAME OVER OUTLAW: The sheriff caught you!</p>

          <div className="bg-black/40 border border-amber-800 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2 text-amber-300">Final Score</h2>
            <p className="text-3xl font-bold text-amber-400">{score}</p>
          </div>

          <p className="text-amber-200 italic">
            "It ain't about how hard ya hit. It's about how hard you can get hit
            and keep moving forward."
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 items-center">
          {qualifiesForHighScore ? (
            <Button 
              size="lg"
              onClick={handleNextClick}
              className="w-[200px] bg-green-700 hover:bg-green-600 text-white border border-green-500 animate-pulse"
            >
              Next
            </Button>
          ) : (
            <Button 
              size="lg" 
              onClick={onRestart} 
              className="w-[200px] bg-amber-700 hover:bg-amber-600 text-white border border-amber-500"
            >
              Try Again
            </Button>
          )}
          
          {!qualifiesForHighScore && (
            <Button 
              size="default" 
              onClick={showLeaderboard} 
              className="w-[200px] bg-amber-900 hover:bg-amber-800 text-white border border-amber-600"
            >
              View Leaderboard
            </Button>
          )}
          
          {qualifiesForHighScore && (
            <p className="text-green-400 text-sm mt-2">
              New high score! Click Next to enter your name
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameOverScreen;
