import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/google-sheets';

// GET /api/leads - Fetch all leads from Google Sheets (READ ONLY)
export async function GET() {
    try {
        const leads = await getLeads();
        // Filter out rows that are missing mandatory fields
        const validLeads = leads.filter(l =>
            l.date && l.date.trim() !== '' &&
            l.leadNumber && l.leadNumber.trim() !== '' &&
            l.leadIndex && l.leadIndex.trim() !== '' &&
            l.product && l.product.trim() !== '' &&
            l.leadType && l.leadType.trim() !== '' &&
            l.customerName && l.customerName.trim() !== ''
        );
        return NextResponse.json({ success: true, data: validLeads });
    } catch (error) {
        console.error('API Error fetching leads:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch leads from Google Sheets' },
            { status: 500 }
        );
    }
}
