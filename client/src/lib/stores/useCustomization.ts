import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AccessoryType, 
  getAccessoryById, 
  accessories
} from '../../game/data/accessories';

interface CustomizationState {
  // Map of accessory types to selected accessory IDs
  selectedAccessories: Record<AccessoryType, string | null>;
  
  // Map of unlocked accessory IDs
  unlockedAccessories: Set<string>;
  
  // Game stats for tracking unlocks
  stats: {
    highestScore: number;
    highestLevel: number;
    coinsCollected: number;
  };
  
  // Actions
  selectAccessory: (type: AccessoryType, id: string | null) => void;
  unlockAccessory: (id: string) => void;
  updateStats: (stats: Partial<CustomizationState['stats']>) => void;
  isAccessoryUnlocked: (id: string) => boolean;
}

// Configure which accessory types can be worn together
const compatibleAccessories: Record<AccessoryType, AccessoryType[]> = {
  hat: ['bandana', 'vest', 'boots', 'gun', 'belt'],
  bandana: ['hat', 'vest', 'boots', 'gun', 'belt'],
  vest: ['hat', 'bandana', 'boots', 'gun', 'belt'],
  boots: ['hat', 'bandana', 'vest', 'gun', 'belt'],
  gun: ['hat', 'bandana', 'vest', 'boots', 'belt'],
  belt: ['hat', 'bandana', 'vest', 'boots', 'gun']
};

// Create the store with persistence
export const useCustomization = create<CustomizationState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedAccessories: {
        hat: 'hat_cowboy', // Start with the default cowboy hat
        bandana: null,
        vest: null,
        boots: null,
        gun: null,
        belt: null
      },
      unlockedAccessories: new Set(['hat_cowboy']), // Start with the default cowboy hat unlocked
      stats: {
        highestScore: 0,
        highestLevel: 1,
        coinsCollected: 0
      },
      
      // Select an accessory of a particular type
      selectAccessory: (type: AccessoryType, id: string | null) => {
        set((state) => ({
          selectedAccessories: {
            ...state.selectedAccessories,
            [type]: id
          }
        }));
      },
      
      // Unlock a new accessory
      unlockAccessory: (id: string) => {
        set((state) => {
          // Create a new Set to ensure state update triggers
          const newUnlockedAccessories = new Set(state.unlockedAccessories);
          newUnlockedAccessories.add(id);
          
          return {
            unlockedAccessories: newUnlockedAccessories
          };
        });
      },
      
      // Update game stats (highest score, level, coins collected)
      updateStats: (newStats: Partial<CustomizationState['stats']>) => {
        set((state) => {
          // Create updated stats object
          const updatedStats = {
            ...state.stats,
            highestScore: Math.max(state.stats.highestScore, newStats.highestScore || 0),
            highestLevel: Math.max(state.stats.highestLevel, newStats.highestLevel || 0),
            coinsCollected: state.stats.coinsCollected + (newStats.coinsCollected || 0)
          };
          
          // Check if any new accessories should be unlocked based on the updated stats
          const newUnlockedAccessories = new Set(state.unlockedAccessories);
          let hasNewUnlocks = false;
          
          accessories.forEach(accessory => {
            // Skip if already unlocked
            if (newUnlockedAccessories.has(accessory.id)) return;
            
            // Check unlock criteria
            const { unlockCriteria } = accessory;
            let shouldUnlock = false;
            
            if (unlockCriteria.type === 'score' && updatedStats.highestScore >= unlockCriteria.target) {
              shouldUnlock = true;
            } else if (unlockCriteria.type === 'level' && updatedStats.highestLevel >= unlockCriteria.target) {
              shouldUnlock = true;
            } else if (unlockCriteria.type === 'coins' && updatedStats.coinsCollected >= unlockCriteria.target) {
              shouldUnlock = true;
            }
            
            if (shouldUnlock) {
              newUnlockedAccessories.add(accessory.id);
              hasNewUnlocks = true;
            }
          });
          
          return {
            stats: updatedStats,
            unlockedAccessories: hasNewUnlocks ? newUnlockedAccessories : state.unlockedAccessories
          };
        });
      },
      
      // Check if an accessory is unlocked
      isAccessoryUnlocked: (id: string) => {
        return get().unlockedAccessories.has(id);
      }
    }),
    {
      name: 'cowboy-customization', // Local storage key
      // Convert Set to array for serialization and back
      partialize: (state) => ({
        ...state,
        unlockedAccessories: Array.from(state.unlockedAccessories)
      }),
      // Convert array back to Set on hydration
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.unlockedAccessories)) {
          state.unlockedAccessories = new Set(state.unlockedAccessories);
        }
      }
    }
  )
);