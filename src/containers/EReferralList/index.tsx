import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Spin, Button, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

import { PageContainer } from '@beda.software/emr/components';
import { formatHumanDateTime } from '@beda.software/emr/utils';
import { service } from '@beda.software/emr/services';
import { isSuccess } from '@beda.software/remote-data';
import { ServiceRequest } from 'fhir/r4b';

interface ReferralRow {
    key: string;
    serviceRequestId: string;
    patientId: string;
    patientName: string;
    requisition: string;
    authoredOn: string;
    status: string;
    category: string;
    reason: string;
    requester: string;
    performer: string;
    taskStatus: string;
    taskId: string;
}

const taskColors: Record<string, string> = {
    requested: 'orange', received: 'blue', accepted: 'green',
    rejected: 'red', completed: 'green', cancelled: 'gray',
};

async function fetchReferralsWithTasks(): Promise<{ sr: ServiceRequest; tasks: any[] }[]> {
    const result: { sr: ServiceRequest; tasks: any[] }[] = [];
    let nextUrl: string | undefined =
        'ServiceRequest?_sort=-authored&_total=accurate&_count=100&_revinclude=Task:focus&_include=ServiceRequest:patient';

    while (nextUrl) {
        const response: any = await service({ url: nextUrl, method: 'GET' });
        if (isSuccess(response)) {
            const bundle: any = response.data;
            const entries: any[] = bundle.entry ?? [];

            // Build SR->Tasks map from bundle entries
            const taskMap: Record<string, any[]> = {};
            const patientMap: Record<string, string> = {};
            const serviceRequests: ServiceRequest[] = [];

            for (const entry of entries) {
                const res = entry.resource;
                if (!res) continue;
                if (res.resourceType === 'ServiceRequest') {
                    serviceRequests.push(res as ServiceRequest);
                } else if (res.resourceType === 'Task') {
                    const focusRef = res.focus?.reference?.replace('ServiceRequest/', '');
                    if (focusRef) {
                        if (!taskMap[focusRef]) taskMap[focusRef] = [];
                        taskMap[focusRef].push(res);
                    }
                } else if (res.resourceType === 'Patient') {
                    patientMap[res.id as string] =
                        res.name?.[0] ? `${(res.name[0].given || []).join(' ')} ${res.name[0].family || ''}`.trim() : res.id;
                }
            }

            for (const sr of serviceRequests) {
                result.push({
                    sr,
                    tasks: taskMap[sr.id!] || [],
                });
                // Patch patient name from included Patient resources
                const patientId = sr.subject?.reference?.replace('Patient/', '');
                if (patientId && patientMap[patientId] && !sr.subject?.display) {
                    (sr.subject as any).display = patientMap[patientId];
                }
            }

            const nextLink = bundle.link?.find((l: any) => l.relation === 'next');
            nextUrl = nextLink?.url;
        } else {
            break;
        }
    }
    return result;
}

