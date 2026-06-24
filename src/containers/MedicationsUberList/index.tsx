import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Medication } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';

export function MedicationsUberList() {
    return (
        <ResourceListPage<Medication>
            headerTitle="Medications"
            resourceType="Medication"
            searchParams={{ profile: 'https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-medication' }}
            getTableColumns={() => [
                {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (_text: any, { resource }) => {
                        return resource.status;
                    },
                },
                {
                    title: 'Code',
                    dataIndex: 'code',
                    key: 'code',
                    render: (_text: any, { resource }) => {
                        return resource.code?.coding?.[0]?.display;
                    },
                },
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Create medication</Trans>, 'medication-create-connectathon', {
                    icon: <PlusOutlined />,
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of Medication`,
                    value: bundle.total,
                },
            ]}
        />
    );
}
