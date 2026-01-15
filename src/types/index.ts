export type UsageStatus = "Active" | "Trial" | "Inactive" | "Canceled";
export type InstallationStatus = "Pending" | "In Progress" | "Installed";
export type ProductType = "Dr.Ease" | "EasePos";

export interface Branch {
    id?: number;
    name: string;
    isMain: boolean;
    address?: string;
    status?: "รอการติดตั้ง" | "กำลังติดตั้ง" | "ติดตั้งเสร็จ";
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
    branchName?: string;
    status: "Pending" | "Installing" | "Completed";
    requestedBy: string;
    requestedAt: string;
    assignedDev?: string;
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
    severity: "ต่ำ" | "ปานกลาง" | "สูง" | "วิกฤต";
    status: "แจ้งเคส" | "กำลังดำเนินการ" | "เสร็จสิ้น";
    type: string;
    description?: string;
    attachments?: string; // JSON string
    createdBy?: string;
    createdAt?: string;
    modifiedBy?: string;
    modifiedAt?: string;
}
