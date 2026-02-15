import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/google-sheets';

// GET /api/leads - Fetch all leads from Google Sheets (READ ONLY)
export async function GET() {
    try {
        const leads = await getLeads();
        // Filter out placeholder rows: must have date AND at least one real data field
        const validLeads = leads.filter(l => {
            if (!l.date || l.date.trim() === '') return false;
            // Require at least one substantive field (sheet has pre-filled dates for future rows)
            return (l.customerName && l.customerName.trim() !== '') ||
                   (l.product && l.product.trim() !== '') ||
                   (l.salesName && l.salesName.trim() !== '') ||
                   (l.clinicName && l.clinicName.trim() !== '');
        });
        return NextResponse.json({ success: true, data: validLeads });
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
