import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Encounter, Reference } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { compileAsFirst, formatPeriodDateTime } from '@beda.software/emr/utils';

export const getPractitioner = compileAsFirst<Encounter, Reference>(
    "Encounter.participant.individual",
);
export const getPatient = compileAsFirst<Encounter, Reference>('Encounter.subject');
export const getOrganization = compileAsFirst<Encounter, Reference>('Encounter.serviceProvider');

export function EncountersUberList() {
    return (
        <ResourceListPage<Encounter>
            headerTitle="Encounters"
            resourceType="Encounter"
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
                    title: 'Class',
                    dataIndex: 'class',
                    key: 'class',
                    render: (_text: any, { resource }) => {
                        return resource.class.display;
                    },
                },
                {
                    title: 'Date',
                    dataIndex: 'date',
                    key: 'date',
                    width: 250,
                    render: (_text: any, { resource }) => formatPeriodDateTime(resource.period),
                },
                {
                    title: 'Practitioner',
                    dataIndex: 'practitioner',
                    key: 'practitioner',
                    render: (_text: any, { resource }) => {
                        const reference = getPractitioner(resource);
                        if (reference) {
                            return reference.display ?? reference.reference;
                        }
                    },
                },
                {
                    title: 'Patient',
                    dataIndex: 'patient',
                    key: 'patient',
                    render: (_text: any, { resource }) => {
                        const reference = getPatient(resource);
                        if (reference) {
                            return reference.display ?? reference.reference;
                        }
                    },
                },
                {
                    title: 'Organization',
                    dataIndex: 'organization',
                    key: 'organization',
                    render: (_text: any, { resource }) => {
                        const reference = getOrganization(resource);
                        if (reference) {
                            return reference.display ?? reference.reference;
                        }
                    },
                },
            ]}
            getFilters={() => [
                {
                    id: 'name',
                    searchParam: '_ilike',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`Find encounter`,
                    placement: ['search-bar', 'table'],
                },
                {
                    id: 'status',
                    searchParam: 'status',
                    type: SearchBarColumnType.CHOICE,
                    placeholder: t`Choose status`,
                    options: [
                        {
                            value: {
                                Coding: {
                                    code: 'in-progress',
                                    display: 'In progress',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'finished',
                                    display: 'Finished',
                                },
                            },
                        },
                    ],
                    placement: ['table', 'search-bar'],
                },
            ]}
            getRecordActions={(record) => [
                questionnaireAction('Edit', 'encounter-create-connectathon', {
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Encounter', resource: record.resource },
                            ],
                        },
                    },
                }),
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Create encounter</Trans>, 'encounter-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Encounter', resource: { resourceType: 'Encounter' } },
                            ],
                        },
                    },
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of Encounters`,
                    value: bundle.total,
                },
            ]}
        />
    );
}
