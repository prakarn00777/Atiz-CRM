import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/google-sheets';

// GET /api/leads - Fetch all leads from Google Sheets (READ ONLY)
export async function GET() {
    try {
        const leads = await getLeads();
        return NextResponse.json({ success: true, data: leads });
    } catch (error: any) {
        console.error('API Error fetching leads:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch leads from Google Sheets',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
