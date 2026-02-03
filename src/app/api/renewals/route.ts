import { NextResponse } from 'next/server';
import { getRenewals } from '@/lib/google-sheets-renewals';

export async function GET() {
    try {
        const renewals = await getRenewals();

        return NextResponse.json({ success: true, data: renewals });
    } catch (error: any) {
        console.error('API Error fetching renewals:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch renewals from Google Sheets',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
