"use client";

import { LucideIcon, LayoutDashboard, Users, LogOut, Layers } from "lucide-react";

interface SidebarProps {
    currentView: string;
    setView: (view: string) => void;
    onLogout: () => void;
}

export default function Sidebar({ currentView, setView, onLogout }: SidebarProps) {
    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "customers", label: "จัดการลูกค้า", icon: Users },
    ];

    return (
        <aside className="w-64 glass-card h-[calc(100vh-2rem)] m-4 flex flex-col p-6 fixed lg:relative z-50">
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Layers className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">CRM Admin</h2>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`btn w-full justify-start ${currentView === item.id
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : "btn-ghost"
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <button
                onClick={onLogout}
                className="btn btn-ghost w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 mt-auto"
            >
                <LogOut className="w-5 h-5" />
                <span>ออกจากระบบ</span>
            </button>
        </aside>
    );
}
