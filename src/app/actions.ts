"use server";

import { db } from "@/lib/db";
import {
    Customer, UsageStatus, ProductType, InstallationStatus, Lead, User, Role,
    ApiResponse, ApiErrorCode, PaginationParams, PaginationMeta,
    Installation, Issue, Activity, BusinessMetrics, generateUUID, FollowUpLog
} from "@/types";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "crypto";

// ============================================
// Environment & Logging Utilities
// ============================================
const isDev = process.env.NODE_ENV === 'development';
const log = {
    debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
    info: (...args: unknown[]) => isDev && console.log('[INFO]', ...args),
    error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};

// ============================================
// Session Management (httpOnly cookie)
// ============================================
const SESSION_COOKIE = 'crm_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'atizdesk-default-secret-change-in-production';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

interface SessionPayload {
    userId: number;
    name: string;
    role: string;
    permissions?: Record<string, unknown>;
    exp: number;
}

function signSession(payload: SessionPayload): string {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    return `${data}.${sig}`;
}

function verifySession(token: string): SessionPayload | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
        if (payload.exp < Date.now()) return null; // expired
        return payload;
    } catch {
        return null;
    }
}

async function setSessionCookie(payload: Omit<SessionPayload, 'exp'>): Promise<void> {
    const session: SessionPayload = { ...payload, exp: Date.now() + SESSION_MAX_AGE * 1000 };
    const token = signSession(session);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
    });
}

async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
}

async function getServerSession(): Promise<SessionPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE)?.value;
        if (!token) return null;
        return verifySession(token);
    } catch {
        return null;
    }
}

async function requireAuth(): Promise<SessionPayload> {
    const session = await getServerSession();
    if (!session) {
        throw new AuthError("กรุณาเข้าสู่ระบบก่อนใช้งาน");
    }
    return session;
}

class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthError';
    }
}

