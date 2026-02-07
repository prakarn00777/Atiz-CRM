"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

const BUCKET_NAME = "issue-attachments";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ success: false, error: "File too large (max 5MB)" }, { status: 400 });
        }

        // Validate file type (images + PDF)
        const allowedTypes = ["image/", "application/pdf"];
        if (!allowedTypes.some(t => file.type.startsWith(t))) {
            return NextResponse.json({ success: false, error: "Only images and PDFs are allowed" }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${timestamp}_${randomStr}.${ext}`;

        // Convert File to ArrayBuffer then to Uint8Array
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filename, fileBuffer, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Supabase Storage error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filename);

        return NextResponse.json({
            success: true,
            data: {
                name: file.name,
                type: file.type,
                size: file.size,
                url: urlData.publicUrl,
                path: data.path,
            },
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 });
    }
}
