"use client";

import { useMemo } from 'react';

export default function ActiveItemEffect() {
    const particles = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            delay: (i * 0.4),
            duration: 4 + Math.random() * 2,
            size: Math.random() * 2.5 + 2,
            opacity: Math.random() * 0.3 + 0.6,
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            {/* Background Base Glow */}
            <div className="absolute inset-0 bg-active-bg" />

            {/* Particle Wave */}
            <div className="absolute inset-0">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute rounded-full animate-particle-wave"
                        style={{
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            left: 0,
                            top: '50%',
                            opacity: 0,
                            backgroundColor: 'var(--active-text)',
                            boxShadow: `0 0 4px var(--active-icon-glow), 0 0 10px var(--active-icon-glow), 0 0 20px var(--active-icon-glow)`,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes particle-wave-move {
                    0% {
                        transform: translate3d(-30px, -50%, 0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.8;
                    }
                    25% {
                        transform: translate3d(70px, calc(-50% - 6px), 0);
                    }
                    50% {
                        transform: translate3d(150px, calc(-50% + 6px), 0);
                    }
                    75% {
                        transform: translate3d(220px, calc(-50% - 6px), 0);
                    }
                    90% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: translate3d(290px, -50%, 0);
                        opacity: 0;
                    }
                }

                .animate-particle-wave {
                    animation: particle-wave-move linear infinite both;
                    will-change: transform, opacity;
                }
            `}</style>
        </div>
    );
}
