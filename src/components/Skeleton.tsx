"use client";

import React from "react";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular";
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = "",
    variant = "rectangular",
    width,
    height,
    animation = "pulse",
}) => {
    const baseClasses = "bg-bg-hover";
    const animationClasses = {
        pulse: "animate-pulse",
        wave: "animate-shimmer",
        none: "",
    };
    const variantClasses = {
        text: "rounded",
        circular: "rounded-full",
        rectangular: "rounded-lg",
    };

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 10 }) => {
    return (
        <tr className="border-b border-border-light">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-3 py-4">
                    <Skeleton
                        className={`h-4 ${i === 0 ? "w-8" : i === 2 ? "w-32" : i === 3 ? "w-40" : "w-16"}`}
                    />
                </td>
            ))}
        </tr>
    );
};

// Customer Table Skeleton
export const CustomerTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 10 }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4">
                <Skeleton className="h-9 w-48" />
                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full">
                    <Skeleton className="h-10 w-64" />
                    <div className="flex flex-wrap items-center gap-3">
                        <Skeleton className="h-10 w-36" />
                        <Skeleton className="h-10 w-44" />
                        <Skeleton className="h-10 w-44" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="glass-card overflow-hidden border-indigo-500/5">
                <table className="w-full">
                    <thead>
                        <tr className="bg-bg-hover border-b border-border-light">
                            {["4%", "7%", "14%", "16%", "8%", "7%", "10%", "10%", "12%", "5%"].map((w, i) => (
                                <th key={i} className="px-3 py-3" style={{ width: w }}>
                                    <Skeleton className="h-4 w-full" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, i) => (
                            <TableRowSkeleton key={i} columns={10} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Dashboard Card Skeleton
export const DashboardCardSkeleton: React.FC = () => {
    return (
        <div className="glass-card p-5 border border-border-light animate-pulse">
            <div className="flex flex-col gap-3">
                <Skeleton variant="circular" className="w-10 h-10" />
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                    <Skeleton className="h-8 w-20 mt-2" />
                    <Skeleton className="h-2 w-28 mt-1" />
                </div>
            </div>
        </div>
    );
};

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-4">
                    <Skeleton variant="circular" className="w-14 h-14" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <DashboardCardSkeleton key={i} />
                ))}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 glass-card p-6 border-border">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-3 w-32 mb-4" />
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </div>
                <div className="glass-card p-6 border-border">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-3 w-24 mb-4" />
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Skeleton;
