import beep1 from '../assets/beep1.mp3';
import beep2 from '../assets/beep2.mp3';
import blip from '../assets/blip.mp3';
import error from '../assets/error.mp3';
import levelUp from '../assets/level-up.mp3';

// Export for settings
export const sounds = {
  'None': null,
  'Beep 1': beep1,
  'Beep 2': beep2,
  'Blip': blip,
  'Level up': levelUp,
};

// Internal sounds for success/error
const systemSounds = {
  ...sounds,
  success: blip, // Use existing blip sound for success
  error: error, // Use existing error sound
};

export function playSound(type: keyof typeof systemSounds) {
  const sound = systemSounds[type];
  if (sound) {
    const audio = new Audio(sound);
    audio.currentTime = 0; // Reset the sound to start
    audio.play().catch(err => {
      // Ignore errors from browsers that block autoplay
      console.warn('Failed to play sound:', err);
    });
  }
}

export function playErrorSound() {
  new Audio(error).play();
}
