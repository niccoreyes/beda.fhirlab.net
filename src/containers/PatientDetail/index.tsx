import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Descriptions, Button, Space, Spin, Tag } from 'antd';
import { RollbackOutlined, PlusOutlined } from '@ant-design/icons';
import { Patient, Encounter, ServiceRequest } from 'fhir/r4b';

import { PageContainer } from '@beda.software/emr/components';
import { renderHumanName, formatHumanDate, formatHumanDateTime } from '@beda.software/emr/utils';

import { getPatient, getPatientEncounters, getPatientReferrals } from '../../services/fhir';

export function PatientDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [referrals, setReferrals] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            getPatient(id),
            getPatientEncounters(id),
            getPatientReferrals(id),
        ]).then(([p, enc, srs]) => {
            setPatient(p);
            setEncounters(enc);
            setReferrals(srs);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <div style={{ padding: 48, textAlign: 'center' }}><Spin size="large" /></div>;
    }

    if (!patient) {
        return <PageContainer title="Patient Not Found" />;
    }

    const nameStr = patient.name?.[0] ? renderHumanName(patient.name[0]) : 'Unknown';
    const gender = patient.gender ?? 'Unknown';
    const birthDate = patient.birthDate ? formatHumanDate(patient.birthDate) : 'Unknown';

    const encounterColumns = [
        { title: 'Date', dataIndex: 'period', key: 'date', render: (p: any) => p?.start ? formatHumanDateTime(p.start) : '-' },
        { title: 'Type', dataIndex: 'class', key: 'class', render: (c: any) => c?.display ?? c?.code ?? '-' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag>{s}</Tag> },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Encounter) => (
                <Button type="link" onClick={() => navigate(`/referrals/new/${id}?encounter=${record.id}`)}>
                    Refer from this visit
                </Button>
            ),
        },
    ];

    const referralColumns = [
        { title: 'Date', dataIndex: 'authoredOn', key: 'date', render: (d: string) => d ? formatHumanDateTime(d) : '-' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag>{s}</Tag> },
        {
            title: 'Reason',
            key: 'reason',
            render: (_: any, r: ServiceRequest) => r.reasonCode?.[0]?.text ?? r.code?.text ?? '-',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: ServiceRequest) => (
                <Button type="link" onClick={() => navigate(`/referrals/${record.id}`)}>
                    View
                </Button>
            ),
        },
    ];

    return (
        <PageContainer
            title={nameStr}
            headerContent={
                <Space>
                    <Button icon={<RollbackOutlined />} onClick={() => navigate('/patients')}>Back</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/referrals/new/${id}`)}>
                        New Referral
                    </Button>
                </Space>
            }
        >
            <Card title="Patient Information" style={{ marginBottom: 16 }}>
                <Descriptions column={2}>
                    <Descriptions.Item label="Name">{nameStr}</Descriptions.Item>
                    <Descriptions.Item label="Gender">{gender}</Descriptions.Item>
                    <Descriptions.Item label="Birth Date">{birthDate}</Descriptions.Item>
                    <Descriptions.Item label="Contact">
                        {patient.telecom?.map(t => `${t.system}: ${t.value}`).join(', ') || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                        {patient.address?.map(a => [a.line?.join(', '), a.city, a.state, a.country].filter(Boolean).join(', ')).join('; ') || '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="Available Encounters" style={{ marginBottom: 16 }}>
                <Table
                    dataSource={encounters}
                    columns={encounterColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                />
            </Card>

            <Card title="Referral History">
                <Table
                    dataSource={referrals}
                    columns={referralColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                />
            </Card>
        </PageContainer>
    );
}
