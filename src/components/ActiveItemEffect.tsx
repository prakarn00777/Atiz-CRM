"use client";

import React, { useMemo } from 'react';

export default function ActiveItemEffect() {
    // Generate particles for the wave
    const particles = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            delay: (i * 0.4), // Staggered entry
            duration: 4 + Math.random() * 2,
            size: Math.random() * 2 + 1.5,
            opacity: Math.random() * 0.4 + 0.4,
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            {/* Background Base Glow */}
            <div className="absolute inset-0 bg-indigo-500/5" />

            {/* Central Horizontal Line */}
            <div className="absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent transform -translate-y-1/2" />

            {/* Particle Wave */}
            <div className="absolute inset-0">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute bg-indigo-300 rounded-full animate-particle-wave"
                        style={{
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            left: '-10%',
                            top: '50%',
                            opacity: p.opacity,
                            boxShadow: '0 0 6px rgba(165, 180, 252, 0.8)',
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes particle-wave-move {
                    0% { 
                        left: -10%; 
                        transform: translateY(-50%) translateY(0); 
                        opacity: 0; 
                    }
                    10% { 
                        opacity: 0.8; 
                    }
                    25% { 
                        transform: translateY(-50%) translateY(-6px); 
                    }
                    50% { 
                        transform: translateY(-50%) translateY(6px); 
                    }
                    75% { 
                        transform: translateY(-50%) translateY(-6px); 
                    }
                    90% { 
                        opacity: 0.8; 
                    }
                    100% { 
                        left: 110%; 
                        transform: translateY(-50%) translateY(0); 
                        opacity: 0; 
                    }
                }

                .animate-particle-wave {
                    animation: particle-wave-move linear infinite;
                }
            `}</style>
        </div>
    );
}


