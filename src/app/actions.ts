"use server";

import { db } from "@/lib/db";
import {
    Customer, UsageStatus, ProductType, Lead, User, Role,
    ApiResponse, ApiErrorCode, PaginationParams, PaginationMeta,
    Installation, Issue, Activity, BusinessMetrics, generateUUID
} from "@/types";
import bcrypt from "bcryptjs";

// ============================================
// Environment & Logging Utilities
// ============================================
const isDev = process.env.NODE_ENV === 'development';
const log = {
    debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
    error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};

// ============================================
// Error Handling Utilities
// ============================================
function createError(message: string, code: ApiErrorCode = 'UNKNOWN_ERROR'): ApiResponse<never> {
    return { success: false, error: message, code };
}

function createSuccess<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
    return meta ? { success: true, data, meta } : { success: true, data };
}

function handleDbError(err: unknown, context: string): ApiResponse<never> {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    log.error(`${context}:`, message);
    return createError(message, 'DATABASE_ERROR');
}

// ============================================
// Pagination Utilities
// ============================================
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

function getPaginationParams(params?: PaginationParams): { page: number; limit: number; offset: number } {
    const page = Math.max(1, params?.page || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, params?.limit || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

// ============================================
// ID Utilities
// ============================================
function isTemporaryId(id: number | string | undefined): boolean {
    if (!id) return true;
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return numId > 1000000000000; // Temporary IDs from Date.now()
}

export async function importCustomersFromCSV(data: any[]): Promise<ApiResponse<{ count: number }>> {
    try {
        const customers = data.map((row) => {
            const name = row['ชื่อคลินิก/ร้าน (ไทย)'] || row['ชื่อคลินิก/ร้าน (English)'] || row['ชื่อคลินิก/ร้าน "สำหรับใช้ค้นหาตอนแจ้งเคส"'];

            let usageStatus: UsageStatus = "Active";
            if (row['สถานะ'] === "ยกเลิก") usageStatus = "Canceled";
            else if (row['สถานะ'] === "รอการใช้งาน") usageStatus = "Pending";

            let productType: ProductType = "Dr.Ease";
            if (row['สินค้า'] === "EasePos") productType = "EasePos";

            return {
                name,
                client_code: row['Client Code'],
                subdomain: row['Sub-domain'],
                product_type: productType,
                package: row['Package'],
                usage_status: usageStatus,
                business_type: row['ประเภทธุรกิจ'],
                contract_number: row['เลขที่สัญญา'],
                contract_start: row['วันเริ่มสัญญา'],
                contract_end: row['วันหมดสัญญา'],
                sales_name: row['เซลล์'],
                contact_name: row['ชื่อผู้ทำสัญญา'],
                contact_phone: row['เบอร์โทร'],
                note: row['โน็ต'],
                installation_status: usageStatus === "Active" ? "Installed" : "Pending"
            };
        }).filter(c => c.name);

        if (customers.length > 0) {
            const { error } = await db.from('customers').insert(customers);
            if (error) {
                console.error("Error importing customers:", error);
                return createError(error.message, 'DATABASE_ERROR');
            }
        }

        return createSuccess({ count: customers.length });
    } catch (err) {
        return handleDbError(err, "importCustomersFromCSV");
    }
}

export async function getCustomers(params?: PaginationParams): Promise<Customer[]> {
    try {
        const sortBy = params?.sortBy || 'id';
        const sortOrder = params?.sortOrder === 'asc';

        // Build query - fetch all if no limit specified, otherwise use pagination
        let query = db
            .from('customers')
            .select('id, name, client_code, subdomain, product_type, package, usage_status, business_type, contract_number, contract_start, contract_end, sales_name, contact_name, contact_phone, note, installation_status, branches, created_by, created_at, modified_by, modified_at')
            .order(sortBy, { ascending: sortOrder });

        // Only apply range if limit is explicitly specified
        if (params?.limit) {
            const { limit, offset } = getPaginationParams(params);
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;

        if (error) {
            log.error("Error fetching customers:", error);
            return [];
        }

        return (data || []).map(row => ({
            id: Number(row.id),
            name: String(row.name),
            clientCode: row.client_code ? String(row.client_code) : undefined,
            subdomain: row.subdomain ? String(row.subdomain) : undefined,
            productType: (row.product_type as ProductType) || "Dr.Ease",
            package: String(row.package),
            usageStatus: (row.usage_status as UsageStatus) || "Active",
            businessType: row.business_type ? String(row.business_type) : undefined,
            contractNumber: row.contract_number ? String(row.contract_number) : undefined,
            contractStart: row.contract_start ? String(row.contract_start) : undefined,
            contractEnd: row.contract_end ? String(row.contract_end) : undefined,
            salesName: row.sales_name ? String(row.sales_name) : undefined,
            contactName: row.contact_name ? String(row.contact_name) : undefined,
            contactPhone: row.contact_phone ? String(row.contact_phone) : undefined,
            note: row.note ? String(row.note) : undefined,
            installationStatus: row.installation_status ? String(row.installation_status) : undefined,
            branches: row.branches ? JSON.parse(String(row.branches)) : [],
            createdBy: row.created_by ? String(row.created_by) : undefined,
            createdAt: row.created_at ? String(row.created_at) : undefined,
            modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
            modifiedAt: row.modified_at ? String(row.modified_at) : undefined
        })) as Customer[];
    } catch (err) {
        log.error("Critical error in getCustomers:", err);
        return [];
    }
}

export async function getIssues(params?: PaginationParams): Promise<Issue[]> {
    try {
        let query = db
            .from('issues')
            .select('id, customer_id, branch_name, case_number, title, description, type, severity, status, created_by, created_at, modified_by, modified_at, attachments, customers(name)')
            .order('id', { ascending: false });

        if (params?.limit) {
            const { limit, offset } = getPaginationParams(params);
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;

        if (error) {
            log.error("Error fetching issues:", error);
            return [];
        }

        return (data || []).map(row => ({
            id: Number(row.id),
            customerId: row.customer_id ? Number(row.customer_id) : 0,
            customerName: (row.customers as { name?: string })?.name || "N/A",
            branchName: row.branch_name ? String(row.branch_name) : undefined,
            caseNumber: String(row.case_number),
            title: String(row.title),
            description: row.description ? String(row.description) : undefined,
            type: String(row.type),
            severity: String(row.severity) as Issue['severity'],
            status: String(row.status) as Issue['status'],
            createdBy: row.created_by ? String(row.created_by) : undefined,
            createdAt: row.created_at ? String(row.created_at) : undefined,
            modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
            modifiedAt: row.modified_at ? String(row.modified_at) : undefined,
            attachments: row.attachments ? (typeof row.attachments === 'string' ? row.attachments : JSON.stringify(row.attachments)) : "[]",
        }));
    } catch (err) {
        log.error("Critical error in getIssues:", err);
        return [];
    }
}

export async function getInstallations(params?: PaginationParams): Promise<Installation[]> {
    try {
        let query = db
            .from('installations')
            .select('id, customer_id, branch_name, status, installation_type, notes, assigned_dev, completed_at, created_by, created_at, modified_by, modified_at, customers(name)')
            .order('id', { ascending: false });

        if (params?.limit) {
            const { limit, offset } = getPaginationParams(params);
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;

        if (error) {
            log.error("Error fetching installations:", error);
            return [];
        }

        return (data || []).map(row => ({
            id: Number(row.id),
            customerId: row.customer_id ? Number(row.customer_id) : 0,
            customerName: (row.customers as { name?: string })?.name || "N/A",
            branchName: row.branch_name ? String(row.branch_name) : undefined,
            status: String(row.status) as Installation['status'],
            installationType: String(row.installation_type) as Installation['installationType'],
            notes: row.notes ? String(row.notes) : undefined,
            assignedDev: row.assigned_dev ? String(row.assigned_dev) : undefined,
            completedAt: row.completed_at ? String(row.completed_at) : undefined,
            requestedBy: row.created_by ? String(row.created_by) : '',
            requestedAt: row.created_at ? String(row.created_at) : '',
            modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
            modifiedAt: row.modified_at ? String(row.modified_at) : undefined,
        }));
    } catch (err) {
        log.error("Critical error in getInstallations:", err);
        return [];
    }
}

export async function getUsers(): Promise<User[]> {
    try {
        const { data, error } = await db
            .from('users')
            .select('id, name, username, role_id, created_at')
            .order('id', { ascending: true });

        if (error) {
            log.error("Error fetching users:", error);
            return [];
        }

        return (data || []).map(u => ({
            id: Number(u.id),
            name: String(u.name),
            username: String(u.username),
            role: String(u.role_id),
            isActive: true,
            createdAt: u.created_at ? String(u.created_at) : undefined,
        }));
    } catch (err) {
        log.error("Critical error in getUsers:", err);
        return [];
    }
}

export async function saveUser(userData: Partial<User> & { password?: string }): Promise<ApiResponse<User>> {
    try {
        const { id, ...rest } = userData;

        let hashedPassword = rest.password;
        // Only hash if password is provided and not already hashed
        if (rest.password && (!rest.password.startsWith('$2a$') || rest.password.length < 30)) {
            hashedPassword = await bcrypt.hash(rest.password, 10);
        }

        const dbData = {
            name: rest.name,
            username: rest.username,
            password: hashedPassword,
            role_id: rest.role
        };

        let result;
        if (isTemporaryId(id)) {
            // New user - insert
            const { data, error } = await db.from('users').insert(dbData).select('id, name, username, role_id, is_active, created_at');
            if (error) throw error;
            result = data?.[0];
        } else if (id) {
            // Update existing
            const { data, error } = await db.from('users').update(dbData).eq('id', id).select('id, name, username, role_id, is_active, created_at');
            if (error) throw error;
            result = data?.[0];
        } else {
            const { data, error } = await db.from('users').insert(dbData).select('id, name, username, role_id, is_active, created_at');
            if (error) throw error;
            result = data?.[0];
        }

        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        const user: User = {
            id: Number(result.id),
            name: String(result.name),
            username: String(result.username),
            role: String(result.role_id),
            isActive: Boolean(result.is_active),
            createdAt: result.created_at ? String(result.created_at) : undefined,
        };

        return createSuccess(user);
    } catch (err) {
        return handleDbError(err, "saveUser");
    }
}

export async function loginUser(username: string, password: string): Promise<ApiResponse<User & { permissions?: Record<string, unknown> }>> {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            log.error("Missing Supabase Env Vars");
            return createError("System Configuration Error: Missing Environment Variables", 'UNKNOWN_ERROR');
        }

        const { data, error } = await db
            .from('users')
            .select('id, name, username, password, role_id, roles(name, permissions)')
            .eq('username', username)
            .maybeSingle();

        if (error) {
            log.error("Database error during login:", error);
            return createError(`Database Error: ${error.message}`, 'DATABASE_ERROR');
        }

        if (!data) {
            return createError("ไม่พบชื่อผู้ใช้งานนี้ในระบบ", 'NOT_FOUND');
        }

        const isValid = await bcrypt.compare(password, data.password);

        // Fallback for migration: allow plain text match for 'admin:1234' if hash compare fails
        let isMatch = isValid;
        if (!isMatch && username === 'admin' && password === data.password) {
            isMatch = true;
            const newHash = await bcrypt.hash(password, 10);
            await db.from('users').update({ password: newHash }).eq('id', data.id);
        }

        if (!isMatch) {
            return createError("รหัสผ่านไม่ถูกต้อง", 'UNAUTHORIZED');
        }

        const user: User & { permissions?: Record<string, unknown> } = {
            id: Number(data.id),
            name: String(data.name),
            username: String(data.username),
            role: String(data.role_id),
            isActive: true,
            permissions: (data.roles as { permissions?: Record<string, unknown> })?.permissions,
        };

        return createSuccess(user);
    } catch (err) {
        return handleDbError(err, "loginUser");
    }
}

export async function deleteUser(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        const { error } = await db.from('users').update({ is_active: false }).eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteUser");
    }
}

export async function getRoles(): Promise<Role[]> {
    try {
        const { data, error } = await db
            .from('roles')
            .select('id, name, description, permissions')
            .order('id', { ascending: true });

        if (error) {
            log.error("Error fetching roles:", error);
            return [];
        }

        return (data || []).map(r => ({
            id: String(r.id),
            name: String(r.name),
            description: r.description ? String(r.description) : undefined,
            permissions: r.permissions as Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }> || {},
        }));
    } catch (err) {
        log.error("Critical error in getRoles:", err);
        return [];
    }
}

export async function saveRole(roleData: Partial<Role>): Promise<ApiResponse<Role>> {
    try {
        const { id, ...rest } = roleData;

        // Generate UUID for new roles if id looks temporary
        const finalId = id && !id.startsWith('role_') ? id : `role_${generateUUID()}`;

        const { data, error } = await db.from('roles').upsert({
            id: id || finalId,
            name: rest.name,
            description: rest.description,
            permissions: rest.permissions
        }).select('id, name, description, permissions');

        if (error) throw error;

        const result = data?.[0];
        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        return createSuccess({
            id: String(result.id),
            name: String(result.name),
            description: result.description ? String(result.description) : undefined,
            permissions: result.permissions as Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }> || {},
        });
    } catch (err) {
        return handleDbError(err, "saveRole");
    }
}

