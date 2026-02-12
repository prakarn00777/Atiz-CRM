// LINE Flex Message builder for Daily Report

export interface TicketsData {
    total: number;
    resolved: number;
    inProgress: number;
    reported: number;
}

export interface RenewalData {
    monthLabel: string;     // e.g. "ก.พ. 69"
    totalCount: number;
    drEaseCount: number;
    easePosCount: number;
    renewed: number;
    renewedDrEase: number;
    renewedEasePos: number;
    pending: number;
    pendingDrEase: number;
    pendingEasePos: number;
    notRenewed: number;
    notRenewedDrEase: number;
    notRenewedEasePos: number;
}

export interface FollowUpData {
    totalPending: number;
    byStaff: { name: string; count: number }[];
}

export interface DailyReportData {
    date: string;           // e.g. "12/02/2026"
    tickets: TicketsData;
    renewal: RenewalData | null;
    followUp: FollowUpData;
}

/** Build LINE Flex Message JSON for daily report */
export function buildDailyReportFlex(data: DailyReportData): object {
    const sections: object[] = [];

    // --- Header ---
    sections.push({
        type: 'box',
        layout: 'horizontal',
        contents: [
            {
                type: 'text',
                text: '📊 Daily Report',
                weight: 'bold',
                size: 'lg',
                color: '#1a1a2e',
                flex: 0,
            },
            {
                type: 'text',
                text: data.date,
                size: 'sm',
                color: '#888888',
                align: 'end',
            },
        ],
        paddingBottom: '12px',
    });

    // --- Separator ---
    sections.push({ type: 'separator', color: '#e0e0e0' });

    // --- Section 1: Tickets ---
    sections.push({
        type: 'box',
        layout: 'vertical',
        contents: [
            {
                type: 'text',
                text: '🎫 Tickets',
                weight: 'bold',
                size: 'md',
                color: '#1a1a2e',
            },
            {
                type: 'text',
                text: `รวม ${data.tickets.total} เคส`,
                size: 'sm',
                color: '#555555',
                margin: 'sm',
            },
            ...buildTicketRows(data.tickets),
        ],
        paddingTop: '12px',
        paddingBottom: '12px',
    });

    // --- Separator ---
    sections.push({ type: 'separator', color: '#e0e0e0' });

    // --- Section 2: Renewal ---
    if (data.renewal) {
        sections.push({
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: `🔄 Renewal ${data.renewal.monthLabel}`,
                    weight: 'bold',
                    size: 'md',
                    color: '#1a1a2e',
                },
                {
                    type: 'text',
                    text: `(${data.renewal.totalCount} ราย | ${data.renewal.drEaseCount}/${data.renewal.easePosCount})`,
                    size: 'xs',
                    color: '#888888',
                    margin: 'sm',
                },
                buildRenewalRow('✅', 'ต่อแล้ว', data.renewal.renewed, data.renewal.renewedDrEase, data.renewal.renewedEasePos, '#27ae60'),
                buildRenewalRow('⏳', 'รอ', data.renewal.pending, data.renewal.pendingDrEase, data.renewal.pendingEasePos, '#f39c12'),
                buildRenewalRow('❌', 'ไม่ต่อ', data.renewal.notRenewed, data.renewal.notRenewedDrEase, data.renewal.notRenewedEasePos, '#e74c3c'),
            ],
            paddingTop: '12px',
            paddingBottom: '12px',
        });

        sections.push({ type: 'separator', color: '#e0e0e0' });
    }

    // --- Section 3: Follow-up ---
    sections.push({
        type: 'box',
        layout: 'vertical',
        contents: [
            {
                type: 'text',
                text: '📞 Follow-up',
                weight: 'bold',
                size: 'md',
                color: '#1a1a2e',
            },
            {
                type: 'text',
                text: `ต้องติดตาม/โทร ${data.followUp.totalPending} ราย`,
                size: 'sm',
                color: '#555555',
                margin: 'sm',
            },
            ...data.followUp.byStaff.map(staff => ({
                type: 'box' as const,
                layout: 'horizontal' as const,
                contents: [
                    {
                        type: 'text' as const,
                        text: `• ${staff.name}`,
                        size: 'sm' as const,
                        color: '#555555',
                        flex: 3,
                    },
                    {
                        type: 'text' as const,
                        text: `${staff.count} ราย`,
                        size: 'sm' as const,
                        color: staff.count > 0 ? '#1a1a2e' : '#aaaaaa',
                        align: 'end' as const,
                        weight: staff.count > 0 ? 'bold' as const : 'regular' as const,
                        flex: 1,
                    },
                ],
                margin: 'sm' as const,
            })),
        ],
        paddingTop: '12px',
    });

    return {
        type: 'flex',
        altText: `📊 Daily Report ${data.date}`,
        contents: {
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: 'Atiz CRM',
                        color: '#ffffff',
                        size: 'xs',
                    },
                ],
                backgroundColor: '#1a1a2e',
                paddingAll: '12px',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: sections,
                paddingAll: '16px',
                backgroundColor: '#ffffff',
            },
        },
    };
}

function buildTicketRows(tickets: TicketsData): object[] {
    const rows: { label: string; count: number; color: string }[] = [];

    if (tickets.resolved > 0) {
        rows.push({ label: '✅ แก้ไขแล้ว', count: tickets.resolved, color: '#27ae60' });
    }
    if (tickets.inProgress > 0) {
        rows.push({ label: '🔧 กำลังดำเนินการ', count: tickets.inProgress, color: '#f39c12' });
    }
    if (tickets.reported > 0) {
        rows.push({ label: '🆕 แจ้งเคสใหม่', count: tickets.reported, color: '#e74c3c' });
    }

    return rows.map(r => ({
        type: 'box',
        layout: 'horizontal',
        contents: [
            { type: 'text', text: r.label, size: 'sm', color: '#555555', flex: 3 },
            { type: 'text', text: `${r.count} เคส`, size: 'sm', color: r.color, align: 'end', weight: 'bold', flex: 1 },
        ],
        margin: 'sm',
    }));
}

function buildRenewalRow(icon: string, label: string, total: number, drEase: number, easePos: number, color: string): object {
    return {
        type: 'box',
        layout: 'horizontal',
        contents: [
            {
                type: 'text',
                text: `${icon} ${label} ${total}`,
                size: 'sm',
                color,
                weight: 'bold',
                flex: 2,
            },
            {
                type: 'text',
                text: `(${drEase}/${easePos})`,
                size: 'xs',
                color: '#888888',
                align: 'end',
                flex: 1,
            },
        ],
        margin: 'sm',
    };
}
