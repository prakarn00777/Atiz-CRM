"use server";

import { db } from "@/lib/db";
import { Customer, UsageStatus, ProductType } from "@/types";
import bcrypt from "bcryptjs";

export async function importCustomersFromCSV(data: any[]) {
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
            return { success: false, error: error.message };
        }
    }

    return { success: true, count: customers.length };
}

export async function getCustomers(): Promise<Customer[]> {
    try {
        const { data, error } = await db
            .from('customers')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error("Error fetching customers:", error);
            return [];
        }

        return (data || []).map(row => ({
            id: Number(row.id),
            name: String(row.name),
            client_code: row.client_code ? String(row.client_code) : undefined,
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
        })) as Customer[];
    } catch (err) {
        console.error("Critical error in getCustomers:", err);
        return [];
    }
}

export async function getIssues(): Promise<any[]> {
    try {
        const { data, error } = await db
            .from('issues')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error("Error fetching issues:", error);
            return [];
        }

        return (data || []).map(row => ({
            id: Number(row.id),
            customerId: Number(row.customer_id),
            customerName: String(row.customer_name),
            branchName: row.branch_name ? String(row.branch_name) : undefined,
            caseNumber: String(row.case_number),
            title: String(row.title),
            description: row.description ? String(row.description) : undefined,
            type: String(row.type),
            severity: String(row.severity),
            status: String(row.status),
            reportedBy: String(row.reported_by),
            reportedAt: String(row.reported_at),
            modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
            modifiedAt: row.modified_at ? String(row.modified_at) : undefined,
            attachments: row.attachments ? String(row.attachments) : "[]",
        }));
    } catch (err) {
        console.error("Critical error in getIssues:", err);
        return [];
    }
}

export async function getInstallations(): Promise<any[]> {
    try {
        const { data, error } = await db
            .from('installations')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error("Error fetching installations:", error);
            return [];
        }

        return (data || []).map(row => ({
            id: Number(row.id),
            customerId: Number(row.customer_id),
            customerName: String(row.customer_name),
            branchName: row.branch_name ? String(row.branch_name) : undefined,
            status: String(row.status),
            requestedBy: String(row.requested_by),
            requestedAt: String(row.requested_at),
            assignedDev: row.assigned_dev ? String(row.assigned_dev) : undefined,
            completedAt: row.completed_at ? String(row.completed_at) : undefined,
            notes: row.notes ? String(row.notes) : undefined,
            installationType: String(row.installation_type),
            modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
            modifiedAt: row.modified_at ? String(row.modified_at) : undefined,
        }));
    } catch (err) {
        console.error("Critical error in getInstallations:", err);
        return [];
    }
}

export async function getUsers(): Promise<any[]> {
    try {
        const { data, error } = await db
            .from('users')
            .select('*')
            .eq('is_active', true)
            .order('id', { ascending: true });

        if (error) {
            console.error("Error fetching users:", error);
            return [];
        }

        return (data || []).map(u => {
            const { password, ...userWithoutPassword } = u;
            return {
                ...userWithoutPassword,
                role: u.role_id
            };
        });
    } catch (err) {
        console.error("Critical error in getUsers:", err);
        return [];
    }
}

export async function saveUser(userData: any) {
    try {
        const { id, ...rest } = userData;

        let hashedPassword = rest.password;
        // Only hash if it's a new user or if password was explicitly updated
        // In a real app, we might compare with old password hash, but for now we'll hash it
        // if it looks like a plain text (short or provided in the form)
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
        if (id && id > 1000000) { // New user (temporary ID from Date.now())
            const { data, error } = await db.from('users').insert(dbData).select();
            if (error) throw error;
            result = data?.[0];
        } else if (id) { // Update existing
            const { data, error } = await db.from('users').update(dbData).eq('id', id).select();
            if (error) throw error;
            result = data?.[0];
        } else {
            const { data, error } = await db.from('users').insert(dbData).select();
            if (error) throw error;
            result = data?.[0];
        }

        if (!result) throw new Error("No data returned from database");

        const { password, ...userWithoutPassword } = result;
        return { success: true, data: { ...userWithoutPassword, role: result.role_id } };
    } catch (err: any) {
        console.error("Error in saveUser:", err);
        return { success: false, error: err.message || "Unknown database error" };
    }
}

export async function loginUser(username: string, password: string) {
    console.log("Attempting login for:", username); // Debug
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error("Missing Supabase Env Vars:", {
                url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            });
            return { success: false, error: "System Configuration Error: Missing Environment Variables" };
        }

        const { data, error } = await db
            .from('users')
            .select('*, roles(name)')
            .eq('username', username)
            .eq('is_active', true)
            .maybeSingle();

        console.log("Supabase login query result:", { data: data ? "Found" : "Not Found", error }); // Debug

        if (error) {
            console.error("Database error during login:", error);
            return { success: false, error: `Database Error: ${error.message}` };
        }

        if (!data) {
            console.log("Login failed: User not found");
            return { success: false, error: "ไม่พบชื่อผู้ใช้งานนี้ในระบบ" };
        }

        const isValid = await bcrypt.compare(password, data.password);

        // Fallback for migration: allow plain text match for 'admin:1234' if hash compare fails
        let isMatch = isValid;
        if (!isMatch && username === 'admin' && password === data.password) {
            isMatch = true;
            // Optionally auto-migrate to hashed password here
            const newHash = await bcrypt.hash(password, 10);
            await db.from('users').update({ password: newHash }).eq('id', data.id);
        }

        if (!isMatch) {
            console.log("Login failed: Password mismatch");
            return { success: false, error: "รหัสผ่านไม่ถูกต้อง" };
        }

        const { password: _, ...userWithoutPassword } = data;
        return {
            success: true,
            user: {
                ...userWithoutPassword,
                role: data.role_id
            }
        };
    } catch (err: any) {
        console.error("Login error:", err);
        return { success: false, error: `System Error: ${err.message}` };
    }
}

export async function deleteUser(id: number) {
    try {
        const { error } = await db.from('users').update({ is_active: false }).eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error("Error in deleteUser:", err);
        return { success: false, error: err.message };
    }
}

export async function getRoles(): Promise<any[]> {
    try {
        const { data, error } = await db
            .from('roles')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error("Error fetching roles:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Critical error in getRoles:", err);
        return [];
    }
}

export async function saveRole(roleData: any) {
    try {
        const { id, ...rest } = roleData;
        const { data, error } = await db.from('roles').upsert({ id, ...rest }).select();
        if (error) throw error;
        return { success: true, data: data?.[0] };
    } catch (err: any) {
        console.error("Error in saveRole:", err);
        return { success: false, error: err.message };
    }
}

export async function deleteRole(id: string) {
    try {
        const { error } = await db.from('roles').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error("Error in deleteRole:", err);
        return { success: false, error: err.message };
    }
}
