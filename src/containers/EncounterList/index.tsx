import { t, Trans } from '@lingui/macro';
import { Encounter } from 'fhir/r4b';

import { ResourceListPage, navigationAction } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { formatHumanDateTime } from '@beda.software/emr/utils';

export function EncounterList() {
    return (
        <ResourceListPage<Encounter>
            headerTitle={t`Encounters`}
            resourceType="Encounter"
            searchParams={{ _count: 50, _total: 'accurate' }}
            getTableColumns={() => [
                {
                    title: <Trans>Date</Trans>,
                    dataIndex: 'period',
                    key: 'date',
                    render: (_text, { resource }) =>
                        resource.period?.start ? formatHumanDateTime(resource.period.start) : '-',
                    width: 180,
                },
                {
                    title: <Trans>Patient</Trans>,
                    dataIndex: 'subject',
                    key: 'patient',
                    render: (_text, { resource }) =>
                        resource.subject?.display || resource.subject?.reference?.replace('Patient/', '') || '-',
                    width: 250,
                },
                {
                    title: <Trans>Type</Trans>,
                    dataIndex: 'class',
                    key: 'class',
                    render: (_text, { resource }) => resource.class?.display || resource.class?.code || '-',
                    width: 120,
                },
                {
                    title: <Trans>Status</Trans>,
                    dataIndex: 'status',
                    key: 'status',
                    render: (_text, { resource }) => resource.status,
                    width: 110,
                },
                {
                    title: <Trans>Service Provider</Trans>,
                    dataIndex: 'serviceProvider',
                    key: 'provider',
                    render: (_text, { resource }) =>
                        resource.serviceProvider?.display || resource.serviceProvider?.reference || '-',
                    width: 250,
                },
            ]}
            getFilters={() => [
                {
                    id: 'patient',
                    searchParam: 'patient',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`Find by patient`,
                    placement: ['search-bar', 'table'],
                },
                {
                    id: 'status',
                    searchParam: 'status',
                    type: SearchBarColumnType.CHOICE,
                    placeholder: t`Status`,
                    options: [
                        { value: { Coding: { code: 'finished', display: 'Finished' } } },
                        { value: { Coding: { code: 'in-progress', display: 'In progress' } } },
                        { value: { Coding: { code: 'triaged', display: 'Triaged' } } },
                        { value: { Coding: { code: 'planned', display: 'Planned' } } },
                    ],
                    placement: ['table', 'search-bar'],
                },
                {
                    id: 'class',
                    searchParam: 'class',
                    type: SearchBarColumnType.CHOICE,
                    placeholder: t`Type`,
                    options: [
                        { value: { Coding: { code: 'AMB', display: 'Ambulatory' } } },
                        { value: { Coding: { code: 'EMER', display: 'Emergency' } } },
                        { value: { Coding: { code: 'IMP', display: 'Inpatient' } } },
                        { value: { Coding: { code: 'OBSENC', display: 'Outpatient' } } },
                        { value: { Coding: { code: 'VRTL', display: 'Virtual' } } },
                    ],
                    placement: ['table'],
                },
            ]}
            getHeaderActions={() => [
                navigationAction('New Encounter', '/encounters/new'),
            ]}
            getRecordActions={(record) => [
                navigationAction('View', `/encounters/${record.resource.id}`),
                navigationAction('Refer from this', `/referrals/new/${record.resource.subject?.reference?.replace('Patient/', '') || ''}?encounter=${record.resource.id}`),
            ]}
        />
    );
}