// Ensure session cookie exists — called on page load for localStorage→cookie migration
export async function ensureSession(userId: number): Promise<ApiResponse<{ ok: boolean }>> {
    try {
        // Already has valid cookie? Skip
        const existing = await getServerSession();
        if (existing) return createSuccess({ ok: true });

        // Verify user exists and is active in DB
        const { data, error } = await db
            .from('users')
            .select('id, name, role_id, is_active, roles(permissions)')
            .eq('id', userId)
            .maybeSingle();

        if (error || !data || !data.is_active) {
            return createError("Session ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่", 'UNAUTHORIZED');
        }

        // Set cookie
        await setSessionCookie({
            userId: Number(data.id),
            name: String(data.name),
            role: String(data.role_id),
            permissions: (data.roles as { permissions?: Record<string, unknown> })?.permissions,
        });

        return createSuccess({ ok: true });
    } catch (err) {
        return handleDbError(err, "ensureSession");
    }
}

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
    // Handle auth errors separately
    if (err instanceof AuthError) {
        return createError(err.message, 'UNAUTHORIZED');
    }
    // Log full error details server-side only
    log.error(`${context}:`, err);
    // Return generic message to client — never expose DB internals
    return createError("เกิดข้อผิดพลาดในระบบ กรุณาลองอีกครั้ง", 'DATABASE_ERROR');
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
        await requireAuth();
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
        console.log("[getCustomers] Starting fetch...");
        const sortBy = params?.sortBy || 'id';
        const sortOrder = params?.sortOrder === 'asc';

        // Simple query - no joins
        const { data, error } = await db
            .from('customers')
            .select('*')
            .order(sortBy, { ascending: sortOrder });

        if (error) {
            console.error("[getCustomers] Database error:", error.message, error.code);
            return [];
        }

        console.log(`[getCustomers] Success: fetched ${data?.length || 0} customers`);

        // Fetch branches separately
        let branchesMap: Record<number, any[]> = {};
        try {
            const { data: branchesData } = await db
                .from('branches')
                .select('id, customer_id, name, is_main, status, usage_status, address, contract_start, cs_owner');

            if (branchesData) {
                branchesData.forEach(b => {
                    const cid = b.customer_id;
                    if (!branchesMap[cid]) branchesMap[cid] = [];
                    branchesMap[cid].push(b);
                });
            }
        } catch (branchErr) {
            console.warn("[getCustomers] Failed to fetch branches:", branchErr);
        }

        return (data || []).map(row => {
            const mappedBranches = (branchesMap[row.id] || []).map(b => ({
                id: Number(b.id),
                name: String(b.name),
                isMain: Boolean(b.is_main),
                status: b.status as any,
                usageStatus: (b.usage_status as UsageStatus) || "Active",
                address: b.address,
                contractStart: b.contract_start,
                csOwner: b.cs_owner ? String(b.cs_owner) : undefined
            }));

            // Compute customer-level statuses from branches
            const hasAnyBranch = mappedBranches.length > 0;
            let computedUsage: UsageStatus = (row.usage_status as UsageStatus) || "Active";
            let computedInstall: string | undefined = row.installation_status ? String(row.installation_status) : undefined;

            if (hasAnyBranch) {
                const branchUsages = mappedBranches.map(b => b.usageStatus || "Active");
                if (branchUsages.includes("Active")) computedUsage = "Active";
                else if (branchUsages.includes("Training")) computedUsage = "Training";
                else if (branchUsages.includes("Pending")) computedUsage = "Pending";
                else if (branchUsages.every(s => s === "Canceled")) computedUsage = "Canceled";
                else computedUsage = "Inactive";

                computedInstall = mappedBranches.every(b => b.status === "Completed") ? "Completed" : "Pending";
            }

            return {
                id: Number(row.id),
                name: String(row.name),
                clientCode: row.client_code ? String(row.client_code) : undefined,
                subdomain: row.subdomain ? String(row.subdomain) : undefined,
                productType: (row.product_type as ProductType) || "Dr.Ease",
                package: String(row.package || 'Standard'),
                usageStatus: computedUsage,
                contractStart: row.contract_start ? String(row.contract_start) : undefined,
                contractEnd: row.contract_end ? String(row.contract_end) : undefined,
                csOwner: row.cs_owner ? String(row.cs_owner) : undefined,
                contactName: row.contact_name ? String(row.contact_name) : undefined,
                contactPhone: row.contact_phone ? String(row.contact_phone) : undefined,
                salesName: row.sales_name ? String(row.sales_name) : undefined,
                note: row.note ? String(row.note) : undefined,
                installationStatus: computedInstall,
                modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
                modifiedAt: row.modified_at ? String(row.modified_at) : undefined,
                branches: mappedBranches,
            };
        }) as Customer[];
    } catch (err) {
        console.error("[getCustomers] Critical error:", err);
        return [];
    }
}

export async function getIssues(params?: PaginationParams): Promise<Issue[]> {
    try {
        let query = db
            .from('issues')
            .select('id, customer_id, branch_name, case_number, title, description, type, severity, status, assigned_to, assigned_at, created_by, created_at, modified_by, modified_at, attachments, customers(name)')
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
            assignedTo: row.assigned_to ? String(row.assigned_to) : undefined,
            assignedAt: row.assigned_at ? String(row.assigned_at) : undefined,
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
            .select('id, name, username, role_id, is_active, created_at')
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
            isActive: u.is_active !== false,
            createdAt: u.created_at ? String(u.created_at) : undefined,
        }));
    } catch (err) {
        log.error("Critical error in getUsers:", err);
        return [];
    }
}

