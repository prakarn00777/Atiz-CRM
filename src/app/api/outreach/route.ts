import { NextResponse } from 'next/server';
import { getOutreach } from '@/lib/google-sheets-outreach';

export async function GET() {
    try {
        const outreach = await getOutreach();

        return NextResponse.json({ success: true, data: outreach });
    } catch (error: any) {
        console.error('API Error fetching outreach:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch outreach from Google Sheets',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
