"use client";

import { LucideIcon, LayoutDashboard, Users, LogOut, Layers, Settings, ChevronRight, UserCog, ShieldCheck, AlertCircle } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
    currentView: string;
    setView: (view: string) => void;
    onLogout: () => void;
}

export default function Sidebar({ currentView, setView, onLogout }: SidebarProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const mainMenus = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "customers", label: "จัดการลูกค้า", icon: Users },
        { id: "issues", label: "แจ้งปัญหา", icon: AlertCircle },
    ];

    return (
        <aside className="w-56 glass-card h-[calc(100vh-2rem)] m-4 flex flex-col p-4 fixed lg:relative z-50">
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Layers className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-base font-bold tracking-tight">CRM Admin</h2>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                {mainMenus.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`btn w-full justify-start text-sm ${currentView === item.id
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "btn-ghost"
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                    </button>
                ))}

                {/* Settings Section */}
                <div className="pt-2 mt-2 border-t border-white/5">
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="btn btn-ghost w-full justify-start text-slate-400 text-sm"
                    >
                        <Settings className="w-4 h-4" />
                        <span>ตั้งค่า</span>
                        <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${isSettingsOpen ? "rotate-90" : ""}`} />
                    </button>

                    {isSettingsOpen && (
                        <div className="mt-1 ml-3 space-y-0.5 border-l border-white/10 pl-2 animate-in slide-in-from-top-2 duration-200">
                            <button
                                onClick={() => setView("user_management")}
                                className={`btn w-full justify-start text-xs ${currentView === "user_management" ? "text-indigo-400" : "btn-ghost"}`}
                            >
                                <UserCog className="w-3.5 h-3.5" />
                                <span>จัดการผู้ใช้งาน</span>
                            </button>
                            <button
                                onClick={() => setView("role_management")}
                                className={`btn w-full justify-start text-xs ${currentView === "role_management" ? "text-indigo-400" : "btn-ghost"}`}
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>จัดการบทบาท</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <button
                onClick={onLogout}
                className="btn btn-ghost w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 mt-auto pt-3 border-t border-white/5"
            >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
            </button>
        </aside>
    );
}
