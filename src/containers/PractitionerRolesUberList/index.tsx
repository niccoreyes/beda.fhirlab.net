import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Bundle, Practitioner, PractitionerRole } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';

function practitionerFromBundle(bundle: Bundle, practitionerId?: string) {
    if (!practitionerId) {
        return undefined;
    }

    return bundle.entry
        ?.map((entry) => entry.resource)
        .find(
            (resource): resource is Practitioner =>
                resource?.resourceType === 'Practitioner' && resource.id === practitionerId,
        );
}

function formatSpecialties(resource: PractitionerRole) {
    return resource.specialty
        ?.map((item) => item.text ?? item.coding?.[0]?.display)
        .filter(Boolean)
        .join(', ');
}

function practitionerLaunchContext(resource: PractitionerRole, bundle?: Bundle) {
    const practitionerId = resource.practitioner?.reference?.replace('Practitioner/', '');
    const practitioner =
        practitionerFromBundle(bundle ?? { resourceType: 'Bundle', type: 'searchset' }, practitionerId) ??
        (practitionerId
            ? ({ resourceType: 'Practitioner', id: practitionerId } as Practitioner)
            : ({ resourceType: 'Practitioner' } as Practitioner));

    return [
        { name: 'PractitionerRole', resource },
        { name: 'Practitioner', resource: practitioner },
    ];
}

export function PractitionerRolesUberList() {
    return (
        <ResourceListPage<PractitionerRole>
            headerTitle={t`Practitioner roles`}
            resourceType="PractitionerRole"
            searchParams={{
                _include: ['PractitionerRole:practitioner'],
                profile: 'https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-practitionerrole',
            }}
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
                    render: (_text, { resource }) => formatSpecialties(resource),
                    width: 220,
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
                            launchContextParameters: practitionerLaunchContext(record.resource, record.bundle),
                        },
                    },
                }),
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Add practitioner role</Trans>, 'practitionerrole-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: practitionerLaunchContext({
                                resourceType: 'PractitionerRole',
                            }),
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
