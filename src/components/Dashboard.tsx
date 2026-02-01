"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
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
import type { Customer, Installation, Issue, Lead, Activity as CSActivity, GoogleSheetLead, MasterDemoLead, BusinessMetrics, NewSalesRecord } from "@/types";

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
    googleSheetDemos?: MasterDemoLead[];
    newSalesData?: NewSalesRecord[];
    businessMetrics?: BusinessMetrics;
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

const Dashboard = React.memo(function Dashboard({ customers, installations, issues, activities, leads, googleSheetLeads = [], googleSheetDemos = [], newSalesData = [], businessMetrics, user, onViewChange }: DashboardProps) {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'cs' | 'business'>('cs');
    const [timeRange, setTimeRange] = useState<'1w' | '1m' | '3m' | '6m' | '1y' | 'custom'>('1w');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [productFilter, setProductFilter] = useState<'all' | 'Dr.Ease' | 'Ease POS'>('all');
    const [salesFilter, setSalesFilter] = useState<'all' | 'Aoey' | 'Yo'>('all');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAutoCycle, setIsAutoCycle] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState('leads');

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

        const finalCurrentLeads = filterLeadsByRange(currentWeek);
        const finalPrevLeads = filterLeadsByRange(previousWeek);
        const currentCount = finalCurrentLeads.length;
        const prevCount = finalPrevLeads.length;

        let wowPercent = 0;
        if (prevCount > 0) wowPercent = ((currentCount - prevCount) / prevCount) * 100;
        else if (currentCount > 0) wowPercent = 100;

        const dreaseLeads = finalCurrentLeads.filter(l => l.product?.includes('Dr')).length;
        const easeLeads = finalCurrentLeads.filter(l => l.product?.includes('POS') || l.product === 'Ease').length;

        const googleDemosThisWeek = googleSheetDemos.filter(d => {
            if (!d.date) return false;
            const rDate = parseSheetDate(d.date);
            // Only count demos with "Demo แล้ว" status
            const isDemoCompleted = d.demoStatus?.includes('Demo แล้ว');
            return rDate && rDate >= currentWeek.start && rDate <= currentWeek.end && isDemoCompleted;
        }).length;

        const currentDemos = activities.filter(a => {
            if (a.activityType !== "Demo" || !a.createdAt) return false;
            const aDate = new Date(a.createdAt);
            return aDate >= currentWeek.start && aDate <= currentWeek.end;
        }).length + googleDemosThisWeek;

        // Calculate Previous Demos for WoW
        const googleDemosPrevWeek = googleSheetDemos.filter(d => {
            if (!d.date) return false;
            const rDate = parseSheetDate(d.date);
            // Only count demos with "Demo แล้ว" status
            const isDemoCompleted = d.demoStatus?.includes('Demo แล้ว');
            return rDate && rDate >= previousWeek.start && rDate <= previousWeek.end && isDemoCompleted;
        }).length;

        const prevDemos = activities.filter(a => {
            if (a.activityType !== "Demo" || !a.createdAt) return false;
            const aDate = new Date(a.createdAt);
            return aDate >= previousWeek.start && aDate <= previousWeek.end;
        }).length + googleDemosPrevWeek;

        let demosWoWPercent = 0;
        if (prevDemos > 0) demosWoWPercent = ((currentDemos - prevDemos) / prevDemos) * 100;
        else if (currentDemos > 0) demosWoWPercent = 100;

        const wowColor = wowPercent >= 0 ? "text-emerald-400" : "text-rose-400";
        const WoWTag = (
            <div className="flex items-center gap-1.5 relative">
                <span className={`${wowColor} flex items-center gap-0.5 whitespace-nowrap text-[14px] font-bold`}>
                    ({wowPercent >= 0 ? "+" : "-"}{Math.abs(wowPercent).toFixed(1)}%)
                </span>
                <div className="relative group/tooltip">
                    <div className="p-0.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors cursor-help">
                        <Info className="w-3 h-3" />
                    </div>

                    {/* Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-card-bg backdrop-blur-xl border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[100] text-[11px] leading-relaxed text-text-muted pointer-events-none">
                        <p className="font-bold text-text-main mb-1">Growth Calculation (WoW)</p>
                        <p>อัตราการเติบโตเมื่อเทียบกับสัปดาห์ก่อน:</p>
                        <div className="mt-2 p-2 bg-black/5 dark:bg-black/30 rounded-lg font-mono text-indigo-500 dark:text-indigo-300">
                            ((จำนวนสัปดาห์นี้ - จำนวนสัปดาห์ก่อน) / จำนวนสัปดาห์ก่อน) x 100
                        </div>
                    </div>
                </div>
            </div>
        );

        const demosWoWColor = demosWoWPercent >= 0 ? "text-emerald-400" : "text-rose-400";
        const DemosWoWTag = (
            <div className="flex items-center gap-1.5 relative">
                <span className={`${demosWoWColor} flex items-center gap-0.5 whitespace-nowrap text-[14px] font-bold`}>
                    ({demosWoWPercent >= 0 ? "+" : "-"}{Math.abs(demosWoWPercent).toFixed(1)}%)
                </span>
                <div className="relative group/tooltip">
                    <div className="p-0.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors cursor-help">
                        <Info className="w-3 h-3" />
                    </div>

                    {/* Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-card-bg backdrop-blur-xl border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[100] text-[11px] leading-relaxed text-text-muted pointer-events-none">
                        <p className="font-bold text-text-main mb-1">Demos Growth (WoW)</p>
                        <p>อัตราการเติบโตของ Demo เทียบกับสัปดาห์ก่อน:</p>
                        <div className="mt-2 p-2 bg-black/5 dark:bg-black/30 rounded-lg font-mono text-indigo-500 dark:text-indigo-300">
                            ((Demo สัปดาห์นี้ - ก่อนหน้า) / ก่อนหน้า) x 100
                        </div>
                    </div>
                </div>
            </div>
        );

        // Calculate New Sales from Google Sheets data
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentBuddhistYear = String(currentYear + 543);

        // Map to convert Thai month abbreviations
        const thaiMonthMap: { [key: string]: number } = {
            'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3,
            'พ.ค.': 4, 'มิ.ย.': 5, 'ก.ค.': 6, 'ส.ค.': 7,
            'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11
        };

        // Calculate current month's new sales
        const currentMonthSales = newSalesData
            .filter(s => {
                const sMonth = thaiMonthMap[s.month];
                const sYear = s.year;
                return sMonth === currentMonth && sYear === currentBuddhistYear;
            })
            .reduce((sum, s) => sum + (s.amount || 0), 0);

        // Calculate previous month's sales for comparison
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? String(currentYear + 543 - 1) : currentBuddhistYear;
        const prevMonthSales = newSalesData
            .filter(s => {
                const sMonth = thaiMonthMap[s.month];
                const sYear = s.year;
                return sMonth === prevMonth && sYear === prevYear;
            })
            .reduce((sum, s) => sum + (s.amount || 0), 0);

        // Use calculated sales or fallback to businessMetrics
        const newSales = currentMonthSales > 0 ? currentMonthSales : (businessMetrics?.newSales ?? 0);
        const renewal = businessMetrics?.renewal ?? 0;

        // Calculate Sales MoM %
        let salesMoMPercent = 0;
        if (prevMonthSales > 0) salesMoMPercent = ((currentMonthSales - prevMonthSales) / prevMonthSales) * 100;
        else if (currentMonthSales > 0) salesMoMPercent = 100;

        const salesMoMColor = salesMoMPercent >= 0 ? "text-emerald-400" : "text-rose-400";
        const SalesMoMTag = (
            <div className="flex items-center gap-1.5 relative">
                <span className={`${salesMoMColor} flex items-center gap-0.5 whitespace-nowrap text-[14px] font-bold`}>
                    ({salesMoMPercent >= 0 ? "+" : "-"}{Math.abs(salesMoMPercent).toFixed(1)}%)
                </span>
                <div className="relative group/tooltip">
                    <div className="p-0.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors cursor-help">
                        <Info className="w-3 h-3" />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-card-bg backdrop-blur-xl border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[100] text-[11px] leading-relaxed text-text-muted pointer-events-none">
                        <p className="font-bold text-text-main mb-1">Sales Growth (MoM)</p>
                        <p>รายได้ปิดใหม่เทียบกับเดือนก่อนหน้า:</p>
                        <div className="mt-2 p-2 bg-black/5 dark:bg-black/30 rounded-lg font-mono text-indigo-500 dark:text-indigo-300">
                            ((ยอดเดือนนี้ - เดือนก่อน) / เดือนก่อน) x 100
                        </div>
                    </div>
                </div>
            </div>
        );

        // Get Thai month name for display
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const currentMonthName = thaiMonths[currentMonth];

        return [
            { id: 'leads', label: "Total Leads – This Week", subLabel: "ผู้สนใจรายสัปดาห์ (Mon-Sun)", numericValue: currentCount, prefix: "", suffix: "", sub: `Dr.Ease: ${dreaseLeads} | Ease: ${easeLeads}`, extraInfo: WoWTag, tooltip: "อัตราการเติบโตเมื่อเทียบกับสัปดาห์ก่อน (WoW): ((จำนวนสัปดาห์นี้-จำนวนสัปดาห์ก่อน) / จำนวนสัปดาห์ก่อน) x 100", icon: Briefcase, color: "text-amber-400", border: "border-amber-500/20", bg: "from-amber-500/10" },
            { id: 'demos', label: "Weekly Demos", subLabel: "การทำ Demo รายสัปดาห์ (Mon-Sun)", numericValue: currentDemos, prefix: "", suffix: "", sub: `เข้าข่ายสัปดาห์ปัจจุบัน`, extraInfo: DemosWoWTag, icon: Monitor, color: "text-blue-400", border: "border-blue-500/20", bg: "from-blue-500/10" },
            { id: 'sales', label: "New Sales", subLabel: `ยอดเงินปิดใหม่ (${currentMonthName} ${currentBuddhistYear.slice(-2)})`, numericValue: newSales, prefix: "฿", suffix: "", sub: prevMonthSales > 0 ? `เดือนก่อน: ฿${prevMonthSales.toLocaleString()}` : "Revenue เดือนนี้", extraInfo: SalesMoMTag, icon: DollarSign, color: "text-emerald-400", border: "border-emerald-500/20", bg: "from-emerald-500/10" },
            { id: 'renewals', label: "Renewal", subLabel: "ยอดเงินต่อสัญญา", numericValue: renewal, prefix: "฿", suffix: "", sub: "Revenue เดือนนี้", icon: TrendingUp, color: "text-purple-400", border: "border-purple-500/20", bg: "from-purple-500/10" },
        ];
    }, [googleSheetLeads, googleSheetDemos, activities, businessMetrics, newSalesData]);

    const dateRange = useMemo(() => {
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
            const daysBack = timeRange === '1w' ? 7 : timeRange === '1m' ? 30 : timeRange === '3m' ? 90 : timeRange === '6m' ? 180 : 365;
            startDate.setDate(startDate.getDate() - daysBack + 1);
        }
        return { startDate, endDate };
    }, [timeRange, customStartDate, customEndDate]);

    const filteredMasterDemos = useMemo(() => {
        const { startDate, endDate } = dateRange;
        return googleSheetDemos.filter(d => {
            const dDate = parseSheetDate(d.date);
            if (!dDate) return false;
            // Check strictly for date range to match graph
            const inDateRange = dDate >= startDate && dDate <= endDate;
            const matchesSales = salesFilter === 'all' || d.salesperson?.includes(salesFilter);
            return inDateRange && matchesSales;
        });
    }, [googleSheetDemos, dateRange, salesFilter]);

    const dynamicGraphData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const { startDate, endDate } = dateRange;

        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        // Always group by month for sales metric
        const groupBy = selectedMetric === 'sales' ? 'month' : (daysDiff > 400 ? 'month' : (daysDiff > 45 ? 'week' : 'day'));

        const normalizeDate = (dateVal: string | undefined) => {
            const d = parseSheetDate(dateVal);
            if (!d) return null;
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        // Thai month mapping for sales data
        const thaiMonthMap: { [key: string]: number } = {
            'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4,
            'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8,
            'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12
        };

        // Helper to get sales for a specific month/year
        const getSalesForMonth = (gregorianYear: number, month: number) => {
            const buddhistYear = String(gregorianYear + 543);
            return newSalesData
                .filter(s => {
                    const sMonth = thaiMonthMap[s.month];
                    return sMonth === month && s.year === buddhistYear;
                })
                .reduce((sum, s) => sum + (s.amount || 0), 0);
        };

        // Helper to get sales for a specific month/year by salesperson
        const getSalesForMonthBySalesperson = (gregorianYear: number, month: number, salesperson: string) => {
            const buddhistYear = String(gregorianYear + 543);
            return newSalesData
                .filter(s => {
                    const sMonth = thaiMonthMap[s.month];
                    return sMonth === month && s.year === buddhistYear && s.salesName?.includes(salesperson);
                })
                .reduce((sum, s) => sum + (s.amount || 0), 0);
        };

        if (groupBy === 'month') {
            const monthlyData: { [key: string]: any } = {};
            const current = new Date(startDate);
            while (current <= endDate) {
                const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                const salesAoey = getSalesForMonthBySalesperson(current.getFullYear(), current.getMonth() + 1, 'เอย');
                const salesYo = getSalesForMonthBySalesperson(current.getFullYear(), current.getMonth() + 1, 'โย');
                // Apply sales filter for sales metric
                const filteredSalesAoey = (salesFilter === 'all' || salesFilter === 'Aoey') ? salesAoey : 0;
                const filteredSalesYo = (salesFilter === 'all' || salesFilter === 'Yo') ? salesYo : 0;
                const salesAmount = salesFilter === 'all'
                    ? getSalesForMonth(current.getFullYear(), current.getMonth() + 1)
                    : (filteredSalesAoey + filteredSalesYo);
                monthlyData[key] = {
                    drease: 0, ease: 0, leads: 0, demos: 0, demosAoey: 0, demosYo: 0,
                    sales: salesAmount, salesAoey: filteredSalesAoey, salesYo: filteredSalesYo, renewals: 0
                };
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
            googleSheetDemos.forEach(d => {
                const dDate = parseSheetDate(d.date);
                // Only count demos with "Demo แล้ว" status
                const isDemoCompleted = d.demoStatus?.includes('Demo แล้ว');
                if (dDate && dDate >= startDate && dDate <= endDate && isDemoCompleted) {
                    const key = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyData[key]) {
                        // Count by salesperson with filter
                        const matchesSales = salesFilter === 'all' || d.salesperson?.includes(salesFilter);
                        if (matchesSales) {
                            monthlyData[key].demos++;
                            if (d.salesperson?.includes('Aoey')) monthlyData[key].demosAoey++;
                            else if (d.salesperson?.includes('Yo')) monthlyData[key].demosYo++;
                        }
                    }
                }
            });
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            return Object.entries(monthlyData).map(([key, data]) => {
                const monthIndex = parseInt(key.split('-')[1]) - 1;
                const year = key.split('-')[0];
                const buddhistYear = (parseInt(year) + 543).toString().slice(-2);
                return {
                    name: thaiMonths[monthIndex] + ' ' + buddhistYear,
                    fullDate: thaiMonths[monthIndex] + ' พ.ศ. ' + (parseInt(year) + 543),
                    ...data
                };
            });
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
            const googleDemosOnDay = googleSheetDemos.filter(d => {
                const sameDate = normalizeDate(d.date) === dateStr;
                // Only count demos with "Demo แล้ว" status
                const isDemoCompleted = d.demoStatus?.includes('Demo แล้ว');
                return sameDate && isDemoCompleted;
            });
            const demosOnDay = activities.filter(a => a.activityType === "Demo" && normalizeDate(a.createdAt) === dateStr);
            const demosAoeyOnDay = (salesFilter === 'all' || salesFilter === 'Aoey') ? googleDemosOnDay.filter(d => d.salesperson?.includes('Aoey')).length : 0;
            const demosYoOnDay = (salesFilter === 'all' || salesFilter === 'Yo') ? googleDemosOnDay.filter(d => d.salesperson?.includes('Yo')).length : 0;

            // Get monthly sales for this date (since we don't have daily granularity)
            const monthlySales = getSalesForMonth(date.getFullYear(), date.getMonth() + 1);
            const monthlySalesAoey = getSalesForMonthBySalesperson(date.getFullYear(), date.getMonth() + 1, 'เอย');
            const monthlySalesYo = getSalesForMonthBySalesperson(date.getFullYear(), date.getMonth() + 1, 'โย');
            const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            const dailySalesEstimate = Math.round(monthlySales / daysInMonth);
            const dailySalesAoey = Math.round(monthlySalesAoey / daysInMonth);
            const dailySalesYo = Math.round(monthlySalesYo / daysInMonth);

            return {
                name: `${date.getDate()} ${days[date.getDay()]}`,
                fullDate: date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
                drease: leadsOnDay.filter(l => l.product?.includes('Dr')).length,
                ease: leadsOnDay.filter(l => l.product?.includes('POS') || l.product === 'Ease').length,
                leads: leadsOnDay.length,
                demos: (salesFilter === 'all' ? (demosOnDay.length + googleDemosOnDay.length) : (demosAoeyOnDay + demosYoOnDay)),
                demosAoey: demosAoeyOnDay,
                demosYo: demosYoOnDay,
                sales: dailySalesEstimate,
                salesAoey: dailySalesAoey,
                salesYo: dailySalesYo,
                renewals: 0,
            };
        });
    }, [dateRange, googleSheetLeads, googleSheetDemos, activities, productFilter, salesFilter, newSalesData, selectedMetric]);

    const graphTotals = useMemo(() => {
        return dynamicGraphData.reduce((acc, curr) => {
            acc.drease += (curr.drease || 0);
            acc.ease += (curr.ease || 0);
            acc.leads += (curr.leads || 0);
            acc.demos += (curr.demos || 0);
            acc.demosAoey += (curr.demosAoey || 0);
            acc.demosYo += (curr.demosYo || 0);
            acc.sales += (curr.sales || 0);
            acc.salesAoey += (curr.salesAoey || 0);
            acc.salesYo += (curr.salesYo || 0);
            acc.renewals += (curr.renewals || 0);
            return acc;
        }, { drease: 0, ease: 0, leads: 0, demos: 0, demosAoey: 0, demosYo: 0, sales: 0, salesAoey: 0, salesYo: 0, renewals: 0 });
    }, [dynamicGraphData]);

    // Compute sales by salesperson dynamically
    const salesBySalesperson = useMemo(() => {
        const { startDate, endDate } = dateRange;
        const thaiMonthMap: { [key: string]: number } = {
            'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3,
            'พ.ค.': 4, 'มิ.ย.': 5, 'ก.ค.': 6, 'ส.ค.': 7,
            'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11
        };

        const salesMap: { [key: string]: number } = {};
        const colors = ['#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

        newSalesData.forEach(s => {
            if (!s.salesName || !s.month || !s.year) return;

            // Convert Thai Buddhist year to Gregorian
            const buddhistYear = parseInt(s.year);
            const gregorianYear = buddhistYear - 543;
            const monthIndex = thaiMonthMap[s.month];
            if (monthIndex === undefined) return;

            const saleDate = new Date(gregorianYear, monthIndex, 15);
            if (saleDate >= startDate && saleDate <= endDate) {
                const name = s.salesName.trim();
                if (!salesMap[name]) salesMap[name] = 0;
                salesMap[name] += s.amount || 0;
            }
        });

        return Object.entries(salesMap)
            .filter(([_, amount]) => amount > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([name, amount], index) => ({
                name,
                amount,
                color: colors[index % colors.length]
            }));
    }, [newSalesData, dateRange]);

    const yAxisTicks = useMemo(() => {
        // Find max value across all data points
        const maxVal = Math.max(...dynamicGraphData.map(d =>
            Math.max(d.drease || 0, d.ease || 0, d.leads || 0, d.demos || 0, d.demosAoey || 0, d.demosYo || 0, d.sales || 0, d.renewals || 0)
        ));
        if (maxVal === 0) return [0, 5, 10]; // Minimum scale

        const interval = maxVal > 10000 ? 10000 : (maxVal > 1000 ? 1000 : 5);
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
        <div ref={dashboardRef} className={`animate-in fade-in zoom-in-95 duration-500 relative custom-scrollbar flex flex-col pt-2 ${isFullscreen ? `p-8 bg-bg-pure h-screen w-screen overflow-hidden gap-4` : 'h-full overflow-hidden space-y-4'}`}>
            <ParticlesBackground className="absolute inset-0 z-0" />
            <style>{iconAnimationStyles}</style>

            <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10 ${isFullscreen ? 'mb-4 px-1' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="p-1 bg-bg-hover rounded-2xl border border-border shadow-xl overflow-hidden animate-in zoom-in-50 duration-700">
                        <img
                            src="/images/LOGO ATIZ-02.png"
                            alt="ATIZ Logo"
                            className="w-12 h-12 object-contain rounded-xl shadow-lg"
                            style={{ animation: 'logoPulse 4s ease-in-out infinite' }}
                        />
                    </div>
                    <div>
                        <h1 className={`text-3xl font-black tracking-tight ${activeTab === 'business' ? 'text-text-main' : 'text-text-main bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400'}`}>
                            {activeTab === 'cs' ? 'CS Operational Center' : 'Business Insights'}
                        </h1>
                        <p className={`${activeTab === 'business' ? 'text-text-main opacity-90' : 'text-indigo-400'} font-bold text-[10px] uppercase tracking-widest mt-0.5`}>
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
                        <div className="flex items-center gap-1.5 bg-bg-hover px-3 py-1 rounded-lg border border-border-light">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[11px] font-bold tracking-wider font-mono">{currentTime.toLocaleTimeString('th-TH', { hour12: false })}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 hidden sm:block">{currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>

                    {!isFullscreen && (
                        <div className="flex items-center gap-2">
                            <div className="flex bg-bg-hover p-1 rounded-xl border border-border mr-2">
                                <button onClick={() => setIsAutoCycle(!isAutoCycle)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isAutoCycle ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}>
                                    {isAutoCycle ? <Pause className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                                    {isAutoCycle ? 'AUTO-ON' : 'Cycle Off'}
                                </button>
                            </div>
                            <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                                <Tv className="w-4 h-4" /> Fullscreen
                            </button>
                            <div className="flex bg-bg-hover p-1 rounded-xl border border-border ml-2">
                                <button onClick={() => setActiveTab('cs')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all px-6 ${activeTab === 'cs' ? 'bg-indigo-600 text-white shadow-lg' : 'text-text-muted hover:text-text-main hover:bg-bg-hover'}`}>
                                    <ActivityIcon className="w-4 h-4" /> CS Insights
                                </button>
                                <button onClick={() => setActiveTab('business')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all px-6 ${activeTab === 'business' ? 'bg-indigo-600 text-white shadow-lg' : 'text-text-muted hover:text-text-main hover:bg-bg-hover'}`}>
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
                            <div key={i} className={`glass-card p-4 border transition-all hover:-translate-y-1 ${stat.border} dark:${stat.border}`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent opacity-30`} />
                                <div className="relative flex flex-col gap-2">
                                    <div className={`p-1.5 w-fit rounded-lg bg-bg-hover ${stat.color}`}>
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
                        <div className="glass-card p-6 border-border flex flex-col min-h-0">
                            <h3 className="text-text-main font-bold flex items-center gap-2 flex-shrink-0">
                                <ActivityIcon className="w-4 h-4 text-indigo-400" />
                                Recent Support Activity
                            </h3>
                            <p className="text-text-muted opacity-60 text-[10px] font-bold uppercase tracking-widest mb-4 flex-shrink-0">กิจกรรมการซัพพอร์ตล่าสุด</p>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0 space-y-4">
                                {issues.slice(0, 5).map((issue, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer">
                                        <div className={`w-2 h-2 rounded-full ${issue.status === 'เสร็จสิ้น' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-text-main truncate hover:text-indigo-300 transition-colors">{issue.title}</p>
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
                        {businessStats.map((stat: any, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedMetric(stat.id)}
                                className={`group/card glass-card p-4 border transition-all duration-300 cursor-pointer relative hover:z-50 ${selectedMetric === stat.id
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 translate-y-[-4px] shadow-2xl shadow-indigo-500/10 z-40'
                                    : 'border-border hover:border-border-light hover:-translate-y-1'
                                    }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent opacity-30 transition-opacity duration-300 ${selectedMetric === stat.id ? 'opacity-60' : 'group-hover/card:opacity-50'}`} />
                                <div className="relative flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={`p-1.5 w-fit rounded-lg bg-bg-hover ${stat.color} transition-transform duration-300 ${selectedMetric === stat.id ? 'scale-110 shadow-[0_0_15px_currentColor]' : 'group-hover/card:scale-110'}`}
                                            style={{ animation: `iconFloat${i} 3s ease-in-out infinite, continuousFloat 6s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}
                                        >
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                        {selectedMetric === stat.id && (
                                            <div className="animate-pulse flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                                                <span className="text-[10px] text-indigo-400 font-black tracking-tighter uppercase">Active View</span>
                                            </div>
                                        )}
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
                                        {timeRange === '1w' ? 'Weekly' : timeRange === '1m' ? 'Monthly' : timeRange === '3m' ? '3 Months' : timeRange === '6m' ? '6 Months' : timeRange === '1y' ? 'Yearly' : 'Custom'} {
                                            selectedMetric === 'leads' ? 'Leads Performance' :
                                                selectedMetric === 'demos' ? 'Demos Performance' :
                                                    selectedMetric === 'sales' ? 'Sales Revenue Trend' : 'Renewal Revenue Trend'
                                        }
                                    </h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                        {selectedMetric === 'sales'
                                            ? `ยอดขายรายเดือน ${timeRange === '1m' ? '1 เดือนย้อนหลัง' : timeRange === '3m' ? '3 เดือนย้อนหลัง' : timeRange === '6m' ? '6 เดือนย้อนหลัง' : '1 ปีย้อนหลัง'}`
                                            : `อัตราการเติบโตของ Lead และ Demo ${timeRange === '1w' ? 'รายสัปดาห์' : 'ช่วงเวลาที่กำหนด'}`
                                        }
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 scale-90 origin-right">
                                    <div className="w-36 flex-shrink-0">
                                        {selectedMetric === 'demos' ? (
                                            <CustomSelect
                                                options={[
                                                    { value: 'all', label: 'ทั้งหมด' },
                                                    { value: 'Aoey', label: 'Aoey (เอย)' },
                                                    { value: 'Yo', label: 'Yo (โย)' }
                                                ]}
                                                value={salesFilter}
                                                onChange={(val) => setSalesFilter(val as any)}
                                                className="h-9"
                                                portalContainer={dashboardRef.current}
                                            />
                                        ) : selectedMetric === 'leads' ? (
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
                                        ) : null}
                                    </div>
                                    <div className="w-28 flex-shrink-0">
                                        <CustomSelect
                                            options={(selectedMetric === 'sales' || selectedMetric === 'renewals') ? [
                                                { value: '1m', label: '1 เดือน' },
                                                { value: '3m', label: '3 เดือน (รายไตรมาส)' },
                                                { value: '6m', label: '6 เดือน' },
                                                { value: '1y', label: '1 ปี' }
                                            ] : [
                                                { value: '1w', label: '1 Week' },
                                                { value: '1m', label: '1 Month' },
                                                { value: '1y', label: '1 Year' },
                                                { value: 'custom', label: 'Custom' }
                                            ]}
                                            value={(selectedMetric === 'sales' || selectedMetric === 'renewals') && !['1m', '3m', '6m', '1y'].includes(timeRange) ? '3m' : timeRange}
                                            onChange={(val) => {
                                                const newRange = val as '1w' | '1m' | '1y' | '3m' | '6m' | 'custom';
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
                                            <div className={`w-3 h-3 rounded-full ${selectedMetric === 'leads' ? 'bg-indigo-400 shadow-[0_0_10px_#818cf8]' : selectedMetric === 'demos' ? 'bg-blue-400 shadow-[0_0_10px_#3b82f6]' : selectedMetric === 'sales' ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-purple-400 shadow-[0_0_10px_#c084fc]'}`} />
                                            <span className="text-white text-xs uppercase font-black tracking-widest">
                                                {selectedMetric === 'leads' ? 'Total Leads' : selectedMetric === 'demos' ? 'Total' : selectedMetric === 'sales' ? 'Total Sales' : 'Renewal Total'}
                                            </span>
                                        </div>
                                        <p className="text-white text-4xl font-bold tracking-tighter tabular-nums leading-none mb-4">
                                            {selectedMetric === 'leads'
                                                ? (graphTotals.drease + graphTotals.ease).toLocaleString()
                                                : selectedMetric === 'demos'
                                                    ? filteredMasterDemos.length.toLocaleString()
                                                    : selectedMetric === 'sales'
                                                        ? `฿${graphTotals.sales.toLocaleString()}`
                                                        : `฿${graphTotals.renewals.toLocaleString()}`
                                            }
                                        </p>

                                        {selectedMetric === 'leads' ? (
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
                                        ) : selectedMetric === 'demos' ? (
                                            <div className="relative flex flex-col gap-3 ml-1.5 pl-5 border-l border-white/10">
                                                {/* Demo by Salesperson */}
                                                <div className="flex flex-col relative">
                                                    <div className="absolute -left-5 top-2 w-4 h-px bg-white/10" />
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]" />
                                                        <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Aoey</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-white text-xl font-bold tracking-tighter tabular-nums leading-none">
                                                            {filteredMasterDemos.filter(d => d.salesperson?.includes('Aoey') && d.demoStatus?.includes('Demo แล้ว')).length.toLocaleString()}
                                                        </p>
                                                        <span className="text-slate-500 text-xs font-bold">
                                                            / {filteredMasterDemos.filter(d => d.salesperson?.includes('Aoey')).length}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col relative">
                                                    <div className="absolute -left-5 top-2 w-4 h-px bg-white/10" />
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                                                        <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Yo</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-white text-xl font-bold tracking-tighter tabular-nums leading-none">
                                                            {filteredMasterDemos.filter(d => d.salesperson?.includes('Yo') && d.demoStatus?.includes('Demo แล้ว')).length.toLocaleString()}
                                                        </p>
                                                        <span className="text-slate-500 text-xs font-bold">
                                                            / {filteredMasterDemos.filter(d => d.salesperson?.includes('Yo')).length}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Demo Status Breakdown */}
                                                <div className="h-px bg-white/5 w-full my-1" />
                                                <p className="text-white text-sm uppercase font-bold tracking-widest mb-4">สถานะ Demo</p>
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-slate-300 font-medium">Demo แล้ว</span>
                                                        <span className="text-lg text-emerald-400 font-bold">
                                                            {filteredMasterDemos.filter(d => d.demoStatus?.includes('Demo แล้ว')).length}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-slate-300 font-medium">ยังไม่ได้ Demo</span>
                                                        <span className="text-lg text-amber-400 font-bold">
                                                            {filteredMasterDemos.filter(d => d.demoStatus?.includes('ยังไม่ได้')).length}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-slate-300 font-medium">ลูกค้าปฏิเสธ</span>
                                                        <span className="text-lg text-rose-400 font-bold">
                                                            {filteredMasterDemos.filter(d => d.demoStatus?.includes('ปฎิเสธ') || d.demoStatus?.includes('ปฏิเสธ')).length}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-slate-300 font-medium">ไม่ระบุ</span>
                                                        <span className="text-lg text-slate-500 font-bold">
                                                            {filteredMasterDemos.filter(d => !d.demoStatus || d.demoStatus.trim() === '').length}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : selectedMetric === 'sales' ? (
                                            <div className="relative flex flex-col gap-3 ml-1.5 pl-5 border-l border-white/10 max-h-[350px] overflow-y-auto custom-scrollbar">
                                                <p className="text-white text-[10px] uppercase font-bold tracking-widest mb-1 opacity-70">สรุปยอดรายเดือน</p>
                                                {[...dynamicGraphData].reverse().map((data, index) => (
                                                    <div key={index} className="flex flex-col relative group/item">
                                                        <div className="absolute -left-5 top-2 w-4 h-px bg-white/10 group-hover/item:bg-emerald-500/50 transition-colors" />
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                                            <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest">{data.name}</span>
                                                        </div>
                                                        <p className="text-white text-base font-bold tracking-tighter tabular-nums leading-none">
                                                            ฿{(data.sales || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))}
                                                {dynamicGraphData.length === 0 && (
                                                    <p className="text-slate-500 text-xs italic">ไม่มีข้อมูลในช่วงเวลานี้</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Period Insights</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <p className="text-white text-[11px] font-bold">Trend is stable</p>
                                                </div>
                                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 w-[65%]" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-px bg-white/5 w-full" />
                                    <div className="flex flex-col opacity-60">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                            <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Global Status</span>
                                        </div>
                                        <p className="text-slate-400 text-xs font-bold leading-tight uppercase tracking-tighter italic">Live Data Synchronization Active</p>
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
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorRenewals" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorDemos" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorAoey" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorYo" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                                <filter id="glowDrease" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                                <filter id="glowEase" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                                <filter id="glowSales" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                                <filter id="glowRenewals" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                                <filter id="glowDemos" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                                <filter id="glowAoey" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                                <filter id="glowYo" x="-20%" y="-20%" width="140%" height="140%">
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
                                            {selectedMetric === 'leads' && (
                                                <>
                                                    <Area type="monotone" dataKey="drease" name="Dr.Ease" stroke="#7053E1" fill="url(#colorDrease)" strokeWidth={3} filter="url(#glowDrease)" activeDot={{ r: 6, stroke: '#7053E1', strokeWidth: 2, fill: '#fff' }} />
                                                    <Area type="monotone" dataKey="ease" name="Ease" stroke="#F76D85" fill="url(#colorEase)" strokeWidth={3} filter="url(#glowEase)" activeDot={{ r: 6, stroke: '#F76D85', strokeWidth: 2, fill: '#fff' }} />
                                                </>
                                            )}
                                            {selectedMetric === 'demos' && (
                                                <>
                                                    <Area type="monotone" dataKey="demosAoey" name="Aoey" stroke="#22c55e" fill="url(#colorAoey)" strokeWidth={3} filter="url(#glowAoey)" activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2, fill: '#fff' }} />
                                                    <Area type="monotone" dataKey="demosYo" name="Yo" stroke="#f59e0b" fill="url(#colorYo)" strokeWidth={3} filter="url(#glowYo)" activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }} />
                                                </>
                                            )}
                                            {selectedMetric === 'sales' && (
                                                <Area type="monotone" dataKey="sales" name="ยอดขายรวม" stroke="#10b981" fill="url(#colorSales)" strokeWidth={3} filter="url(#glowSales)" activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }} />
                                            )}
                                            {selectedMetric === 'renewals' && (
                                                <Area type="monotone" dataKey="renewals" name="Renewal" stroke="#8b5cf6" fill="url(#colorRenewals)" strokeWidth={3} filter="url(#glowRenewals)" activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }} />
                                            )}
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
                                        <span className={`text-indigo-400 font-bold tracking-tight ${isFullscreen ? 'text-xl' : 'text-sm'}`}>{businessMetrics?.renewalRate ?? 50}%</span>
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
                                        <span className={`text-emerald-400 font-bold tracking-tight ${isFullscreen ? 'text-xl' : 'text-sm'}`}>{businessMetrics?.merchantOnboard?.total ?? 561}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-0.5">
                                        <div><p className="text-[10px] text-slate-500 uppercase font-bold">Dr.Ease</p><p className="font-bold tracking-tight text-white">{businessMetrics?.merchantOnboard?.drease ?? 420}</p></div>
                                        <div><p className="text-[10px] text-slate-500 uppercase font-bold">Ease</p><p className="font-bold tracking-tight text-white">{businessMetrics?.merchantOnboard?.ease ?? 141}</p></div>
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-center">
                                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Ease Pay Usage</p>
                                    <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">จำนวนลูกค้า Ease Pay</p>
                                    <p className={`font-bold tracking-tight text-white ${isFullscreen ? 'text-xl' : 'text-2xl'}`}>{businessMetrics?.easePayUsage ?? 850}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center">
                                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Online Booking</p>
                                    <p className="text-indigo-400/80 text-[9px] font-bold -mt-0.5 mb-1">ระบบจองออนไลน์</p>
                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                        <div><p className="text-[9px] text-indigo-400 font-bold">Pages</p><p className="font-bold tracking-tight text-white text-lg">{(businessMetrics?.onlineBooking?.pages ?? 320).toLocaleString()}</p></div>
                                        <div><p className="text-[9px] text-emerald-400 font-bold">Bookings</p><p className="font-bold tracking-tight text-white text-lg">{(businessMetrics?.onlineBooking?.bookings ?? 1240).toLocaleString()}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default Dashboard;