export async function deleteRole(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        const { error } = await db.from('roles').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteRole");
    }
}

// Issue persistence
export async function saveIssue(issueData: Partial<Issue>): Promise<ApiResponse<Issue>> {
    try {
        const { id, ...rest } = issueData;
        const dbData = {
            customer_id: rest.customerId && rest.customerId > 0 ? rest.customerId : null,
            branch_name: rest.branchName,
            case_number: rest.caseNumber,
            title: rest.title,
            description: rest.description,
            type: rest.type,
            severity: rest.severity,
            status: rest.status,
            attachments: rest.attachments,
            created_by: rest.createdBy,
            created_at: rest.createdAt,
            modified_by: rest.modifiedBy,
            modified_at: rest.modifiedAt
        };

        let result;
        if (!isTemporaryId(id)) {
            log.debug("Updating issue:", id);
            const { data, error } = await db.from('issues').update(dbData).eq('id', id).select();
            if (error) throw error;
            result = data?.[0];
        } else {
            log.debug("Inserting new issue");
            const { data, error } = await db.from('issues').insert(dbData).select();
            if (error) throw error;
            result = data?.[0];
        }

        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        return createSuccess(result as Issue);
    } catch (err) {
        return handleDbError(err, "saveIssue");
    }
}

export async function deleteIssue(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        const { error } = await db.from('issues').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteIssue");
    }
}