export async function saveUser(userData: Partial<User> & { password?: string }): Promise<ApiResponse<User>> {
    try {
        await requireAuth();
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
            return createError("เกิดข้อผิดพลาดในระบบ กรุณาลองอีกครั้ง", 'DATABASE_ERROR');
        }

        if (!data) {
            return createError("ไม่พบชื่อผู้ใช้งานนี้ในระบบ", 'NOT_FOUND');
        }

        const isValid = await bcrypt.compare(password, data.password);

        if (!isValid) {
            return createError("รหัสผ่านไม่ถูกต้อง", 'UNAUTHORIZED');
        }

        const permissions = (data.roles as { permissions?: Record<string, unknown> })?.permissions;

        const user: User & { permissions?: Record<string, unknown> } = {
            id: Number(data.id),
            name: String(data.name),
            username: String(data.username),
            role: String(data.role_id),
            isActive: true,
            permissions,
        };

        // Set httpOnly session cookie
        await setSessionCookie({
            userId: user.id,
            name: user.name,
            role: user.role,
            permissions,
        });

        return createSuccess(user);
    } catch (err) {
        return handleDbError(err, "loginUser");
    }
}

export async function logoutUser(): Promise<ApiResponse<{ loggedOut: boolean }>> {
    try {
        await clearSessionCookie();
        return createSuccess({ loggedOut: true });
    } catch (err) {
        return handleDbError(err, "logoutUser");
    }
}

export async function deleteUser(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        await requireAuth();
        const { error } = await db.from('users').update({ is_active: false }).eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteUser");
    }
}

export async function toggleUserActive(id: number, isActive: boolean): Promise<ApiResponse<{ id: number; isActive: boolean }>> {
    try {
        await requireAuth();
        const { error } = await db.from('users').update({ is_active: isActive }).eq('id', id);
        if (error) throw error;
        return createSuccess({ id, isActive });
    } catch (err) {
        return handleDbError(err, "toggleUserActive");
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
        await requireAuth();
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
        await requireAuth();
        const { error } = await db.from('roles').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteRole");
    }
}

// Generate next case number in C-0001 format
async function generateNextCaseNumber(): Promise<string> {
    const { data } = await db
        .from('issues')
        .select('case_number')
        .like('case_number', 'C-%')
        .order('case_number', { ascending: false })
        .limit(1);

    if (data && data.length > 0) {
        const lastNum = parseInt(data[0].case_number.replace('C-', ''), 10);
        return `C-${String(lastNum + 1).padStart(4, '0')}`;
    }
    return 'C-0001';
}

// Issue persistence
export async function saveIssue(issueData: Partial<Issue>): Promise<ApiResponse<Issue>> {
    try {
        await requireAuth();
        const { id, ...rest } = issueData;
        const isNew = isTemporaryId(id);

        const dbData: Record<string, unknown> = {
            customer_id: rest.customerId && rest.customerId > 0 ? rest.customerId : null,
            branch_name: rest.branchName,
            title: rest.title,
            description: rest.description,
            type: rest.type,
            severity: rest.severity,
            status: rest.status,
            assigned_to: rest.assignedTo,
            assigned_at: rest.assignedAt,
            attachments: rest.attachments,
            created_by: rest.createdBy,
            created_at: rest.createdAt,
            modified_by: rest.modifiedBy,
            modified_at: rest.modifiedAt
        };

        if (isNew) {
            dbData.case_number = await generateNextCaseNumber();
        }

        let result;
        if (!isNew) {
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

        // Map snake_case DB result to camelCase Issue
        const mapped: Issue = {
            id: Number(result.id),
            customerId: result.customer_id ? Number(result.customer_id) : 0,
            customerName: rest.customerName || '',
            branchName: result.branch_name ? String(result.branch_name) : undefined,
            caseNumber: result.case_number ? String(result.case_number) : '',
            title: String(result.title),
            description: result.description ? String(result.description) : undefined,
            type: String(result.type),
            severity: String(result.severity) as Issue['severity'],
            status: String(result.status) as Issue['status'],
            assignedTo: result.assigned_to ? String(result.assigned_to) : undefined,
            assignedAt: result.assigned_at ? String(result.assigned_at) : undefined,
            createdBy: result.created_by ? String(result.created_by) : undefined,
            createdAt: result.created_at ? String(result.created_at) : undefined,
            modifiedBy: result.modified_by ? String(result.modified_by) : undefined,
            modifiedAt: result.modified_at ? String(result.modified_at) : undefined,
            attachments: result.attachments ? (typeof result.attachments === 'string' ? result.attachments : JSON.stringify(result.attachments)) : "[]",
        };

        return createSuccess(mapped);
    } catch (err) {
        return handleDbError(err, "saveIssue");
    }
}

export async function assignIssue(issueId: number, assignedTo: string, modifiedBy: string): Promise<ApiResponse<{ assignedTo: string; assignedAt: string }>> {
    try {
        if (!assignedTo || !modifiedBy) {
            return createError("Missing assignedTo or modifiedBy", "VALIDATION_ERROR");
        }

        // Check if already assigned
        const { data: existing } = await db
            .from('issues')
            .select('assigned_to')
            .eq('id', issueId)
            .single();

        if (existing?.assigned_to) {
            return createError(`เคสนี้ถูกรับโดย ${existing.assigned_to} แล้ว`, "VALIDATION_ERROR");
        }

        const now = new Date().toISOString();
        const { error } = await db
            .from('issues')
            .update({
                assigned_to: assignedTo,
                assigned_at: now,
                status: 'กำลังดำเนินการ',
                modified_by: modifiedBy,
                modified_at: now,
            })
            .eq('id', issueId);

        if (error) throw error;
        return createSuccess({ assignedTo, assignedAt: now });
    } catch (err) {
        return handleDbError(err, "assignIssue");
    }
}

export async function deleteIssue(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        await requireAuth();
        const { error } = await db.from('issues').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteIssue");
    }
}

