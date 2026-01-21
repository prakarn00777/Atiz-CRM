"use client";

import { Activity, SentimentType, ActivityType } from "@/types";
import { Phone, MessageSquare, MapPin, GraduationCap, RefreshCw, FileText, Clock } from "lucide-react";

interface ActivityLogProps {
    activities: Activity[];
}

export default function ActivityLog({ activities }: ActivityLogProps) {
    const getActivityIcon = (type: ActivityType) => {
        switch (type) {
            case "Call": return <Phone className="w-4 h-4" />;
            case "Line": return <MessageSquare className="w-4 h-4" />;
            case "Visit": return <MapPin className="w-4 h-4" />;
            case "Training": return <GraduationCap className="w-4 h-4" />;
            case "Renewal": return <RefreshCw className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getSentimentColor = (sentiment: SentimentType) => {
        switch (sentiment) {
            case "Positive": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20";
            case "Neutral": return "bg-slate-500/20 text-slate-400 border-slate-500/20";
            case "Negative": return "bg-rose-500/20 text-rose-400 border-rose-500/20";
            default: return "bg-slate-500/20 text-slate-400 border-slate-500/20";
        }
    };

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
            {activities.length > 0 ? (
                activities.map((activity) => (
                    <div key={activity.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-800 bg-[#0f172a] text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:border-indigo-500/50 group-hover:text-indigo-400">
                            {getActivityIcon(activity.activityType)}
                        </div>
                        {/* Content */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all shadow-xl hover:scale-[1.01] duration-300">
                            <div className="flex items-center justify-between mb-1">
                                <time className="text-xs font-medium text-indigo-400">
                                    {new Date(activity.createdAt!).toLocaleString('th-TH', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </time>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getSentimentColor(activity.sentiment)}`}>
                                    {activity.sentiment}
                                </span>
                            </div>
                            <div className="text-sm font-bold text-slate-200 mb-1">
                                {activity.customerName}
                                <span className="ml-2 px-1.5 py-0.5 bg-white/5 rounded text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                    {activity.activityType}
                                </span>
                            </div>
                            <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                                {activity.content}
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                                <span className="text-[10px] text-slate-500">โดย {activity.createdBy}</span>
                                {activity.followUpDate && (
                                    <div className="flex items-center gap-1 text-[10px] text-amber-400/80">
                                        <Clock className="w-3 h-3" />
                                        นัดติดตาม: {new Date(activity.followUpDate).toLocaleDateString('th-TH')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-600">
                    <FileText className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-sm font-medium">ยังไม่มีการบันทึกกิจกรรม</p>
                    <p className="text-xs opacity-50">เริ่มบันทึกการทำงานของคุณเพื่อสร้างประวัติดูแลลูกค้า</p>
                </div>
            )}
        </div>
    );
}
