"use client";

import { useMemo, useState, useEffect } from "react";
import { Users, Activity, Award, TrendingUp, Layers, Zap, Clock, AlertCircle, DollarSign, ArrowUpRight } from "lucide-react";
import ParticlesBackground from "./ParticlesBackground";
import { Customer, Installation, Issue } from "@/types";

interface DashboardProps {
    customers: Customer[];
    installations: Installation[];
    issues: Issue[];
    user: any;
    onViewChange: (view: string) => void;
}

export default function Dashboard({ customers, installations, issues, user, onViewChange }: DashboardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Calculate Stats
    const stats = useMemo(() => {
        // Estimated Revenue Calculation (Simplified logic)
        // Starter = 1500, Standard = 3000, Elite = 5000 (Example rates per month/year)
        // This is just for visualization, adjust rates as needed.
        const calculateRevenue = (custs: Customer[]) => {
            return custs.reduce((acc, curr) => {
                if (curr.usageStatus !== "Active") return acc;
                if (curr.package === "Elite") return acc + 5000;
                if (curr.package === "Standard") return acc + 3000;
                return acc + 1500;
            }, 0);
        };

        const revenue = calculateRevenue(customers);
        const activeIssues = issues.filter(i => i.status !== "เสร็จสิ้น").length;
        const pendingInstallations = installations.filter(i => i.status !== "Completed").length;
        const activeCustomers = customers.filter(c => c.usageStatus === "Active").length;

        return [
            {
                label: "Total Revenue (Est.)",
                value: `฿${revenue.toLocaleString()}`,
                sub: "Monthly Recurring",
                icon: DollarSign,
                trend: "+12.5%",
                color: "text-emerald-400",
                bg: "from-emerald-500/20 to-teal-900/20",
                border: "border-emerald-500/20"
            },
            {
                label: "Active Customers",
                value: activeCustomers,
                sub: "Runing on Production",
                icon: Zap,
                trend: "+5 New",
                color: "text-amber-400",
                bg: "from-amber-500/20 to-orange-900/20",
                border: "border-amber-500/20"
            },
            {
                label: "Pending Installations",
                value: pendingInstallations,
                sub: "Need Attention",
                icon: Layers,
                trend: "On Track",
                color: "text-blue-400",
                bg: "from-blue-500/20 to-indigo-900/20",
                border: "border-blue-500/20"
            },
            {
                label: "Active Issues",
                value: activeIssues,
                sub: "Support Tickets",
                icon: AlertCircle,
                trend: activeIssues > 5 ? "High Load" : "Low Load",
                color: activeIssues > 5 ? "text-rose-400" : "text-slate-400",
                bg: "from-rose-500/20 to-pink-900/20",
                border: "border-rose-500/20"
            }
        ];
    }, [customers, issues, installations]);

    const recentActivities = useMemo(() => {
        // Mocking recent activity from installations and issues logic
        // In a real app, you might have a dedicated logs array
        const list: any[] = [];
        installations.slice(0, 3).forEach(inst => {
            list.push({
                type: "installation",
                title: `New Installation: ${inst.branchName || "Unknown Branch"}`,
                time: "Recently",
                status: inst.status
            });
        });
        issues.slice(0, 3).forEach(issue => {
            list.push({
                type: "issue",
                title: `Issue Report: ${issue.title}`,
                time: "Recently",
                status: issue.status
            });
        });
        return list;
    }, [installations, issues]);

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 relative">
            <ParticlesBackground className="absolute inset-0 z-0" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-1 relative z-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">
                        Command Center
                    </h1>
                    <p className="text-slate-400 mt-2 flex items-center gap-2 text-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        System Operational • {user.name}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-mono font-bold text-white tracking-widest">
                        {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
                        {currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className={`relative overflow-hidden glass-card p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 group ${stat.border}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-20 group-hover:opacity-30 transition-opacity`} />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl bg-white/5 border border-white/5 ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] font-bold text-emerald-400">{stat.trend}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                                <p className="text-slate-500 text-xs">{stat.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                {/* Live Activity Feed */}
                <div className="lg:col-span-2 glass-card p-0 flex flex-col overflow-hidden border-indigo-500/20">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            Live Activity Feed
                        </h3>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Real-time updates
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {recentActivities.map((act, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all cursor-default group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                                    ${act.type === 'installation' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {act.type === 'installation' ? <Layers className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">{act.title}</h4>
                                    <p className="text-xs text-slate-400">{act.time} • {act.status}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-300 border border-white/10 uppercase tracking-wider">
                                        {act.type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Mini List */}
                <div className="glass-card p-6 flex flex-col justify-between bg-gradient-to-b from-indigo-900/20 to-slate-900/50 border-purple-500/20">
                    <div>
                        <h3 className="font-bold text-lg text-white mb-1">New Customers</h3>
                        <p className="text-xs text-slate-400 mb-6">Latest joiners this month</p>

                        <div className="space-y-4">
                            {customers.slice(0, 4).map((c, i) => (
                                <div key={c.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                            {c.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{c.name}</p>
                                            <p className="text-[10px] text-slate-500">{c.package} Plan</p>
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${c.usageStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => onViewChange("customers")}
                        className="w-full mt-6 py-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                    >
                        View All Customers
                    </button>
                </div>
            </div>
        </div>
    );
}
