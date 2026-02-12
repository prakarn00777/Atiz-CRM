// LINE Flex Message builder for Issue Detail — Theme #7053E1

const BRAND = '#7053E1';
const TEXT_DARK = '#2D2D2D';
const TEXT_SUB = '#888888';

const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
    Critical: { label: 'Critical', color: '#e74c3c' },
    High: { label: 'High', color: '#e67e22' },
    Medium: { label: 'Medium', color: '#f39c12' },
    Low: { label: 'Low', color: '#27ae60' },
};

const STATUS_MAP: Record<string, { color: string }> = {
    'แจ้งเคส': { color: '#e74c3c' },
    'กำลังดำเนินการ': { color: '#f39c12' },
    'เสร็จสิ้น': { color: '#27ae60' },
};

export interface IssueDetailData {
    caseNumber: string;
    title: string;
    customerName: string;
    branchName?: string;
    severity: string;
    status: string;
    assignedTo?: string;
    createdAt?: string;
    customerSubdomain?: string;
    crmBaseUrl: string;
    issueId: number;
}

export function buildIssueDetailFlex(data: IssueDetailData): object {
    const sev = SEVERITY_MAP[data.severity] || { label: data.severity, color: TEXT_SUB };
    const stat = STATUS_MAP[data.status] || { color: TEXT_SUB };

    const customerDisplay = data.branchName
        ? `${data.customerName} (${data.branchName})`
        : data.customerName;

    const body: object[] = [
        // Case number + status
        {
            type: 'box', layout: 'horizontal', margin: 'none',
            contents: [
                { type: 'text', text: data.caseNumber, size: 'sm', color: BRAND, weight: 'bold', flex: 0 },
                { type: 'text', text: data.status, size: 'xs', color: stat.color, weight: 'bold', align: 'end' },
            ],
        },
        // Title
        { type: 'text', text: data.title, size: 'xs', color: TEXT_DARK, weight: 'bold', margin: 'sm', wrap: true },
        // Separator
        { type: 'separator', color: '#f0f0f0', margin: 'md' },
        // Details
        row('ลูกค้า', customerDisplay),
        row('ระดับ', sev.label, sev.color),
    ];

    if (data.assignedTo) {
        body.push(row('ผู้รับผิดชอบ', data.assignedTo));
    }

    if (data.createdAt) {
        body.push(row('วันที่แจ้ง', data.createdAt));
    }

    // Buttons
    const actions: object[] = [];

    // Case detail link (CRM deep link)
    actions.push({
        type: 'button',
        action: {
            type: 'uri',
            label: 'ดูเคส',
            uri: `${data.crmBaseUrl}?tab=issues&issueId=${data.issueId}`,
        },
        style: 'primary',
        color: BRAND,
        height: 'sm',
    });

    // Customer system link
    if (data.customerSubdomain) {
        const url = data.customerSubdomain.startsWith('http')
            ? data.customerSubdomain
            : `https://${data.customerSubdomain}`;
        actions.push({
            type: 'button',
            action: {
                type: 'uri',
                label: 'เข้าระบบลูกค้า',
                uri: url,
            },
            style: 'secondary',
            height: 'sm',
        });
    }

    return {
        type: 'flex',
        altText: `🎫 ${data.caseNumber} — ${data.title}`,
        contents: {
            type: 'bubble',
            size: 'kilo',
            header: {
                type: 'box',
                layout: 'horizontal',
                contents: [
                    { type: 'text', text: '🎫 Issue Detail', weight: 'bold', size: 'sm', color: '#ffffff', flex: 0 },
                ],
                backgroundColor: BRAND,
                paddingAll: '14px',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: body,
                paddingAll: '14px',
                spacing: 'xs',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: actions,
                spacing: 'xs',
                paddingAll: '14px',
            },
        },
    };
}

function row(label: string, value: string, valueColor = TEXT_DARK): object {
    return {
        type: 'box',
        layout: 'horizontal',
        contents: [
            { type: 'text', text: label, size: 'xs', color: TEXT_SUB, flex: 2 },
            { type: 'text', text: value, size: 'xs', color: valueColor, weight: 'bold', flex: 3, wrap: true },
        ],
        margin: 'sm',
    };
}