// Customer persistence
export async function saveCustomer(customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    try {
        const { id, ...rest } = customerData;
        const dbData = {
            name: rest.name,
            client_code: rest.clientCode,
            subdomain: rest.subdomain,
            product_type: rest.productType,
            package: rest.package,
            usage_status: rest.usageStatus,
            installation_status: rest.installationStatus,
            business_type: rest.businessType,
            contract_number: rest.contractNumber,
            contract_start: rest.contractStart,
            contract_end: rest.contractEnd,
            sales_name: rest.salesName,
            contact_name: rest.contactName,
            contact_phone: rest.contactPhone,
            note: rest.note,
            created_by: rest.createdBy,
            created_at: rest.createdAt,
            modified_by: rest.modifiedBy,
            modified_at: rest.modifiedAt,
            branches: JSON.stringify(rest.branches || [])
        };

        let result;
        if (!isTemporaryId(id)) {
            const { data, error } = await db.from('customers').update(dbData).eq('id', id).select();
            if (error) throw error;
            result = data?.[0];
        } else {
            const { data, error } = await db.from('customers').insert(dbData).select();
            if (error) throw error;
            result = data?.[0];
        }

        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        return createSuccess(result as Customer);
    } catch (err) {
        return handleDbError(err, "saveCustomer");
    }
}

