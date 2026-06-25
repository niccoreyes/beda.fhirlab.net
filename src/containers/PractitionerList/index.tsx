import { t, Trans } from '@lingui/macro';
import { Practitioner } from 'fhir/r4b';

import { ResourceListPage, navigationAction } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { formatHumanDate, renderHumanName, compileAsFirst } from '@beda.software/emr/utils';

const getPrcId = compileAsFirst<Practitioner, string>(
    "Practitioner.identifier.where(system='https://prc.gov.ph/').value",
);

export function PractitionerList() {
    return (
        <ResourceListPage<Practitioner>
            headerTitle={t`Practitioners`}
            resourceType="Practitioner"
            getTableColumns={() => [
                {
                    title: <Trans>Name</Trans>,
                    dataIndex: 'name',
                    key: 'name',
                    render: (_text, { resource }) => renderHumanName(resource.name?.[0]),
                    width: 250,
                },
                {
                    title: <Trans>PRC License</Trans>,
                    dataIndex: 'identifier',
                    key: 'prc',
                    render: (_text, { resource }) => getPrcId(resource) ?? '',
                    width: 130,
                },
                {
                    title: <Trans>Birth date</Trans>,
                    dataIndex: 'birthDate',
                    key: 'birthDate',
                    render: (_text, { resource }) =>
                        resource.birthDate ? formatHumanDate(resource.birthDate) : null,
                    width: 110,
                },
                {
                    title: <Trans>Gender</Trans>,
                    dataIndex: 'gender',
                    key: 'gender',
                    render: (_text, { resource }) => resource.gender ?? null,
                    width: 90,
                },
            ]}
            getFilters={() => [
                {
                    id: 'name',
                    searchParam: 'name',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`Find practitioner`,
                    placement: ['search-bar', 'table'],
                },
                {
                    id: 'identifier',
                    searchParam: 'identifier',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`PRC license`,
                    placement: ['table'],
                },
            ]}
            getRecordActions={(record) => [
                navigationAction('View', `/practitioners/${record.resource.id}`),
            ]}
        />
    );
}
