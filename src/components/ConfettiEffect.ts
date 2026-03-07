import confetti from 'canvas-confetti';

export const fireWinConfetti = () => {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // Gold and yellow colors for premium feel
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500', '#B8860B'] });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500', '#B8860B'] });
  }, 250);
};

export const fireSingleBlast = () => {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FFA500', '#B8860B']
  });
};
