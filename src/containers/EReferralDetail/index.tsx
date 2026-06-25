import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Spin, Button, Space, Tabs, Timeline } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { ServiceRequest, Task, Provenance, Patient, Encounter, Condition } from 'fhir/r4b';

import { PageContainer } from '@beda.software/emr/components';
import { formatHumanDateTime } from '@beda.software/emr/utils';

import { getReferralTasks, getReferralProvenance, getFHIRResourceById } from '../../services/fhir';

export function EReferralDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [sr, setSr] = useState<ServiceRequest | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [provenances, setProvenances] = useState<Provenance[]>([]);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [encounter, setEncounter] = useState<Encounter | null>(null);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        Promise.all([
            getFHIRResourceById<ServiceRequest>('ServiceRequest', id),
            getReferralTasks(id),
            getReferralProvenance(id),
        ]).then(async ([serviceRequest, taskData, provData]) => {
            if (serviceRequest) {
                setSr(serviceRequest);
                setTasks(taskData);
                setProvenances(provData);

                const subjectRef = serviceRequest.subject?.reference;
                if (subjectRef) {
                    const patientId = subjectRef.replace('Patient/', '');
                    const p = await getFHIRResourceById<Patient>('Patient', patientId);
                    if (p) setPatient(p);
                }

                const encRef = serviceRequest.encounter?.reference;
                if (encRef) {
                    const encId = encRef.replace('Encounter/', '');
                    const e = await getFHIRResourceById<Encounter>('Encounter', encId);
                    if (e) setEncounter(e);
                }

                for (const ref of serviceRequest.reasonReference || []) {
                    const refStr = ref.reference || '';
                    if (refStr.startsWith('Condition/')) {
                        const c = await getFHIRResourceById<Condition>('Condition', refStr.replace('Condition/', ''));
                        if (c) setConditions(prev => [...prev, c]);
                    }
                }
            }
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <div style={{ padding: 48, textAlign: 'center' }}><Spin size="large" /></div>;
    }

    if (!sr) {
        return <PageContainer title="Referral Not Found" />;
    }

    const taskStatusColor: Record<string, string> = {
        requested: 'orange',
        received: 'blue',
        accepted: 'green',
        rejected: 'red',
        completed: 'green',
        cancelled: 'gray',
    };

    const patientName = patient?.name?.[0]
        ? `${patient.name[0].given?.join(' ') || ''} ${patient.name[0].family || ''}`.trim()
        : sr.subject?.display || sr.subject?.reference || 'Unknown';

    const currentTaskStatus = tasks[0]?.status || 'requested';

    return (
        <PageContainer
            title={`Referral: ${sr.requisition?.value || sr.id}`}
            headerContent={
                <Space>
                    <Button icon={<RollbackOutlined />} onClick={() => navigate('/referrals')}>Back</Button>
                    <Tag color={taskStatusColor[currentTaskStatus]}>{currentTaskStatus}</Tag>
                </Space>
            }
        >
            <Tabs
                defaultActiveKey="overview"
                items={[
                    {
                        key: 'overview',
                        label: 'Overview',
                        children: (
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Card title="Referral Details">
                                    <Descriptions column={2} bordered size="small">
                                        <Descriptions.Item label="Patient">
                                            <a onClick={() => navigate(`/patients/${patient?.id || sr.subject?.reference?.replace('Patient/', '')}`)}>{patientName}</a>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Category">
                                            {sr.category?.[0]?.text || sr.category?.[0]?.coding?.[0]?.display || '-'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Date Authored">
                                            {sr.authoredOn ? formatHumanDateTime(sr.authoredOn) : '-'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Status">
                                            <Tag>{sr.status}</Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Requester">
                                            {sr.requester?.display || sr.requester?.reference || '-'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Performer">
                                            {sr.performer?.map((p: any) => p.display || p.reference).join(', ') || '-'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Reason" span={2}>
                                            {sr.reasonCode?.[0]?.text || sr.code?.text || '-'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Clinical Note" span={2}>
                                            {sr.note?.map(n => n.text).join(' ') || '-'}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>

                                <Card title="Task Status Timeline">
                                    <Timeline
                                        items={tasks.length > 0 ? tasks.map(t => ({
                                            color: taskStatusColor[t.status] || 'gray',
                                            children: (
                                                <div>
                                                    <Tag color={taskStatusColor[t.status]}>{t.status}</Tag>
                                                    {t.lastModified ? formatHumanDateTime(t.lastModified) : t.authoredOn ? formatHumanDateTime(t.authoredOn) : ''}
                                                    {t.note?.[0]?.text && <div style={{ color: '#666' }}>{t.note[0].text}</div>}
                                                </div>
                                            ),
                                        })) : [
                                            { color: 'orange', children: <span>Referral requested <Tag color="orange">requested</Tag></span> },
                                        ]}
                                    />
                                </Card>

                                {patient && (
                                    <Card title="Patient Information">
                                        <Descriptions column={2} size="small">
                                            <Descriptions.Item label="Name">{patientName}</Descriptions.Item>
                                            <Descriptions.Item label="Gender">{patient.gender}</Descriptions.Item>
                                            <Descriptions.Item label="Birth Date">{patient.birthDate}</Descriptions.Item>
                                            <Descriptions.Item label="Contact">
                                                {patient.telecom?.map(t => `${t.system}: ${t.value}`).join(', ') || '-'}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Card>
                                )}

                                {encounter && (
                                    <Card title="Encounter">
                                        <Descriptions column={2} size="small">
                                            <Descriptions.Item label="Status">{encounter.status}</Descriptions.Item>
                                            <Descriptions.Item label="Class">{encounter.class?.display || encounter.class?.code}</Descriptions.Item>
                                            <Descriptions.Item label="Date">{encounter.period?.start?.slice(0, 10)}</Descriptions.Item>
                                        </Descriptions>
                                    </Card>
                                )}

                                {conditions.length > 0 && (
                                    <Card title="Diagnoses">
                                        {conditions.map(c => (
                                            <div key={c.id}>
                                                <Tag color="blue">{c.code?.coding?.[0]?.display || c.code?.text || c.id}</Tag>
                                                {c.note?.map(n => <div key={n.text} style={{ color: '#666', marginLeft: 8 }}>{n.text}</div>)}
                                            </div>
                                        ))}
                                    </Card>
                                )}

                                {provenances.length > 0 && (
                                    <Card title="Audit Trail (Provenance)">
                                        {provenances.map(p => (
                                            <div key={p.id}>
                                                <Tag>{p.recorded?.slice(0, 10)}</Tag>
                                                {p.agent?.map(a => (a.who?.display || a.who?.reference || '')).join(', ')}
                                            </div>
                                        ))}
                                    </Card>
                                )}
                            </Space>
                        ),
                    },
                    {
                        key: 'raw',
                        label: 'Raw FHIR',
                        children: (
                            <Card>
                                <pre style={{ maxHeight: 600, overflow: 'auto', fontSize: 12 }}>
                                    {JSON.stringify(sr, null, 2)}
                                </pre>
                            </Card>
                        ),
                    },
                ]}
            />
        </PageContainer>
    );
}
