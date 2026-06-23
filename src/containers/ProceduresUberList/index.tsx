import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Procedure } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { compileAsFirst, formatHumanDateTime } from '@beda.software/emr/utils';

export const getProcedureCode = compileAsFirst<Procedure, string>(
    'Procedure.code.text | Procedure.code.coding.first().display',
);
export const getSubjectLabel = compileAsFirst<Procedure, string>(
    'Procedure.subject.display | Procedure.subject.reference',
);
export const getPerformedDateTime = compileAsFirst<Procedure, string>(
    'Procedure.performedDateTime | Procedure.performedPeriod.start',
);

export function ProceduresUberList() {
    return (
        <ResourceListPage<Procedure>
            headerTitle="Procedures"
            resourceType="Procedure"
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
                    title: 'Date',
                    dataIndex: 'date',
                    key: 'date',
                    width: 200,
                    render: (_text: any, { resource }) => formatHumanDateTime(getPerformedDateTime(resource)),
                },
                {
                    title: 'Code',
                    key: 'code',
                    render: (_text: any, { resource }) => getProcedureCode(resource),
                },
                {
                    title: 'Patient',
                    key: 'patient',
                    render: (_text: any, { resource }) => getSubjectLabel(resource),
                },
            ]}
            getFilters={() => [
                {
                    id: 'status',
                    searchParam: 'status',
                    type: SearchBarColumnType.CHOICE,
                    placeholder: t`Choose status`,
                    options: [
                        {
                            value: {
                                Coding: {
                                    code: 'completed',
                                    display: 'Completed',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'in-progress',
                                    display: 'In progress',
                                },
                            },
                        },
                    ],
                    placement: ['table', 'search-bar'],
                },
                {
                    id: 'patient',
                    searchParam: 'patient:Patient.name',
                    type: SearchBarColumnType.STRING,
                    placeholder: 'Find by patient',
                    placement: ['search-bar', 'table'],
                },
                {
                    id: 'encounter',
                    searchParam: 'encounter',
                    type: SearchBarColumnType.REFERENCE,
                    placeholder: 'Find by encounter',
                    expression: 'Encounter',
                    path: "class.display + ' - ' + period.start",
                    placement: ['search-bar', 'table'],
                },
            ]}
            getRecordActions={(record) => [
                questionnaireAction('Edit', 'procedure-create-connectathon', {
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Procedure', resource: record.resource },
                            ],
                        },
                    },
                }),
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Create procedure</Trans>, 'procedure-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Procedure', resource: { resourceType: 'Procedure' } as Procedure},
                            ],
                        },
                    },
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of Procedures`,
                    value: bundle.total,
                },
            ]}
        />
    );
}