export async function deleteInstallation(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        await requireAuth();
        const { error } = await db.from('installations').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteInstallation");
    }
}

// Validation helpers
const VALID_USAGE_STATUSES: UsageStatus[] = ["Active", "Pending", "Training", "Canceled", "Inactive"];
const VALID_INSTALLATION_STATUSES: InstallationStatus[] = ["Pending", "Completed"];
const VALID_PRODUCT_TYPES: ProductType[] = ["Dr.Ease", "EasePos"];
const VALID_PACKAGES = ["Starter", "Standard", "Elite"];

function validateCustomerInput(data: Partial<Customer>): string | null {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        return "กรุณาระบุชื่อลูกค้า";
    }
    if (data.name.trim().length > 200) {
        return "ชื่อลูกค้ายาวเกินไป (สูงสุด 200 ตัวอักษร)";
    }
    if (data.productType && !VALID_PRODUCT_TYPES.includes(data.productType)) {
        return `ประเภทสินค้าไม่ถูกต้อง: ${data.productType}`;
    }
    if (data.package && !VALID_PACKAGES.includes(data.package)) {
        return `แพ็คเกจไม่ถูกต้อง: ${data.package}`;
    }
    if (data.usageStatus && !VALID_USAGE_STATUSES.includes(data.usageStatus)) {
        return `สถานะการใช้งานไม่ถูกต้อง: ${data.usageStatus}`;
    }
    if (data.installationStatus && !VALID_INSTALLATION_STATUSES.includes(data.installationStatus as InstallationStatus)) {
        return `สถานะการติดตั้งไม่ถูกต้อง: ${data.installationStatus}`;
    }
    // Validate branches
    if (data.branches) {
        for (let i = 0; i < data.branches.length; i++) {
            const b = data.branches[i];
            if (!b.name || typeof b.name !== 'string' || b.name.trim().length === 0) {
                return `สาขาที่ ${i + 1}: กรุณาระบุชื่อสาขา`;
            }
            if (b.usageStatus && !VALID_USAGE_STATUSES.includes(b.usageStatus)) {
                return `สาขา "${b.name}": สถานะการใช้งานไม่ถูกต้อง`;
            }
        }
    }
    return null; // valid
}