export async function deleteCustomer(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        const { error } = await db.from('customers').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteCustomer");
    }
}

// Installation persistence
export async function saveInstallation(instData: Partial<Installation>): Promise<ApiResponse<Installation>> {
    try {
        const { id, ...rest } = instData;
        const dbData = {
            customer_id: rest.customerId && rest.customerId > 0 ? rest.customerId : null,
            branch_name: rest.branchName,
            status: rest.status,
            created_by: rest.requestedBy,
            created_at: rest.requestedAt,
            assigned_dev: rest.assignedDev,
            completed_at: rest.completedAt,
            notes: rest.notes,
            installation_type: rest.installationType,
            modified_by: rest.modifiedBy,
            modified_at: rest.modifiedAt
        };

        let result;
        if (!isTemporaryId(id)) {
            log.debug("Updating installation:", id);
            const { data, error } = await db.from('installations').update(dbData).eq('id', id).select();
            if (error) throw error;
            result = data?.[0];
        } else {
            log.debug("Inserting new installation");
            const { data, error } = await db.from('installations').insert(dbData).select();
            if (error) throw error;
            result = data?.[0];
        }

        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        // Map snake_case to camelCase
        const installation: Installation = {
            id: Number(result.id),
            customerId: result.customer_id ? Number(result.customer_id) : 0,
            customerName: '',
            branchName: result.branch_name ? String(result.branch_name) : undefined,
            status: String(result.status) as Installation['status'],
            installationType: String(result.installation_type) as Installation['installationType'],
            notes: result.notes ? String(result.notes) : undefined,
            assignedDev: result.assigned_dev ? String(result.assigned_dev) : undefined,
            completedAt: result.completed_at ? String(result.completed_at) : undefined,
            requestedBy: result.created_by ? String(result.created_by) : '',
            requestedAt: result.created_at ? String(result.created_at) : '',
            modifiedBy: result.modified_by ? String(result.modified_by) : undefined,
            modifiedAt: result.modified_at ? String(result.modified_at) : undefined,
        };

        return createSuccess(installation);
    } catch (err) {
        return handleDbError(err, "saveInstallation");
    }
}

