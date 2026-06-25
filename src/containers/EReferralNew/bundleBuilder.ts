import { v4 as uuid4 } from 'uuid';
import { Bundle, BundleEntry, Patient } from 'fhir/r4b';
import { ReferralFormData } from '../types';

function generateUUID(): string {
    return uuid4();
}

export function buildReferralBundle(data: ReferralFormData, existingPatient?: Patient | null): Bundle {
    const patientUUID = generateUUID();
    const sendingPractUUID = generateUUID();
    const receivingPractUUID = generateUUID();
    const sendingOrgUUID = generateUUID();
    const receivingOrgUUID = generateUUID();
    const sendingPRUUID = generateUUID();
    const receivingPRUUID = generateUUID();
    const srUUID = generateUUID();
    const encUUID = generateUUID();
    const ccUUID = generateUUID();
    const wiUUID = generateUUID();
    const bpUUID = generateUUID();
    const hrUUID = generateUUID();
    const rrUUID = generateUUID();
    const spo2UUID = generateUUID();
    const tempUUID = generateUUID();
    const wtUUID = generateUUID();
    const procUUID = generateUUID();
    const drUUID = generateUUID();
    const taskUUID = generateUUID();
    const provUUID = generateUUID();

    const now = new Date().toISOString();
    const referralDate = data.referralDate || now;

    const entries: BundleEntry[] = [];

    // Entry 1: Patient (conditional PUT on PhilSys ID using existing data)
    const patientResource: any = existingPatient
        ? { ...existingPatient, id: undefined }
        : {
            resourceType: 'Patient',
            meta: { profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-patient'] },
            identifier: [{ system: 'http://philhealth.gov.ph/fhir/Identifier/philhealth-id', value: data.patientId }],
            name: [{ use: 'official', family: data.patientId, given: ['Patient'] }],
            gender: 'unknown',
            birthDate: '2000-01-01',
        };
    entries.push({
        fullUrl: `urn:uuid:${patientUUID}`,
        resource: patientResource,
        request: {
            method: 'PUT',
            url: `Patient?identifier=http://philsys.gov.ph/fhir/Identifier/philsys-id|${data.patientId}`,
        },
    });

    // Entry 2: Sending Practitioner (conditional PUT on PRC ID)
    entries.push({
        fullUrl: `urn:uuid:${sendingPractUUID}`,
        resource: {
            resourceType: 'Practitioner',
            id: `ERefPractitionerSubmission-${data.sendingPractitionerPRCId}`,
            meta: {
                profile: ['https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-practitioner'],
            },
            identifier: [
                { system: 'https://prc.gov.ph/', value: data.sendingPractitionerPRCId },
            ],
            name: [{
                use: 'official',
                family: (data.sendingPractitionerName || '').split(' ').slice(1).join(' ') || data.sendingPractitionerName || '',
                given: [(data.sendingPractitionerName || '').split(' ')[0] || ''],
                prefix: ['Dr.'],
            }],
        },
        request: {
            method: 'POST',
            url: 'Practitioner',
        },
    });

    // Entry 3: Receiving Practitioner
    if (data.receivingPractitionerPRCId) {
        entries.push({
            fullUrl: `urn:uuid:${receivingPractUUID}`,
            resource: {
                resourceType: 'Practitioner',
                id: `ERefPractitionerReceiving-${data.receivingPractitionerPRCId}`,
                meta: {
                    profile: ['https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-practitioner'],
                },
                identifier: [
                    { system: 'https://prc.gov.ph/', value: data.receivingPractitionerPRCId },
                ],
                name: [{
                    use: 'official',
                    family: (data.receivingPractitionerName || '').split(' ').slice(1).join(' ') || data.receivingPractitionerName || '',
                    given: [(data.receivingPractitionerName || '').split(' ')[0] || ''],
                    prefix: ['Dr.'],
                }],
            },
            request: {
                method: 'POST',
                url: 'Practitioner',
            },
        });
    }

    // Entry 4: Sending Organization (conditional PUT on NHFR code)
    entries.push({
        fullUrl: `urn:uuid:${sendingOrgUUID}`,
        resource: {
            resourceType: 'Organization',
            id: `ERefOrgSending-${data.sendingFacilityNHFR}`,
            meta: {
                profile: ['https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-organization'],
            },
            identifier: [
                { system: 'https://fhir.doh.gov.ph/phcore/Identifier/doh-nhfr-code', value: data.sendingFacilityNHFR },
                ...(data.sendingFacilityHCPN ? [{ system: 'https://fhir.doh.gov.ph/phcore/Identifier/hcpn-code', value: data.sendingFacilityHCPN }] : []),
            ],
            name: data.sendingFacilityName,
            active: true,
        },
        request: {
            method: 'PUT',
            url: `Organization?identifier=https://fhir.doh.gov.ph/phcore/Identifier/doh-nhfr-code|${data.sendingFacilityNHFR}`,
        },
    });

    // Entry 5: Receiving Organization (conditional PUT on NHFR code)
    entries.push({
        fullUrl: `urn:uuid:${receivingOrgUUID}`,
        resource: {
            resourceType: 'Organization',
            id: `ERefOrgReceiving-${data.receivingFacilityNHFR}`,
            meta: {
                profile: ['https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-organization'],
            },
            identifier: [
                { system: 'https://fhir.doh.gov.ph/phcore/Identifier/doh-nhfr-code', value: data.receivingFacilityNHFR },
                ...(data.receivingFacilityHCPN ? [{ system: 'https://fhir.doh.gov.ph/phcore/Identifier/hcpn-code', value: data.receivingFacilityHCPN }] : []),
            ],
            name: data.receivingFacilityName,
            active: true,
        },
        request: {
            method: 'PUT',
            url: `Organization?identifier=https://fhir.doh.gov.ph/phcore/Identifier/doh-nhfr-code|${data.receivingFacilityNHFR}`,
        },
    });

    // Entry 6: Sending PractitionerRole (conditional PUT on PRC ID)
    entries.push({
        fullUrl: `urn:uuid:${sendingPRUUID}`,
        resource: {
            resourceType: 'PractitionerRole',
            id: `ERefPRSubmission-${data.sendingPractitionerPRCId}`,
            meta: {
                profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-practitioner-role'],
            },
            identifier: [
                { system: 'https://prc.gov.ph/', value: data.sendingPractitionerPRCId },
            ],
            practitioner: { reference: `urn:uuid:${sendingPractUUID}` },
            organization: { reference: `urn:uuid:${sendingOrgUUID}` },
            code: [{
                coding: [{
                    system: 'http://snomed.info/sct',
                    code: '158965000',
                    display: 'Medical practitioner',
                }],
            }],
        },
        request: {
            method: 'POST',
            url: 'PractitionerRole',
        },
    });

    // Entry 7: Receiving PractitionerRole (conditional PUT on PRC ID)
    if (data.receivingPractitionerPRCId) {
        entries.push({
            fullUrl: `urn:uuid:${receivingPRUUID}`,
            resource: {
                resourceType: 'PractitionerRole',
                id: `ERefPRReceiving-${data.receivingPractitionerPRCId}`,
                meta: {
                    profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-practitioner-role'],
                },
                identifier: [
                    { system: 'https://prc.gov.ph/', value: data.receivingPractitionerPRCId },
                ],
                practitioner: { reference: `urn:uuid:${receivingPractUUID}` },
                organization: { reference: `urn:uuid:${receivingOrgUUID}` },
                code: [{
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: '158965000',
                        display: 'Medical practitioner',
                    }],
                }],
            },
            request: {
                method: 'POST',
                url: 'PractitionerRole',
            },
        });
    }

    const categoryCode = data.referralCategory === 'emergency' ? '73770003' : '308335008';
    const categoryDisplay = data.referralCategory === 'emergency'
        ? 'Hospital-based outpatient emergency care center'
        : 'Referral to outpatient service';

    // Entry 8: ServiceRequest (the core referral)
    entries.push({
        fullUrl: `urn:uuid:${srUUID}`,
        resource: {
            resourceType: 'ServiceRequest',
            id: `ERefSR-${Date.now()}`,
            meta: {
                profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-service-request'],
            },
            requisition: {
                system: 'urn:oid:1.2.840.113619.21.1.2',
                value: data.requisitionId || `REF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
            },
            status: 'active',
            intent: 'order',
            category: [{
                coding: [{
                    system: 'http://snomed.info/sct',
                    code: categoryCode,
                    display: categoryDisplay,
                }],
                text: data.referralCategory === 'emergency' ? 'Emergency' : 'Outpatient',
            }],
            subject: { reference: `urn:uuid:${patientUUID}` },
            encounter: { reference: `urn:uuid:${encUUID}` },
            occurrenceDateTime: data.encounterDate || referralDate,
            authoredOn: referralDate,
            requester: { reference: `urn:uuid:${sendingPRUUID}` },
            performer: [{ reference: data.receivingPractitionerPRCId ? `urn:uuid:${receivingPRUUID}` : `urn:uuid:${receivingOrgUUID}` }],
            reasonCode: [{
                coding: [{
                    system: 'http://snomed.info/sct',
                    code: data.reasonForReferralCode || '71388002',
                    display: data.reasonForReferralDisplay || 'Procedure',
                }],
                text: data.reasonForReferralText || data.workingImpression,
            }],
            reasonReference: [{
                reference: `urn:uuid:${wiUUID}`,
            }],
            note: [{
                text: data.clinicalNote || `${data.workingImpression}. ${data.clinicalHistory || ''}`,
            }],
        },
        request: { method: 'POST', url: 'ServiceRequest' },
    });

    // Entry 9: Encounter
    entries.push({
        fullUrl: `urn:uuid:${encUUID}`,
        resource: {
            resourceType: 'Encounter',
            id: `ERefEncounter-${Date.now()}`,
            meta: {
                profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-encounter'],
            },
            status: 'finished',
            class: {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                code: 'AMB',
                display: 'ambulatory',
            },
            subject: { reference: `urn:uuid:${patientUUID}` },
            period: {
                start: data.encounterDate || referralDate,
            },
        },
        request: { method: 'POST', url: 'Encounter' },
    });

    // Entry 10: Condition — Chief Complaint
    if (data.chiefComplaint) {
        entries.push({
            fullUrl: `urn:uuid:${ccUUID}`,
            resource: {
                resourceType: 'Condition',
                id: `ERefCC-${Date.now()}`,
                meta: {
                    profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-condition'],
                },
                clinicalStatus: {
                    coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
                },
                category: [{
                    coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item', display: 'Problem List Item' }],
                }],
                code: {
                    coding: data.chiefComplaintCode
                        ? [{ system: 'http://snomed.info/sct', code: data.chiefComplaintCode, display: data.chiefComplaint }]
                        : undefined,
                    text: data.chiefComplaint,
                },
                subject: { reference: `urn:uuid:${patientUUID}` },
                encounter: { reference: `urn:uuid:${encUUID}` },
                note: [{ text: `Chief complaint: ${data.chiefComplaint}` }],
            },
            request: { method: 'POST', url: 'Condition' },
        });
    }

    // Entry 11: Condition — Working Impression
    if (data.workingImpression) {
        entries.push({
            fullUrl: `urn:uuid:${wiUUID}`,
            resource: {
                resourceType: 'Condition',
                id: `ERefWI-${Date.now()}`,
                meta: {
                    profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-condition'],
                },
                clinicalStatus: {
                    coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
                },
                verificationStatus: {
                    coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'provisional', display: 'Provisional' }],
                },
                category: [{
                    coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }],
                }],
                code: {
                    coding: data.workingImpressionCode
                        ? [{ system: 'http://snomed.info/sct', code: data.workingImpressionCode, display: data.workingImpression }]
                        : undefined,
                    text: data.workingImpression,
                },
                subject: { reference: `urn:uuid:${patientUUID}` },
                encounter: { reference: `urn:uuid:${encUUID}` },
                note: [{ text: data.clinicalHistory || data.workingImpression }],
            },
            request: { method: 'POST', url: 'Condition' },
        });
    }

    // Entries 12-17: Observations (vital signs)
    const vitalObservations = [
        {
            uuid: bpUUID, id: 'BP', loinc: '85354-9', snomed: '75367002', display: 'Blood pressure panel',
            components: [
                { loinc: '8480-6', snomed: '271649006', display: 'Systolic blood pressure', value: data.bloodPressureSystolic, unit: 'mmHg', code: 'mm[Hg]' },
                { loinc: '8462-4', snomed: '271650006', display: 'Diastolic blood pressure', value: data.bloodPressureDiastolic, unit: 'mmHg', code: 'mm[Hg]' },
            ],
        },
        ...(data.heartRate ? [{
            uuid: hrUUID, id: 'HR', loinc: '8867-4', snomed: '78564009', display: 'Heart rate',
            value: data.heartRate, unit: 'beats/minute', ucum: '/min',
        }] : []),
        ...(data.respiratoryRate ? [{
            uuid: rrUUID, id: 'RR', loinc: '9279-1', snomed: '86290005', display: 'Respiratory rate',
            value: data.respiratoryRate, unit: 'breaths/minute', ucum: '/min',
        }] : []),
        ...(data.oxygenSaturation ? [{
            uuid: spo2UUID, id: 'SpO2', loinc: '59408-5', snomed: '103228002', display: 'Oxygen saturation in Arterial blood',
            value: data.oxygenSaturation, unit: '%', ucum: '%',
        }] : []),
        ...(data.temperature ? [{
            uuid: tempUUID, id: 'Temp', loinc: '8310-5', snomed: '386725007', display: 'Body temperature',
            value: data.temperature, unit: 'Celsius', ucum: 'Cel',
        }] : []),
        ...(data.weight ? [{
            uuid: wtUUID, id: 'Weight', loinc: '29463-7', snomed: '27113001', display: 'Body weight',
            value: data.weight, unit: 'kg', ucum: 'kg',
        }] : []),
    ];

    for (const obs of vitalObservations) {
        const obsResource: any = {
            resourceType: 'Observation',
            id: `ERefObs${obs.id}-${Date.now()}`,
            meta: {
                profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-observation'],
            },
            status: 'final',
            category: [{
                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }],
            }],
            code: {
                coding: [
                    { system: 'http://loinc.org', code: obs.loinc, display: obs.display },
                    { system: 'http://snomed.info/sct', code: obs.snomed, display: obs.display },
                ],
            },
            subject: { reference: `urn:uuid:${patientUUID}` },
            encounter: { reference: `urn:uuid:${encUUID}` },
            effectiveDateTime: data.encounterDate || referralDate,
        };

        const obsAny = obs as any;
        if (obsAny.components?.length) {
            obsResource.component = obsAny.components.map((comp: any) => ({
                code: {
                    coding: [
                        { system: 'http://loinc.org', code: comp.loinc, display: comp.display },
                        { system: 'http://snomed.info/sct', code: comp.snomed, display: comp.display },
                    ],
                },
                valueQuantity: {
                    value: comp.value,
                    unit: comp.unit,
                    system: 'http://unitsofmeasure.org',
                    code: comp.code,
                },
            }));
        } else if ('value' in obs) {
            obsResource.valueQuantity = {
                value: obs.value,
                unit: (obs as any).unit,
                system: 'http://unitsofmeasure.org',
                code: (obs as any).ucum,
            };
        }

        entries.push({
            fullUrl: `urn:uuid:${obs.uuid}`,
            resource: obsResource,
            request: { method: 'POST', url: 'Observation' },
        });
    }

    // Entry 18: Procedure — Treatment Given
    if (data.treatmentGiven) {
        entries.push({
            fullUrl: `urn:uuid:${procUUID}`,
            resource: {
                resourceType: 'Procedure',
                id: `ERefProc-${Date.now()}`,
                meta: {
                    profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-procedure'],
                },
                status: 'completed',
                code: {
                    coding: [{ system: 'http://snomed.info/sct', code: '182836005', display: 'Drug therapy' }],
                    text: 'Pre-referral treatment',
                },
                subject: { reference: `urn:uuid:${patientUUID}` },
                encounter: { reference: `urn:uuid:${encUUID}` },
                note: [{ text: data.treatmentGiven }],
            },
            request: { method: 'POST', url: 'Procedure' },
        });
    }

    // Entry 19: DiagnosticReport — Lab Results
    if (data.labResults || data.labResultsAttachment) {
        entries.push({
            fullUrl: `urn:uuid:${drUUID}`,
            resource: {
                resourceType: 'DiagnosticReport',
                id: `ERefDR-${Date.now()}`,
                status: 'final',
                code: {
                    coding: [{ system: 'http://loinc.org', code: '24356-8', display: 'Urinalysis complete panel' }],
                },
                subject: { reference: `urn:uuid:${patientUUID}` },
                encounter: { reference: `urn:uuid:${encUUID}` },
                effectiveDateTime: data.encounterDate || referralDate,
                ...(data.labResultsAttachment
                    ? { presentedForm: [{ contentType: 'application/pdf', data: data.labResultsAttachment }] }
                    : {}),
                conclusion: data.labResults || '',
            },
            request: { method: 'POST', url: 'DiagnosticReport' },
        });
    }

    // Entry 20: Task — Referral tracking
    entries.push({
        fullUrl: `urn:uuid:${taskUUID}`,
        resource: {
            resourceType: 'Task',
            id: `ERefTask-${Date.now()}`,
            meta: {
                profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-task'],
            },
            status: 'requested',
            intent: 'order',
            code: {
                coding: [{
                    system: 'http://snomed.info/sct',
                    code: '3457005',
                    display: 'Patient referral',
                }],
                text: `eReferral for ${data.workingImpression || 'patient care'}`,
            },
            focus: { reference: `urn:uuid:${srUUID}` },
            for: { reference: `urn:uuid:${patientUUID}` },
            authoredOn: referralDate,
            lastModified: now,
            requester: { reference: `urn:uuid:${sendingPRUUID}` },
            owner: { reference: data.receivingPractitionerPRCId ? `urn:uuid:${receivingPRUUID}` : `urn:uuid:${receivingOrgUUID}` },
            note: [{ text: `New referral for ${data.workingImpression || 'specialist care'}. Awaiting response.` }],
        },
        request: { method: 'POST', url: 'Task' },
    });

    // Entry 21: Provenance — Signature attestation
    entries.push({
        fullUrl: `urn:uuid:${provUUID}`,
        resource: {
            resourceType: 'Provenance',
            id: `ERefProv-${Date.now()}`,
            meta: {
                profile: ['https://fhir.doh.gov.ph/pheref/StructureDefinition/ereferral-provenance'],
            },
            target: [{ reference: `urn:uuid:${srUUID}` }],
            recorded: referralDate,
            activity: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
                    code: 'CREATE',
                }],
            },
            agent: [{
                type: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
                        code: 'author',
                        display: 'Author',
                    }],
                },
                who: { reference: `urn:uuid:${sendingPRUUID}` },
                onBehalfOf: { reference: `urn:uuid:${sendingOrgUUID}` },
            }],
        },
        request: { method: 'POST', url: 'Provenance' },
    });

    return {
        resourceType: 'Bundle',
        id: `ERefSubmission-${Date.now()}`,
        type: 'transaction',
        timestamp: now,
        entry: entries,
    };
}
