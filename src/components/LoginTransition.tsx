"use client";

import { useEffect, useState } from "react";
import { Layers, ShieldCheck, Server, Wifi } from "lucide-react";

interface LoginTransitionProps {
    onComplete: () => void;
}

export default function LoginTransition({ onComplete }: LoginTransitionProps) {
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("INITIALIZING SYSTEM...");
    const [phase, setPhase] = useState<"init" | "auth" | "load" | "complete">("init");

    useEffect(() => {
        // Timeline of events
        const timeline = async () => {
            // Phase 1: Initialize
            await new Promise(r => setTimeout(r, 500));
            setPhase("auth");
            setStatusText("VERIFYING CREDENTIALS...");
            setProgress(20);

            // Phase 2: Auth Simulation
            await new Promise(r => setTimeout(r, 800));
            setPhase("load");
            setStatusText("CONNECTING TO SECURE SERVER...");
            setProgress(45);

            // Phase 3: Loading Modules
            await new Promise(r => setTimeout(r, 600));
            setStatusText("LOADING DASHBOARD MODULES...");
            setProgress(75);

            await new Promise(r => setTimeout(r, 400));
            setStatusText("SYNCING CUSTOMER DATA...");
            setProgress(90);

            // Phase 4: Complete
            await new Promise(r => setTimeout(r, 500));
            setPhase("complete");
            setStatusText("ACCESS GRANTED");
            setProgress(100);

            // Wait a bit before unmounting
            await new Promise(r => setTimeout(r, 500));
            onComplete();
        };

        timeline();
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden font-mono">
            {/* Cybernetic Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Floating Particles/Glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8">
                {/* Central Icon container with rings */}
                <div className="relative mb-12">
                    {/* Ring animations */}
                    <div className={`absolute inset-0 border-2 border-indigo-500/30 rounded-full animate-[spin_3s_linear_infinite] ${phase === 'complete' ? 'scale-150 opacity-0 transition-all duration-500' : ''}`} />
                    <div className={`absolute inset-[-10px] border border-purple-500/20 rounded-full animate-[spin_4s_linear_infinite_reverse] ${phase === 'complete' ? 'scale-150 opacity-0 transition-all duration-500' : ''}`} />

                    {/* Main Icon */}
                    <div className="w-24 h-24 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        {phase === 'init' && <Wifi className="w-10 h-10 text-indigo-500 animate-pulse" />}
                        {phase === 'auth' && <ShieldCheck className="w-10 h-10 text-emerald-600 animate-bounce" />}
                        {phase === 'load' && <Server className="w-10 h-10 text-purple-500 animate-pulse" />}
                        {phase === 'complete' && <Layers className="w-12 h-12 text-white animate-[ping_1s_ease-out]" />}
                    </div>
                </div>

                {/* Text Scramble / Status */}
                <h2 className="text-2xl font-bold text-white tracking-widest mb-2 text-center animate-in fade-in zoom-in duration-300">
                    ATIZ CRM <span className="text-indigo-500">v2.0</span>
                </h2>

                <div className="h-6 mb-8 flex items-center justify-center">
                    <span className="text-xs text-indigo-300 font-bold tracking-[0.2em] animate-pulse">
                        [{statusText}]
                    </span>
                </div>

                {/* High-tech Progress Bar */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-300 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_1s_infinite]" />
                    </div>
                </div>

                {/* Hexagon stats decorative */}
                <div className="flex gap-4 mt-8 opacity-50 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${phase !== 'init' ? 'bg-indigo-500 shadow-[0_0_10px_indigo]' : 'bg-slate-700'}`} />
                        <span>NET</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${phase === 'auth' || phase === 'complete' ? 'bg-emerald-500 shadow-[0_0_10px_emerald]' : 'bg-slate-700'}`} />
                        <span>AUTH</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${phase === 'load' || phase === 'complete' ? 'bg-purple-500 shadow-[0_0_10px_purple]' : 'bg-slate-700'}`} />
                        <span>DATA</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${phase === 'complete' ? 'bg-blue-500 shadow-[0_0_10px_blue]' : 'bg-slate-700'}`} />
                        <span>UI</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
