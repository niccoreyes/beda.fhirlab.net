import { Bundle, Composition, Patient, Reference } from 'fhir/r4b';
import { v4 as uuid4 } from 'uuid';

import { formatFHIRDate } from 'aidbox-react/lib/utils/date';

import config from '@beda.software/emr-config';
import { parseFHIRReference, SearchParams } from '@beda.software/fhir-react';

export function getPatientSearchParamsForPractitioner(practitionerId: string): SearchParams {
    return {
        status: 'active',
        category: 'data-sharing',
        period: formatFHIRDate(new Date()),
        actor: practitionerId,
        _include: ['Consent:patient:Patient'],
    };
}

export function prepareIPSBundle(patient: Patient, composition: Composition): Bundle {
    const ipsBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'document',
        meta: {
            profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips'],
        },
        identifier: {
            system: 'http://hl7.org/fhir/uv/ips/ImplementationGuide/hl7.fhir.uv.ips',
            value: uuid4(),
        },
        timestamp: new Date().toISOString(),
        entry: [
            {
                fullUrl: `${config.baseURL}/ui/console#/resource-types/Composition/${composition.id}`,
                resource: composition,
            },
            {
                fullUrl: `${config.baseURL}/ui/console#/resource-types/Patient/${patient.id}`,
                resource: patient,
            },
        ],
    };

    return ipsBundle;
}

export function prepareCompositionResourcesIds(composition: Composition): Record<string, string[]> {
    const ResourcesMap: Record<string, string[]> = {};

    if (!composition.section) {
        return ResourcesMap;
    }

    for (const section of composition.section) {
        if (section.entry) {
            for (const entry of section.entry) {
                const { resourceType, id } = parseFHIRReference(entry as Reference);
                if (resourceType && id) {
                    if (!ResourcesMap[resourceType]) {
                        ResourcesMap[resourceType] = [];
                    }
                    if (!ResourcesMap[resourceType].includes(id)) {
                        ResourcesMap[resourceType].push(id);
                    }
                }
            }
        }
    }

    return ResourcesMap;
}
