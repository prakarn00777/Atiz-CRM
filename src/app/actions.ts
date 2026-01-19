"use server";

import { db } from "@/lib/db";
import { Customer, UsageStatus, ProductType } from "@/types";

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
            .order('id', { ascending: true });

        if (error) {
            console.error("Error fetching users:", error);
            return [];
        }

        return (data || []).map(u => ({
            ...u,
            role: u.role_id
        }));
    } catch (err) {
        console.error("Critical error in getUsers:", err);
        return [];
    }
}

export async function saveUser(userData: any) {
    try {
        const { id, ...rest } = userData;
        const dbData = {
            name: rest.name,
            username: rest.username,
            password: rest.password,
            role_id: rest.role
        };

        let result;
        if (id && id > 1000000) { // New user
            const { data, error } = await db.from('users').insert(dbData).select();
            if (error) throw error;
            result = data?.[0];
        } else if (id) { // Update
            const { data, error } = await db.from('users').update(dbData).eq('id', id).select();
            if (error) throw error;
            result = data?.[0];
        } else {
            const { data, error } = await db.from('users').insert(dbData).select();
            if (error) throw error;
            result = data?.[0];
        }

        if (!result) throw new Error("No data returned from database");

        return { success: true, data: { ...result, role: result.role_id } };
    } catch (err: any) {
        console.error("Error in saveUser:", err);
        return { success: false, error: err.message || "Unknown database error" };
    }
}

export async function deleteUser(id: number) {
    try {
        const { error } = await db.from('users').delete().eq('id', id);
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
