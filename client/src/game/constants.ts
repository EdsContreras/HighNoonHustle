// Game constants

// Canvas and scaling
export const BASE_WIDTH = 800;
export const BASE_HEIGHT = 600;
export const GRID_CELLS_X = 8; // Decreased from 10 to zoom in
export const GRID_CELLS_Y = 30; // Extended for scrolling
export const VISIBLE_CELLS_Y = 8; // Decreased from 10 to zoom in

// Player
export const PLAYER_WIDTH = 50; // Increased from 40
export const PLAYER_HEIGHT = 50; // Increased from 40
export const PLAYER_MOVE_COOLDOWN = 100; // ms between moves (reduced for better responsiveness)
export const PLAYER_MOVE_SPEED = 0.3; // movement speed (0.0-1.0, higher = faster)

// Game mechanics
export const STARTING_LIVES = 3;
export const POINTS_FOR_CROSSING = 100;
export const POINTS_FOR_MONEYBAG = 500; // Points for reaching a money bag
export const POINTS_FOR_COIN = 500; // Increased 10x from original 50
export const TIME_BONUS_FACTOR = 10;

// Coin settings
export const COIN_WIDTH = 40; // Increased from 30
export const COIN_HEIGHT = 40; // Increased from 30
export const COINS_PER_LANE = 3; // Average number of coins per lane

// Level design
export const INITIAL_OBSTACLE_SPEED = 1;
export const SPEED_INCREMENT_PER_LEVEL = 0.3;
export const MAX_OBSTACLE_SPEED = 5;

// Obstacle patterns and types
export enum ObstacleType {
  HORSE = 'horse',
  TUMBLEWEED = 'tumbleweed',
  TRAIN = 'train',
  CACTUS = 'cactus'
}

// Obstacle properties
export const OBSTACLE_PROPERTIES = {
  [ObstacleType.HORSE]: {
    width: 100, // Increased from 80
    height: 50, // Increased from 40
    speedMultiplier: 1.5,
    deadly: true
  },
  [ObstacleType.TUMBLEWEED]: {
    width: 50, // Increased from 40
    height: 50, // Increased from 40
    speedMultiplier: 2,
    deadly: true
  },
  [ObstacleType.TRAIN]: {
    width: 160, // Increased from 140
    height: 70, // Increased from 60
    speedMultiplier: 0.8,
    deadly: true
  },
  [ObstacleType.CACTUS]: {
    width: 50, // Increased from 40
    height: 70, // Increased from 60
    speedMultiplier: 0,
    deadly: true
  }
};

// Colors
export const COLORS = {
  BACKGROUND: '#e4d7a8', // sandy background
  SAFE_ZONE: '#c2b280', // lighter sand
  ROAD: '#a67c52', // dirt road
  RIVER: '#4a74a8', // water
  MONEYBAG: '#daa520', // golden color
  TEXT: '#543a1c', // dark brown
  SCORE: '#543a1c',
  LIVES: '#8c2f20' // reddish brown
};

// Control keys
export const KEYS = {
  UP: 38, // Arrow Up
  DOWN: 40, // Arrow Down
  LEFT: 37, // Arrow Left
  RIGHT: 39, // Arrow Right
  W: 87, // W
  S: 83, // S
  A: 65, // A
  D: 68, // D
};

// Game states
export enum GameState {
  START = 'start',
  PLAYING = 'playing',
  LEVEL_COMPLETE = 'levelComplete',
  GAME_OVER = 'gameOver',
  VICTORY = 'victory'
}

// Level data
export interface LevelConfig {
  lanes: LaneConfig[];
  goalCount: number;
  timeLimit: number; // in seconds
}

export interface LaneConfig {
  type: 'road' | 'river' | 'safe';
  direction: 'left' | 'right';
  obstacleType?: ObstacleType;
  obstacleFrequency?: number; // Obstacles per second
  obstacleSpeedMultiplier?: number; // Multiplier on the base speed
}

// Level definitions
export const LEVELS: Record<number, LevelConfig> = {
  1: {
    lanes: [
      { type: 'safe', direction: 'left' }, // Starting zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.15 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'right', obstacleType: ObstacleType.TUMBLEWEED, obstacleFrequency: 0.2 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.15 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'right', obstacleType: ObstacleType.TRAIN, obstacleFrequency: 0.1 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.TUMBLEWEED, obstacleFrequency: 0.2 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'right', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.15 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.TRAIN, obstacleFrequency: 0.1 },
      { type: 'safe', direction: 'left' } // Goal zone
    ],
    goalCount: 3,
    timeLimit: 90,
  },
  2: {
    lanes: [
      { type: 'safe', direction: 'left' }, // Starting zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.2 },
      { type: 'road', direction: 'right', obstacleType: ObstacleType.TUMBLEWEED, obstacleFrequency: 0.25 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.TRAIN, obstacleFrequency: 0.15 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'right', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.2 },
      { type: 'road', direction: 'left', obstacleType: ObstacleType.TUMBLEWEED, obstacleFrequency: 0.3 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'right', obstacleType: ObstacleType.TRAIN, obstacleFrequency: 0.15 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.25 },
      { type: 'road', direction: 'right', obstacleType: ObstacleType.TUMBLEWEED, obstacleFrequency: 0.2 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.TRAIN, obstacleFrequency: 0.15 },
      { type: 'safe', direction: 'left' } // Goal zone
    ],
    goalCount: 4,
    timeLimit: 120,
  },
  3: {
    lanes: [
      { type: 'safe', direction: 'left' }, // Starting zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.25 },
      { type: 'road', direction: 'right', obstacleType: ObstacleType.TUMBLEWEED, obstacleFrequency: 0.3 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.TRAIN, obstacleFrequency: 0.2 },
      { type: 'road', direction: 'right', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.25 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.TUMBLEWEED, obstacleFrequency: 0.3 },
      { type: 'road', direction: 'right', obstacleType: ObstacleType.TRAIN, obstacleFrequency: 0.2 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.25 },
      { type: 'road', direction: 'right', obstacleType: ObstacleType.TUMBLEWEED, obstacleFrequency: 0.35 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.TRAIN, obstacleFrequency: 0.2 },
      { type: 'road', direction: 'right', obstacleType: ObstacleType.HORSE, obstacleFrequency: 0.3 },
      { type: 'safe', direction: 'left' }, // Safe zone
      { type: 'road', direction: 'left', obstacleType: ObstacleType.TUMBLEWEED, obstacleFrequency: 0.35 },
      { type: 'road', direction: 'right', obstacleType: ObstacleType.TRAIN, obstacleFrequency: 0.25 },
      { type: 'safe', direction: 'left' } // Goal zone
    ],
    goalCount: 5,
    timeLimit: 150,
  },
  // Add more levels as needed
};
