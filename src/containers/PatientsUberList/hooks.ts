import {
    AllergyIntolerance,
    Bundle,
    Composition,
    Condition,
    Immunization,
    MedicationStatement,
    Patient,
    Procedure,
} from 'fhir/r4b';
import { useCallback } from 'react';

import { getFHIRResources } from '@beda.software/emr/services';
import config from '@beda.software/emr-config';
import { extractBundleResources, parseFHIRReference, useService } from '@beda.software/fhir-react';
import { mapSuccess, sequenceMap } from '@beda.software/remote-data';

import { prepareIPSBundle } from './utils';

export interface DocumentsProps {
    patient: Patient;
}

const ProblemsSectionCode = '11450-4';
const AllergiesSectionCode = '48765-2';
const MedicationsSectionCode = '10160-0';
const ImmunizationsSectionCode = '11369-6';
const ProceduresSectionCode = '47519-4';

interface CompositionRelatedResourcesMap {
    problems: Condition[];
    allergies: AllergyIntolerance[];
    medicationStatements: MedicationStatement[];
    immunizations: Immunization[];
    procedures: Procedure[];
}

export function useDocuments(patient: Patient) {
    const [response] = useService(async () => {
        const conditionsResponse = mapSuccess(
            await getFHIRResources<Condition>('Condition', {
                patient: `Patient/${patient.id}`,
            }),
            (bundle) => extractBundleResources(bundle).Condition,
        );
        const allergiesResponse = mapSuccess(
            await getFHIRResources<AllergyIntolerance>('AllergyIntolerance', {
                patient: `Patient/${patient.id}`,
            }),
            (bundle) => extractBundleResources(bundle).AllergyIntolerance,
        );
        const medicationStatementsResponse = mapSuccess(
            await getFHIRResources<MedicationStatement>('MedicationStatement', {
                patient: `Patient/${patient.id}`,
            }),
            (bundle) => extractBundleResources(bundle).MedicationStatement,
        );
        const immunizationsResponse = mapSuccess(
            await getFHIRResources<Immunization>('Immunization', {
                patient: `Patient/${patient.id}`,
            }),
            (bundle) => extractBundleResources(bundle).Immunization,
        );
        const proceduresResponse = mapSuccess(
            await getFHIRResources<Procedure>('Procedure', {
                patient: `Patient/${patient.id}`,
            }),
            (bundle) => extractBundleResources(bundle).Procedure,
        );

        return sequenceMap<CompositionRelatedResourcesMap, any>({
            problems: conditionsResponse,
            allergies: allergiesResponse,
            medicationStatements: medicationStatementsResponse,
            immunizations: immunizationsResponse,
            procedures: proceduresResponse,
        });
    });

    const prepareResultBundle = useCallback(
        (composition: Composition, resourcesMap: CompositionRelatedResourcesMap) => {
            const initialBundle = prepareIPSBundle(patient, composition);
            const problemsSection = composition.section?.find(
                (section) => section.code?.coding?.[0].code === ProblemsSectionCode,
            );
            const allergiesSection = composition.section?.find(
                (section) => section.code?.coding?.[0].code === AllergiesSectionCode,
            );
            const medicationsSection = composition.section?.find(
                (section) => section.code?.coding?.[0].code === MedicationsSectionCode,
            );
            const immunizationsSection = composition.section?.find(
                (section) => section.code?.coding?.[0].code === ImmunizationsSectionCode,
            );
            const proceduresSection = composition.section?.find(
                (section) => section.code?.coding?.[0].code === ProceduresSectionCode,
            );

            const conditionIds = problemsSection?.entry?.map((entryItem) => parseFHIRReference(entryItem).id!) ?? [];
            const conditions = resourcesMap.problems.filter((condition) => conditionIds.includes(condition.id!));
            const allergyIds = allergiesSection?.entry?.map((entryItem) => parseFHIRReference(entryItem).id!) ?? [];
            const allergies = resourcesMap.allergies.filter((allergy) => allergyIds.includes(allergy.id!));
            const medicationStatementIds =
                medicationsSection?.entry?.map((entryItem) => parseFHIRReference(entryItem).id!) ?? [];
            const medicationStatements = resourcesMap.medicationStatements.filter((medicationStatement) =>
                medicationStatementIds.includes(medicationStatement.id!),
            );
            const immunizationIds =
                immunizationsSection?.entry?.map((entryItem) => parseFHIRReference(entryItem).id!) ?? [];
            const immunizations = resourcesMap.immunizations.filter((immunization) =>
                immunizationIds.includes(immunization.id!),
            );
            const procedureIds = proceduresSection?.entry?.map((entryItem) => parseFHIRReference(entryItem).id!) ?? [];
            const procedures = resourcesMap.procedures.filter((procedure) => procedureIds.includes(procedure.id!));

            const resultBundle: Bundle = {
                ...initialBundle,
                entry: [
                    ...(initialBundle.entry ?? []),
                    ...conditions.map((condition) => ({
                        fullUrl: `${config.baseURL}/ui/console#/resource-types/Condition/${condition.id}`,
                        resource: condition,
                    })),
                    ...allergies.map((allergy) => ({
                        fullUrl: `${config.baseURL}/ui/console#/resource-types/AllergyIntolerance/${allergy.id}`,
                        resource: allergy,
                    })),
                    ...medicationStatements.map((medicationStatement) => ({
                        fullUrl: `${config.baseURL}/ui/console#/resource-types/MedicationStatement/${medicationStatement.id}`,
                        resource: medicationStatement,
                    })),
                    ...immunizations.map((immunization) => ({
                        fullUrl: `${config.baseURL}/ui/console#/resource-types/Immunization/${immunization.id}`,
                        resource: immunization,
                    })),
                    ...procedures.map((procedure) => ({
                        fullUrl: `${config.baseURL}/ui/console#/resource-types/Procedure/${procedure.id}`,
                        resource: procedure,
                    })),
                ],
            };

            return resultBundle;
        },
        [patient],
    );

    return { response, prepareResultBundle };
}
