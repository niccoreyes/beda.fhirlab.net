import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Observation, ObservationComponent, Quantity, Reference } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { compileAsFirst, formatHumanDateTime } from '@beda.software/emr/utils';

type AidboxQuantityHolder = {
    valueQuantity?: Quantity;
    value?: { Quantity?: Quantity };
};

function getQuantity(holder?: AidboxQuantityHolder): Quantity | undefined {
    if (!holder) {
        return undefined;
    }
    return holder.valueQuantity ?? holder.value?.Quantity;
}

function getEffectiveDateTime(resource: Observation): string | undefined {
    return resource.effectiveDateTime ?? (resource as Observation & { effective?: { dateTime?: string } }).effective?.dateTime;
}

function getSubjectLabel(subject?: Reference): string | undefined {
    if (!subject) {
        return undefined;
    }
    if (subject.display) {
        return subject.display;
    }
    if (subject.reference) {
        return subject.reference;
    }
    const aidboxSubject = subject as Reference & { id?: string; resourceType?: string };
    if (aidboxSubject.id && aidboxSubject.resourceType) {
        return `${aidboxSubject.resourceType}/${aidboxSubject.id}`;
    }
    return undefined;
}

export const getObservationCode = compileAsFirst<Observation, string>('Observation.code.coding.first().display');

function getComponentValue(c: ObservationComponent) {
    if (c.dataAbsentReason) {
        return [c.dataAbsentReason.text];
    }
    const quantity = getQuantity(c);
    return [`${quantity?.value ?? ''} ${quantity?.unit ?? ''}`.trim()];
}

export const getObservationValue = (r: Observation): string | React.ReactElement => {
    if (r.dataAbsentReason) {
        return r.dataAbsentReason.text ?? r.dataAbsentReason.coding?.[0]?.display ?? 'unknown';
    }

    const quantity = getQuantity(r);
    if (quantity) {
        return `${quantity.value} ${quantity.unit}`;
    }

    if (r.valueCodeableConcept) {
        return r.valueCodeableConcept.text ?? r.valueCodeableConcept.coding?.[0]?.display ?? 'Unknown';
    }

    if (r.component) {
        return (
            <>
                {r.component
                    .map((c) => [...[c.code.coding?.[0]?.display], ...getComponentValue(c)].join(': '))
                    .map((v) => (
                        <div key={v}>{v}</div>
                    ))}
            </>
        );
    }

    return 'Unknown';
};

export function ObservationsUberList() {
    return (
        <ResourceListPage<Observation>
            headerTitle="Observations"
            resourceType="Observation"
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
                    render: (_text: any, { resource }) => formatHumanDateTime(getEffectiveDateTime(resource)),
                },
                {
                    title: 'Patient',
                    dataIndex: 'patient',
                    key: 'patient',
                    render: (_text: any, { resource }) => getSubjectLabel(resource.subject),
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
