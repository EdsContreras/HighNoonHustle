import React from "react";
import { HeartCrack } from "lucide-react";

interface HUDProps {
  score: number;
  level: number;
  lives: number;
}

const HUD: React.FC<HUDProps> = ({ score, level, lives }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between pointer-events-none">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2">
        <span className="text-white font-bold">Level: {level}</span>
      </div>

      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2">
        <span className="text-white font-bold">Score: {score}</span>
      </div>

      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center">
        {[...Array(Math.max(0, lives))].map((_, i) => (
          <HeartCrack key={i} className="h-5 w-5 text-red-500 mx-0.5" />
        ))}
      </div>
    </div>
  );
};

export default HUD;
