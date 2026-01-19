"use client";

import { useEffect, useRef } from "react";

interface ParticlesBackgroundProps {
    className?: string;
}

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
}

export default function ParticlesBackground({ className }: ParticlesBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        const resizeCanvas = () => {
            canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            const particleCount = Math.floor((canvas.width * canvas.height) / 15000); // Density based on area
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5, // Size between 0.5 and 2.5
                    speedX: (Math.random() - 0.5) * 0.5, // Slow horizontal movement
                    speedY: (Math.random() - 0.5) * 0.5, // Slow vertical movement
                    opacity: Math.random() * 0.3 + 0.1 // Opacity between 0.1 and 0.4
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around screen
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(147, 197, 253, ${particle.opacity})`; // blue-300 color
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Initial setup
        resizeCanvas();
        animate();

        // Handle resize
        window.addEventListener("resize", resizeCanvas);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className={`block pointer-events-none ${className || ""}`} />;
}
