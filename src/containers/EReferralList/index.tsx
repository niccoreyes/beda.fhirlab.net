import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tabs, Tag, Spin, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { PageContainer } from '@beda.software/emr/components';
import { formatHumanDateTime } from '@beda.software/emr/utils';

import { getPatientReferrals, getReferralTasks, searchPatients } from '../../services/fhir';

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

export function EReferralList() {
    const navigate = useNavigate();
    const [referrals, setReferrals] = useState<ReferralRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        setLoading(true);
        searchPatients('').then(async patients => {
            const allReferrals: ReferralRow[] = [];
            for (const p of patients.slice(0, 30)) {
                const srs = await getPatientReferrals(p.id!);
                for (const sr of srs) {
                    const tasks = await getReferralTasks(sr.id!);
                    const name = p.name?.[0];
                    allReferrals.push({
                        key: sr.id!,
                        serviceRequestId: sr.id!,
                        patientId: p.id!,
                        patientName: name ? `${name.given?.join(' ') || ''} ${name.family || ''}`.trim() : 'Unknown',
                        requisition: sr.requisition?.value || '-',
                        authoredOn: sr.authoredOn || '',
                        status: sr.status || '',
                        category: sr.category?.[0]?.text || sr.category?.[0]?.coding?.[0]?.display || '-',
                        reason: sr.reasonCode?.[0]?.text || sr.code?.text || '-',
                        requester: sr.requester?.display || sr.requester?.reference || '',
                        performer: sr.performer?.map((p: any) => p.display || p.reference).join(', ') || '',
                        taskStatus: tasks[0]?.status || 'no task',
                        taskId: tasks[0]?.id || '',
                    });
                }
            }
            setReferrals(allReferrals);
        }).finally(() => setLoading(false));
    }, []);

    const taskColors: Record<string, string> = {
        requested: 'orange', received: 'blue', accepted: 'green',
        rejected: 'red', completed: 'green', cancelled: 'gray',
    };

    const columns = [
        {
            title: 'Requisition',
            dataIndex: 'requisition',
            key: 'requisition',
            width: 160,
            render: (r: string) => r?.slice(-20) || '-',
        },
        {
            title: 'Patient',
            dataIndex: 'patientName',
            key: 'patient',
            width: 200,
            render: (name: string, record: ReferralRow) => (
                <a onClick={() => navigate(`/patients/${record.patientId}`)}>{name}</a>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'authoredOn',
            key: 'date',
            width: 160,
            render: (d: string) => (d ? formatHumanDateTime(d) : '-'),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 100,
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            ellipsis: true,
        },
        {
            title: 'Requester',
            dataIndex: 'requester',
            key: 'requester',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (s: string) => <Tag color={s === 'active' ? 'blue' : 'default'}>{s}</Tag>,
        },
        {
            title: 'Task',
            dataIndex: 'taskStatus',
            key: 'taskStatus',
            width: 110,
            render: (s: string) => <Tag color={taskColors[s] || 'default'}>{s}</Tag>,
        },
        {
            title: 'Action',
            key: 'action',
            width: 70,
            render: (_: any, record: ReferralRow) => (
                <Button type="link" onClick={() => navigate(`/referrals/${record.serviceRequestId}`)}>
                    View
                </Button>
            ),
        },
    ];

    const filteredReferrals = activeTab === 'all'
        ? referrals
        : referrals.filter(r => r.taskStatus === activeTab);

    return (
        <PageContainer
            title="Referrals"
            headerContent={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/patients')}>
                    New Referral
                </Button>
            }
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
            ) : (
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    { key: 'all', label: 'All Referrals' },
                    { key: 'requested', label: 'Requested' },
                    { key: 'received', label: 'Received' },
                    { key: 'accepted', label: 'Accepted' },
                    { key: 'rejected', label: 'Rejected' },
                    { key: 'completed', label: 'Completed' },
                ]} />
            )}
            <Table
                dataSource={filteredReferrals}
                columns={columns}
                rowKey="key"
                loading={loading}
                pagination={{ pageSize: 20 }}
                size="middle"
            />
        </PageContainer>
    );
}
