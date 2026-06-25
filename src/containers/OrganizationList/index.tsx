import { t, Trans } from '@lingui/macro';
import { Organization } from 'fhir/r4b';

import { ResourceListPage, navigationAction } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { compileAsFirst } from '@beda.software/emr/utils';

const NHFR_SYSTEM = 'https://fhir.doh.gov.ph/phcore/Identifier/doh-nhfr-code';
const HCPN_SYSTEM = 'https://fhir.doh.gov.ph/phcore/Identifier/hcpn-code';

const getNhfrCode = compileAsFirst<Organization, string>(
    `Organization.identifier.where(system='${NHFR_SYSTEM}').value`,
);
const getHcpnCode = compileAsFirst<Organization, string>(
    `Organization.identifier.where(system='${HCPN_SYSTEM}').value`,
);

export function OrganizationList() {
    return (
        <ResourceListPage<Organization>
            headerTitle={t`Organizations`}
            resourceType="Organization"
            searchParams={{ _total: 'accurate', _count: 50 }}
            tableProps={{ scroll: { x: 'max-content' } }}
            getTableColumns={() => [
                {
                    title: <Trans>Name</Trans>,
                    dataIndex: 'name',
                    key: 'name',
                    render: (_text, { resource }) => resource.name,
                    width: 250,
                },
                {
                    title: <Trans>NHFR Code</Trans>,
                    dataIndex: 'identifier',
                    key: 'nhfr',
                    render: (_text, { resource }) => getNhfrCode(resource),
                    width: 120,
                },
                {
                    title: <Trans>HCPN Code</Trans>,
                    dataIndex: 'identifier',
                    key: 'hcpn',
                    render: (_text, { resource }) => getHcpnCode(resource),
                    width: 150,
                },
                {
                    title: <Trans>Phone</Trans>,
                    dataIndex: 'telecom',
                    key: 'phone',
                    render: (_text, { resource }) =>
                        resource.telecom?.find(t => t.system === 'phone')?.value || '-',
                    width: 150,
                },
                {
                    title: <Trans>Active</Trans>,
                    dataIndex: 'active',
                    key: 'active',
                    render: (_text, { resource }) =>
                        resource.active === undefined ? null : resource.active ? t`Yes` : t`No`,
                    width: 80,
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
                {
                    id: 'active',
                    searchParam: 'active',
                    type: SearchBarColumnType.CHOICE,
                    placeholder: t`Active`,
                    options: [
                        { value: { Coding: { code: 'true', display: 'Active' } } },
                        { value: { Coding: { code: 'false', display: 'Inactive' } } },
                    ],
                    placement: ['table'],
                },
            ]}
            getRecordActions={(record) => [
                navigationAction('View', `/organizations/${record.resource.id}`),
            ]}
        />
    );
}
