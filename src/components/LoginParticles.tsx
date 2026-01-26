import { useMemo } from 'react';

interface Particle {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: number;
  color: string;
  rotation: number;
  direction: number; // -1 or 1 for random wind direction
}

interface LoginParticlesProps {
  count: number;
}

export default function LoginParticles({ count }: LoginParticlesProps) {
  // We use a fixed pool of particles that are always rendered but toggled by opacity
  // This allows them to "persist" (loop) while typing exists
  // And "fade out" gracefully when deleted

  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${4 + Math.random() * 4}s`,
      size: 8 + Math.random() * 10,
      color: ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#34d399', '#2dd4bf'][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
      direction: Math.random() > 0.5 ? 1 : -1
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, index) => {
        // Active if the index is within the current count
        const isActive = index < count;

        return (
          <div
            key={p.id}
            // Transition Opacity: Fades in when typing, Fades out handling deletion
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
          >
            <div
              className={`absolute top-[-20px] opacity-0 blur-[0.5px] ${p.direction > 0 ? 'animate-wind-leaf-right' : 'animate-wind-leaf-left'}`}
              style={{
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
                borderRadius: '2px 70% 2px 70%', // Leaf shape
                boxShadow: `0 0 ${p.size}px ${p.color}`,
                transform: `rotate(${p.rotation}deg)`
              } as React.CSSProperties}
            />
          </div>
        );
      })}
      <style jsx>{`
        @keyframes wind-leaf-right {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(10vh) translateX(10px) rotate(45deg);
          }
          40% {
            transform: translateY(40vh) translateX(30px) rotate(120deg);
          }
          70% {
            transform: translateY(70vh) translateX(10px) rotate(240deg);
          }
          100% {
            transform: translateY(105vh) translateX(40px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes wind-leaf-left {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(10vh) translateX(-10px) rotate(-45deg);
          }
          40% {
            transform: translateY(40vh) translateX(-30px) rotate(-120deg);
          }
          70% {
            transform: translateY(70vh) translateX(-10px) rotate(-240deg);
          }
          100% {
            transform: translateY(105vh) translateX(-40px) rotate(-360deg);
            opacity: 0;
          }
        }
        .animate-wind-leaf-right {
          animation-name: wind-leaf-right;
          animation-timing-function: linear;
          animation-iteration-count: infinite; /* Loop continuously */
        }
        .animate-wind-leaf-left {
          animation-name: wind-leaf-left;
          animation-timing-function: linear;
          animation-iteration-count: infinite; /* Loop continuously */
        }
      `}</style>
    </div>
  );
}
