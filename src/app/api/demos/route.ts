import { NextResponse } from 'next/server';
import { getMasterDemos } from '@/lib/google-sheets-master';

export async function GET() {
    try {
        const demos = await getMasterDemos();

        return NextResponse.json({ success: true, data: demos });
    } catch (error: any) {
        console.error('API Error fetching master demos:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch master demos',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