// Customer persistence
export async function saveCustomer(customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    try {
        await requireAuth();
        // Input validation
        const validationError = validateCustomerInput(customerData);
        if (validationError) {
            return createError(validationError, 'VALIDATION_ERROR');
        }

        const { id, ...rest } = customerData;
        const toNull = (val: any) => (val === "" || val === undefined) ? null : val;

        // Note: cs_owner is now managed at branch level, not customer level
        // Note: contact_name/contact_phone columns don't exist in customers table
        const dbData = {
            name: rest.name,
            client_code: rest.clientCode,
            subdomain: rest.subdomain,
            product_type: rest.productType,
            package: rest.package,
            usage_status: rest.usageStatus,
            installation_status: rest.installationStatus,
            contract_start: toNull(rest.contractStart),
            contract_end: toNull(rest.contractEnd),
            sales_name: rest.salesName,
            note: rest.note,
            created_by: rest.createdBy,
            created_at: rest.createdAt,
            modified_by: rest.modifiedBy,
            modified_at: rest.modifiedAt
            // branches column is now legacy - managed in separate table
        };

        log.info("saveCustomer: Starting save for customer id:", id, "isNew:", isTemporaryId(id));

        let result;
        if (!isTemporaryId(id)) {
            log.info("saveCustomer: Updating existing customer...");
            const { data, error } = await db.from('customers').update(dbData).eq('id', id).select();
            if (error) {
                log.error("saveCustomer: Error updating customer:", error);
                throw error;
            }
            result = data?.[0];
            log.info("saveCustomer: Update successful, result:", result?.id);
        } else {
            log.info("saveCustomer: Inserting new customer...");
            const { data, error } = await db.from('customers').insert(dbData).select();
            if (error) {
                log.error("saveCustomer: Error inserting customer:", error);
                throw error;
            }
            result = data?.[0];
            log.info("saveCustomer: Insert successful, result:", result?.id);
        }

        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        // --- Branch Normalization Logic ---
        const customerId = Number(result.id);
        const incomingBranches = rest.branches || [];
        log.info("saveCustomer: Processing branches for customer:", customerId, "count:", incomingBranches.length);

        try {
            // 1. Get existing branches from DB for this customer
            const { data: existingBranches, error: fetchBranchError } = await db
                .from('branches')
                .select('id')
                .eq('customer_id', customerId);

            if (fetchBranchError) {
                log.error("saveCustomer: Error fetching existing branches:", fetchBranchError);
            }

            const existingIds = (existingBranches || []).map(b => Number(b.id));
            const incomingIds = incomingBranches
                .filter(b => b.id && !isTemporaryId(b.id))
                .map(b => Number(b.id));

            // 2. Determine branches to delete (in DB but not in incoming)
            const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
            if (idsToDelete.length > 0) {
                log.info("saveCustomer: Deleting branches:", idsToDelete);
                const { error: deleteError } = await db.from('branches').delete().in('id', idsToDelete);
                if (deleteError) {
                    log.error("saveCustomer: Error deleting branches:", deleteError);
                }
            }

            // 3. Update existing + insert new branches
            // (branches.id is GENERATED ALWAYS — can't upsert with explicit id)
            if (incomingBranches.length > 0) {
                const existingToUpdate = incomingBranches.filter(b => b.id && !isTemporaryId(b.id));
                const newToInsert = incomingBranches.filter(b => !b.id || isTemporaryId(b.id));

                // Update existing branches one by one
                for (const b of existingToUpdate) {
                    const { error: updateErr } = await db.from('branches').update({
                        name: b.name,
                        is_main: b.isMain,
                        status: b.status,
                        usage_status: b.usageStatus || "Active",
                        address: b.address,
                        contract_start: b.contractStart,
                        cs_owner: b.csOwner || null
                    }).eq('id', b.id);
                    if (updateErr) {
                        log.error("saveCustomer: Error updating branch:", b.id, updateErr);
                        throw updateErr;
                    }
                }

                // Insert new branches (no id — let DB auto-generate)
                if (newToInsert.length > 0) {
                    const insertData = newToInsert.map(b => ({
                        customer_id: customerId,
                        name: b.name,
                        is_main: b.isMain,
                        status: b.status,
                        usage_status: b.usageStatus || "Active",
                        address: b.address,
                        contract_start: b.contractStart,
                        cs_owner: b.csOwner || null
                    }));
                    const { error: insertErr } = await db.from('branches').insert(insertData);
                    if (insertErr) {
                        log.error("saveCustomer: Error inserting branches:", insertErr);
                        throw insertErr;
                    }
                }

                log.info("saveCustomer: Branches save successful (updated:", existingToUpdate.length, "inserted:", newToInsert.length, ")");
            }
        } catch (branchErr: any) {
            log.error("saveCustomer: Branch management failed for customer:", customerId, branchErr);
            return createError(
                "บันทึกข้อมูลลูกค้าสำเร็จ แต่จัดการสาขาล้มเหลว กรุณาลองบันทึกอีกครั้ง",
                'DATABASE_ERROR'
            );
        }

        // Fetch the customer again to return complete data
        log.info("saveCustomer: Fetching final customer data for id:", customerId);
        const { data: finalData, error: finalError } = await db
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .maybeSingle();

        if (finalError) {
            log.error("saveCustomer: Error fetching final customer data:", finalError);
        }

        if (finalError || !finalData) {
            log.info("saveCustomer: Returning partial data as fallback");
            return createSuccess(result as Customer); // Fallback to partial data
        }

        // Fetch branches separately
        log.info("saveCustomer: Fetching branches for customer:", customerId);
        const { data: branchesData, error: branchFetchError } = await db
            .from('branches')
            .select('id, name, is_main, status, usage_status, address, contract_start, cs_owner')
            .eq('customer_id', customerId);

        if (branchFetchError) {
            log.error("saveCustomer: Error fetching branches:", branchFetchError);
        }

        // Map branches and compute customer-level statuses
        const mappedBranches = (branchesData || []).map(b => ({
            id: Number(b.id),
            name: String(b.name),
            isMain: Boolean(b.is_main),
            status: b.status as any,
            usageStatus: (b.usage_status as UsageStatus) || "Active",
            address: b.address,
            contractStart: b.contract_start,
            csOwner: b.cs_owner ? String(b.cs_owner) : undefined
        }));

        // Compute aggregate statuses from branches
        let computedUsage: UsageStatus = finalData.usage_status as UsageStatus || "Active";
        let computedInstall: InstallationStatus = finalData.installation_status as InstallationStatus || "Pending";
        if (mappedBranches.length > 0) {
            const branchUsages = mappedBranches.map(b => b.usageStatus || "Active");
            if (branchUsages.includes("Active")) computedUsage = "Active";
            else if (branchUsages.includes("Training")) computedUsage = "Training";
            else if (branchUsages.includes("Pending")) computedUsage = "Pending";
            else if (branchUsages.every(s => s === "Canceled")) computedUsage = "Canceled";
            else computedUsage = "Inactive";

            computedInstall = mappedBranches.every(b => b.status === "Completed") ? "Completed" : "Pending";

            // Write computed statuses back to customers table for backward compat
            await db.from('customers').update({
                usage_status: computedUsage,
                installation_status: computedInstall,
            }).eq('id', customerId);
        }

        const savedCustomer: Customer = {
            ...result,
            id: Number(finalData.id),
            name: String(finalData.name),
            clientCode: finalData.client_code,
            subdomain: finalData.subdomain,
            productType: finalData.product_type as ProductType,
            package: finalData.package,
            usageStatus: computedUsage,
            installationStatus: computedInstall,
            branches: mappedBranches,
        } as Customer;

        log.info("saveCustomer: Complete! Customer saved successfully:", savedCustomer.id);
        return createSuccess(savedCustomer);
    } catch (err: any) {
        log.error("saveCustomer: Caught error:", err?.message || err, err?.code, err?.details);
        return handleDbError(err, "saveCustomer");
    }
}

