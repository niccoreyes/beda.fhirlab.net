import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, Tag, Table } from 'antd';
import { RollbackOutlined, PlusOutlined } from '@ant-design/icons';
import { Encounter, Condition, Observation } from 'fhir/r4b';

import { PageContainer } from '@beda.software/emr/components';
import { formatHumanDateTime } from '@beda.software/emr/utils';

import { getFHIRResourceById, getEncounterClinicalData } from '../../services/fhir';

export function EncounterDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [encounter, setEncounter] = useState<Encounter | null>(null);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [observations, setObservations] = useState<Observation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            getFHIRResourceById<Encounter>('Encounter', id),
            getEncounterClinicalData(id),
        ]).then(([enc, clinical]) => {
            setEncounter(enc);
            if (clinical) {
                setConditions(clinical.conditions);
                setObservations(clinical.observations);
            }
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={{ padding: 48, textAlign: 'center' }}><Spin size="large" /></div>;
    if (!encounter) return <PageContainer title="Encounter Not Found" />;

    const patientId = encounter.subject?.reference?.replace('Patient/', '');
    const patientName = encounter.subject?.display || patientId || 'Unknown';

    return (
        <PageContainer
            title={`Encounter: ${encounter.class?.display || encounter.class?.code || ''}`}
            headerContent={
                <Space>
                    <Button icon={<RollbackOutlined />} onClick={() => navigate('/encounters')}>Back</Button>
                    {patientId && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/referrals/new/${patientId}?encounter=${id}`)}>
                            Refer from this visit
                        </Button>
                    )}
                </Space>
            }
        >
            <Card title="Encounter Details" style={{ marginBottom: 16 }}>
                <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Status"><Tag>{encounter.status}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Class">{encounter.class?.display || encounter.class?.code || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Patient">
                        <a onClick={() => navigate(`/patients/${patientId}`)}>{patientName}</a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Date">
                        {encounter.period?.start ? formatHumanDateTime(encounter.period.start) : '-'}
                    </Descriptions.Item>
                    {encounter.period?.end && (
                        <Descriptions.Item label="End Date">{formatHumanDateTime(encounter.period.end)}</Descriptions.Item>
                    )}
                    <Descriptions.Item label="Service Provider">
                        {encounter.serviceProvider?.display || encounter.serviceProvider?.reference || '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {conditions.length > 0 && (
                <Card title="Diagnoses (from this encounter)" style={{ marginBottom: 16 }}>
                    {conditions.map(c => (
                        <div key={c.id}>
                            <Tag color="blue">{c.code?.coding?.[0]?.display || c.code?.text || c.id}</Tag>
                            {c.note?.map(n => <span key={n.text} style={{ marginLeft: 8, color: '#666' }}>{n.text}</span>)}
                        </div>
                    ))}
                </Card>
            )}

            {observations.length > 0 && (
                <Card title="Vital Signs & Observations (from this encounter)">
                    <div style={{ overflowX: 'auto' }}>
                        <Table
                            dataSource={observations}
                        columns={[
                            { title: 'Code', key: 'code', render: (_: any, r: Observation) => r.code?.coding?.[0]?.display || r.code?.text || '-' },
                            { title: 'Value', key: 'value', render: (_: any, r: Observation) => {
                                if (r.valueQuantity) return `${r.valueQuantity.value} ${r.valueQuantity.unit || ''}`;
                                if (r.component) return r.component.map(c => `${c.code?.coding?.[0]?.display}: ${c.valueQuantity?.value}${c.valueQuantity?.unit}`).join(', ');
                                return r.valueCodeableConcept?.text || '-';
                            }},
                        ]}
                        rowKey="id"
                        pagination={false}
                        size="small"
                    />
                    </div>
                </Card>
            )}
        </PageContainer>
    );
}
