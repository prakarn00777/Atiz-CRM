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
    const { data, error } = await db
        .from('customers')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error("Error fetching customers:", error);
        return [];
    }

    return data.map(row => ({
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
}

export async function getIssues(): Promise<any[]> {
    const { data, error } = await db
        .from('issues')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error("Error fetching issues:", error);
        return [];
    }

    return data.map(row => ({
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
}

export async function getInstallations(): Promise<any[]> {
    const { data, error } = await db
        .from('installations')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error("Error fetching installations:", error);
        return [];
    }

    return data.map(row => ({
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
}

export async function getUsers(): Promise<any[]> {
    const { data, error } = await db
        .from('users')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error("Error fetching users:", error);
        return [];
    }

    return data.map(u => ({
        ...u,
        role: u.role_id
    }));
}

export async function saveUser(userData: any) {
    const { id, ...rest } = userData;

    // Map 'role' to 'role_id' for Supabase schema
    const dbData = {
        name: rest.name,
        username: rest.username,
        password: rest.password,
        role_id: rest.role
    };

    let result;
    if (id && id > 1000000) { // New user with Date.now() as temp id (SQLite artifact)
        const { data, error } = await db.from('users').insert(dbData).select();
        if (error) throw error;
        result = data[0];
    } else if (id) { // Existing user
        const { data, error } = await db.from('users').update(dbData).eq('id', id).select();
        if (error) throw error;
        result = data[0];
    } else { // No id at all
        const { data, error } = await db.from('users').insert(dbData).select();
        if (error) throw error;
        result = data[0];
    }

    return { ...result, role: result.role_id };
}

export async function deleteUser(id: number) {
    const { error } = await db.from('users').delete().eq('id', id);
    if (error) throw error;
    return true;
}

export async function getRoles(): Promise<any[]> {
    const { data, error } = await db
        .from('roles')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error("Error fetching roles:", error);
        return [];
    }

    return data;
}

export async function saveRole(roleData: any) {
    const { id, ...rest } = roleData;
    const { data, error } = await db.from('roles').upsert({ id, ...rest }).select();
    if (error) throw error;
    return data[0];
}

export async function deleteRole(id: string) {
    const { error } = await db.from('roles').delete().eq('id', id);
    if (error) throw error;
    return true;
}