export async function deleteCustomer(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        await requireAuth();
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
        await requireAuth();
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
        await requireAuth();
        const { data, error } = await db.from('installations').update({
            status,
            modified_by: modifiedBy,
            modified_at: new Date().toISOString(),
            ...(status === "Completed" ? { completed_at: new Date().toISOString() } : { completed_at: null })
        }).eq('id', id).select();

        if (error) throw error;

        const row = data?.[0];
        if (!row) return createSuccess(null);

        // Sync branch status in branches table
        if (row.customer_id) {
            if (row.installation_type === "branch" && row.branch_name) {
                await db.from('branches')
                    .update({ status })
                    .eq('customer_id', row.customer_id)
                    .eq('name', row.branch_name);
            } else {
                // "new" or undefined → update main branch
                await db.from('branches')
                    .update({ status })
                    .eq('customer_id', row.customer_id)
                    .eq('is_main', true);
            }

            // Recompute customer-level installation_status from all branches
            const { data: allBranches } = await db.from('branches')
                .select('status')
                .eq('customer_id', row.customer_id);

            const allCompleted = allBranches && allBranches.length > 0
                && allBranches.every(b => b.status === "Completed");

            await db.from('customers').update({
                installation_status: allCompleted ? "Completed" : "Pending"
            }).eq('id', row.customer_id);
        }

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
        await requireAuth();
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
        await requireAuth();
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
        await requireAuth();
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
        await requireAuth();
        const { error } = await db.from('leads').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteLead");
    }
}

