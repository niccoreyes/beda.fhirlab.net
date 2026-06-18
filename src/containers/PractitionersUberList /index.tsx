import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Practitioner } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { renderHumanName, formatHumanDate } from '@beda.software/emr/utils';

export function PractitionersUberList() {
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
                    width: '35%',
                },
                {
                    title: <Trans>Birth date</Trans>,
                    dataIndex: 'birthDate',
                    key: 'birthDate',
                    render: (_text, { resource }) =>
                        resource.birthDate ? formatHumanDate(resource.birthDate) : null,
                    width: '20%',
                },
                {
                    title: <Trans>Language</Trans>,
                    dataIndex: 'communication',
                    key: 'communication',
                    render: (_text, { resource }) =>
                        resource.communication
                            ?.map(
                                (item) =>
                                    item.text ?? item.coding?.[0]?.display ?? item.coding?.[0]?.code,
                            )
                            .filter(Boolean)
                            .join(', ') || null,
                    width: '15%',
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
            ]}
            getRecordActions={(record) => [
                questionnaireAction('Edit', 'practitioner-create-connectathon', {
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Practitioner', resource: record.resource },
                            ],
                        },
                    },
                }),
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Add practitioner</Trans>, 'practitioner-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Practitioner', resource: { resourceType: 'Practitioner' } },
                            ],
                        },
                    },
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of Practitioner`,
                    value: bundle.total,
                },
            ]}
        ></ResourceListPage>
    );
}
