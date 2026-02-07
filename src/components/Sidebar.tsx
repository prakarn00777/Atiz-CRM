"use client";

import { memo, useState } from "react";
import { LayoutDashboard, Settings, ChevronRight, UserCog, ShieldCheck, AlertCircle, Wrench, Megaphone } from "lucide-react";
import ActiveItemEffect from "./ActiveItemEffect";

interface SidebarProps {
    currentView: string;
    setView: (view: string) => void;
    userRole: {
        id?: string;
        name?: string;
        role?: string;
        permissions?: Record<string, { read?: boolean; write?: boolean }>;
    } | null;
    onQuickAction?: (action: string) => void;
}

const mainMenus = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
        id: "cs_dev_group",
        label: "CS & DEV Team",
        icon: Wrench,
        children: [
            { id: "customers", label: "Customers" },
            { id: "cs_followup", label: "Follow-up Plan" },
            { id: "issues", label: "Issues" },
            { id: "cs_activity", label: "CS Task" },
        ]
    },
    {
        id: "marketing_group",
        label: "Marketing Team",
        icon: Megaphone,
        children: [
            { id: "leads", label: "Leads" },
            { id: "demos", label: "Demos" },
            { id: "sales", label: "Sales" },
            { id: "renewals", label: "Renewals" },
        ]
    },
];

