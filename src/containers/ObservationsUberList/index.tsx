import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Observation } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { compileAsFirst, formatHumanDateTime } from '@beda.software/emr/utils';

export const getEffectiveDateTime = compileAsFirst<Observation, string>(
    'Observation.effectiveDateTime | Observation.effective.dateTime',
);

export const getSubjectLabel = compileAsFirst<Observation, string>(
    "Observation.subject.display | Observation.subject.reference | (Observation.subject.resourceType & '/' & Observation.subject.id)",
);

export const getObservationCode = compileAsFirst<Observation, string>(
    'Observation.code.coding.first().display',
);

export const getObservationValue = compileAsFirst<Observation, string>(
    "Observation.dataAbsentReason.text | Observation.dataAbsentReason.coding.first().display | (Observation.valueQuantity.value.toString() + ' ' + Observation.valueQuantity.unit) | Observation.valueCodeableConcept.text | Observation.valueCodeableConcept.coding.first().display | Observation.component.select((code.coding.first().display | code.text) + ': ' + (dataAbsentReason.text | (valueQuantity.value.toString() + ' ' + valueQuantity.unit))).join(' | ') | 'Unknown'",
);

export function ObservationsUberList() {
    return (
        <ResourceListPage<Observation>
            headerTitle="Observations"
            resourceType="Observation"
            searchParams={{ profile: 'https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-observation' }}
            getTableColumns={() => [
                {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (_text: any, { resource }) => resource.status,
                },
                {
                    title: 'Date',
                    dataIndex: 'date',
                    key: 'date',
                    render: (_text: any, { resource }) => formatHumanDateTime(getEffectiveDateTime(resource)),
                },
                {
                    title: 'Patient',
                    dataIndex: 'patient',
                    key: 'patient',
                    render: (_text: any, { resource }) => getSubjectLabel(resource),
                },
                {
                    title: 'Code',
                    dataIndex: 'code',
                    key: 'code',
                    render: (_text: any, { resource }) => getObservationCode(resource),
                },
                {
                    title: 'Value',
                    dataIndex: 'value',
                    key: 'value',
                    render: (_text: any, { resource }) => getObservationValue(resource),
                },
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Create observation</Trans>, 'observation-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'Patient', resource: { resourceType: 'Patient' } },
                            ],
                        },
                    },
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of Observation`,
                    value: bundle.total,
                },
            ]}
        />
    );
}
