"use client";

import React from "react";
import { X, History as HistoryIcon } from "lucide-react";
import CustomSelect from "../CustomSelect";
import SearchableCustomerSelect from "../SearchableCustomerSelect";
import { Customer, ActivityType, SentimentType } from "@/types";

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingActivity: any;
    customers: Customer[];
    selectedCustomerId: number | null;
    setSelectedCustomerId: (id: number | null) => void;
    selectedCustomerName: string;
    setSelectedCustomerName: (name: string) => void;
    activityType: ActivityType;
    setActivityType: (type: ActivityType) => void;
    activityStatus: string;
    setActivityStatus: (status: string) => void;
    activitySentiment: SentimentType;
    activityAssignee: string;
    setActivityAssignee: (assignee: string) => void;
    userOptions: { value: string; label: string }[];
    isSavingActivity: boolean;
    onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ActivityModal = React.memo(function ActivityModal({
    isOpen,
    onClose,
    editingActivity,
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomerName,
    setSelectedCustomerName,
    activityType,
    setActivityType,
    activityStatus,
    setActivityStatus,
    activityAssignee,
    setActivityAssignee,
    userOptions,
    isSavingActivity,
    onSave,
}: ActivityModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="glass-card w-full max-w-lg relative shadow-2xl border-indigo-500/20 flex flex-col h-[85vh] max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-white/5 shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <HistoryIcon className="w-5 h-5 text-indigo-400" />
                            {editingActivity ? "Edit Task" : "Add Task"}
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
                            <X />
                        </button>
                    </div>
                </div>

                {/* Status Flow Bar */}
                <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Status:</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActivityStatus("Open")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityStatus === "Open"
                                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                                    : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                                    }`}
                            >
                                Open
                            </button>
                            <span className="text-slate-600">→</span>
                            <button
                                type="button"
                                onClick={() => setActivityStatus("In Progress")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityStatus === "In Progress"
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
                                    : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                                    }`}
                            >
                                In Progress
                            </button>
                            <span className="text-slate-600">→</span>
                            <button
                                type="button"
                                onClick={() => setActivityStatus("Success")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityStatus === "Success"
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                                    : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                                    }`}
                            >
                                Success
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form id="task-form" onSubmit={onSave} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">ชื่อลูกค้า</label>
                            <SearchableCustomerSelect
                                customers={customers}
                                value={selectedCustomerId}
                                onChange={(id: number, name: string) => {
                                    setSelectedCustomerId(id);
                                    setSelectedCustomerName(name);
                                }}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Summary</label>
                            <input
                                name="title"
                                defaultValue={editingActivity?.title}
                                className="input-field text-xs py-2"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">ประเภทงาน</label>
                            <CustomSelect
                                value={activityType}
                                onChange={(val) => setActivityType(val as ActivityType)}
                                options={[
                                    { value: "Training", label: "Training" },
                                    { value: "Onboarding", label: "Onboarding" },
                                    { value: "Support", label: "Support" },
                                    { value: "Call", label: "Call" },
                                    { value: "Line", label: "Line" },
                                    { value: "Visit", label: "Visit" },
                                    { value: "Renewal", label: "Renewal" },
                                    { value: "Other", label: "Other" },
                                ]}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">ผู้รับผิดชอบ (Assignee)</label>
                            <CustomSelect
                                value={activityAssignee}
                                onChange={(val) => setActivityAssignee(val)}
                                options={userOptions}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">Description</label>
                            <textarea
                                name="content"
                                defaultValue={editingActivity?.content}
                                className="input-field text-xs py-3 min-h-[100px] resize-none"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-white/5 flex gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="flex-1 btn btn-ghost py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5">Cancel</button>
                    <button form="task-form" type="submit" disabled={isSavingActivity} className="flex-1 btn btn-primary py-3 rounded-xl font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSavingActivity ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            "Save Task"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ActivityModal;
