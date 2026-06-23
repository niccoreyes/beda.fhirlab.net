import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Organization } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { compileAsFirst } from '@beda.software/emr/utils';

const NHFR_SYSTEM = 'https://fhir.doh.gov.ph/phcore/Identifier/doh-nhfr-code';

const getNhfrCode = compileAsFirst<Organization, string>(
    `Organization.identifier.where(system='${NHFR_SYSTEM}').value`,
);

export function OrganizationsUberList() {
    return (
        <ResourceListPage<Organization>
            headerTitle={t`Organizations`}
            resourceType="Organization"
            getTableColumns={() => [
                {
                    title: <Trans>Name</Trans>,
                    dataIndex: 'name',
                    key: 'name',
                    render: (_text, { resource }) => resource.name,
                    width: '35%',
                },
                {
                    title: <Trans>DOH NHFR Code</Trans>,
                    dataIndex: 'identifier',
                    key: 'identifier',
                    render: (_text, { resource }) => getNhfrCode(resource),
                    width: '25%',
                },
                {
                    title: <Trans>Active</Trans>,
                    dataIndex: 'active',
                    key: 'active',
                    render: (_text, { resource }) =>
                        resource.active === undefined ? null : resource.active ? t`Yes` : t`No`,
                    width: '15%',
                },
            ]}
            getFilters={() => [
                {
                    id: 'name',
                    searchParam: 'name',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`Find organization`,
                    placement: ['search-bar', 'table'],
                },
            ]}
            getRecordActions={(record) => [
                questionnaireAction('Edit', 'organization-create-connectathon', {
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Organization', resource: record.resource },
                            ],
                        },
                    },
                }),
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Add organization</Trans>, 'organization-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Organization', resource: { resourceType: 'Organization' } },
                            ],
                        },
                    },
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of Organization`,
                    value: bundle.total,
                },
            ]}
        ></ResourceListPage>
    );
}
