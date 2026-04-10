import { useCallback } from "react";

// Utilisation de liens CDN pour des sons libres de droits (ex: Pixabay)
const SOUND_URLS = {
  bet: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", // Click/Select
  win: "https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3", // Win Fanfare
  lose: "https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3",  // Lose / Fail
  tick: "https://assets.mixkit.co/active_storage/sfx/2556/2556-preview.mp3", // Clock tick
  roll: "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3", // Slot roll
  shimmer: "https://assets.mixkit.co/active_storage/sfx/1118/1118-preview.mp3" // Background ambiant
};

const playAudio = (url: string, volume = 0.5, loop = false) => {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.loop = loop;
  audio.play().catch(err => {
    // Les navigateurs bloquent souvent l'audio auto-play sans interaction
    console.debug("Audio play deferred or blocked:", err.message);
  });
  return audio;
};

export const useSound = () => {
  const playBet = useCallback(() => playAudio(SOUND_URLS.bet), []);
  const playWin = useCallback(() => playAudio(SOUND_URLS.win, 0.7), []);
  const playLose = useCallback(() => playAudio(SOUND_URLS.lose, 0.4), []);
  const playTick = useCallback(() => playAudio(SOUND_URLS.tick, 0.3), []);
  const playRoll = useCallback(() => playAudio(SOUND_URLS.roll, 0.5), []);
  
  return {
    playBet,
    playWin,
    playLose,
    playTick,
    playRoll
  };
};
