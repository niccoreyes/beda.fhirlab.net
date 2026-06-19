import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { PractitionerRole } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';

export function PractitionerRolesUberList() {
    return (
        <ResourceListPage<PractitionerRole>
            headerTitle={t`Practitioner roles`}
            resourceType="PractitionerRole"
            getTableColumns={() => [
                {
                    title: <Trans>Practitioner</Trans>,
                    dataIndex: 'practitioner',
                    key: 'practitioner',
                    render: (_text, { resource }) =>
                        resource.practitioner?.display ?? resource.practitioner?.reference,
                    width: 250,
                },
                {
                    title: <Trans>Organization</Trans>,
                    dataIndex: 'organization',
                    key: 'organization',
                    render: (_text, { resource }) =>
                        resource.organization?.display ?? resource.organization?.reference,
                    width: 250,
                },
                {
                    title: <Trans>Role</Trans>,
                    dataIndex: 'code',
                    key: 'code',
                    render: (_text, { resource }) =>
                        resource.code?.[0]?.text ?? resource.code?.[0]?.coding?.[0]?.display,
                    width: 150,
                },
                {
                    title: <Trans>Specialty</Trans>,
                    dataIndex: 'specialty',
                    key: 'specialty',
                    render: (_text, { resource }) =>
                        resource.specialty?.[0]?.text ?? resource.specialty?.[0]?.coding?.[0]?.display,
                    width: 150,
                },
            ]}
            getFilters={() => [
                {
                    id: 'practitioner',
                    searchParam: 'practitioner:Practitioner.name',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`Find by practitioner`,
                    placement: ['search-bar', 'table'],
                },
                {
                    id: 'organization',
                    searchParam: 'organization:Organization.name',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`Find by organization`,
                    placement: ['search-bar', 'table'],
                },
            ]}
            getRecordActions={(record) => [
                questionnaireAction('Edit', 'practitionerrole-create-connectathon', {
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'PractitionerRole', resource: record.resource },
                            ],
                        },
                    },
                }),
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Add practitioner role</Trans>, 'practitionerrole-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'PractitionerRole', resource: { resourceType: 'PractitionerRole' } },
                            ],
                        },
                    },
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of practitioner roles`,
                    value: bundle.total,
                },
            ]}
        />
    );
}
