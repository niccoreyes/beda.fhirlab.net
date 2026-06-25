import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Form, Select, DatePicker, Button, Card, Space, message,
} from 'antd';
import { RollbackOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { PageContainer } from '@beda.software/emr/components';
import { createFHIRResource } from '@beda.software/emr/services';
import { isSuccess } from '@beda.software/remote-data';
import { Encounter } from 'fhir/r4b';

import { searchPatients, searchOrganizations } from '../../services/fhir';

const STATUS_OPTIONS = [
    { label: 'Planned', value: 'planned' },
    { label: 'Triaged', value: 'triaged' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Finished', value: 'finished' },
    { label: 'Cancelled', value: 'cancelled' },
];

const CLASS_OPTIONS = [
    { label: 'Ambulatory', value: 'AMB' },
    { label: 'Emergency', value: 'EMER' },
    { label: 'Inpatient', value: 'IMP' },
    { label: 'Outpatient', value: 'OBSENC' },
    { label: 'Virtual', value: 'VRTL' },
];

export function EncounterNew() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [patientOptions, setPatientOptions] = useState<any[]>([]);
    const [orgOptions, setOrgOptions] = useState<any[]>([]);

    const searchPatient = useCallback(async (query: string) => {
        if (!query || query.length < 2) return;
        const patients = await searchPatients(query);
        setPatientOptions(patients.map(p => ({
            label: `${p.name?.[0]?.given?.join(' ') || ''} ${p.name?.[0]?.family || ''}`.trim() || p.id,
            value: p.id!,
        })));
    }, []);

    const searchOrg = useCallback(async (query: string) => {
        if (!query || query.length < 2) return;
        const orgs = await searchOrganizations(query);
        setOrgOptions(orgs.map(o => ({
            label: `${o.name} (${o.id})`,
            value: o.id!,
        })));
    }, []);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const encounter: Encounter = {
                resourceType: 'Encounter',
                status: values.status,
                class: {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    code: values.classCode,
                    display: CLASS_OPTIONS.find(c => c.value === values.classCode)?.label || values.classCode,
                },
                subject: {
                    reference: `Patient/${values.patientId}`,
                    display: patientOptions.find(p => p.value === values.patientId)?.label,
                },
                period: {
                    start: values.date ? dayjs(values.date).toISOString() : new Date().toISOString(),
                },
            };

            if (values.orgId) {
                encounter.serviceProvider = {
                    reference: `Organization/${values.orgId}`,
                    display: orgOptions.find(o => o.value === values.orgId)?.label,
                };
            }

            const result = await createFHIRResource(encounter);
            if (isSuccess(result)) {
                message.success('Encounter created successfully!');
                navigate(`/encounters/${result.data.id}`);
            } else {
                message.error('Failed to create encounter');
            }
        } catch (err) {
            console.error('Validation error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContainer
            title="New Encounter"
            headerContent={
                <Button icon={<RollbackOutlined />} onClick={() => navigate('/encounters')}>Back</Button>
            }
        >
            <Card style={{ maxWidth: 600 }}>
                <Form form={form} layout="vertical">
                    <Form.Item name="patientId" label="Patient" rules={[{ required: true, message: 'Select a patient' }]}>
                        <Select
                            showSearch
                            placeholder="Search patient by name (min 2 chars)"
                            onSearch={searchPatient}
                            filterOption={false}
                            options={patientOptions}
                            notFoundContent={null}
                        />
                    </Form.Item>

                    <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="in-progress">
                        <Select options={STATUS_OPTIONS} />
                    </Form.Item>

                    <Form.Item name="classCode" label="Class" rules={[{ required: true }]} initialValue="AMB">
                        <Select options={CLASS_OPTIONS} />
                    </Form.Item>

                    <Form.Item name="date" label="Date & Time" rules={[{ required: true }]} initialValue={dayjs()}>
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="orgId" label="Service Provider (Organization)">
                        <Select
                            showSearch
                            placeholder="Search organization (optional)"
                            onSearch={searchOrg}
                            filterOption={false}
                            options={orgOptions}
                            allowClear
                            notFoundContent={null}
                        />
                    </Form.Item>

                    <Space>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={submitting}>
                            Create Encounter
                        </Button>
                        <Button onClick={() => navigate('/encounters')}>Cancel</Button>
                    </Space>
                </Form>
            </Card>
        </PageContainer>
    );
}
