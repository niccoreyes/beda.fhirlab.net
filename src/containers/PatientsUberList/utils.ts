import {
    AllergyIntolerance,
    Bundle,
    Composition,
    Condition,
    Immunization,
    MedicationStatement,
    Patient,
    Procedure,
    Reference,
} from 'fhir/r4b';
import { v4 as uuid4 } from 'uuid';

import { formatFHIRDate } from 'aidbox-react/lib/utils/date';

import { extractBundleResources, parseFHIRReference, SearchParams } from '@beda.software/fhir-react';

export function getPatientSearchParamsForPractitioner(practitionerId: string): SearchParams {
    return {
        status: 'active',
        category: 'data-sharing',
        period: formatFHIRDate(new Date()),
        actor: practitionerId,
        _include: ['Consent:patient:Patient'],
    };
}

export function prepareIPSBundle(
    composition: Composition,
    relatedResourcesBundle: Bundle<
        Composition | Patient | Condition | AllergyIntolerance | MedicationStatement | Immunization | Procedure
    >,
): Bundle {
    const resources = extractBundleResources(relatedResourcesBundle);
    const patient = resources.Patient[0]!;
    const initialBundle: Bundle = {
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
                fullUrl: `urn:uuid:${composition.id}`,
                resource: composition,
            },
            {
                fullUrl: `urn:uuid:${patient.id}`,
                resource: patient,
            },
        ],
    };

    const conditions = resources.Condition ?? [];
    const allergies = resources.AllergyIntolerance ?? [];
    const medicationStatements = resources.MedicationStatement ?? [];
    const immunizations = resources.Immunization ?? [];
    const procedures = resources.Procedure ?? [];
    const resultBundle: Bundle = {
        ...initialBundle,
        entry: [
            ...(initialBundle.entry ?? []),
            ...conditions.map((condition) => ({
                fullUrl: `urn:uuid:${condition.id}`,
                resource: condition,
            })),
            ...allergies.map((allergy) => ({
                fullUrl: `urn:uuid:${allergy.id}`,
                resource: allergy,
            })),
            ...medicationStatements.map((medicationStatement) => ({
                fullUrl: `urn:uuid:${medicationStatement.id}`,
                resource: medicationStatement,
            })),
            ...immunizations.map((immunization) => ({
                fullUrl: `urn:uuid:${immunization.id}`,
                resource: immunization,
            })),
            ...procedures.map((procedure) => ({
                fullUrl: `urn:uuid:${procedure.id}`,
                resource: procedure,
            })),
        ],
    };

    return resultBundle;
}
