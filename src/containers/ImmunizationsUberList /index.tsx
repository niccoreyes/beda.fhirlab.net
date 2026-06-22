import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Immunization, Reference } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { compileAsArray, compileAsFirst, formatHumanDateTime } from '@beda.software/emr/utils';

export const getPerformers = compileAsArray<Immunization, Reference>('Immunization.performer.actor');

export const getVaccineCode = compileAsFirst<Immunization, string>(
    'Immunization.vaccineCode.text | Immunization.vaccineCode.coding.first().display',
);
export const getPatientLabel = compileAsFirst<Immunization, string>(
    'Immunization.patient.display | Immunization.patient.reference',
);
export const getOccurrenceDateTime = compileAsFirst<Immunization, string>(
    'Immunization.occurrenceDateTime | Immunization.occurrencePeriod.start',
);

export function ImmunizationsUberList() {
    return (
        <ResourceListPage<Immunization>
            headerTitle="Immunizations"
            resourceType="Immunization"
            getTableColumns={() => [
                {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (_text: any, { resource }) => {
                        return resource.status;
                    },
                },
                {
                    title: 'Date',
                    dataIndex: 'date',
                    key: 'date',
                    width: 200,
                    render: (_text: any, { resource }) => formatHumanDateTime(getOccurrenceDateTime(resource)),
                },
                {
                    title: 'Vaccine',
                    key: 'vaccine',
                    width: 250,
                    render: (_text: any, { resource }) =>
                        getVaccineCode(resource),
                },
                {
                    title: 'Patient',
                    dataIndex: 'patient',
                    key: 'patient',
                    render: (_text: any, { resource }) => getPatientLabel(resource),
                },
                {
                    title: 'Performer',
                    dataIndex: 'performer',
                    key: 'performer',
                    render: (_text: any, { resource }) => {
                        const references = getPerformers(resource);
                        return references
                            .map((reference) => reference.display ?? reference.reference)
                            .filter(Boolean)
                            .join(', ');
                    },
                },
            ]}
            getFilters={() => [
                {
                    id: 'status',
                    searchParam: 'status',
                    type: SearchBarColumnType.CHOICE,
                    placeholder: t`Choose status`,
                    options: [
                        {
                            value: {
                                Coding: {
                                    code: 'completed',
                                    display: 'Completed',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'entered-in-error',
                                    display: 'Entered in error',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'not-done',
                                    display: 'Not done',
                                },
                            },
                        },
                    ],
                    placement: ['table', 'search-bar'],
                },
                {
                    id: 'patient',
                    searchParam: 'patient:Patient.name',
                    type: SearchBarColumnType.STRING,
                    placeholder: 'Find by patient',
                    placement: ['search-bar', 'table'],
                },
                {
                    id: 'practitioner',
                    searchParam: 'performer:Practitioner.name',
                    type: SearchBarColumnType.STRING,
                    placeholder: 'Find by performer',
                    placement: ['search-bar', 'table'],
                },
            ]}
            getRecordActions={(record) => [
                questionnaireAction('Edit', 'immunization-create-connectathon', {
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Immunization', resource: record.resource },
                            ],
                        },
                    },
                }),
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Create immunization</Trans>, 'immunization-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Immunization', resource: { resourceType: 'Immunization' } },
                            ],
                        },
                    },
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of Immunizations`,
                    value: bundle.total,
                },
            ]}
        />
    );
}
