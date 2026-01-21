export type UsageStatus = "Active" | "Pending" | "Training" | "Canceled";
export type InstallationStatus = "Pending" | "Installing" | "Completed";
export type ProductType = "Dr.Ease" | "EasePos";

export interface Branch {
    id?: number;
    name: string;
    isMain: boolean;
    address?: string;
    status?: "Pending" | "Installing" | "Completed";
}

export interface Customer {
    id: number;
    name: string;
    clientCode?: string;
    subdomain?: string;
    productType?: ProductType;
    package: string;
    usageStatus: UsageStatus;
    installationStatus: InstallationStatus;
    businessType?: string;
    contractNumber?: string;
    contractStart?: string;
    contractEnd?: string;
    salesName?: string;
    contactName?: string;
    contactPhone?: string;
    note?: string;
    branches?: Branch[];
    createdBy?: string;
    createdAt?: string;
    modifiedBy?: string;
    modifiedAt?: string;
}

export interface Installation {
    id: number;
    customerId: number;
    customerName: string;
    customerLink?: string;
    branchName?: string;
    status: "Pending" | "Installing" | "Completed";
    requestedBy: string;
    requestedAt: string;
    completedAt?: string;
    notes?: string;
    installationType?: "new" | "branch";
    modifiedBy?: string;
    modifiedAt?: string;
}

export interface Issue {
    id: number;
    caseNumber: string;
    title: string;
    customerId: number;
    customerName: string;
    branchName?: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    status: "แจ้งเคส" | "กำลังดำเนินการ" | "เสร็จสิ้น";
    type: string;
    description?: string;
    attachments?: string; // JSON string
    createdBy?: string;
    createdAt?: string;
    modifiedBy?: string;
    modifiedAt?: string;
}

export interface CRMNotification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    timestamp: string;
    isRead: boolean;
    data?: any;
}
export type ActivityType = "Training" | "Onboarding" | "Support" | "Other";
export type SentimentType = "Positive" | "Neutral" | "Negative";

export interface Activity {
    id: number;
    customerId: number;
    customerName: string;
    title: string;
    activityType: ActivityType;
    content?: string;
    assignee?: string;
    status: string;
    sentiment: SentimentType;
    followUpDate?: string;
    createdBy?: string;
    createdAt?: string;
    modifiedBy?: string;
    modifiedAt?: string;
}
