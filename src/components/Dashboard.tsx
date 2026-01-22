"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import {
    Users, Activity as ActivityIcon, Layers, Zap, Clock, AlertCircle,
    DollarSign, BarChart3, LineChart,
    Briefcase, TrendingUp, Monitor,
    Tv, Pause, RefreshCw
} from "lucide-react";
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import ParticlesBackground from "./ParticlesBackground";
import type { Customer, Installation, Issue, Lead, Activity as CSActivity } from "@/types";

import SegmentedControl from "./SegmentedControl";
import CustomSelect from "./CustomSelect";

interface DashboardProps {
    customers: Customer[];
    installations: Installation[];
    issues: Issue[];
    activities: CSActivity[];
    leads: Lead[];
    user: any;
    onViewChange: (view: string) => void;
}

// Initial values for dynamic graph data
const INITIAL_GRAPH_DATA = Array.from({ length: 7 }).map((_, i) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(2026, 0, 21); // Base for initial static feel
    date.setDate(date.getDate() - (6 - i));
    return {
        name: `${date.getDate()} ${days[date.getDay()]}`,
        drease: [4, 3, 5, 3, 2, 5, 1][i],
        ease: [3, 0, 1, 2, 0, 0, 0][i],
    };
});

export default function Dashboard({ customers, installations, issues, activities, leads, user, onViewChange }: DashboardProps) {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'cs' | 'business'>('cs');
    const [timeRange, setTimeRange] = useState<'1w' | '1m'>('1w');
    const [dataType, setDataType] = useState<'all' | 'lead' | 'demo'>('all');
    const [productFilter, setProductFilter] = useState<'all' | 'Dr.Ease' | 'Ease POS'>('all');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAutoCycle, setIsAutoCycle] = useState(false);
    const cycleTimerRef = useRef<any>(null);
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

    // Business Stats Calculation
    const businessStats = useMemo(() => {
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(23, 59, 59, 999);

        const last7Days = new Date();
        last7Days.setDate(todayAtMidnight.getDate() - 7);
        last7Days.setHours(0, 0, 0, 0);

        const weeklyLeads = leads.filter(l => {
            if (!l.receivedDate) return false;
            const rDate = new Date(l.receivedDate);
            return rDate >= last7Days && rDate <= todayAtMidnight;
        });

        const dreaseLeads = weeklyLeads.filter(l => l.product === "Dr.Ease").length;
        const easeLeads = weeklyLeads.filter(l => l.product === "Ease POS").length;

        return [
            { label: "Weekly Leads", subLabel: "ผู้สนใจรายสัปดาห์", value: weeklyLeads.length, sub: `Dr.Ease: ${dreaseLeads} | Ease: ${easeLeads}`, icon: Briefcase, color: "text-amber-400", border: "border-amber-500/20", bg: "from-amber-500/10" },
            { label: "Weekly Demos", subLabel: "การทำ Demo รายสัปดาห์", value: "18", sub: "Dr.Ease: 10 | Ease: 8", icon: Monitor, color: "text-blue-400", border: "border-blue-500/20", bg: "from-blue-500/10" },
            { label: "New Sales (Revenue)", subLabel: "ยอดเงินปิดใหม่", value: "฿408,604", sub: "", icon: DollarSign, color: "text-emerald-400", border: "border-emerald-500/20", bg: "from-emerald-500/10" },
            { label: "Renewal (Revenue)", subLabel: "ยอดเงินต่อสัญญา", value: "฿882,120", sub: "", icon: TrendingUp, color: "text-purple-400", border: "border-purple-500/20", bg: "from-purple-500/10" },
        ];
    }, [leads]);

    // Generate last 7 or 30 days labels ending with today
    const dynamicGraphData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const count = timeRange === '1w' ? 7 : 30;

        return Array.from({ length: count }).map((_, i) => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - (count - 1 - i));

            const dateStr = date.toISOString().split('T')[0];

            // Filter logic based on dataType
            let dayLeads = 0;
            let dayDemos = 0;

            // 1. Calculate Leads
            if (dataType === 'all' || dataType === 'lead') {
                const leadsOnDay = leads.filter(l => l.receivedDate === dateStr);
                if (productFilter === 'all') {
                    dayLeads = leadsOnDay.length;
                } else {
                    dayLeads = leadsOnDay.filter(l => l.product === productFilter).length;
                }
            }

            // 2. Calculate Demos
            if (dataType === 'all' || dataType === 'demo') {
                const demosOnDay = activities.filter(a =>
                    a.activityType === "Demo" &&
                    a.createdAt && a.createdAt.startsWith(dateStr)
                );

                if (productFilter === 'all') {
                    dayDemos = demosOnDay.length;
                } else {
                    // Mapping activities to products is tricky as Activity doesn't have 'product' field
                    // However, we can look up the customer's productType
                    dayDemos = demosOnDay.filter(a => {
                        const customer = customers.find(c => c.id === a.customerId);
                        return customer?.productType === (productFilter === 'Ease POS' ? 'EasePos' : productFilter);
                    }).length;
                }
            }

            return {
                name: `${date.getDate()} ${days[date.getDay()]}`,
                drease: (dataType === 'all' || dataType === 'lead') && (productFilter === 'all' || productFilter === 'Dr.Ease')
                    ? (leads.filter(l => l.receivedDate === dateStr && l.product === 'Dr.Ease').length +
                        activities.filter(a => a.activityType === 'Demo' && a.createdAt?.startsWith(dateStr) && customers.find(c => c.id === a.customerId)?.productType === 'Dr.Ease').length)
                    : 0,
                ease: (dataType === 'all' || dataType === 'lead') && (productFilter === 'all' || productFilter === 'Ease POS')
                    ? (leads.filter(l => l.receivedDate === dateStr && l.product === 'Ease POS').length +
                        activities.filter(a => a.activityType === 'Demo' && a.createdAt?.startsWith(dateStr) && customers.find(c => c.id === a.customerId)?.productType === 'EasePos').length)
                    : 0,
                leads: dayLeads,
                demos: dayDemos,
                shortName: `${date.getDate()}`
            };
        });
    }, [timeRange, leads, activities, dataType, productFilter, customers]);

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
                                    <ActivityIcon className="w-4 h-4" />
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
                                        <h3 className="text-7xl font-bold text-text-main tracking-tighter leading-none">{stat.value}</h3>
                                        <p className="text-text-muted text-[9px] mt-1 line-clamp-1">{stat.sub}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 flex-1 min-h-0">
                        <div className="glass-card p-6 border-white/5 flex flex-col min-h-0">
                            <h3 className="text-white font-bold flex items-center gap-2 flex-shrink-0">
                                <ActivityIcon className="w-4 h-4 text-indigo-400" />
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
                                        <p className="text-text-muted text-[12px] uppercase font-bold tracking-widest">{stat.label}</p>
                                        <p className="text-indigo-400/80 text-[11px] font-bold -mt-0.5 mb-1">{stat.subLabel}</p>
                                        <h3 className="text-7xl font-bold text-text-main tracking-tighter leading-none">
                                            {stat.value}
                                        </h3>
                                        <p className="text-text-muted text-[11px] font-bold mt-1 line-clamp-1">{stat.sub}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                        <div className="lg:col-span-2 glass-card p-6 border-white/5 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex flex-col">
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        <LineChart className="w-4 h-4 text-indigo-400" />
                                        {timeRange === '1w' ? 'Weekly' : 'Monthly'} Leads & Demos Growth
                                    </h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">อัตราการเติบโตของ Lead และ Demo {timeRange === '1w' ? 'รายสัปดาห์' : 'รายเดือน'}</p>
                                </div>
                                <div className="flex items-center gap-2 scale-90 origin-right">
                                    <div className="w-36 flex-shrink-0">
                                        <CustomSelect
                                            options={[
                                                { value: 'all', label: 'All Data' },
                                                { value: 'lead', label: 'Leads' },
                                                { value: 'demo', label: 'Demos' }
                                            ]}
                                            value={dataType}
                                            onChange={(val) => setDataType(val as 'all' | 'lead' | 'demo')}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="w-36 flex-shrink-0">
                                        <CustomSelect
                                            options={[
                                                { value: 'all', label: 'All Products' },
                                                { value: 'Dr.Ease', label: 'Dr.Ease' },
                                                { value: 'Ease POS', label: 'Ease POS' }
                                            ]}
                                            value={productFilter}
                                            onChange={(val) => setProductFilter(val as 'all' | 'Dr.Ease' | 'Ease POS')}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="w-24 flex-shrink-0">
                                        <CustomSelect
                                            options={[
                                                { value: '1w', label: '1W' },
                                                { value: '1m', label: '1M' }
                                            ]}
                                            value={timeRange}
                                            onChange={(val) => setTimeRange(val as '1w' | '1m')}
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dynamicGraphData}>
                                        <defs>
                                            <linearGradient id="colorDrease" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#7053E1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#7053E1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorEase" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F76D85" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#F76D85" stopOpacity={0} />
                                            </linearGradient>
                                            <filter id="glowDrease" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="3" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                            <filter id="glowEase" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="3" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#64748b"
                                            fontSize={10}
                                            interval={timeRange === '1w' ? 0 : 4} // Skip labels for 1m to avoid overlap
                                        />
                                        <YAxis stroke="#64748b" fontSize={10} />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-purple-500/20 animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                                                <Clock className="w-3.5 h-3.5 text-[#7053E1]" />
                                                                <span className="text-white font-bold text-sm tracking-tight">{label}</span>
                                                            </div>
                                                            <div className="space-y-2.5">
                                                                {payload.map((entry, index) => (
                                                                    <div key={index} className="flex items-center justify-between gap-8">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div
                                                                                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                                                                style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}80` }}
                                                                            />
                                                                            <span className="text-slate-400 text-xs font-medium">{entry.name}</span>
                                                                        </div>
                                                                        <span className="text-white font-bold text-sm tabular-nums">{entry.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                            cursor={{ stroke: 'rgba(112, 83, 225, 0.2)', strokeWidth: 2, strokeDasharray: '4 4' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="drease"
                                            name="Dr.Ease"
                                            stroke="#7053E1"
                                            fillOpacity={1}
                                            fill="url(#colorDrease)"
                                            strokeWidth={3}
                                            activeDot={{ r: 6, stroke: '#7053E1', strokeWidth: 2, fill: '#fff', filter: 'url(#glowDrease)' }}
                                            style={{ filter: 'drop-shadow(0 0 5px rgba(112, 83, 225, 0.6))' }}
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="ease"
                                            name="Ease"
                                            stroke="#F76D85"
                                            fillOpacity={1}
                                            fill="url(#colorEase)"
                                            strokeWidth={3}
                                            activeDot={{ r: 6, stroke: '#F76D85', strokeWidth: 2, fill: '#fff', filter: 'url(#glowEase)' }}
                                            style={{ filter: 'drop-shadow(0 0 5px rgba(247, 109, 133, 0.6))' }}
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
