import { t, Trans } from '@lingui/macro';
import { Patient } from 'fhir/r4b';

import { ResourceListPage, navigationAction } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { formatHumanDate, renderHumanName, compileAsFirst } from '@beda.software/emr/utils';

const getPhilHealthId = compileAsFirst<Patient, string>(
    "Patient.identifier.where(system='http://philhealth.gov.ph/fhir/Identifier/philhealth-id').value",
);
const getPhilsysId = compileAsFirst<Patient, string>(
    "Patient.identifier.where(system='http://philsys.gov.ph/fhir/Identifier/philsys-id').value",
);

export function PatientList() {
    return (
        <ResourceListPage<Patient>
            headerTitle={t`Patients`}
            resourceType="Patient"
            searchParams={{ _total: 'accurate', _count: 50 }}
            tableProps={{ scroll: { x: 'max-content' } }}
            getTableColumns={() => [
                {
                    title: <Trans>Name</Trans>,
                    dataIndex: 'name',
                    key: 'name',
                    render: (_text, { resource }) => renderHumanName(resource.name?.[0]),
                    width: 250,
                },
                {
                    title: <Trans>Birth date</Trans>,
                    dataIndex: 'birthDate',
                    key: 'birthDate',
                    render: (_text, { resource }) => (resource.birthDate ? formatHumanDate(resource.birthDate) : null),
                    width: 110,
                },
                {
                    title: <Trans>Gender</Trans>,
                    dataIndex: 'gender',
                    key: 'gender',
                    render: (_text, { resource }) => resource.gender,
                    width: 90,
                },
                {
                    title: <Trans>PhilHealth ID</Trans>,
                    dataIndex: 'identifier',
                    key: 'philhealth',
                    render: (_text, { resource }) => getPhilHealthId(resource) ?? '',
                    width: 150,
                },
                {
                    title: <Trans>PhilSys ID</Trans>,
                    dataIndex: 'identifier',
                    key: 'philsys',
                    render: (_text, { resource }) => getPhilsysId(resource) ?? '',
                    width: 180,
                },
                {
                    title: <Trans>Contact</Trans>,
                    dataIndex: 'telecom',
                    key: 'contact',
                    render: (_text, { resource }) =>
                        resource.telecom?.map(t => t.value).join(', ') || '',
                    width: 160,
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
                {
                    id: 'gender',
                    searchParam: 'gender',
                    type: SearchBarColumnType.CHOICE,
                    placeholder: t`Gender`,
                    options: [
                        { value: { Coding: { code: 'male', display: 'Male' } } },
                        { value: { Coding: { code: 'female', display: 'Female' } } },
                    ],
                    placement: ['table'],
                },
                {
                    id: 'birthDate',
                    searchParam: 'birthdate',
                    type: SearchBarColumnType.SINGLEDATE,
                    placeholder: t`Birth date`,
                    placement: ['table'],
                },
            ]}
            getRecordActions={(record) => [
                navigationAction('View', `/patients/${record.resource.id}`),
                navigationAction('Refer', `/referrals/new/${record.resource.id}`),
            ]}
        />
    );
}
