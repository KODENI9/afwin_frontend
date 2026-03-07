const playSound = (type: 'bet' | 'win' | 'lose') => {
  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.volume = 0.5;
  audio.play().catch(err => console.warn("Audio play blocked by browser:", err));
};

export const useSound = () => {
  return {
    playBet: () => playSound('bet'),
    playWin: () => playSound('win'),
    playLose: () => playSound('lose'),
  };
};
