"use client";

import { memo, useState } from "react";
import { LayoutDashboard, Users, LogOut, Layers, Settings, ChevronRight, UserCog, ShieldCheck, AlertCircle, History as HistoryIcon } from "lucide-react";

interface SidebarProps {
    currentView: string;
    setView: (view: string) => void;
    onLogout: () => void;
    userRole: {
        role?: string;
        permissions?: Record<string, { read?: boolean; write?: boolean }>;
    } | null;
}

const mainMenus = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "cs_activity", label: "CS Task", icon: HistoryIcon },
    { id: "leads", label: "ลีด (Leads)", icon: Users },
    {
        id: "customer_group",
        label: "ลูกค้า",
        icon: Users,
        children: [
            { id: "customers", label: "จัดการลูกค้า" },
            { id: "installations", label: "งานติดตั้ง" },
        ]
    },
    { id: "issues", label: "แจ้งปัญหา", icon: AlertCircle },
];

const Sidebar = memo(function Sidebar({ currentView, setView, onLogout, userRole }: SidebarProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>(["customer_group"]);

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuId)
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId]
        );
    };

    return (
        <aside
            className={`glass-card min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)] m-2 lg:m-4 flex flex-col p-4 fixed lg:relative z-50 transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"
                }`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-10 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-600 transition-colors z-[60]"
            >
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`} />
            </button>

            <div className={`flex items-center mb-6 px-2 transition-all duration-300 ${isCollapsed ? "justify-center gap-0" : "gap-3"}`}>
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Layers className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                    <h2 className="text-base font-bold tracking-tight truncate animate-in fade-in duration-300">CRM Admin</h2>
                )}
            </div>

            <nav className={`flex-1 space-y-1 pr-1 no-scrollbar ${isCollapsed ? "overflow-visible" : "overflow-y-auto"}`}>
                {mainMenus.map((item) => {
                    const isAdmin = userRole?.role?.toLowerCase() === 'admin';

                    // Handle Group Items (like "ลูกค้า")
                    if (item.children) {
                        // Filter visible children based on permissions
                        const visibleChildren = item.children.filter(child =>
                            isAdmin || userRole?.permissions?.[child.id]?.read
                        );

                        // If no children are visible, hide the group
                        if (visibleChildren.length === 0) return null;

                        const isActive = currentView === item.id || visibleChildren.some(child => child.id === currentView);
                        const isExpanded = expandedMenus.includes(item.id);

                        return (
                            <div key={item.id} className="space-y-1 relative group">
                                <button
                                    onClick={() => !isCollapsed ? toggleMenu(item.id) : null}
                                    className={`btn w-full text-sm transition-all duration-200 ${isCollapsed ? "justify-center p-2" : "justify-between"
                                        } ${isActive && !visibleChildren.some(c => c.id === currentView)
                                            ? "text-slate-200"
                                            : "btn-ghost"
                                        }`}
                                    title={isCollapsed ? item.label : ""}
                                >
                                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                                        <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                                        {!isCollapsed && (
                                            <span className="truncate animate-in fade-in duration-300 font-medium">{item.label}</span>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                    )}
                                </button>

                                {/* Submenu for Expanded State */}
                                {!isCollapsed && isExpanded && (
                                    <div className="ml-4 pl-3 border-l border-white/10 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                        {visibleChildren.map((child) => (
                                            <button
                                                key={child.id}
                                                onClick={() => setView(child.id)}
                                                className={`btn w-full justify-start text-sm h-9 font-medium ${currentView === child.id
                                                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                <span className="truncate">{child.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Flyout Menu for Collapsed State */}
                                {isCollapsed && (
                                    <div className="absolute left-full top-0 ml-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-[100] translate-x-2 group-hover:translate-x-0">
                                        <div className="glass-card p-2 space-y-1 shadow-2xl border-white/20 bg-slate-900/95 backdrop-blur-xl">
                                            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                                                {item.label}
                                            </div>
                                            {visibleChildren.map((child) => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => setView(child.id)}
                                                    className={`btn w-full justify-start text-sm font-medium ${currentView === child.id ? "text-indigo-400 bg-indigo-500/10" : "btn-ghost"}`}
                                                >
                                                    <span className="truncate">{child.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Handle Single Items
                    const canRead = isAdmin || item.id === 'dashboard' || item.id === 'cs_activity' || item.id === 'leads' || userRole?.permissions?.[item.id]?.read;
                    if (!canRead) return null;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`btn w-full text-sm transition-all duration-200 ${isCollapsed ? "justify-center p-2" : "justify-start"
                                } ${currentView === item.id
                                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                    : "btn-ghost"
                                }`}
                            title={isCollapsed ? item.label : ""}
                        >
                            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                                <item.icon className={`w-4 h-4 flex-shrink-0 ${currentView === item.id ? "text-indigo-400" : "text-slate-400"}`} />
                                {!isCollapsed && (
                                    <span className="truncate animate-in fade-in duration-300 font-medium">{item.label}</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Settings Section - Only show if has permission for user_management OR role_management */}
            {(userRole?.permissions?.['user_management']?.read || userRole?.permissions?.['role_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                <div className="pt-2 mt-2 border-t border-white/5 relative group">
                    <button
                        onClick={() => !isCollapsed && setIsSettingsOpen(!isSettingsOpen)}
                        className={`btn btn-ghost w-full text-slate-400 text-sm transition-all duration-200 ${isCollapsed ? "justify-center p-2" : "justify-start"
                            }`}
                        title={isCollapsed ? "ตั้งค่า" : ""}
                    >
                        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                            <Settings className="w-4 h-4 flex-shrink-0" />
                            {!isCollapsed && (
                                <div className="flex-1 flex items-center justify-between">
                                    <span className="font-medium">ตั้งค่า</span>
                                    <ChevronRight className={`w-3 h-3 transition-transform ${isSettingsOpen ? "rotate-90" : ""}`} />
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Flyout Menu for Collapsed State */}
                    {isCollapsed && (
                        <div className="absolute left-full top-0 ml-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-[100] translate-x-2 group-hover:translate-x-0">
                            <div className="glass-card p-2 space-y-1 shadow-2xl border-white/20 bg-slate-900/95 backdrop-blur-xl">
                                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                                    Settings
                                </div>
                                {(userRole?.permissions?.['user_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                                    <button
                                        onClick={() => setView("user_management")}
                                        className={`btn w-full justify-start text-sm font-medium ${currentView === "user_management" ? "text-indigo-400 bg-indigo-500/10" : "btn-ghost"}`}
                                    >
                                        <UserCog className="w-3.5 h-3.5" />
                                        <span>จัดการผู้ใช้งาน</span>
                                    </button>
                                )}
                                {(userRole?.permissions?.['role_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                                    <button
                                        onClick={() => setView("role_management")}
                                        className={`btn w-full justify-start text-sm font-medium ${currentView === "role_management" ? "text-indigo-400 bg-indigo-500/10" : "btn-ghost"}`}
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>จัดการบทบาท</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {!isCollapsed && isSettingsOpen && (
                        <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {(userRole?.permissions?.['user_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                                <button
                                    onClick={() => setView("user_management")}
                                    className={`btn w-full justify-start text-sm h-9 font-medium ${currentView === "user_management" ? "text-indigo-400 bg-indigo-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                                >
                                    <UserCog className="w-3.5 h-3.5 mr-2" />
                                    <span>จัดการผู้ใช้งาน</span>
                                </button>
                            )}
                            {(userRole?.permissions?.['role_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                                <button
                                    onClick={() => setView("role_management")}
                                    className={`btn w-full justify-start text-sm h-9 font-medium ${currentView === "role_management" ? "text-indigo-400 bg-indigo-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                                    <span>จัดการบทบาท</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={onLogout}
                className={`btn btn-ghost w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 pt-3 border-t border-white/5 transition-all duration-200 ${isCollapsed ? "justify-center p-2" : "justify-start"
                    }`}
                title={isCollapsed ? "ออกจากระบบ" : ""}
            >
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && (
                        <span className="animate-in fade-in duration-300 font-medium">ออกจากระบบ</span>
                    )}
                </div>
            </button>
        </aside>
    );
});

export default Sidebar;
