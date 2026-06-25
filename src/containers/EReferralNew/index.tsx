import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Form, Input, Select, DatePicker, InputNumber, Button, Card, Space, Typography,
    Steps, message, Divider, Descriptions, Radio,
} from 'antd';
import dayjs from 'dayjs';
import { RollbackOutlined, SendOutlined, BugOutlined } from '@ant-design/icons';
import { Organization } from 'fhir/r4b';

import { PageContainer } from '@beda.software/emr/components';

import {
    getPatient, getPatientEncounters, getEncounterClinicalData,
    searchOrganizations, getFHIRResourceById,
} from '../../services/fhir';
import { buildReferralBundle } from './bundleBuilder';
import { postTransactionBundle } from '../../services/fhir';
import { ReferralFormData } from '../types';

function getNHFR(org: Organization): string {
    return org.identifier?.find((i: any) => i.system?.includes('doh-nhfr-code'))?.value || '?';
}

export function EReferralNew() {
    const { patientId } = useParams<{ patientId: string }>();
    const [searchParams] = useSearchParams();
    const preselectedEncounter = searchParams.get('encounter');
    const navigate = useNavigate();

    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [encounters, setEncounters] = useState<any[]>([]);
    const [selectedEncounterData, setSelectedEncounterData] = useState<any>(null);
    const [facilityOptions, setFacilityOptions] = useState<Organization[]>([]);

    useEffect(() => {
        if (!patientId) return;
        getPatient(patientId).then(p => {
            if (p) {
                const name = p.name?.[0];
                form.setFieldsValue({ patientName: name ? `${name.given?.join(' ') || ''} ${name.family || ''}`.trim() : 'Unknown' });
            }
        });
        getPatientEncounters(patientId).then(setEncounters);
    }, [patientId, form]);

    useEffect(() => {
        if (preselectedEncounter) {
            form.setFieldsValue({ encounterId: preselectedEncounter });
            getEncounterClinicalData(preselectedEncounter).then(data => {
                setSelectedEncounterData(data);
                const conditions = data.conditions.map((c: any) => c.code?.text || c.code?.coding?.[0]?.display || '').filter(Boolean);
                if (conditions.length > 0) form.setFieldsValue({ chiefComplaint: conditions[0] });
                if (data.observations.length > 0) {
                    const obsMap: Record<string, number> = {};
                    for (const obs of data.observations) {
                        const code = obs.code?.coding?.[0]?.display || '';
                        if (code.includes('Systolic') || code.includes('Blood pressure') || obs.code?.coding?.[0]?.code === '85354-9') {
                            const comp = obs.component;
                            if (comp) {
                                for (const c of comp) {
                                    const cc = c.code?.coding?.[0]?.display || '';
                                    if (cc.includes('Systolic')) obsMap.bpSystolic = c.valueQuantity?.value || 0;
                                    if (cc.includes('Diastolic')) obsMap.bpDiastolic = c.valueQuantity?.value || 0;
                                }
                            }
                        }
                        if (code.includes('Heart rate') || obs.code?.coding?.[0]?.code === '8867-4') obsMap.heartRate = obs.valueQuantity?.value || 0;
                        if (code.includes('Respiratory') || obs.code?.coding?.[0]?.code === '9279-1') obsMap.respiratoryRate = obs.valueQuantity?.value || 0;
                        if (code.includes('Oxygen') || obs.code?.coding?.[0]?.code === '59408-5') obsMap.oxygenSaturation = obs.valueQuantity?.value || 0;
                        if (code.includes('Temperature') || obs.code?.coding?.[0]?.code === '8310-5') obsMap.temperature = obs.valueQuantity?.value || 0;
                        if (code.includes('Weight') || obs.code?.coding?.[0]?.code === '29463-7') obsMap.weight = obs.valueQuantity?.value || 0;
                    }
                    form.setFieldsValue(obsMap);
                }
            });
        }
    }, [preselectedEncounter, form]);

    const searchFacility = useCallback(async (query: string) => {
        if (query.length < 2) return;
        const orgs = await searchOrganizations(query);
        setFacilityOptions(orgs);
    }, []);

    const handleSubmit = async () => {
        try {
            await form.validateFields();
            setSubmitting(true);
            const values = form.getFieldsValue();

            const existingPatient = await getFHIRResourceById<any>('Patient', patientId!);

            const formData: ReferralFormData = {
                patientId: patientId!,
                sendingPractitionerName: values.sendingPractitionerName || '',
                sendingPractitionerPRCId: values.sendingPractitionerPRCId || '0000000',
                sendingPractitionerRole: values.sendingPractitionerRole || 'Medical practitioner',
                sendingFacilityId: values.sendingFacilityId || '',
                sendingFacilityName: values.sendingFacilityName || '',
                sendingFacilityNHFR: values.sendingFacilityNHFR || '',
                sendingFacilityHCPN: values.sendingFacilityHCPN || '',
                receivingPractitionerName: values.receivingPractitionerName || '',
                receivingPractitionerPRCId: values.receivingPractitionerPRCId || '',
                receivingPractitionerRole: values.receivingPractitionerRole || '',
                receivingFacilityId: values.receivingFacilityId || '',
                receivingFacilityName: values.receivingFacilityName || '',
                receivingFacilityNHFR: values.receivingFacilityNHFR || '',
                receivingFacilityHCPN: values.receivingFacilityHCPN || '',
                referralDate: values.referralDate ? dayjs(values.referralDate).toISOString() : new Date().toISOString(),
                referralCategory: values.referralCategory || 'emergency',
                reasonForReferralCode: values.reasonForReferralCode || '',
                reasonForReferralDisplay: values.reasonForReferralDisplay || 'Procedure',
                reasonForReferralText: values.reasonForReferralText || '',
                encounterId: values.encounterId || '',
                encounterDate: values.encounterDate ? dayjs(values.encounterDate).toISOString() : new Date().toISOString(),
                chiefComplaint: values.chiefComplaint || '',
                chiefComplaintCode: values.chiefComplaintCode || '',
                workingImpression: values.workingImpression || '',
                workingImpressionCode: values.workingImpressionCode || '',
                clinicalHistory: values.clinicalHistory || '',
                bloodPressureSystolic: values.bpSystolic || 0,
                bloodPressureDiastolic: values.bpDiastolic || 0,
                heartRate: values.heartRate || 0,
                respiratoryRate: values.respiratoryRate || 0,
                oxygenSaturation: values.oxygenSaturation || 0,
                temperature: values.temperature || 0,
                weight: values.weight || 0,
                treatmentGiven: values.treatmentGiven || '',
                labResults: values.labResults || '',
                labResultsAttachment: values.labResultsAttachment || '',
                clinicalNote: values.clinicalNote || '',
                requisitionId: values.requisitionId || '',
            };

            const bundle = buildReferralBundle(formData, existingPatient);
            const success = await postTransactionBundle(bundle);

            if (success) {
                message.success('Referral submitted successfully!');
                navigate('/referrals');
            } else {
                message.error('Failed to submit referral. Check console for details.');
            }
        } catch (err: any) {
            if (err?.errorFields) {
                message.error('Please fill in all required fields.');
            } else {
                message.error('Error: ' + (err.message || 'Unknown error'));
                console.error('Submit error:', err);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const steps = [
        { title: 'Patient & Encounter' },
        { title: 'Sending Facility' },
        { title: 'Receiving Facility' },
        { title: 'Clinical Details' },
        { title: 'Review & Submit' },
    ];

    return (
        <PageContainer
            title="New eReferral"
            headerContent={
                <Space>
                    <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>Back</Button>
                    {/* TEMPORARY: Auto-fill test data for quick testing */}
                    <Button icon={<BugOutlined />} onClick={() => {
                        form.setFieldsValue({
                            sendingPractitionerName: 'Maria Villanueva',
                            sendingPractitionerPRCId: '5466863',
                            sendingPractitionerRole: 'Medical practitioner',
                            sendingFacilityName: 'Kalibo Health Center',
                            sendingFacilityNHFR: '3056',
                            sendingFacilityHCPN: 'Aklan HCPN',
                            receivingPractitionerName: 'Carlos Lim',
                            receivingPractitionerPRCId: '7890123',
                            receivingFacilityName: 'Dr. Rafael S. Tumbokon Memorial Hospital',
                            receivingFacilityNHFR: '513',
                            receivingFacilityHCPN: 'Aklan HCPN',
                            referralCategory: 'emergency',
                            reasonForReferralDisplay: 'Procedure',
                            chiefComplaint: 'Severe headache, dizziness, blurring of vision',
                            workingImpression: 'Severe pre-eclampsia, 32 weeks AOG',
                            clinicalHistory: 'G2P1, 32 weeks AOG. BP 180/110 mmHg.',
                            clinicalNote: 'Referred for urgent management of severe pre-eclampsia.',
                            bpSystolic: 180,
                            bpDiastolic: 110,
                            heartRate: 112,
                            respiratoryRate: 24,
                            oxygenSaturation: 96,
                            temperature: 36.8,
                            weight: 72,
                            treatmentGiven: 'Methyldopa 250mg BID, Folic Acid 5mg OD',
                            labResults: 'Proteinuria 3+. Consistent with severe pre-eclampsia.',
                        });
                        message.info('Test data filled. Review each step before submitting.');
                    }}>Fill Test Data</Button>
                </Space>
            }
        >
            <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

            <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
                <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                    <Card title="Patient & Encounter">
                        <Form.Item name="patientName" label="Patient">
                            <Input disabled />
                        </Form.Item>

                        <Form.Item name="encounterId" label="Select Encounter (optional)">
                            {encounters.length > 0 ? (
                                <Select
                                    placeholder="Choose the encounter that prompted this referral"
                                    allowClear showSearch
                                    filterOption={(input, option) =>
                                        (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={encounters.map((e: any) => ({
                                        label: `#${e.id} | ${e.class?.display || e.class?.code || '?'} | ${e.status} | ${e.period?.start?.slice(0, 10) || 'no date'}`,
                                        value: e.id || '',
                                    }))}
                                    onChange={(value) => {
                                        if (value) {
                                            getEncounterClinicalData(value).then(data => setSelectedEncounterData(data));
                                            const enc = encounters.find((e: any) => e.id === value);
                                            if (enc?.period?.start) form.setFieldsValue({ encounterDate: dayjs(enc.period.start) });
                                        } else {
                                            setSelectedEncounterData(null);
                                        }
                                    }}
                                />
                            ) : (
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Typography.Text type="secondary">
                                        No encounters found for this patient. Create one first to link clinical data.
                                    </Typography.Text>
                                    <Button type="primary" ghost onClick={() => {
                                        window.open('/encounters/new', '_blank');
                                        const check = setInterval(async () => {
                                            const data = await getPatientEncounters(patientId!);
                                            if (data.length > 0) { setEncounters(data); clearInterval(check); }
                                        }, 2000);
                                        setTimeout(() => clearInterval(check), 60000);
                                    }}>
                                        Create Encounter
                                    </Button>
                                </Space>
                            )}
                        </Form.Item>

                        {selectedEncounterData && (
                            <Card title="Auto-loaded Clinical Data from Encounter" size="small" style={{ marginTop: 8 }}>
                                <Typography.Text strong>Conditions:</Typography.Text>
                                {selectedEncounterData.conditions.map((c: any) => (
                                    <div key={c.id}>{c.code?.text || c.code?.coding?.[0]?.display || c.id}</div>
                                ))}
                                <Divider />
                                <Typography.Text strong>Observations:</Typography.Text>
                                {selectedEncounterData.observations.map((o: any) => (
                                    <div key={o.id}>
                                        {o.code?.coding?.[0]?.display || o.code?.text}: {
                                            o.valueQuantity ? `${o.valueQuantity.value} ${o.valueQuantity.unit || ''}`
                                                : o.component?.map((c: any) => `${c.code?.coding?.[0]?.display}: ${c.valueQuantity?.value} ${c.valueQuantity?.unit || ''}`).join(', ')
                                        }
                                    </div>
                                ))}
                            </Card>
                        )}

                        <Form.Item name="encounterDate" label="Encounter Date" initialValue={dayjs()}>
                            <DatePicker showTime style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="referralDate" label="Referral Date" initialValue={dayjs()}>
                            <DatePicker showTime style={{ width: '100%' }} />
                        </Form.Item>
                    </Card>
                </div>

                <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    <Card title="Sending (Referring) Facility">
                        <Typography.Title level={5}>Sending Practitioner</Typography.Title>
                        <Form.Item name="sendingPractitionerName" label="Practitioner Name" rules={[{ required: true }]}>
                            <Input placeholder="e.g., Maria Villanueva" />
                        </Form.Item>
                        <Form.Item name="sendingPractitionerPRCId" label="PRC License Number" rules={[{ required: true }]}>
                            <Input placeholder="e.g., 5466863" />
                        </Form.Item>
                        <Form.Item name="sendingPractitionerRole" label="Role" initialValue="Medical practitioner">
                            <Input disabled />
                        </Form.Item>
                        <Divider />
                        <Typography.Title level={5}>Sending Facility</Typography.Title>
                        <Form.Item name="sendingFacilityName" label="Facility Name" rules={[{ required: true }]}>
                            <Select showSearch placeholder="Search for facility" onSearch={searchFacility}
                                options={facilityOptions.map(f => ({ label: `${f.name} (NHFR: ${getNHFR(f)})`, value: f.id || '' }))} />
                        </Form.Item>
                        <Form.Item name="sendingFacilityNHFR" label="NHFR Code" rules={[{ required: true }]}>
                            <Input placeholder="e.g., 3056" />
                        </Form.Item>
                        <Form.Item name="sendingFacilityHCPN" label="HCPN Name">
                            <Input placeholder="e.g., Aklan HCPN" />
                        </Form.Item>
                    </Card>
                </div>

                <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                    <Card title="Receiving Facility">
                        <Typography.Title level={5}>Receiving Practitioner (Care Navigator)</Typography.Title>
                        <Form.Item name="receivingPractitionerName" label="Practitioner Name">
                            <Input placeholder="e.g., Carlos Lim" />
                        </Form.Item>
                        <Form.Item name="receivingPractitionerPRCId" label="PRC License Number">
                            <Input placeholder="e.g., 7890123" />
                        </Form.Item>
                        <Divider />
                        <Typography.Title level={5}>Receiving Facility</Typography.Title>
                        <Form.Item name="receivingFacilityName" label="Facility Name" rules={[{ required: true }]}>
                            <Select showSearch placeholder="Search for receiving facility" onSearch={searchFacility}
                                options={facilityOptions.map(f => ({ label: `${f.name} (NHFR: ${getNHFR(f)})`, value: f.id || '' }))} />
                        </Form.Item>
                        <Form.Item name="receivingFacilityNHFR" label="NHFR Code" rules={[{ required: true }]}>
                            <Input placeholder="e.g., 513" />
                        </Form.Item>
                        <Form.Item name="receivingFacilityHCPN" label="HCPN Name">
                            <Input placeholder="e.g., Aklan HCPN" />
                        </Form.Item>
                        <Divider />
                        <Typography.Title level={5}>Referral Details</Typography.Title>
                        <Form.Item name="referralCategory" label="Category" rules={[{ required: true }]} initialValue="emergency">
                            <Radio.Group>
                                <Radio value="emergency">Emergency</Radio>
                                <Radio value="outpatient">Outpatient / Routine</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item name="reasonForReferralDisplay" label="Reason for Referral (Service Type)" rules={[{ required: true }]} initialValue="Procedure">
                            <Select options={[
                                { label: 'Consultation', value: 'Consultation' },
                                { label: 'Diagnostics', value: 'Diagnostics' },
                                { label: 'Procedure', value: 'Procedure' },
                                { label: 'Others', value: 'Others' },
                            ]} />
                        </Form.Item>
                    </Card>
                </div>

                <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
                    <Card title="Clinical Information">
                        <Typography.Title level={5}>Patient Assessment</Typography.Title>
                        <Form.Item name="chiefComplaint" label="Chief Complaint">
                            <Input.TextArea rows={3} placeholder="e.g., Severe headache, dizziness, blurring of vision" />
                        </Form.Item>
                        <Form.Item name="workingImpression" label="Working Impression (Diagnosis)" rules={[{ required: true }]}>
                            <Input.TextArea rows={2} placeholder="e.g., Severe pre-eclampsia, 32 weeks AOG" />
                        </Form.Item>
                        <Form.Item name="clinicalHistory" label="Clinical History">
                            <Input.TextArea rows={3} placeholder="Pertinent medical history" />
                        </Form.Item>
                        <Form.Item name="clinicalNote" label="Clinical Note">
                            <Input.TextArea rows={3} placeholder="Additional notes for the referral" />
                        </Form.Item>
                        <Divider />
                        <Typography.Title level={5}>Vital Signs</Typography.Title>
                        <Space size="large" wrap>
                            <Form.Item name="bpSystolic" label="BP Systolic"><InputNumber addonAfter="mmHg" /></Form.Item>
                            <Form.Item name="bpDiastolic" label="BP Diastolic"><InputNumber addonAfter="mmHg" /></Form.Item>
                            <Form.Item name="heartRate" label="Heart Rate"><InputNumber addonAfter="bpm" /></Form.Item>
                            <Form.Item name="respiratoryRate" label="Respiratory Rate"><InputNumber addonAfter="/min" /></Form.Item>
                            <Form.Item name="oxygenSaturation" label="SpO2"><InputNumber addonAfter="%" /></Form.Item>
                            <Form.Item name="temperature" label="Temperature"><InputNumber addonAfter="°C" /></Form.Item>
                            <Form.Item name="weight" label="Weight"><InputNumber addonAfter="kg" /></Form.Item>
                        </Space>
                        <Divider />
                        <Typography.Title level={5}>Treatment & Labs</Typography.Title>
                        <Form.Item name="treatmentGiven" label="Treatment Given">
                            <Input.TextArea rows={2} placeholder="Pre-referral treatment administered" />
                        </Form.Item>
                        <Form.Item name="labResults" label="Lab Results">
                            <Input.TextArea rows={3} placeholder="Laboratory results summary" />
                        </Form.Item>
                    </Card>
                </div>

                <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
                    <Card title="Review & Submit">
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Patient">{form.getFieldValue('patientName')}</Descriptions.Item>
                            <Descriptions.Item label="Encounter">{form.getFieldValue('encounterId') || 'New encounter will be created'}</Descriptions.Item>
                            <Descriptions.Item label="Referring Practitioner">{form.getFieldValue('sendingPractitionerName')}</Descriptions.Item>
                            <Descriptions.Item label="Sending Facility">{form.getFieldValue('sendingFacilityName')}</Descriptions.Item>
                            <Descriptions.Item label="Receiving Facility">{form.getFieldValue('receivingFacilityName')}</Descriptions.Item>
                            <Descriptions.Item label="Category">{form.getFieldValue('referralCategory')}</Descriptions.Item>
                            <Descriptions.Item label="Working Impression">{form.getFieldValue('workingImpression')}</Descriptions.Item>
                            <Descriptions.Item label="Chief Complaint">{form.getFieldValue('chiefComplaint')}</Descriptions.Item>
                            <Descriptions.Item label="Clinical History">{form.getFieldValue('clinicalHistory')}</Descriptions.Item>
                            <Descriptions.Item label="Vital Signs">
                                {[form.getFieldValue('bpSystolic') && `BP: ${form.getFieldValue('bpSystolic')}/${form.getFieldValue('bpDiastolic')}`,
                                form.getFieldValue('heartRate') && `HR: ${form.getFieldValue('heartRate')}`,
                                form.getFieldValue('respiratoryRate') && `RR: ${form.getFieldValue('respiratoryRate')}`,
                                form.getFieldValue('oxygenSaturation') && `SpO2: ${form.getFieldValue('oxygenSaturation')}%`,
                                form.getFieldValue('temperature') && `Temp: ${form.getFieldValue('temperature')}°C`,
                                form.getFieldValue('weight') && `Wt: ${form.getFieldValue('weight')}kg`,
                                ].filter(Boolean).join(', ') || 'None entered'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Treatment Given">{form.getFieldValue('treatmentGiven') || 'None'}</Descriptions.Item>
                            <Descriptions.Item label="Lab Results">{form.getFieldValue('labResults') || 'None'}</Descriptions.Item>
                        </Descriptions>
                        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                            On submit, a FHIR transaction bundle (21 entries) will be posted to the server.
                        </Typography.Text>
                        <Button type="primary" size="large" icon={<SendOutlined />}
                            onClick={handleSubmit} loading={submitting} style={{ marginTop: 16 }}>
                            Submit Referral
                        </Button>
                    </Card>
                </div>
            </Form>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Space>
                    {currentStep > 0 && <Button onClick={() => setCurrentStep((s: number) => s - 1)}>Previous</Button>}
                    {currentStep < 4 && <Button type="primary" onClick={() => setCurrentStep((s: number) => s + 1)}>Next</Button>}
                </Space>
            </div>
        </PageContainer>
    );
}