export async function importLeads(data: Partial<Lead>[]): Promise<ApiResponse<{ count: number }>> {
    try {
        await requireAuth();
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
    // Default values - always return these if anything goes wrong
    const defaultMetrics: BusinessMetrics = {
        newSales: 414504.57,
        renewal: 965629.05,
        renewalRate: 50,
        merchantOnboard: { drease: 420, ease: 141, total: 561 },
        easePayUsage: 850,
        onlineBooking: { pages: 320, bookings: 1240 },
        updatedAt: new Date().toISOString(),
    };

    try {
        const { data, error } = await db
            .from('business_metrics')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Return defaults if table doesn't exist or any error
        if (error) {
            return createSuccess(defaultMetrics);
        }

        // Return defaults if no data
        if (!data) {
            return createSuccess(defaultMetrics);
        }

        const metrics: BusinessMetrics = {
            newSales: Number(data.new_sales) || defaultMetrics.newSales,
            renewal: Number(data.renewal) || defaultMetrics.renewal,
            renewalRate: Number(data.renewal_rate) || defaultMetrics.renewalRate,
            merchantOnboard: {
                drease: Number(data.merchant_drease) || defaultMetrics.merchantOnboard.drease,
                ease: Number(data.merchant_ease) || defaultMetrics.merchantOnboard.ease,
                total: Number(data.merchant_total) || defaultMetrics.merchantOnboard.total,
            },
            easePayUsage: Number(data.ease_pay_usage) || defaultMetrics.easePayUsage,
            onlineBooking: {
                pages: Number(data.booking_pages) || defaultMetrics.onlineBooking.pages,
                bookings: Number(data.bookings) || defaultMetrics.onlineBooking.bookings,
            },
            updatedAt: data.updated_at || new Date().toISOString(),
        };

        return createSuccess(metrics);
    } catch {
        // Silently return defaults on any error
        return createSuccess(defaultMetrics);
    }
}

export async function saveBusinessMetrics(metrics: Partial<BusinessMetrics>): Promise<ApiResponse<BusinessMetrics>> {
    try {
        await requireAuth();
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

// ============================================
// Follow-up Logs (History)
// ============================================
export async function getFollowUpLogs(customerId?: number): Promise<FollowUpLog[]> {
    try {
        let query = db
            .from('follow_up_logs')
            .select('id, customer_id, customer_name, branch_name, cs_owner, round, due_date, completed_at, feedback, outcome, created_by, created_at')
            .order('created_at', { ascending: false });

        if (customerId) {
            query = query.eq('customer_id', customerId);
        }

        const { data, error } = await query;

        if (error) {
            log.error("Error fetching follow-up logs:", error);
            return [];
        }

        return (data || []).map(row => ({
            id: Number(row.id),
            customerId: Number(row.customer_id),
            customerName: String(row.customer_name),
            branchName: row.branch_name ? String(row.branch_name) : undefined,
            csOwner: String(row.cs_owner),
            round: Number(row.round) as FollowUpLog['round'],
            dueDate: String(row.due_date),
            completedAt: String(row.completed_at),
            feedback: row.feedback ? String(row.feedback) : undefined,
            outcome: row.outcome ? String(row.outcome) as FollowUpLog['outcome'] : 'completed',
            createdBy: row.created_by ? String(row.created_by) : undefined,
            createdAt: row.created_at ? String(row.created_at) : undefined,
        }));
    } catch (err) {
        log.error("Critical error in getFollowUpLogs:", err);
        return [];
    }
}

export async function saveFollowUpLog(logData: Partial<FollowUpLog>): Promise<ApiResponse<FollowUpLog>> {
    try {
        await requireAuth();
        const dbData = {
            customer_id: logData.customerId,
            customer_name: logData.customerName,
            branch_name: logData.branchName,
            cs_owner: logData.csOwner,
            round: logData.round,
            due_date: logData.dueDate,
            completed_at: logData.completedAt || new Date().toISOString(),
            feedback: logData.feedback,
            outcome: logData.outcome || 'completed',
            created_by: logData.createdBy,
            created_at: new Date().toISOString(),
        };

        const { data, error } = await db.from('follow_up_logs').insert(dbData).select();
        if (error) throw error;

        const result = data?.[0];
        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        const log: FollowUpLog = {
            id: Number(result.id),
            customerId: Number(result.customer_id),
            customerName: String(result.customer_name),
            branchName: result.branch_name ? String(result.branch_name) : undefined,
            csOwner: String(result.cs_owner),
            round: Number(result.round) as FollowUpLog['round'],
            dueDate: String(result.due_date),
            completedAt: String(result.completed_at),
            feedback: result.feedback ? String(result.feedback) : undefined,
            outcome: result.outcome ? String(result.outcome) as FollowUpLog['outcome'] : 'completed',
            createdBy: result.created_by ? String(result.created_by) : undefined,
            createdAt: result.created_at ? String(result.created_at) : undefined,
        };

        return createSuccess(log);
    } catch (err) {
        return handleDbError(err, "saveFollowUpLog");
    }
}

export async function updateFollowUpLog(id: number, logData: Partial<FollowUpLog>): Promise<ApiResponse<FollowUpLog>> {
    try {
        await requireAuth();
        const dbData: Record<string, any> = {};

        if (logData.feedback !== undefined) dbData.feedback = logData.feedback;
        if (logData.csOwner !== undefined) dbData.cs_owner = logData.csOwner;
        if (logData.completedAt !== undefined) dbData.completed_at = logData.completedAt;
        if (logData.outcome !== undefined) dbData.outcome = logData.outcome;

        const { data, error } = await db
            .from('follow_up_logs')
            .update(dbData)
            .eq('id', id)
            .select();

        if (error) throw error;

        const result = data?.[0];
        if (!result) {
            return createError("No data returned from database", 'DATABASE_ERROR');
        }

        const updatedLog: FollowUpLog = {
            id: Number(result.id),
            customerId: Number(result.customer_id),
            customerName: String(result.customer_name),
            branchName: result.branch_name ? String(result.branch_name) : undefined,
            csOwner: String(result.cs_owner),
            round: Number(result.round) as FollowUpLog['round'],
            dueDate: String(result.due_date),
            completedAt: String(result.completed_at),
            feedback: result.feedback ? String(result.feedback) : undefined,
            outcome: result.outcome ? String(result.outcome) as FollowUpLog['outcome'] : 'completed',
            createdBy: result.created_by ? String(result.created_by) : undefined,
            createdAt: result.created_at ? String(result.created_at) : undefined,
        };

        return createSuccess(updatedLog);
    } catch (err) {
        return handleDbError(err, "updateFollowUpLog");
    }
}

export async function deleteFollowUpLog(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        await requireAuth();
        const { error } = await db.from('follow_up_logs').delete().eq('id', id);
        if (error) throw error;
        return createSuccess({ deleted: true });
    } catch (err) {
        return handleDbError(err, "deleteFollowUpLog");
    }
}
