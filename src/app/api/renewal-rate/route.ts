import { NextResponse } from 'next/server';
import { getRenewalRate } from '@/lib/google-sheets-renewal-rate';

export async function GET() {
    try {
        const data = await getRenewalRate();

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('API Error fetching renewal rate:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch renewal rate from Google Sheets',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
