"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import {
    Users, Activity, Layers, Zap, Clock, AlertCircle,
    DollarSign, BarChart3, LineChart,
    Briefcase, TrendingUp, Monitor,
    Tv, Pause, RefreshCw
} from "lucide-react";
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import ParticlesBackground from "./ParticlesBackground";
import { Customer, Installation, Issue } from "@/types";

interface DashboardProps {
    customers: Customer[];
    installations: Installation[];
    issues: Issue[];
    user: any;
    onViewChange: (view: string) => void;
}

// Mock Data for New Business Metrics
const MOCK_LINE_DATA = [
    { name: 'Mon', drease: 4, ease: 3 },
    { name: 'Tue', drease: 3, ease: 0 },
    { name: 'Wed', drease: 5, ease: 1 },
    { name: 'Thu', drease: 3, ease: 2 },
    { name: 'Fri', drease: 2, ease: 0 },
    { name: 'Sat', drease: 5, ease: 0 },
    { name: 'Sun', drease: 1, ease: 0 },
];

export default function Dashboard({ customers, installations, issues, user, onViewChange }: DashboardProps) {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'cs' | 'business'>('cs');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAutoCycle, setIsAutoCycle] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            clearInterval(timer);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoCycle) {
            interval = setInterval(() => {
                setActiveTab(prev => prev === 'cs' ? 'business' : 'cs');
            }, 30000); // 30 seconds
        }
        return () => clearInterval(interval);
    }, [isAutoCycle]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            dashboardRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // CS Stats Calculation
    const csStats = useMemo(() => {
        const activeIssues = issues.filter(i => i.status !== "เสร็จสิ้น").length;
        const pendingInstallations = installations.filter(i => i.status !== "Completed").length;
        const activeCustomers = customers.filter(c => c.usageStatus === "Active").length;
        const trainingCustomers = customers.filter(c => c.usageStatus === "Training").length;

        return [
            { label: "Active Customers", subLabel: "ลูกค้าที่กำลังใช้งาน", value: activeCustomers, sub: "Running Production", icon: Zap, color: "text-emerald-400", border: "border-emerald-500/20", bg: "from-emerald-500/10" },
            { label: "Pending Install", subLabel: "รอดำเนินการติดตั้ง", value: pendingInstallations, sub: "In Pipeline", icon: Layers, color: "text-blue-400", border: "border-blue-500/20", bg: "from-blue-500/10" },
            { label: "Active Issues", subLabel: "ปัญหาที่กำลังดำเนินการ", value: activeIssues, sub: "Support Needed", icon: AlertCircle, color: "text-rose-400", border: "border-rose-500/20", bg: "from-rose-500/10" },
            { label: "Training", subLabel: "รอนัดหมายเทรนนิ่ง", value: trainingCustomers, sub: "Onboarding", icon: Users, color: "text-indigo-400", border: "border-indigo-500/20", bg: "from-indigo-500/10" },
        ];
    }, [customers, issues, installations]);

    // Business Stats Calculation (Mocked for now)
    const businessStats = useMemo(() => {
        return [
            { label: "Weekly Leads", subLabel: "ผู้สนใจรายสัปดาห์", value: "29", sub: "Dr.Ease: 23 | Ease: 6", icon: Briefcase, color: "text-amber-400", border: "border-amber-500/20", bg: "from-amber-500/10" },
            { label: "Weekly Demos", subLabel: "การทำ Demo รายสัปดาห์", value: "18", sub: "Dr.Ease: 10 | Ease: 8", icon: Monitor, color: "text-blue-400", border: "border-blue-500/20", bg: "from-blue-500/10" },
            { label: "New Sales (Revenue)", subLabel: "ยอดเงินปิดใหม่", value: "฿408,604", sub: "", icon: DollarSign, color: "text-emerald-400", border: "border-emerald-500/20", bg: "from-emerald-500/10" },
            { label: "Renewal (Revenue)", subLabel: "ยอดเงินต่อสัญญา", value: "฿882,120", sub: "", icon: TrendingUp, color: "text-purple-400", border: "border-purple-500/20", bg: "from-purple-500/10" },
        ];
    }, []);

    return (
        <div
            ref={dashboardRef}
            className={`animate-in fade-in zoom-in-95 duration-500 relative custom-scrollbar flex flex-col pt-2
                ${isFullscreen ? 'p-8 bg-slate-950 h-screen w-screen overflow-hidden gap-4' : 'space-y-4 pb-10 overflow-y-auto'}`}
        >
            <ParticlesBackground className="absolute inset-0 z-0" />

            {/* Header Section */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10
                ${isFullscreen ? 'mb-4 px-1' : ''}`}>
                <div>
                    <h1 className={`text-3xl font-black tracking-tight ${activeTab === 'business' ? 'text-white' : 'text-text-main bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400'}`}>
                        {activeTab === 'cs' ? 'CS Operational Center' : 'Business Insights'}
                    </h1>
                    <p className={`${activeTab === 'business' ? 'text-white' : 'text-indigo-400'} font-bold text-[10px] uppercase tracking-widest mt-0.5`}>
                        {activeTab === 'cs' ? 'ศูนย์ปฏิบัติการทีม CS' : 'ภาพรวมข้อมูลเชิงลึกธุรกิจ'}
                    </p>
                    <p className="text-text-muted mt-1 flex items-center gap-2 text-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {user.name} • {activeTab === 'cs' ? 'Command Mode' : 'Strategic Mode'}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3 mr-1">
                    {/* Real-time Clock - Always visible */}
                    <div className="flex items-center gap-3 text-text-muted mr-12">
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[11px] font-bold tracking-wider font-mono">
                                {currentTime.toLocaleTimeString('th-TH', { hour12: false })}
                            </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 hidden sm:block">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    </div>

                    {/* Fullscreen Controls - Hidden in Fullscreen mode */}
                    {!isFullscreen && (
                        <div className="flex items-center gap-2">
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
                                <button
                                    onClick={() => setIsAutoCycle(!isAutoCycle)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all
                                        ${isAutoCycle ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
                                    title="Auto-Cycle Tabs"
                                >
                                    {isAutoCycle ? <Pause className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                                    {isAutoCycle ? 'AUTO-ON' : 'Cycle Off'}
                                </button>
                            </div>

                            <button
                                onClick={toggleFullscreen}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <Tv className="w-4 h-4" />
                                Fullscreen
                            </button>

                            {/* Tab Switcher */}
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 ml-2">
                                <button
                                    onClick={() => setActiveTab('cs')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all px-6
                                        ${activeTab === 'cs' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Activity className="w-4 h-4" />
                                    CS Insights
                                </button>
                                <button
                                    onClick={() => setActiveTab('business')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all px-6
                                        ${activeTab === 'business' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    Business Overview
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content for CS Insights */}
            {activeTab === 'cs' && (
                <div className={`relative z-10 animate-in slide-in-from-left-4 duration-500 flex flex-col min-h-0 flex-1
                    ${isFullscreen ? 'gap-4' : 'space-y-6'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                        {csStats.map((stat, i) => (
                            <div key={i} className={`glass-card p-4 border transition-all hover:-translate-y-1 ${stat.border}`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent opacity-30`} />
                                <div className="relative flex flex-col gap-2">
                                    <div className={`p-1.5 w-fit rounded-lg bg-white/5 ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">{stat.label}</p>
                                        <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">{stat.subLabel}</p>
                                        <h3 className="text-2xl font-bold text-text-main tracking-tight leading-none">{stat.value}</h3>
                                        <p className="text-text-muted text-[9px] mt-1 line-clamp-1">{stat.sub}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 flex-1 min-h-0">
                        <div className="glass-card p-6 border-white/5 flex flex-col min-h-0">
                            <h3 className="text-white font-bold flex items-center gap-2 flex-shrink-0">
                                <Activity className="w-4 h-4 text-indigo-400" />
                                Recent Support Activity
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex-shrink-0">กิจกรรมการซัพพอร์ตล่าสุด</p>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0 space-y-4">
                                {issues.slice(0, 5).map((issue, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 transition-colors">
                                        <div className={`w-2 h-2 rounded-full ${issue.status === 'เสร็จสิ้น' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-text-main truncate">{issue.title}</p>
                                            <p className="text-[10px] text-text-muted">{issue.customerName} • {issue.status}</p>
                                        </div>
                                        <div className="text-[10px] text-text-muted font-mono">
                                            {issue.createdAt?.split('T')[0]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content for Business Overview */}
            {activeTab === 'business' && (
                <div className={`relative z-10 animate-in slide-in-from-right-4 duration-500 flex flex-col min-h-0 flex-1
                    ${isFullscreen ? 'gap-4' : 'space-y-6'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                        {businessStats.map((stat, i) => (
                            <div key={i} className={`glass-card p-4 border transition-all hover:-translate-y-1 ${stat.border}`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent opacity-30`} />
                                <div className="relative flex flex-col gap-2">
                                    <div className={`p-1.5 w-fit rounded-lg bg-white/5 ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">{stat.label}</p>
                                        <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">{stat.subLabel}</p>
                                        <h3 className="text-2xl font-bold text-text-main tracking-tight leading-none">{stat.value}</h3>
                                        <p className="text-text-muted text-[9px] mt-1 line-clamp-1">{stat.sub}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                        <div className="lg:col-span-2 glass-card p-6 border-white/5 flex flex-col min-h-0">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <LineChart className="w-4 h-4 text-indigo-400" />
                                Weekly Leads & Demos Growth
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex-shrink-0">อัตราการเติบโตของ Lead และ Demo รายสัปดาห์</p>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={MOCK_LINE_DATA}>
                                        <defs>
                                            <linearGradient id="colorDrease" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorEase" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                        <YAxis stroke="#64748b" fontSize={10} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="drease"
                                            name="Dr.Ease"
                                            stroke="#6366f1"
                                            fillOpacity={1}
                                            fill="url(#colorDrease)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="drease"
                                            stroke="#818cf8"
                                            fill="transparent"
                                            strokeWidth={4}
                                            strokeDasharray="4 20"
                                            className="animate-flow"
                                            style={{ filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.8))' }}
                                            activeDot={false}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="ease"
                                            name="Ease"
                                            stroke="#10b981"
                                            fillOpacity={1}
                                            fill="url(#colorEase)"
                                            strokeWidth={2}
                                            activeDot={false}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="ease"
                                            stroke="#34d399"
                                            fill="transparent"
                                            strokeWidth={4}
                                            strokeDasharray="4 20"
                                            className="animate-flow"
                                            style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.8))' }}
                                            activeDot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-card p-6 border-white/5 flex flex-col min-h-0">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-emerald-400" />
                                Growth & Usage Metrics
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex-shrink-0">สถิติการเติบโตและการใช้งาน</p>

                            <div className={`flex-1 min-h-0 ${isFullscreen ? 'grid grid-rows-4 gap-2' : 'space-y-4 overflow-y-auto custom-scrollbar'}`}>
                                {/* Renewal % */}
                                <div className={`p-2.5 rounded-xl bg-white/5 border border-white/15 flex flex-col justify-center ${isFullscreen ? 'py-1' : 'space-y-3'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Renewal Rate</p>
                                            <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">% ต่อสัญญา</p>
                                        </div>
                                        <span className={`text-indigo-400 font-bold tracking-tight ${isFullscreen ? 'text-xl' : 'text-sm'}`}>50%</span>
                                    </div>
                                    <div className={`grid grid-cols-2 gap-3 ${isFullscreen ? 'mt-0.5' : ''}`}>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Dr.Ease</p>
                                            <p className={`font-bold tracking-tight text-white ${isFullscreen ? 'text-lg' : 'text-base'}`}>55.55%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Ease</p>
                                            <p className={`font-bold tracking-tight text-white ${isFullscreen ? 'text-lg' : 'text-base'}`}>44.44%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Onboarding */}
                                <div className={`p-2.5 rounded-xl bg-white/5 border border-white/15 flex flex-col justify-center ${isFullscreen ? 'py-1' : 'space-y-3'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Merchant Onboard</p>
                                            <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">จำนวนการขึ้นระบบ</p>
                                        </div>
                                        <span className={`text-emerald-400 font-bold tracking-tight ${isFullscreen ? 'text-xl' : 'text-sm'}`}>561</span>
                                    </div>
                                    <div className={`grid grid-cols-2 gap-3 ${isFullscreen ? 'mt-0.5' : ''}`}>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Dr.Ease</p>
                                            <p className={`font-bold tracking-tight text-white ${isFullscreen ? 'text-lg' : 'text-base'}`}>420</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Ease</p>
                                            <p className={`font-bold tracking-tight text-white ${isFullscreen ? 'text-lg' : 'text-base'}`}>141</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Stats - Card 3 */}
                                <div className={`p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-center ${isFullscreen ? 'py-1' : ''}`}>
                                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Ease Pay Usage</p>
                                    <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">จำนวนลูกค้า Ease Pay</p>
                                    <p className={`font-bold tracking-tight text-white ${isFullscreen ? 'text-xl' : 'text-2xl'}`}>850</p>
                                </div>

                                {/* Product Stats - Card 4 */}
                                <div className={`p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center ${isFullscreen ? 'py-1' : ''}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Online Booking</p>
                                            <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">ระบบจองออนไลน์</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[9px] text-indigo-400 font-bold">Pages</p>
                                            <p className={`font-bold tracking-tight text-white ${isFullscreen ? 'text-lg' : 'text-lg'}`}>320</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-emerald-400 font-bold">Bookings</p>
                                            <p className={`font-bold tracking-tight text-white ${isFullscreen ? 'text-lg' : 'text-lg'}`}>1,240</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!isFullscreen && (
                                <button
                                    onClick={() => onViewChange('customers')}
                                    className="w-full py-3 mt-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold tracking-widest uppercase transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex-shrink-0"
                                >
                                    Analysis Report
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
