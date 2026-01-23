import { NextResponse } from 'next/server';
import { getMasterDemos } from '@/lib/google-sheets-master';

export async function GET() {
    try {
        const demos = await getMasterDemos();

        // You can add additional filtering here if needed, 
        // e.g., only return rows where demoStatus is not empty
        const validDemos = demos.filter(d => d.date && d.leadNumber);

        return NextResponse.json({ success: true, data: validDemos });
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
