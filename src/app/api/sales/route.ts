import { NextResponse } from 'next/server';
import { getNewSales } from '@/lib/google-sheets-sales';

export async function GET() {
    try {
        const sales = await getNewSales();

        return NextResponse.json({ success: true, data: sales });
    } catch (error: any) {
        console.error('API Error fetching new sales:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch new sales from Google Sheets',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
