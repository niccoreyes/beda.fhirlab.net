import { t, Trans } from '@lingui/macro';
import { Patient } from 'fhir/r4b';

import { ResourceListPage, navigationAction } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { formatHumanDate, renderHumanName } from '@beda.software/emr/utils';

export function PatientList() {
    return (
        <ResourceListPage<Patient>
            headerTitle={t`Patients`}
            resourceType="Patient"
            getTableColumns={() => [
                {
                    title: <Trans>Name</Trans>,
                    dataIndex: 'name',
                    key: 'name',
                    render: (_text, { resource }) => renderHumanName(resource.name?.[0]),
                    width: 300,
                },
                {
                    title: <Trans>Birth date</Trans>,
                    dataIndex: 'birthDate',
                    key: 'birthDate',
                    render: (_text, { resource }) => (resource.birthDate ? formatHumanDate(resource.birthDate) : null),
                },
                {
                    title: <Trans>Gender</Trans>,
                    dataIndex: 'gender',
                    key: 'gender',
                    render: (_text, { resource }) => resource.gender,
                },
            ]}
            getFilters={() => [
                {
                    id: 'name',
                    searchParam: 'name',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`Find patient`,
                    placement: ['search-bar', 'table'],
                },
            ]}
            getRecordActions={(record) => [
                navigationAction('View', `/patients/${record.resource.id}`),
                navigationAction('Refer', `/referrals/new/${record.resource.id}`),
            ]}
        />
    );
}
