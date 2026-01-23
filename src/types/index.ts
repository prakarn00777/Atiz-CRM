// ============================================
// API Response Types (Type-Safe Error Handling)
// ============================================
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    meta?: PaginationMeta;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: ApiErrorCode;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiErrorCode =
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'DATABASE_ERROR'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';

// ============================================
// Pagination Types
// ============================================
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

// ============================================
// Utility Types
// ============================================
export type UUID = string;

export const generateUUID = (): UUID => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// ============================================
// Domain Types
// ============================================
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
    assignedDev?: string;
    completedAt?: string;
    notes?: string;
    installationType?: "new" | "branch";
    requestedBy: string;
    requestedAt: string;
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
    attachments?: string | { name: string, type: string, size: number, data: string }[]; // JSON string or Array for optimistic UI
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
    data?: Record<string, unknown>;
}
export type ActivityType = "Training" | "Onboarding" | "Support" | "Demo" | "Call" | "Line" | "Visit" | "Renewal" | "Other";
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

export interface Lead {
    id: number;
    leadNumber: string;
    product: string; // Dr.Ease, Ease POS
    source: string; // ยิงแอด, เซลล์หา, พาร์ทเนอร์, บริษัทหา
    leadType: string; // LINE, Facebook, Call, ลีดจากสัมนา, ลูกค้าเก่า ต่อสัญญา, ขบายสัญญาเพิ่ม, ลีดซ้ำ
    salesName: string; // Aoey, Yo
    customerName: string;
    phone: string;
    receivedDate: string; // ISO date string
    notes?: string;
    createdBy?: string;
    createdAt?: string;
    modifiedBy?: string;
    modifiedAt?: string;
}

// Lead from Google Sheets (read-only, different structure)
export interface GoogleSheetLead {
    id?: string;           // Row number
    leadIndex: string;     // ลีดที่ (Column A)
    leadNumber: string;    // เลขที่ลีด (Column B)
    date: string;          // วันที่ (Column C)
    product: string;       // Product (Column D)
    source: string;        // ลีด (Column E)
    leadType: string;      // ประเภทลีด (Column F)
    salesName: string;     // เซลล์ (Column G)
    customerName: string;  // ชื่อลูกค้า (Column H)
    phone: string;         // เบอร์โทร (Column I)
    quotationStatus: string; // สถานะใบเสนอราคา (Column J)
    quotation: string;     // ใบเสนอราคา (Column K)
    clinicName: string;    // ชื่อคลินิก/ธุรกิจ (Column L)
    notes: string;         // Note (Column M)
}

// ============================================
// User & Role Types
// ============================================
export interface User {
    id: number;
    name: string;
    username: string;
    role: string;
    isActive?: boolean;
    createdAt?: string;
    modifiedAt?: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: Record<string, MenuPermission>;
}

export interface MenuPermission {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

// ============================================
// Business Metrics Types
// ============================================
export interface BusinessMetrics {
    newSales: number;
    renewal: number;
    renewalRate: number;
    merchantOnboard: {
        drease: number;
        ease: number;
        total: number;
    };
    easePayUsage: number;
    onlineBooking: {
        pages: number;
        bookings: number;
    };
    updatedAt: string;
}