export function EReferralList() {
    const navigate = useNavigate();
    const [referrals, setReferrals] = useState<ReferralRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [requesterFilter, setRequesterFilter] = useState('');
    const [performerFilter, setPerformerFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        setLoading(true);
        fetchReferralsWithTasks().then(items => {
            const rows: ReferralRow[] = items.map(({ sr, tasks }) => {
                const patientRef = sr.subject?.reference?.replace('Patient/', '') || '';
                const taskStatus = tasks[0]?.status || 'no task';
                return {
                    key: sr.id!,
                    serviceRequestId: sr.id!,
                    patientId: patientRef,
                    patientName: sr.subject?.display || patientRef || 'Unknown',
                    requisition: sr.requisition?.value || '-',
                    authoredOn: sr.authoredOn || '',
                    status: sr.status || '',
                    category: sr.category?.[0]?.text || sr.category?.[0]?.coding?.[0]?.display || '-',
                    reason: sr.reasonCode?.[0]?.text || sr.code?.text || '-',
                    requester: sr.requester?.display || sr.requester?.reference || '',
                    performer: sr.performer?.map((p: any) => p.display || p.reference).join(', ') || '',
                    taskStatus,
                    taskId: tasks[0]?.id || '',
                };
            });
            setReferrals(rows);
        }).finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        let result = referrals;
        if (statusFilter !== 'all') {
            result = result.filter(r => r.taskStatus === statusFilter);
        }
        if (requesterFilter) {
            const q = requesterFilter.toLowerCase();
            result = result.filter(r => r.requester.toLowerCase().includes(q));
        }
        if (performerFilter) {
            const q = performerFilter.toLowerCase();
            result = result.filter(r => r.performer.toLowerCase().includes(q));
        }
        return result;
    }, [referrals, statusFilter, requesterFilter, performerFilter]);

    const columns = [
        {
            title: 'Requisition', dataIndex: 'requisition', key: 'requisition', width: 170,
            render: (r: string) => r?.slice(-20) || '-',
        },
        {
            title: 'Patient', dataIndex: 'patientName', key: 'patient', width: 220,
            render: (name: string, r: ReferralRow) => (
                <a onClick={() => navigate(`/patients/${r.patientId}`)}>{name}</a>
            ),
        },
        { title: 'Date', dataIndex: 'authoredOn', key: 'date', width: 170, render: (d: string) => d ? formatHumanDateTime(d) : '-' },
        { title: 'Category', dataIndex: 'category', key: 'category', width: 110 },
        { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true },
        {
            title: 'Requester', dataIndex: 'requester', key: 'requester', width: 230,
            ellipsis: true,
            filterDropdown: () => null,
        },
        {
            title: 'Performer', dataIndex: 'performer', key: 'performer', width: 230,
            ellipsis: true,
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 100,
            render: (s: string) => <Tag color={s === 'active' ? 'blue' : 'default'}>{s}</Tag>,
        },
        {
            title: 'Task', dataIndex: 'taskStatus', key: 'taskStatus', width: 110,
            render: (s: string) => <Tag color={taskColors[s] || 'default'}>{s}</Tag>,
        },
        {
            title: '', key: 'action', width: 70,
            render: (_: any, r: ReferralRow) => (
                <Button type="link" onClick={() => navigate(`/referrals/${r.serviceRequestId}`)}>View</Button>
            ),
        },
    ];

    const countByStatus = (s: string) => s === 'all' ? referrals.length : referrals.filter(r => r.taskStatus === s).length;

    return (
        <PageContainer title="Referrals"
            headerContent={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/patients')}>New Referral</Button>
            }
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
            ) : (
                <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Input
                        placeholder="Filter by requester..."
                        prefix={<SearchOutlined />}
                        value={requesterFilter}
                        onChange={e => setRequesterFilter(e.target.value)}
                        style={{ width: 250 }}
                        allowClear
                    />
                    <Input
                        placeholder="Filter by performer..."
                        prefix={<SearchOutlined />}
                        value={performerFilter}
                        onChange={e => setPerformerFilter(e.target.value)}
                        style={{ width: 250 }}
                        allowClear
                    />

                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        {[
                            { key: 'all', label: `All (${referrals.length})` },
                            { key: 'requested', label: 'Requested' },
                            { key: 'received', label: 'Received' },
                            { key: 'accepted', label: 'Accepted' },
                            { key: 'rejected', label: 'Rejected' },
                            { key: 'completed', label: 'Completed' },
                        ].map(tab => (
                            <Tag
                                key={tab.key}
                                color={statusFilter === tab.key ? 'blue' : 'default'}
                                style={{ cursor: 'pointer', padding: '2px 8px' }}
                                onClick={() => setStatusFilter(tab.key)}
                            >
                                {tab.label}
                                {tab.key !== 'all' && ` (${countByStatus(tab.key)})`}
                            </Tag>
                        ))}
                    </div>
                </div>
            )}
            <Table
                dataSource={filtered}
                columns={columns}
                rowKey="key"
                loading={loading}
                pagination={{ pageSize: 50, showTotal: (t: number) => `${t} referrals` }}
                scroll={{ x: 'max-content' }}
                size="middle"
            />
        </PageContainer>
    );
}
