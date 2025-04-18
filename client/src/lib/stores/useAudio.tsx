import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  gruntSound: HTMLAudioElement | null;
  gameOverSound: HTMLAudioElement | null;
  wompWompSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setGruntSound: (sound: HTMLAudioElement) => void;
  setGameOverSound: (sound: HTMLAudioElement) => void;
  setWompWompSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playGrunt: () => void;
  playGameOver: () => void;
  playWompWomp: () => void;
  playBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  gruntSound: null,
  gameOverSound: null,
  wompWompSound: null,
  isMuted: false, // We want to hear sounds by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setGruntSound: (sound) => set({ gruntSound: sound }),
  setGameOverSound: (sound) => set({ gameOverSound: sound }),
  setWompWompSound: (sound) => set({ wompWompSound: sound }),
  
  toggleMute: () => {
    const { isMuted, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Handle background music
    if (backgroundMusic) {
      if (newMutedState) {
        backgroundMusic.pause();
      } else {
        // Try to play or resume background music
        backgroundMusic.play().catch(error => {
          console.error("Could not play background music:", error);
        });
      }
    }
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },

  playBackgroundMusic: () => {
    const { backgroundMusic, isMuted } = get();
    if (backgroundMusic && !isMuted) {
      console.log("Playing background music");
      backgroundMusic.play().catch(error => {
        console.error("Could not play background music:", error);
      });
    } else {
      console.log("Background music not played (muted or not set)");
    }
  },

  stopBackgroundMusic: () => {
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Use same pattern as other sounds that work correctly
      hitSound.currentTime = 0;
      hitSound.volume = 0.8; // Make it a bit louder
      console.log("Playing hit sound");
      hitSound.play().catch(error => {
        console.error("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.volume = 0.8; // Make it a bit louder
      console.log("Playing success sound");
      successSound.play().catch(error => {
        console.error("Success sound play prevented:", error);
      });
    }
  },
  
  playGrunt: () => {
    const { gruntSound, isMuted } = get();
    if (gruntSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Grunt sound skipped (muted)");
        return;
      }
      
      // This is the EXACT same implementation as playGameOver
      // which we know works correctly
      gruntSound.currentTime = 0;
      gruntSound.volume = 1.0; // Maximum volume
      console.log("Playing grunt sound exactly like game over sound");
      gruntSound.play().catch(error => {
        console.error("Grunt sound play prevented:", error);
      });
    }
  },
  
  playGameOver: () => {
    const { gameOverSound, isMuted } = get();
    if (gameOverSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Game over sound skipped (muted)");
        return;
      }
      
      gameOverSound.currentTime = 0;
      gameOverSound.play().catch(error => {
        console.error("Game over sound play prevented:", error);
      });
    }
  },
  
  playWompWomp: () => {
    const { wompWompSound, isMuted } = get();
    if (wompWompSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Womp womp sound skipped (muted)");
        return;
      }
      
      wompWompSound.currentTime = 0;
      wompWompSound.volume = 0.6; // Slightly louder for comic effect
      wompWompSound.play().catch(error => {
        console.error("Womp womp sound play prevented:", error);
      });
    }
  }
}));
