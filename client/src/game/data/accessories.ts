// Define types of accessories
export type AccessoryType = 'hat' | 'bandana' | 'vest' | 'boots' | 'gun' | 'belt';

// Define the unlock criteria
export type UnlockCriterion = 
  | { type: 'score'; target: number } 
  | { type: 'level'; target: number } 
  | { type: 'coins'; target: number };

// Define the accessory data structure
export interface Accessory {
  id: string;
  name: string;
  description: string;
  type: AccessoryType;
  imagePath: string;
  unlockCriteria: UnlockCriterion;
  position: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
}

// Accessories data
export const accessories: Accessory[] = [
  {
    id: 'hat_cowboy',
    name: 'Cowboy Hat',
    description: 'A classic western hat',
    type: 'hat',
    imagePath: '/assets/accessories/hat.svg',
    unlockCriteria: { type: 'score', target: 0 }, // Available from the start
    position: {
      offsetX: 0,
      offsetY: -20,
      scale: 0.5
    }
  },
  {
    id: 'bandana_red',
    name: 'Red Bandana',
    description: 'Keeps the dust out of your face',
    type: 'bandana',
    imagePath: '/assets/accessories/bandana.svg',
    unlockCriteria: { type: 'score', target: 1000 },
    position: {
      offsetX: 0,
      offsetY: -5,
      scale: 0.4
    }
  },
  {
    id: 'vest_leather',
    name: 'Leather Vest',
    description: 'Stylish protection for a gunslinger',
    type: 'vest',
    imagePath: '/assets/accessories/vest.svg',
    unlockCriteria: { type: 'score', target: 2500 },
    position: {
      offsetX: 0,
      offsetY: 10,
      scale: 0.5
    }
  },
  {
    id: 'boots_spurred',
    name: 'Spurred Boots',
    description: 'Makes that classic cowboy sound when you walk',
    type: 'boots',
    imagePath: '/assets/accessories/boots.svg',
    unlockCriteria: { type: 'level', target: 2 },
    position: {
      offsetX: 0,
      offsetY: 30,
      scale: 0.4
    }
  },
  {
    id: 'gun_revolver',
    name: 'Six-shooter',
    description: 'Every cowboy needs a trusty revolver',
    type: 'gun',
    imagePath: '/assets/accessories/gun.svg',
    unlockCriteria: { type: 'level', target: 3 },
    position: {
      offsetX: 20,
      offsetY: 15,
      scale: 0.3
    }
  },
  {
    id: 'belt_gold',
    name: 'Gold Buckle Belt',
    description: 'Show off your rodeo champion status',
    type: 'belt',
    imagePath: '/assets/accessories/belt.svg',
    unlockCriteria: { type: 'coins', target: 5 },
    position: {
      offsetX: 0,
      offsetY: 20,
      scale: 0.4
    }
  }
];

// Helper function to get accessories by type
export const getAccessoriesByType = (type: AccessoryType): Accessory[] => {
  return accessories.filter(accessory => accessory.type === type);
};

// Helper function to get accessory by ID
export const getAccessoryById = (id: string): Accessory | undefined => {
  return accessories.find(accessory => accessory.id === id);
};