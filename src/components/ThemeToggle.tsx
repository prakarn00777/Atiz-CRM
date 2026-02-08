"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-all text-slate-500 hover:text-indigo-500"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {theme === "dark" ? (
                <>
                    <Sun className="w-4 h-4" />
                    <span className="text-xs font-medium">Light Mode</span>
                </>
            ) : (
                <>
                    <Moon className="w-4 h-4" />
                    <span className="text-xs font-medium">Dark Mode</span>
                </>
            )}
        </button>
    );
}
