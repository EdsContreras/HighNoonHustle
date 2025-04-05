import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { useCustomization } from '../lib/stores/useCustomization';
import { 
  Accessory, 
  AccessoryType, 
  accessories, 
  getAccessoriesByType,
  getAccessoryById
} from '../game/data/accessories';
import '../styles/customization.css';

interface CustomizationScreenProps {
  onBack: () => void;
}

const CustomizationScreen: React.FC<CustomizationScreenProps> = ({ onBack }) => {
  // Preview canvas ref
  const previewRef = useRef<HTMLDivElement>(null);
  const [p5Instance, setP5Instance] = useState<p5 | null>(null);
  
  // Get state and actions from our customization store
  const { 
    selectedAccessories,
    unlockedAccessories,
    stats,
    selectAccessory,
    isAccessoryUnlocked
  } = useCustomization();
  
  // Track accessory types as a state for tabs or categories
  const accessoryTypes: AccessoryType[] = ['hat', 'bandana', 'vest', 'boots', 'gun', 'belt'];
  
  // Load p5 sketch for preview
  useEffect(() => {
    // Clean up any existing sketch
    if (p5Instance) {
      p5Instance.remove();
    }
    
    // Create new sketch for cowboy preview
    const sketch = (p: p5) => {
      const cowboyImage = p.loadImage('/assets/player.png');
      const accessoryImages: Record<string, p5.Image> = {};
      
      p.preload = () => {
        // Load the cowboy base image
        
        // Load accessory images
        accessories.forEach(acc => {
          accessoryImages[acc.id] = p.loadImage(acc.imagePath);
        });
      };
      
      p.setup = () => {
        // Create canvas that fits in the preview container
        const canvas = p.createCanvas(200, 200);
        canvas.addClass('preview-canvas');
      };
      
      p.draw = () => {
        p.background(139, 69, 19); // Brown background
        
        // Center the cowboy
        p.imageMode(p.CENTER);
        p.translate(p.width / 2, p.height / 2);
        
        // Draw base cowboy
        p.image(cowboyImage, 0, 0, 100, 100);
        
        // Draw accessories in the right order
        accessoryTypes.forEach(type => {
          const selectedId = selectedAccessories[type];
          if (selectedId) {
            const accessory = getAccessoryById(selectedId);
            if (accessory) {
              // Draw the accessory using its position data
              const { offsetX, offsetY, scale } = accessory.position;
              const img = accessoryImages[accessory.id];
              if (img) {
                p.image(img, offsetX, offsetY, img.width * scale, img.height * scale);
              }
            }
          }
        });
      };
    };
    
    // Create the p5 instance
    if (previewRef.current) {
      const newP5 = new p5(sketch, previewRef.current);
      setP5Instance(newP5);
    }
    
    // Clean up on unmount
    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, [selectedAccessories, previewRef]);
  
  // Helper to get unlock requirement text
  const getUnlockRequirement = (accessory: Accessory): string => {
    const { unlockCriteria } = accessory;
    
    if (unlockCriteria.type === 'score') {
      return `Score ${unlockCriteria.target} points`;
    } else if (unlockCriteria.type === 'level') {
      return `Reach level ${unlockCriteria.target}`;
    } else if (unlockCriteria.type === 'coins') {
      return `Collect ${unlockCriteria.target} coins`;
    }
    
    return 'Unlock condition unknown';
  };
  
  // Helper to get progress toward unlocking
  const getUnlockProgress = (accessory: Accessory): number => {
    const { unlockCriteria } = accessory;
    
    if (unlockCriteria.type === 'score') {
      return Math.min(100, (stats.highestScore / unlockCriteria.target) * 100);
    } else if (unlockCriteria.type === 'level') {
      return Math.min(100, (stats.highestLevel / unlockCriteria.target) * 100);
    } else if (unlockCriteria.type === 'coins') {
      return Math.min(100, (stats.coinsCollected / unlockCriteria.target) * 100);
    }
    
    return 0;
  };
  
  // Handle accessory selection
  const handleAccessoryClick = (type: AccessoryType, accessory: Accessory) => {
    // If already unlocked, equip/unequip it
    if (isAccessoryUnlocked(accessory.id)) {
      // If it's already selected, remove it
      if (selectedAccessories[type] === accessory.id) {
        selectAccessory(type, null);
      } else {
        // Otherwise, select it
        selectAccessory(type, accessory.id);
      }
    }
  };
  
  return (
    <div className="customization-screen">
      <h1 className="customization-header">Customize Your Cowboy</h1>
      <button className="customization-back-button" onClick={onBack}>
        Back to Game
      </button>
      
      <div className="customization-content">
        {/* Stats Display */}
        <div className="stats-container">
          <h2 className="stats-title">Your Stats</h2>
          <div className="stats-list">
            <div className="stat-item">
              <span>Highest Score:</span>
              <span>{stats.highestScore}</span>
            </div>
            <div className="stat-item">
              <span>Highest Level:</span>
              <span>{stats.highestLevel}</span>
            </div>
            <div className="stat-item">
              <span>Coins Collected:</span>
              <span>{stats.coinsCollected}</span>
            </div>
          </div>
        </div>
        
        {/* Preview Area */}
        <div className="preview-container">
          <div ref={previewRef}></div>
        </div>
        
        {/* Accessories Categories */}
        <div className="accessories-container">
          {accessoryTypes.map(type => (
            <div key={type} className="accessory-category">
              <h2 className="category-title">{type}</h2>
              <div className="accessory-list">
                {getAccessoriesByType(type).map(accessory => {
                  const isUnlocked = isAccessoryUnlocked(accessory.id);
                  const isSelected = selectedAccessories[type] === accessory.id;
                  
                  return (
                    <div 
                      key={accessory.id} 
                      className={`accessory-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
                      onClick={() => handleAccessoryClick(type, accessory)}
                    >
                      <img 
                        src={accessory.imagePath} 
                        alt={accessory.name} 
                        className="accessory-image" 
                      />
                      <div className="accessory-name">{accessory.name}</div>
                      
                      {!isUnlocked && (
                        <div className="tooltip">
                          <span className="lock-icon">🔒</span>
                          <span className="tooltip-text">
                            {getUnlockRequirement(accessory)}
                            <br />
                            Progress: {Math.floor(getUnlockProgress(accessory))}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Option to remove accessory */}
                <div 
                  className={`accessory-item ${selectedAccessories[type] === null ? 'selected' : ''}`}
                  onClick={() => selectAccessory(type, null)}
                >
                  <div className="accessory-name">None</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomizationScreen;