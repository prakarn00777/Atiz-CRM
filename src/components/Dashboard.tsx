"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import {
    Users, Activity as ActivityIcon, Layers, Zap, Clock, AlertCircle,
    DollarSign, BarChart3, LineChart,
    Briefcase, TrendingUp, Monitor,
    Tv, Pause, RefreshCw, Info
} from "lucide-react";

// Animated Number Component - counts up from 0 to target value
const AnimatedNumber = ({ value, duration = 1500, prefix = "", suffix = "" }: {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const previousValueRef = useRef<number>(0);

    useEffect(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        const startValue = previousValueRef.current;
        startTimeRef.current = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(startValue + (value - startValue) * easeOutQuart);

            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                previousValueRef.current = value;
                animationRef.current = null;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return <>{prefix}{displayValue.toLocaleString()}{suffix}</>;
};

const iconAnimationStyles = `
@keyframes iconFloat0 {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-3px) rotate(3deg); }
}
@keyframes iconFloat1 {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-2px) scale(1.05); }
}
@keyframes iconFloat2 {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-3px) rotate(-3deg); }
}
@keyframes iconFloat3 {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.08) rotate(5deg); }
}
@keyframes logoPulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.3)); }
    50% { transform: scale(1.05); filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.5)); }
}
@keyframes continuousFloat {
    0%, 100% { transform: translateY(0) translateX(0); }
    33% { transform: translateY(-2px) translateX(1px); }
    66% { transform: translateY(1px) translateX(-1px); }
}
`;

import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import ParticlesBackground from "./ParticlesBackground";
import type { Customer, Installation, Issue, Lead, Activity as CSActivity, GoogleSheetLead } from "@/types";

import SegmentedControl from "./SegmentedControl";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";

interface DashboardProps {
    customers: Customer[];
    installations: Installation[];
    issues: Issue[];
    activities: CSActivity[];
    leads: Lead[];
    googleSheetLeads?: GoogleSheetLead[];
    user: any;
    onViewChange: (view: string) => void;
}

export const parseSheetDate = (dateVal: string | undefined) => {
    if (!dateVal) return null;
    const parts = dateVal.split('/');
    if (parts.length === 3) {
        const d = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const y = parseInt(parts[2]);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
            return new Date(y, m, d);
        }
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
};

const parseLocalISO = (isoStr: string) => {
    if (!isoStr) return null;
    const parts = isoStr.split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(isoStr);
};

export default function Dashboard({ customers, installations, issues, activities, leads, googleSheetLeads = [], user, onViewChange }: DashboardProps) {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'cs' | 'business'>('cs');
    const [timeRange, setTimeRange] = useState<'1w' | '1m' | '1y' | 'custom'>('1w');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [dataType, setDataType] = useState<'all' | 'lead' | 'demo'>('all');
    const [productFilter, setProductFilter] = useState<'all' | 'Dr.Ease' | 'Ease POS'>('all');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAutoCycle, setIsAutoCycle] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
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
            }, 30000);
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

    const businessStats = useMemo(() => {
        const getFixedWeekRange = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const start = new Date(d.setDate(diff));
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        };

        const now = new Date();
        const currentWeek = getFixedWeekRange(now);
        const prevWeekDate = new Date(currentWeek.start);
        prevWeekDate.setDate(prevWeekDate.getDate() - 7);
        const previousWeek = getFixedWeekRange(prevWeekDate);

        const isValidLead = (l: GoogleSheetLead) => {
            const hasName = l.customerName && l.customerName.trim() !== '';
            const isNotSpam = !l.leadType?.toLowerCase().includes('spam') && !l.customerName?.toLowerCase().includes('test');
            return hasName && isNotSpam;
        };

        const filterLeadsByRange = (range: { start: Date, end: Date }) => {
            return googleSheetLeads.filter(l => {
                if (!l.date) return false;
                const rDate = parseSheetDate(l.date);
                if (!rDate) return false;
                return rDate >= range.start && rDate <= range.end && isValidLead(l);
            });
        };

        const deduplicate = (leads: GoogleSheetLead[]) => {
            const seen = new Set();
            return leads.filter(l => {
                const key = `${l.customerName}-${l.phone || l.notes?.substring(0, 20)}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        };

        const finalCurrentLeads = deduplicate(filterLeadsByRange(currentWeek));
        const finalPrevLeads = deduplicate(filterLeadsByRange(previousWeek));
        const currentCount = finalCurrentLeads.length;
        const prevCount = finalPrevLeads.length;

        let wowPercent = 0;
        if (prevCount > 0) wowPercent = ((currentCount - prevCount) / prevCount) * 100;
        else if (currentCount > 0) wowPercent = 100;

        const dreaseLeads = finalCurrentLeads.filter(l => l.product?.includes('Dr')).length;
        const easeLeads = finalCurrentLeads.filter(l => l.product?.includes('POS') || l.product === 'Ease').length;

        const currentDemos = activities.filter(a => {
            if (a.activityType !== "Demo" || !a.createdAt) return false;
            const aDate = new Date(a.createdAt);
            return aDate >= currentWeek.start && aDate <= currentWeek.end;
        }).length;

        const wowColor = wowPercent >= 0 ? "text-emerald-400" : "text-rose-400";
        const WoWTag = (
            <div className="flex items-center gap-1.5 group relative">
                <span className={`${wowColor} flex items-center gap-0.5 whitespace-nowrap text-[14px] font-bold`}>
                    ({wowPercent >= 0 ? "+" : "-"}{Math.abs(wowPercent).toFixed(1)}%)
                </span>
                <div className="p-0.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors cursor-help">
                    <Info className="w-3 h-3" />
                </div>

                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] text-[11px] leading-relaxed text-slate-300 pointer-events-none">
                    <p className="font-bold text-white mb-1">Growth Calculation (WoW)</p>
                    <p>อัตราการเติบโตเมื่อเทียบกับสัปดาห์ก่อน:</p>
                    <div className="mt-2 p-2 bg-black/30 rounded-lg font-mono text-indigo-300">
                        ((จำนวนสัปดาห์นี้ - จำนวนสัปดาห์ก่อน) / จำนวนสัปดาห์ก่อน) x 100
                    </div>
                </div>
            </div>
        );

        return [
            { label: "Total Leads – This Week", subLabel: "ผู้สนใจรายสัปดาห์ (Mon-Sun)", numericValue: currentCount, prefix: "", suffix: "", sub: `Dr.Ease: ${dreaseLeads} | Ease: ${easeLeads}`, extraInfo: WoWTag, tooltip: "อัตราการเติบโตเมื่อเทียบกับสัปดาห์ก่อน (WoW): ((จำนวนสัปดาห์นี้-จำนวนสัปดาห์ก่อน) / จำนวนสัปดาห์ก่อน) x 100", icon: Briefcase, color: "text-amber-400", border: "border-amber-500/20", bg: "from-amber-500/10" },
            { label: "Weekly Demos", subLabel: "การทำ Demo รายสัปดาห์", numericValue: currentDemos, prefix: "", suffix: "", sub: `เข้าข่ายสัปดาห์ปัจจุบัน`, icon: Monitor, color: "text-blue-400", border: "border-blue-500/20", bg: "from-blue-500/10" },
            { label: "New Sales", subLabel: "ยอดเงินปิดใหม่", numericValue: 408604, prefix: "฿", suffix: "", sub: "Revenue สัปดาห์นี้", icon: DollarSign, color: "text-emerald-400", border: "border-emerald-500/20", bg: "from-emerald-500/10" },
            { label: "Renewal", subLabel: "ยอดเงินต่อสัญญา", numericValue: 882120, prefix: "฿", suffix: "", sub: "Revenue สัปดาห์นี้", icon: TrendingUp, color: "text-purple-400", border: "border-purple-500/20", bg: "from-purple-500/10" },
        ];
    }, [googleSheetLeads, activities]);

    const dynamicGraphData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let startDate: Date;
        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        if (timeRange === 'custom' && customStartDate && customEndDate) {
            startDate = parseLocalISO(customStartDate) || new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = parseLocalISO(customEndDate) || new Date();
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            const daysBack = timeRange === '1w' ? 7 : timeRange === '1m' ? 30 : 365;
            startDate.setDate(startDate.getDate() - daysBack + 1);
        }

        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const groupBy = daysDiff > 400 ? 'month' : (daysDiff > 45 ? 'week' : 'day');

        const normalizeDate = (dateVal: string | undefined) => {
            const d = parseSheetDate(dateVal);
            if (!d) return null;
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        if (groupBy === 'month') {
            const monthlyData: { [key: string]: any } = {};
            const current = new Date(startDate);
            while (current <= endDate) {
                const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[key] = { drease: 0, ease: 0, leads: 0, demos: 0 };
                current.setMonth(current.getMonth() + 1);
            }
            googleSheetLeads.forEach(l => {
                const lDate = parseSheetDate(l.date);
                if (lDate && lDate >= startDate && lDate <= endDate) {
                    const key = `${lDate.getFullYear()}-${String(lDate.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyData[key]) {
                        if (l.product?.includes('Dr')) monthlyData[key].drease++;
                        else if (l.product?.includes('POS') || l.product === 'Ease') monthlyData[key].ease++;
                        monthlyData[key].leads++;
                    }
                }
            });
            return Object.entries(monthlyData).map(([key, data]) => ({
                name: months[parseInt(key.split('-')[1]) - 1] + ' ' + key.split('-')[0].slice(2),
                fullDate: months[parseInt(key.split('-')[1]) - 1] + ' ' + key.split('-')[0],
                ...data
            }));
        }

        const count = daysDiff;
        return Array.from({ length: count }).map((_, i) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = normalizeDate(date.toISOString());
            const leadsOnDay = googleSheetLeads.filter(l => {
                const sameDate = normalizeDate(l.date) === dateStr;
                if (!sameDate) return false;
                const matchesProduct = productFilter === 'all' ||
                    (productFilter === 'Dr.Ease' && l.product?.includes('Dr')) ||
                    (productFilter === 'Ease POS' && (l.product?.includes('POS') || l.product === 'Ease'));
                return matchesProduct;
            });
            const demosOnDay = activities.filter(a => a.activityType === "Demo" && normalizeDate(a.createdAt) === dateStr);

            return {
                name: `${date.getDate()} ${days[date.getDay()]}`,
                fullDate: date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
                drease: (dataType === 'all' || dataType === 'lead')
                    ? leadsOnDay.filter(l => l.product?.includes('Dr')).length : 0,
                ease: (dataType === 'all' || dataType === 'lead')
                    ? leadsOnDay.filter(l => l.product?.includes('POS') || l.product === 'Ease').length : 0,
                leads: leadsOnDay.length,
                demos: (dataType === 'all' || dataType === 'demo') ? demosOnDay.length : 0,
            };
        });
    }, [timeRange, customStartDate, customEndDate, googleSheetLeads, activities, dataType, productFilter]);

    const graphTotals = useMemo(() => {
        return dynamicGraphData.reduce((acc, curr) => {
            acc.drease += (curr.drease || 0);
            acc.ease += (curr.ease || 0);
            acc.leads += (curr.leads || 0);
            acc.demos += (curr.demos || 0);
            return acc;
        }, { drease: 0, ease: 0, leads: 0, demos: 0 });
    }, [dynamicGraphData]);

    const yAxisTicks = useMemo(() => {
        // Find max value across all data points
        const maxVal = Math.max(...dynamicGraphData.map(d => Math.max(d.drease || 0, d.ease || 0, d.leads || 0, d.demos || 0)));
        if (maxVal === 0) return [0, 5, 10]; // Minimum scale

        const interval = 5;
        const maxTick = Math.ceil(maxVal / interval) * interval;
        const ticks = [];
        for (let i = 0; i <= maxTick; i += interval) {
            ticks.push(i);
        }

        // If the range is very large (e.g. > 100 on Y axis), 20 ticks is too many. 
        // We'll revert to automatic scaling if ticks exceed a manageable number.
        return ticks.length > 20 ? undefined : ticks;
    }, [dynamicGraphData]);

    return (
        <div ref={dashboardRef} className={`animate-in fade-in zoom-in-95 duration-500 relative custom-scrollbar flex flex-col pt-2 ${isFullscreen ? 'p-8 bg-slate-950 h-screen w-screen overflow-hidden gap-4' : 'h-full overflow-hidden space-y-4'}`}>
            <ParticlesBackground className="absolute inset-0 z-0" />
            <style>{iconAnimationStyles}</style>

            <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10 ${isFullscreen ? 'mb-4 px-1' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="p-1 bg-white/5 rounded-2xl border border-white/10 shadow-xl overflow-hidden animate-in zoom-in-50 duration-700">
                        <img
                            src="/images/LOGO ATIZ-02.png"
                            alt="ATIZ Logo"
                            className="w-12 h-12 object-contain rounded-xl shadow-lg"
                            style={{ animation: 'logoPulse 4s ease-in-out infinite' }}
                        />
                    </div>
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
                </div>

                <div className="flex flex-col items-end gap-3 mr-1">
                    <div className="flex items-center gap-3 text-text-muted mr-12">
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[11px] font-bold tracking-wider font-mono">{currentTime.toLocaleTimeString('th-TH', { hour12: false })}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 hidden sm:block">{currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>

                    {!isFullscreen && (
                        <div className="flex items-center gap-2">
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
                                <button onClick={() => setIsAutoCycle(!isAutoCycle)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isAutoCycle ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}>
                                    {isAutoCycle ? <Pause className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                                    {isAutoCycle ? 'AUTO-ON' : 'Cycle Off'}
                                </button>
                            </div>
                            <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                                <Tv className="w-4 h-4" /> Fullscreen
                            </button>
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 ml-2">
                                <button onClick={() => setActiveTab('cs')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all px-6 ${activeTab === 'cs' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                    <ActivityIcon className="w-4 h-4" /> CS Insights
                                </button>
                                <button onClick={() => setActiveTab('business')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all px-6 ${activeTab === 'business' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                    <BarChart3 className="w-4 h-4" /> Business
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {activeTab === 'cs' && (
                <div className="relative z-10 animate-in slide-in-from-left-4 duration-500 flex flex-col min-h-0 flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                        {csStats.map((stat, i) => (
                            <div key={i} className={`glass-card p-4 border transition-all hover:-translate-y-1 ${stat.border}`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent opacity-30`} />
                                <div className="relative flex flex-col gap-2">
                                    <div className={`p-1.5 w-fit rounded-lg bg-white/5 ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" style={{ animation: `iconFloat${i} 3s ease-in-out infinite, continuousFloat 5s ease-in-out infinite` }} />
                                    </div>
                                    <div>
                                        <p className="text-text-muted text-sm uppercase font-bold tracking-widest">{stat.label}</p>
                                        <p className="text-indigo-400/80 text-xs font-bold -mt-0.5 mb-1">{stat.subLabel}</p>
                                        <h3 className="text-3xl font-bold text-text-main tracking-tighter leading-none">{stat.value}</h3>
                                        <p className="text-text-muted text-xs font-bold mt-1 line-clamp-1">{stat.sub}</p>
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

            {activeTab === 'business' && (
                <div className="relative z-10 animate-in slide-in-from-right-4 duration-500 flex flex-col min-h-0 flex-1 gap-3 overflow-visible">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0 pt-1">
                        {businessStats.map((stat, i) => (
                            <div key={i} className={`glass-card p-4 border transition-all duration-300 hover:-translate-y-1 hover:z-20 ${stat.border}`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent opacity-30 transition-opacity duration-300 group-hover:opacity-50`} />
                                <div className="relative flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={`p-1.5 w-fit rounded-lg bg-white/5 ${stat.color} transition-transform duration-300 hover:scale-110`}
                                            style={{ animation: `iconFloat${i} 3s ease-in-out infinite, continuousFloat 6s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}
                                        >
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-text-muted text-sm uppercase font-bold tracking-widest">{stat.label}</p>
                                        <p className="text-indigo-400/80 text-xs font-bold -mt-0.5 mb-1">{stat.subLabel}</p>
                                        <div className="flex items-baseline justify-between w-full mt-1">
                                            <h3 className="text-3xl font-bold text-text-main tracking-tighter leading-none">
                                                <AnimatedNumber value={stat.numericValue} duration={1500} prefix={stat.prefix} suffix={stat.suffix} />
                                            </h3>
                                            {stat.extraInfo && <div>{stat.extraInfo}</div>}
                                        </div>
                                        <p className="text-text-muted text-xs font-bold mt-1 line-clamp-1">{stat.sub}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
                        <div className="lg:col-span-2 glass-card p-6 border-white/5 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex flex-col">
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        <LineChart className="w-4 h-4 text-indigo-400" />
                                        {timeRange === '1w' ? 'Weekly' : timeRange === '1m' ? 'Monthly' : timeRange === '1y' ? 'Yearly' : 'Custom'} Leads & Demos Growth
                                    </h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                        อัตราการเติบโตของ Lead และ Demo {timeRange === '1w' ? 'รายสัปดาห์' : 'ช่วงเวลาที่กำหนด'}
                                    </p>
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
                                            portalContainer={dashboardRef.current}
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
                                            onChange={(val) => setProductFilter(val as any)}
                                            className="h-9"
                                            portalContainer={dashboardRef.current}
                                        />
                                    </div>
                                    <div className="w-28 flex-shrink-0">
                                        <CustomSelect
                                            options={[
                                                { value: '1w', label: '1 Week' },
                                                { value: '1m', label: '1 Month' },
                                                { value: '1y', label: '1 Year' },
                                                { value: 'custom', label: 'Custom' }
                                            ]}
                                            value={timeRange}
                                            onChange={(val) => {
                                                const newRange = val as '1w' | '1m' | '1y' | 'custom';
                                                setTimeRange(newRange);
                                                if (newRange === 'custom' && (!customStartDate || !customEndDate)) {
                                                    const today = new Date();
                                                    const yyyy = today.getFullYear();
                                                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                                                    const dd = String(today.getDate()).padStart(2, '0');
                                                    const dateStr = `${yyyy}-${mm}-${dd}`;
                                                    if (!customStartDate) setCustomStartDate(dateStr);
                                                    if (!customEndDate) setCustomEndDate(dateStr);
                                                }
                                            }}
                                            className="h-9"
                                            portalContainer={dashboardRef.current}
                                        />
                                    </div>

                                    {timeRange === 'custom' && (
                                        <>
                                            <div className="w-32 flex-shrink-0 animate-in fade-in slide-in-from-right-2 duration-300">
                                                <CustomDatePicker
                                                    value={customStartDate}
                                                    onChange={setCustomStartDate}
                                                    placeholder="Start Date"
                                                    className="h-9"
                                                    portalContainer={dashboardRef.current}
                                                />
                                            </div>
                                            <div className="w-32 flex-shrink-0 animate-in fade-in slide-in-from-right-2 duration-300 delay-75">
                                                <CustomDatePicker
                                                    value={customEndDate}
                                                    onChange={setCustomEndDate}
                                                    placeholder="End Date"
                                                    className="h-9"
                                                    portalContainer={dashboardRef.current}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-0 mt-2">
                                <div className="flex flex-col gap-6 pr-8 border-r border-white/5 min-w-[220px] py-2">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8]" />
                                            <span className="text-white text-xs uppercase font-black tracking-widest">Total Leads</span>
                                        </div>
                                        <p className="text-white text-4xl font-bold tracking-tighter tabular-nums leading-none mb-4">
                                            {(graphTotals.drease + graphTotals.ease).toLocaleString()}
                                        </p>
                                        <div className="relative flex flex-col gap-4 ml-1.5 pl-5 border-l border-white/10">
                                            <div className="flex flex-col relative">
                                                <div className="absolute -left-5 top-2 w-4 h-px bg-white/10" />
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <div className="w-2 h-2 rounded-full bg-[#7053E1] shadow-[0_0_8px_#7053E1]" />
                                                    <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Lead Dr.ease</span>
                                                </div>
                                                <p className="text-white text-2xl font-bold tracking-tighter tabular-nums leading-none">{graphTotals.drease.toLocaleString()}</p>
                                            </div>
                                            <div className="flex flex-col relative">
                                                <div className="absolute -left-5 top-2 w-4 h-px bg-white/10" />
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <div className="w-2 h-2 rounded-full bg-[#F76D85] shadow-[0_0_8px_#F76D85]" />
                                                    <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Lead EasePOS</span>
                                                </div>
                                                <p className="text-white text-2xl font-bold tracking-tighter tabular-nums leading-none">{graphTotals.ease.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/5 w-full" />
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
                                            <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Demos</span>
                                        </div>
                                        <p className="text-white text-3xl font-bold tracking-tighter tabular-nums leading-none">{graphTotals.demos.toLocaleString()}</p>
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
                                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                                            <YAxis
                                                stroke="#64748b"
                                                fontSize={10}
                                                fontWeight="bold"
                                                tickLine={false}
                                                axisLine={false}
                                                allowDecimals={false}
                                                tickFormatter={(value) => Math.floor(value).toString()}
                                                ticks={yAxisTicks}
                                                domain={[0, 'auto']}
                                            />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                                                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                                                    <span className="text-white font-bold text-xs tracking-tight">{payload[0].payload.fullDate || label}</span>
                                                                </div>
                                                                <div className="space-y-2.5">
                                                                    {payload.map((entry, index) => (
                                                                        <div key={index} className="flex items-center justify-between gap-8">
                                                                            <div className="flex items-center gap-2.5">
                                                                                <div className="w-2 rounded-full h-2 shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}80` }} />
                                                                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{entry.name}</span>
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
                                            />
                                            <Area type="monotone" dataKey="drease" name="Dr.Ease" stroke="#7053E1" fill="url(#colorDrease)" strokeWidth={3} activeDot={{ r: 6, stroke: '#7053E1', strokeWidth: 2, fill: '#fff' }} />
                                            <Area type="monotone" dataKey="ease" name="Ease" stroke="#F76D85" fill="url(#colorEase)" strokeWidth={3} activeDot={{ r: 6, stroke: '#F76D85', strokeWidth: 2, fill: '#fff' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 border-white/5 flex flex-col min-h-0">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-emerald-400" />
                                Growth & Usage Metrics
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">สถิติการเติบโตและการใช้งาน</p>
                            <div className={`flex-1 min-h-0 ${isFullscreen ? 'grid grid-rows-4 gap-2' : 'space-y-4 overflow-y-auto custom-scrollbar'}`}>
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/15 flex flex-col justify-center">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Renewal Rate</p>
                                            <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">% ต่อสัญญา</p>
                                        </div>
                                        <span className={`text-indigo-400 font-bold tracking-tight ${isFullscreen ? 'text-xl' : 'text-sm'}`}>50%</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-0.5">
                                        <div><p className="text-[10px] text-slate-500 uppercase font-bold">Dr.Ease</p><p className="font-bold tracking-tight text-white">55.55%</p></div>
                                        <div><p className="text-[10px] text-slate-500 uppercase font-bold">Ease</p><p className="font-bold tracking-tight text-white">44.44%</p></div>
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/15 flex flex-col justify-center">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Merchant Onboard</p>
                                            <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">จำนวนการขึ้นระบบ</p>
                                        </div>
                                        <span className={`text-emerald-400 font-bold tracking-tight ${isFullscreen ? 'text-xl' : 'text-sm'}`}>561</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-0.5">
                                        <div><p className="text-[10px] text-slate-500 uppercase font-bold">Dr.Ease</p><p className="font-bold tracking-tight text-white">420</p></div>
                                        <div><p className="text-[10px] text-slate-500 uppercase font-bold">Ease</p><p className="font-bold tracking-tight text-white">141</p></div>
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-center">
                                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Ease Pay Usage</p>
                                    <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">จำนวนลูกค้า Ease Pay</p>
                                    <p className={`font-bold tracking-tight text-white ${isFullscreen ? 'text-xl' : 'text-2xl'}`}>850</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center">
                                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Online Booking</p>
                                    <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">ระบบจองออนไลน์</p>
                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                        <div><p className="text-[9px] text-indigo-400 font-bold">Pages</p><p className="font-bold tracking-tight text-white text-lg">320</p></div>
                                        <div><p className="text-[9px] text-emerald-400 font-bold">Bookings</p><p className="font-bold tracking-tight text-white text-lg">1,240</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