export async function updateInstallationStatus(id: number, status: string, modifiedBy?: string): Promise<ApiResponse<Installation | null>> {
    try {
        const { data, error } = await db.from('installations').update({
            status,
            modified_by: modifiedBy,
            modified_at: new Date().toISOString()
        }).eq('id', id).select();

        if (error) throw error;

        const row = data?.[0];
        if (!row) return createSuccess(null);

        const installation: Installation = {
            id: Number(row.id),
            customerId: row.customer_id ? Number(row.customer_id) : 0,
            customerName: '',
            branchName: row.branch_name ? String(row.branch_name) : undefined,
            status: String(row.status) as Installation['status'],
            installationType: String(row.installation_type) as Installation['installationType'],
            notes: row.notes ? String(row.notes) : undefined,
            assignedDev: row.assigned_dev ? String(row.assigned_dev) : undefined,
            completedAt: row.completed_at ? String(row.completed_at) : undefined,
            requestedBy: row.created_by ? String(row.created_by) : '',
            requestedAt: row.created_at ? String(row.created_at) : '',
            modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
            modifiedAt: row.modified_at ? String(row.modified_at) : undefined,
        };

        return createSuccess(installation);
    } catch (err) {
        return handleDbError(err, "updateInstallationStatus");
    }
}


