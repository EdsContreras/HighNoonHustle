import React from "react";
import { HeartCrack } from "lucide-react";

interface HUDProps {
  score: number;
  level: number;
  lives: number;
  collectedCoins?: number;
  requiredCoins?: number;
}

const HUD: React.FC<HUDProps> = ({ score, level, lives, collectedCoins = 0, requiredCoins = 0 }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex flex-wrap justify-between pointer-events-none">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2 mb-2">
        <span className="text-white font-bold">Level: {level}</span>
      </div>

      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2 mb-2">
        <span className="text-white font-bold">Score: {score}</span>
      </div>

      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center mb-2">
        {[...Array(lives)].map((_, i) => (
          <HeartCrack key={i} className="h-5 w-5 text-red-500 mx-0.5" />
        ))}
      </div>
      
      {requiredCoins > 0 && (
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2 mb-2 mx-auto">
          <span className="text-amber-400 font-bold">
            Money Bags: {collectedCoins}/{requiredCoins}
          </span>
          <div className="w-16 h-2 bg-gray-700 rounded overflow-hidden">
            <div 
              className="h-full bg-amber-400" 
              style={{ 
                width: `${Math.min(100, (collectedCoins / requiredCoins) * 100)}%`,
                transition: "width 0.3s ease-in-out" 
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HUD;
