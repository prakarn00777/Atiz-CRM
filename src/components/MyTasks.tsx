"use client";

import React, { useState, useMemo } from "react";
import { ClipboardList, Headphones, CheckCircle2, Clock, Play } from "lucide-react";
import { Issue, Activity } from "@/types";

interface MyTasksProps {
    issues: Issue[];
    activities: Activity[];
    currentUser: string;
    onEditIssue: (issue: Issue) => void;
    onEditActivity: (activity: Activity) => void;
}

const MyTasks = React.memo(function MyTasks({ issues, activities, currentUser, onEditIssue, onEditActivity }: MyTasksProps) {
    const [activeTab, setActiveTab] = useState<"issues" | "cs_task">("issues");
    const [showCompleted, setShowCompleted] = useState(false);

    const myIssues = useMemo(() => {
        const filtered = issues.filter(i => i.assignedTo === currentUser);
        if (showCompleted) return filtered;
        return filtered.filter(i => i.status !== "เสร็จสิ้น");
    }, [issues, currentUser, showCompleted]);

    const myActivities = useMemo(() => {
        const filtered = activities.filter(a => a.assignee === currentUser);
        if (showCompleted) return filtered;
        return filtered.filter(a => a.status !== "Completed" && a.status !== "completed");
    }, [activities, currentUser, showCompleted]);

    const totalPending = myIssues.filter(i => i.status !== "เสร็จสิ้น").length
        + myActivities.filter(a => a.status !== "Completed" && a.status !== "completed").length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2 text-text-main">งานของฉัน</h1>
                <p className="text-sm text-text-muted">รวมงานที่ assign ให้ {currentUser}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-text-main">{totalPending}</p>
                        <p className="text-xs text-text-muted">งานค้าง</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-text-main">{myIssues.filter(i => i.status !== "เสร็จสิ้น").length}</p>
                        <p className="text-xs text-text-muted">เคสค้าง</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <Headphones className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-text-main">{myActivities.filter(a => a.status !== "Completed" && a.status !== "completed").length}</p>
                        <p className="text-xs text-text-muted">CS Task ค้าง</p>
                    </div>
                </div>
            </div>

            {/* Tabs + Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-bg-hover rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab("issues")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "issues"
                            ? "bg-card-bg text-text-main shadow-sm"
                            : "text-text-muted hover:text-text-main"
                            }`}
                    >
                        Issues ({myIssues.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("cs_task")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "cs_task"
                            ? "bg-card-bg text-text-main shadow-sm"
                            : "text-text-muted hover:text-text-main"
                            }`}
                    >
                        CS Task ({myActivities.length})
                    </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showCompleted}
                        onChange={(e) => setShowCompleted(e.target.checked)}
                        className="rounded border-border-light"
                    />
                    แสดงงานที่เสร็จแล้ว
                </label>
            </div>

            {/* Content */}
            <div className="glass-card overflow-hidden border-indigo-500/5">
                {activeTab === "issues" ? (
                    <div className="divide-y divide-border-light">
                        {myIssues.length > 0 ? myIssues.map(issue => (
                            <div
                                key={issue.id}
                                onClick={() => onEditIssue(issue)}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-bg-hover transition-colors cursor-pointer"
                            >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${issue.status === "เสร็จสิ้น" ? "bg-emerald-400" : issue.status === "กำลังดำเนินการ" ? "bg-indigo-400" : "bg-amber-400"}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-text-muted">{issue.caseNumber}</span>
                                        <span className="text-sm font-medium text-text-main truncate">{issue.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-text-muted">{issue.customerName}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${issue.severity === "Critical" ? "text-rose-500 bg-rose-500/10" : issue.severity === "High" ? "text-orange-500 bg-orange-500/10" : "text-text-muted bg-bg-hover"}`}>
                                            {issue.severity}
                                        </span>
                                    </div>
                                </div>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${issue.status === "เสร็จสิ้น" ? "text-emerald-600 bg-emerald-500/10" : issue.status === "กำลังดำเนินการ" ? "text-indigo-500 bg-indigo-500/10" : "text-amber-600 bg-amber-500/10"}`}>
                                    {issue.status === "เสร็จสิ้น" ? <CheckCircle2 className="w-3 h-3" /> : issue.status === "กำลังดำเนินการ" ? <Play className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                    {issue.status}
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center gap-2 py-12">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500/30" />
                                <p className="text-sm text-text-muted">ไม่มีเคสค้าง</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-border-light">
                        {myActivities.length > 0 ? myActivities.map(activity => (
                            <div
                                key={activity.id}
                                onClick={() => onEditActivity(activity)}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-bg-hover transition-colors cursor-pointer"
                            >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activity.status === "Completed" || activity.status === "completed" ? "bg-emerald-400" : activity.status === "In Progress" ? "bg-indigo-400" : "bg-amber-400"}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-main truncate">{activity.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-text-muted">{activity.customerName}</span>
                                        <span className="text-[10px] text-text-muted bg-bg-hover px-2 py-0.5 rounded-full">{activity.activityType}</span>
                                    </div>
                                </div>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${activity.status === "Completed" || activity.status === "completed" ? "text-emerald-600 bg-emerald-500/10" : activity.status === "In Progress" ? "text-indigo-500 bg-indigo-500/10" : "text-amber-600 bg-amber-500/10"}`}>
                                    {activity.status}
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center gap-2 py-12">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500/30" />
                                <p className="text-sm text-text-muted">ไม่มี CS Task ค้าง</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

export default MyTasks;
