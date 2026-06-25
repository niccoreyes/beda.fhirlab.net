import {
    getFHIRResources,
    getFHIRResource as emrGetFHIRResource,
    service,
} from '@beda.software/emr/services';
import { isSuccess } from '@beda.software/remote-data';
import { extractBundleResources } from '@beda.software/fhir-react';
import {
    Patient,
    Practitioner,
    Organization,
    ServiceRequest,
    Encounter,
    Condition,
    Observation,
    Task,
    Bundle,
    Provenance,
    Resource,
    Reference,
} from 'fhir/r4b';

export type SearchParams = Record<string, string | number | undefined>;

function toSearchParams(params: SearchParams): Record<string, string | number | undefined> {
    return params;
}

export async function searchPatients(query: string): Promise<Patient[]> {
    const result = await getFHIRResources<Patient>('Patient', toSearchParams({ _count: 20, ...(query ? { name: query } : {}) }));
    if (isSuccess(result)) {
        return extractBundleResources(result.data).Patient ?? [];
    }
    return [];
}

export async function getPatient(id: string): Promise<Patient | null> {
    const ref: Reference = { reference: `Patient/${id}` };
    const result = await emrGetFHIRResource<Patient>(ref);
    if (isSuccess(result)) {
        return result.data;
    }
    return null;
}

export async function getPatientEncounters(patientId: string): Promise<Encounter[]> {
    const result = await getFHIRResources<Encounter>('Encounter', toSearchParams({
        subject: `Patient/${patientId}`,
        _sort: '-date',
        _count: 50,
    }));
    if (isSuccess(result)) {
        return extractBundleResources(result.data).Encounter ?? [];
    }
    return [];
}

export async function getEncounterClinicalData(encounterId: string) {
    const [conditionsRes, observationsRes] = await Promise.all([
        getFHIRResources<Condition>('Condition', toSearchParams({ encounter: `Encounter/${encounterId}` })),
        getFHIRResources<Observation>('Observation', toSearchParams({ encounter: `Encounter/${encounterId}` })),
    ]);
    return {
        conditions: isSuccess(conditionsRes) ? extractBundleResources(conditionsRes.data).Condition ?? [] : [],
        observations: isSuccess(observationsRes) ? extractBundleResources(observationsRes.data).Observation ?? [] : [],
    };
}

export async function searchPractitioners(query: string): Promise<Practitioner[]> {
    const result = await getFHIRResources<Practitioner>('Practitioner', toSearchParams({ name: query, _count: 20 }));
    if (isSuccess(result)) {
        return extractBundleResources(result.data).Practitioner ?? [];
    }
    return [];
}

export async function searchOrganizations(query: string): Promise<Organization[]> {
    const result = await getFHIRResources<Organization>('Organization', toSearchParams({ name: query, _count: 20 }));
    if (isSuccess(result)) {
        return extractBundleResources(result.data).Organization ?? [];
    }
    return [];
}

export async function getOrganization(id: string): Promise<Organization | null> {
    const ref: Reference = { reference: `Organization/${id}` };
    const result = await emrGetFHIRResource<Organization>(ref);
    if (isSuccess(result)) {
        return result.data;
    }
    return null;
}

export async function getSentReferrals(orgId: string): Promise<{
    serviceRequests: ServiceRequest[];
    patients: Patient[];
    encounters: Encounter[];
}> {
    const result = await service<Bundle>({
        url: `Organization?_id=${orgId}&_revinclude=PractitionerRole:organization&_revinclude:iterate=ServiceRequest:requester&_include:iterate=ServiceRequest:patient&_include:iterate=ServiceRequest:encounter`,
        method: 'GET',
    });
    if (isSuccess(result)) {
        const entries = result.data.entry ?? [];
        return {
            serviceRequests: entries.filter(e => e.resource?.resourceType === 'ServiceRequest').map(e => e.resource as unknown as ServiceRequest),
            patients: entries.filter(e => e.resource?.resourceType === 'Patient').map(e => e.resource as unknown as Patient),
            encounters: entries.filter(e => e.resource?.resourceType === 'Encounter').map(e => e.resource as unknown as Encounter),
        };
    }
    return { serviceRequests: [], patients: [], encounters: [] };
}

export async function getReceivedReferrals(orgId: string): Promise<{
    tasks: Task[];
    patients: Patient[];
    serviceRequests: ServiceRequest[];
}> {
    const result = await service<Bundle>({
        url: `Organization?_id=${orgId}&_revinclude=PractitionerRole:organization&_revinclude:iterate=Task:owner&_include:iterate=Task:patient&_include:iterate=Task:focus`,
        method: 'GET',
    });
    if (isSuccess(result)) {
        const entries = result.data.entry ?? [];
        return {
            tasks: entries.filter(e => e.resource?.resourceType === 'Task').map(e => e.resource as unknown as Task),
            patients: entries.filter(e => e.resource?.resourceType === 'Patient').map(e => e.resource as unknown as Patient),
            serviceRequests: entries.filter(e => e.resource?.resourceType === 'ServiceRequest').map(e => e.resource as unknown as ServiceRequest),
        };
    }
    return { tasks: [], patients: [], serviceRequests: [] };
}

export async function getPatientReferrals(patientId: string): Promise<ServiceRequest[]> {
    const result = await getFHIRResources<ServiceRequest>('ServiceRequest', toSearchParams({
        subject: `Patient/${patientId}`,
        _sort: '-authored',
        _count: 50,
    }));
    if (isSuccess(result)) {
        return extractBundleResources(result.data).ServiceRequest ?? [];
    }
    return [];
}

export async function getReferralTasks(serviceRequestId: string): Promise<Task[]> {
    const result = await getFHIRResources<Task>('Task', toSearchParams({ 'focus:ServiceRequest': serviceRequestId }));
    if (isSuccess(result)) {
        return extractBundleResources(result.data).Task ?? [];
    }
    return [];
}

export async function getReferralProvenance(serviceRequestId: string): Promise<Provenance[]> {
    const result = await service<Bundle>({
        url: `Provenance?target=ServiceRequest/${serviceRequestId}`,
        method: 'GET',
    });
    if (isSuccess(result)) {
        const entries = result.data.entry ?? [];
        return entries.map(e => e.resource as unknown as Provenance);
    }
    return [];
}

export async function postTransactionBundle(bundle: Bundle): Promise<boolean> {
    const result = await service({ url: '/', method: 'POST', data: bundle });
    return isSuccess(result);
}

export async function getFHIRResourceById<T extends Resource>(resourceType: string, id: string): Promise<T | null> {
    const ref: Reference = { reference: `${resourceType}/${id}` };
    const result = await emrGetFHIRResource<T>(ref);
    if (isSuccess(result)) {
        return result.data;
    }
    return null;
}
