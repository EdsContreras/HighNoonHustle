import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skull } from "lucide-react";

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  onRestart,
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-[90%] max-w-md bg-background/95">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-2">
            <Skull className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold mb-2">End of the Trail</h1>
          <p className="text-lg mb-4">Your endless journey through the wild west has come to an end!</p>

          <div className="bg-muted p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Final Score</h2>
            <p className="text-3xl font-bold">{score}</p>
            <p className="text-sm mt-2">How far can you make it next time?</p>
          </div>

          <p className="text-muted-foreground italic">
            "The trail goes on forever, and the party never ends. Saddle up cowboy, and try again!"
          </p>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button size="lg" onClick={onRestart} className="w-[200px]">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameOverScreen;
