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
            getTableColumns={() => [
                {
                    title: <Trans>Date</Trans>,
                    dataIndex: 'period',
                    key: 'date',
                    render: (_text, { resource }) =>
                        resource.period?.start ? formatHumanDateTime(resource.period.start) : '-',
                    width: 200,
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
                    width: 120,
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
                    placeholder: t`Choose status`,
                    options: [
                        { value: { Coding: { code: 'finished', display: 'Finished' } } },
                        { value: { Coding: { code: 'in-progress', display: 'In progress' } } },
                        { value: { Coding: { code: 'triaged', display: 'Triaged' } } },
                        { value: { Coding: { code: 'planned', display: 'Planned' } } },
                    ],
                    placement: ['table', 'search-bar'],
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