export async function getActivities(params?: PaginationParams): Promise<Activity[]> {
    try {
        let query = db
            .from('activities')
            .select('id, customer_id, customer_name, title, activity_type, content, assignee, status, sentiment, follow_up_date, created_by, created_at, modified_by, modified_at')
            .order('created_at', { ascending: false });

        if (params?.limit) {
            const { limit, offset } = getPaginationParams(params);
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((item) => ({
            id: Number(item.id),
            customerId: Number(item.customer_id),
            customerName: String(item.customer_name),
            title: String(item.title),
            activityType: item.activity_type as Activity['activityType'],
            content: item.content ? String(item.content) : undefined,
            assignee: item.assignee ? String(item.assignee) : undefined,
            status: String(item.status),
            sentiment: item.sentiment as Activity['sentiment'],
            followUpDate: item.follow_up_date ? String(item.follow_up_date) : undefined,
            createdBy: item.created_by ? String(item.created_by) : undefined,
            createdAt: item.created_at ? String(item.created_at) : undefined,
            modifiedBy: item.modified_by ? String(item.modified_by) : undefined,
            modifiedAt: item.modified_at ? String(item.modified_at) : undefined
        }));
    } catch (err) {
        log.error("Error fetching activities:", err);
        return [];
    }
}

export async function saveActivity(activityData: Partial<Activity>): Promise<ApiResponse<Activity>> {
    try {
        const { id, ...rest } = activityData;
        const dbData = {
            customer_id: rest.customerId,
            customer_name: rest.customerName,
            title: rest.title,
            activity_type: rest.activityType,
            content: rest.content,
            assignee: rest.assignee,
            status: rest.status,
            sentiment: rest.sentiment,
            follow_up_date: rest.followUpDate,
            created_by: rest.createdBy,
            created_at: rest.createdAt,
            modified_by: rest.modifiedBy,
            modified_at: rest.modifiedAt
        };

        let result;
        if (!isTemporaryId(id)) {
            const { data, error } = await db.from('activities').update(dbData).eq('id', id).select();
            if (error) throw error;
            result = data?.[0];
        } else {
            const { data, error } = await db.from('activities').insert(dbData).select();
            if (error) throw error;
            result = data?.[0];
        }

        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        const activity: Activity = {
            id: Number(result.id),
            customerId: Number(result.customer_id),
            customerName: String(result.customer_name),
            title: String(result.title),
            activityType: result.activity_type as Activity['activityType'],
            content: result.content ? String(result.content) : undefined,
            assignee: result.assignee ? String(result.assignee) : undefined,
            status: String(result.status),
            sentiment: result.sentiment as Activity['sentiment'],
            followUpDate: result.follow_up_date ? String(result.follow_up_date) : undefined,
            createdBy: result.created_by ? String(result.created_by) : undefined,
            createdAt: result.created_at ? String(result.created_at) : undefined,
            modifiedBy: result.modified_by ? String(result.modified_by) : undefined,
            modifiedAt: result.modified_at ? String(result.modified_at) : undefined
        };

        return createSuccess(activity);
    } catch (err) {
        return handleDbError(err, "saveActivity");
    }
}

export async function deleteActivity(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        const { error } = await db.from('activities').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteActivity");
    }
}

// Leads persistence
export async function getLeads(params?: PaginationParams): Promise<Lead[]> {
    try {
        let query = db
            .from('leads')
            .select('id, lead_number, product, source, lead_type, sales_name, customer_name, phone, received_date, notes, created_by, created_at, modified_by, modified_at')
            .order('created_at', { ascending: false });

        if (params?.limit) {
            const { limit, offset } = getPaginationParams(params);
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map(row => ({
            id: Number(row.id),
            leadNumber: String(row.lead_number),
            product: String(row.product),
            source: String(row.source),
            leadType: String(row.lead_type),
            salesName: String(row.sales_name),
            customerName: String(row.customer_name),
            phone: String(row.phone),
            receivedDate: String(row.received_date),
            notes: row.notes ? String(row.notes) : undefined,
            createdBy: row.created_by ? String(row.created_by) : undefined,
            createdAt: row.created_at ? String(row.created_at) : undefined,
            modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
            modifiedAt: row.modified_at ? String(row.modified_at) : undefined
        }));
    } catch (err) {
        log.error("Error in getLeads:", err);
        return [];
    }
}

export async function saveLead(leadData: Partial<Lead>): Promise<ApiResponse<Lead>> {
    try {
        const { id, ...rest } = leadData;
        const dbData = {
            lead_number: rest.leadNumber,
            product: rest.product,
            source: rest.source,
            lead_type: rest.leadType,
            sales_name: rest.salesName,
            customer_name: rest.customerName,
            phone: rest.phone,
            received_date: rest.receivedDate,
            notes: rest.notes,
            created_by: rest.createdBy,
            created_at: rest.createdAt,
            modified_by: rest.modifiedBy,
            modified_at: rest.modifiedAt
        };

        let result;
        if (!isTemporaryId(id)) {
            const { data, error } = await db.from('leads').update(dbData).eq('id', id).select();
            if (error) throw error;
            result = data?.[0];
        } else {
            const { data, error } = await db.from('leads').insert(dbData).select();
            if (error) throw error;
            result = data?.[0];
        }

        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        const lead: Lead = {
            id: Number(result.id),
            leadNumber: String(result.lead_number),
            product: String(result.product),
            source: String(result.source),
            leadType: String(result.lead_type),
            salesName: String(result.sales_name),
            customerName: String(result.customer_name),
            phone: String(result.phone),
            receivedDate: String(result.received_date),
            notes: result.notes ? String(result.notes) : undefined,
            createdBy: result.created_by ? String(result.created_by) : undefined,
            createdAt: result.created_at ? String(result.created_at) : undefined,
            modifiedBy: result.modified_by ? String(result.modified_by) : undefined,
            modifiedAt: result.modified_at ? String(result.modified_at) : undefined
        };

        return createSuccess(lead);
    } catch (err) {
        return handleDbError(err, "saveLead");
    }
}

export async function deleteLead(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        const { error } = await db.from('leads').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteLead");
    }
}

