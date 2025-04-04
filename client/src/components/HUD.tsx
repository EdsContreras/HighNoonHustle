import React from "react";
import { HeartCrack } from "lucide-react";

interface HUDProps {
  score: number;
  level: number;
  lives: number;
}

const HUD: React.FC<HUDProps> = ({ score, level, lives }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-5 flex justify-between pointer-events-none">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-2">
        <span className="text-white font-bold text-xl">Level: {level}</span>
      </div>

      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-2">
        <span className="text-white font-bold text-xl">Score: {score}</span>
      </div>

      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 flex items-center">
        {[...Array(lives)].map((_, i) => (
          <HeartCrack key={i} className="h-7 w-7 text-red-500 mx-1" />
        ))}
      </div>
    </div>
  );
};

export default HUD;
