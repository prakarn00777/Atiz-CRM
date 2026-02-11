import type { Branch, UsageStatus, InstallationStatus } from "@/types";

export function computeCustomerUsageStatus(branches: Branch[]): UsageStatus {
    if (!branches || branches.length === 0) return "Active";
    const statuses = branches.map(b => b.usageStatus || "Active");
    if (statuses.includes("Active")) return "Active";
    if (statuses.includes("Training")) return "Training";
    if (statuses.includes("Pending")) return "Pending";
    if (statuses.every(s => s === "Canceled")) return "Canceled";
    return "Inactive";
}

export function computeCustomerInstallationStatus(branches: Branch[]): InstallationStatus {
    if (!branches || branches.length === 0) return "Pending";
    return branches.every(b => b.status === "Completed") ? "Completed" : "Pending";
}

export function computeCustomerStatuses(branches: Branch[]): {
    usageStatus: UsageStatus;
    installationStatus: InstallationStatus;
} {
    return {
        usageStatus: computeCustomerUsageStatus(branches),
        installationStatus: computeCustomerInstallationStatus(branches),
    };
}