export async function importLeads(data: Partial<Lead>[]): Promise<ApiResponse<{ count: number }>> {
    try {
        const dbData = data.map(row => ({
            lead_number: row.leadNumber,
            product: row.product,
            source: row.source,
            lead_type: row.leadType,
            sales_name: row.salesName,
            customer_name: row.customerName,
            phone: row.phone,
            received_date: row.receivedDate,
            notes: row.notes,
            created_at: new Date().toISOString()
        }));

        const { error } = await db.from('leads').insert(dbData);
        if (error) throw error;
        return createSuccess({ count: dbData.length });
    } catch (err) {
        return handleDbError(err, "importLeads");
    }
}

// ============================================
// Business Metrics
// ============================================
export async function getBusinessMetrics(): Promise<ApiResponse<BusinessMetrics>> {
    try {
        // In a real app, this would fetch from a metrics table or aggregate from multiple tables
        // For now, return default values that can be updated via admin interface
        const { data, error } = await db
            .from('business_metrics')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
            throw error;
        }

        // Default values if no data exists
        const metrics: BusinessMetrics = data ? {
            newSales: Number(data.new_sales) || 0,
            renewal: Number(data.renewal) || 0,
            renewalRate: Number(data.renewal_rate) || 50,
            merchantOnboard: {
                drease: Number(data.merchant_drease) || 420,
                ease: Number(data.merchant_ease) || 141,
                total: Number(data.merchant_total) || 561,
            },
            easePayUsage: Number(data.ease_pay_usage) || 850,
            onlineBooking: {
                pages: Number(data.booking_pages) || 320,
                bookings: Number(data.bookings) || 1240,
            },
            updatedAt: data.updated_at || new Date().toISOString(),
        } : {
            newSales: 414504.57,
            renewal: 965629.05,
            renewalRate: 50,
            merchantOnboard: { drease: 420, ease: 141, total: 561 },
            easePayUsage: 850,
            onlineBooking: { pages: 320, bookings: 1240 },
            updatedAt: new Date().toISOString(),
        };

        return createSuccess(metrics);
    } catch (err) {
        return handleDbError(err, "getBusinessMetrics");
    }
}

export async function saveBusinessMetrics(metrics: Partial<BusinessMetrics>): Promise<ApiResponse<BusinessMetrics>> {
    try {
        const dbData = {
            new_sales: metrics.newSales,
            renewal: metrics.renewal,
            renewal_rate: metrics.renewalRate,
            merchant_drease: metrics.merchantOnboard?.drease,
            merchant_ease: metrics.merchantOnboard?.ease,
            merchant_total: metrics.merchantOnboard?.total,
            ease_pay_usage: metrics.easePayUsage,
            booking_pages: metrics.onlineBooking?.pages,
            bookings: metrics.onlineBooking?.bookings,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await db.from('business_metrics').upsert(dbData).select();
        if (error) throw error;

        return createSuccess(metrics as BusinessMetrics);
    } catch (err) {
        return handleDbError(err, "saveBusinessMetrics");
    }
}
