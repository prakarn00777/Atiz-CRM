"use client";

import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info";
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = "success", onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
    };

    const colors = {
        success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        error: "bg-rose-500/10 border-rose-500/30 text-rose-400",
        info: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
    };

    return (
        <div className={`fixed top-4 right-4 z-[200] animate-in slide-in-from-top-2 fade-in duration-300`}>
            <div className={`${colors[type]} border rounded-xl p-4 pr-12 shadow-2xl backdrop-blur-xl flex items-center gap-3 min-w-[300px] max-w-md`}>
                {icons[type]}
                <p className="text-sm font-medium flex-1">{message}</p>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