const Sidebar = memo(function Sidebar({ currentView, setView, userRole, onQuickAction }: SidebarProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>(["cs_dev_group", "marketing_group"]);

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuId)
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId]
        );
    };

    return (
        <aside
            className={`bg-card-bg backdrop-blur-sm shadow-xl shadow-black/5 border border-border/50 rounded-2xl min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)] m-2 lg:m-4 flex flex-col p-4 fixed lg:relative z-50 transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"
                }`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-10 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 hover:scale-110 transition-all duration-200 z-[60]"
            >
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`} />
            </button>

            {/* Logo & Brand */}
            <div className={`flex items-center mb-6 px-2 transition-all duration-300 ${isCollapsed ? "justify-center gap-0" : "gap-3"}`}>
                <div className={`rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
                    <img
                        src="/images/LOGO ATIZ-02.png"
                        alt="ATIZ Logo"
                        className={`object-contain transition-all duration-300 ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}
                    />
                </div>
                {!isCollapsed && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-base font-black tracking-tight text-text-main leading-tight">AXIS</h2>
                        <p className="text-[9px] text-text-muted tracking-wider uppercase leading-tight">Atiz Experience & Insight System</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            {onQuickAction && (
                <div className={`mb-4 pb-4 border-b border-border-light space-y-2`}>
                    {!isCollapsed && (
                        <h3 className="px-2 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Quick Actions</h3>
                    )}
                    <button
                        onClick={() => onQuickAction('new_install')}
                        className={`btn w-full text-xs font-bold transition-all duration-200 ${isCollapsed
                            ? "h-10 w-10 p-0 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 mx-auto flex items-center justify-center"
                            : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/15 justify-start px-3 py-2.5 rounded-xl"
                            }`}
                        title="แจ้งติดตั้งใหม่"
                    >
                        <Wrench className={`w-4 h-4 ${isCollapsed ? "" : "mr-2"}`} />
                        {!isCollapsed && "แจ้งติดตั้งใหม่"}
                    </button>
                    <button
                        onClick={() => onQuickAction('new_issue')}
                        className={`btn w-full text-xs font-bold transition-all duration-200 ${isCollapsed
                            ? "h-10 w-10 p-0 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 mx-auto flex items-center justify-center mt-2"
                            : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/15 border border-rose-500/20 justify-start px-3 py-2.5 rounded-xl"
                            }`}
                        title="แจ้งเคส/ปัญหา"
                    >
                        <AlertCircle className={`w-4 h-4 ${isCollapsed ? "" : "mr-2"}`} />
                        {!isCollapsed && "แจ้งเคส/ปัญหา"}
                    </button>
                </div>
            )}

            <nav className={`flex-1 space-y-1 pr-1 no-scrollbar ${isCollapsed ? "overflow-visible" : "overflow-y-auto"}`}>
                {mainMenus.map((item) => {
                    const isAdmin = userRole?.role?.toLowerCase() === 'admin' || userRole?.name?.toLowerCase() === 'admin' || userRole?.id === 'admin';

                    // Handle Group Items
                    if (item.children) {
                        const visibleChildren = item.children.filter(child =>
                            isAdmin ||
                            userRole?.permissions?.[child.id]?.read ||
                            (child.id === 'cs_followup' && userRole?.permissions?.['customers']?.read) ||
                            (child.id === 'renewals' && userRole?.permissions?.['sales']?.read)
                        );

                        if (visibleChildren.length === 0) return null;

                        const isActive = currentView === item.id || visibleChildren.some(child => child.id === currentView);
                        const isExpanded = expandedMenus.includes(item.id);

                        return (
                            <div key={item.id} className="space-y-1 relative group">
                                <button
                                    onClick={() => !isCollapsed ? toggleMenu(item.id) : null}
                                    className={`btn w-full text-sm transition-all duration-200 relative overflow-hidden rounded-xl ${isCollapsed ? "justify-center p-2" : "justify-between"
                                        } ${isActive && !visibleChildren.some(c => c.id === currentView)
                                            ? "text-active-text bg-active-bg"
                                            : "btn-ghost text-text-muted hover:text-text-main"
                                        }`}
                                    title={isCollapsed ? item.label : ""}
                                >
                                    {isActive && !visibleChildren.some(c => c.id === currentView) && <ActiveItemEffect />}
                                    <div className={`flex items-center relative z-10 ${isCollapsed ? "justify-center" : "gap-3"}`}>
                                        <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive && !visibleChildren.some(c => c.id === currentView) ? "text-active-text" : "text-current"}`} />
                                        {!isCollapsed && (
                                            <span className={`truncate animate-in fade-in duration-300 font-medium ${isActive && !visibleChildren.some(c => c.id === currentView) ? "text-active-text" : ""}`}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <ChevronRight className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                    )}
                                </button>

                                {/* Submenu for Expanded State */}
                                {!isCollapsed && isExpanded && (
                                    <div className="ml-4 pl-3 border-l-2 border-border-light space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                        {visibleChildren.map((child) => (
                                            <button
                                                key={child.id}
                                                onClick={() => setView(child.id)}
                                                className={`btn w-full justify-start text-sm h-9 font-medium relative overflow-hidden rounded-lg ${currentView === child.id
                                                    ? "bg-active-bg text-active-text"
                                                    : "text-text-muted hover:text-text-main hover:bg-bg-hover"
                                                    }`}
                                            >
                                                {currentView === child.id && <ActiveItemEffect />}
                                                <span className={`truncate relative z-10 ${currentView === child.id ? "text-active-text font-semibold" : ""}`}>
                                                    {child.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Flyout Menu for Collapsed State */}
                                {isCollapsed && (
                                    <div className="absolute left-full top-0 ml-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-[100] translate-x-2 group-hover:translate-x-0">
                                        <div className="bg-card-bg p-2 space-y-1 shadow-2xl border border-border rounded-2xl backdrop-blur-xl">
                                            <div className="px-2 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-light mb-1">
                                                {item.label}
                                            </div>
                                            {visibleChildren.map((child) => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => setView(child.id)}
                                                    className={`btn w-full justify-start text-sm font-medium relative overflow-hidden rounded-lg ${currentView === child.id ? "text-active-text bg-active-bg" : "text-text-muted hover:text-text-main hover:bg-bg-hover"}`}
                                                >
                                                    {currentView === child.id && <ActiveItemEffect />}
                                                    <span className={`truncate relative z-10 ${currentView === child.id ? "text-active-text font-semibold" : ""}`}>
                                                        {child.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Handle Single Items
                    const canRead = isAdmin || item.id === 'dashboard' || userRole?.permissions?.[item.id]?.read;
                    if (!canRead) return null;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`btn w-full text-sm transition-all duration-200 relative overflow-hidden rounded-xl ${isCollapsed ? "justify-center p-2" : "justify-start"
                                } ${currentView === item.id
                                    ? "bg-active-bg text-active-text"
                                    : "text-text-muted hover:text-text-main hover:bg-bg-hover"
                                }`}
                            title={isCollapsed ? item.label : ""}
                        >
                            {currentView === item.id && <ActiveItemEffect />}
                            <div className={`flex items-center relative z-10 ${isCollapsed ? "justify-center" : "gap-3"}`}>
                                <item.icon className={`w-4 h-4 flex-shrink-0 ${currentView === item.id ? "text-active-text" : "text-current"}`} />
                                {!isCollapsed && (
                                    <span className={`truncate animate-in fade-in duration-300 font-medium ${currentView === item.id ? "text-active-text font-semibold" : ""}`}>
                                        {item.label}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Settings Section */}
            {(userRole?.permissions?.['user_management']?.read || userRole?.permissions?.['role_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                <div className="pt-2 mt-2 border-t border-border-light relative group">
                    <button
                        onClick={() => !isCollapsed && setIsSettingsOpen(!isSettingsOpen)}
                        className={`btn btn-ghost w-full text-text-muted hover:text-text-main hover:bg-bg-hover text-sm transition-all duration-200 rounded-xl ${isCollapsed ? "justify-center p-2" : "justify-start"
                            }`}
                        title={isCollapsed ? "Settings" : ""}
                    >
                        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                            <Settings className="w-4 h-4 flex-shrink-0 text-current" />
                            {!isCollapsed && (
                                <div className="flex-1 flex items-center justify-between">
                                    <span className="font-medium">Settings</span>
                                    <ChevronRight className={`w-3 h-3 text-text-muted transition-transform ${isSettingsOpen ? "rotate-90" : ""}`} />
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Flyout Menu for Collapsed State */}
                    {isCollapsed && (
                        <div className="absolute left-full top-0 ml-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-[100] translate-x-2 group-hover:translate-x-0">
                            <div className="bg-card-bg p-2 space-y-1 shadow-2xl border border-border rounded-2xl backdrop-blur-xl">
                                <div className="px-2 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-light mb-1">
                                    Settings
                                </div>
                                {(userRole?.permissions?.['user_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                                    <button
                                        onClick={() => setView("user_management")}
                                        className={`btn w-full justify-start text-sm font-medium relative overflow-hidden rounded-lg ${currentView === "user_management" ? "text-active-text bg-active-bg" : "text-text-muted hover:text-text-main hover:bg-bg-hover"}`}
                                    >
                                        {currentView === "user_management" && <ActiveItemEffect />}
                                        <UserCog className={`w-3.5 h-3.5 relative z-10 ${currentView === "user_management" ? "text-active-text" : "text-current"}`} />
                                        <span className={`relative z-10 ${currentView === "user_management" ? "text-active-text font-semibold" : "text-current"}`}>
                                            User Management
                                        </span>
                                    </button>
                                )}
                                {(userRole?.permissions?.['role_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                                    <button
                                        onClick={() => setView("role_management")}
                                        className={`btn w-full justify-start text-sm font-medium relative overflow-hidden rounded-lg ${currentView === "role_management" ? "text-active-text bg-active-bg" : "text-text-muted hover:text-text-main hover:bg-bg-hover"}`}
                                    >
                                        {currentView === "role_management" && <ActiveItemEffect />}
                                        <ShieldCheck className={`w-3.5 h-3.5 relative z-10 ${currentView === "role_management" ? "text-active-text" : "text-current"}`} />
                                        <span className={`relative z-10 ${currentView === "role_management" ? "text-active-text font-semibold" : "text-current"}`}>
                                            Role Management
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {!isCollapsed && isSettingsOpen && (
                        <div className="mt-1 ml-4 pl-3 border-l-2 border-border-light space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                            {(userRole?.permissions?.['user_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                                <button
                                    onClick={() => setView("user_management")}
                                    className={`btn w-full justify-start text-sm h-9 font-medium relative overflow-hidden rounded-lg ${currentView === "user_management" ? "text-active-text bg-active-bg" : "text-text-muted hover:text-text-main hover:bg-bg-hover"}`}
                                >
                                    {currentView === "user_management" && <ActiveItemEffect />}
                                    <UserCog className={`w-3.5 h-3.5 mr-2 relative z-10 ${currentView === "user_management" ? "text-active-text" : "text-current"}`} />
                                    <span className={`relative z-10 ${currentView === "user_management" ? "text-active-text font-semibold" : ""}`}>
                                        User Management
                                    </span>
                                </button>
                            )}
                            {(userRole?.permissions?.['role_management']?.read || userRole?.role?.toLowerCase() === 'admin') && (
                                <button
                                    onClick={() => setView("role_management")}
                                    className={`btn w-full justify-start text-sm h-9 font-medium relative overflow-hidden rounded-lg ${currentView === "role_management" ? "text-active-text bg-active-bg" : "text-text-muted hover:text-text-main hover:bg-bg-hover"}`}
                                >
                                    {currentView === "role_management" && <ActiveItemEffect />}
                                    <ShieldCheck className={`w-3.5 h-3.5 mr-2 relative z-10 ${currentView === "role_management" ? "text-active-text" : "text-current"}`} />
                                    <span className={`relative z-10 ${currentView === "role_management" ? "text-active-text font-semibold" : ""}`}>
                                        Role Management
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

        </aside>
    );
});

export default Sidebar;
