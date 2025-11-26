import { CheckCircleOutlined } from '@ant-design/icons';
import { t } from '@lingui/macro';
import { Modal } from 'antd';
import { Patient, Bundle, Composition } from 'fhir/r4b';
import { Route, Routes } from 'react-router-dom';

import { Spinner } from '@beda.software/emr/components';
import { PatientDashboardProvider } from '@beda.software/emr/dist/components/Dashboard/contexts';
import { PatientDocument } from '@beda.software/emr/dist/containers/PatientDetails/PatientDocument/index';
import { PatientDocumentDetails } from '@beda.software/emr/dist/containers/PatientDetails/PatientDocumentDetails/index';
import { PatientDocuments } from '@beda.software/emr/dist/containers/PatientDetails/PatientDocuments/index';
import { PatientOverview } from '@beda.software/emr/dist/containers/PatientDetails/PatientOverviewDynamic/index';
import { ResourceDetailPage, Tab } from '@beda.software/emr/dist/uberComponents/ResourceDetailPage/index';
import { compileAsFirst, selectCurrentUserRoleResource } from '@beda.software/emr/dist/utils/index';
import { extractBundleResources, RenderRemoteData, WithId } from '@beda.software/fhir-react';

import { dashboard } from './dashboard';
import { useDocuments } from './hooks';

const { confirm } = Modal;

const getName = compileAsFirst<Patient, string>("Patient.name.given.first() + ' ' + Patient.name.family");

const tabs: Array<Tab<WithId<Patient>>> = [
    {
        path: '',
        label: 'Overview',
        component: ({ resource }) => <PatientOverview patient={resource} />,
    },
    {
        path: 'documents',
        label: 'Documents',
        component: ({ resource }) => <Documents patient={resource} />,
    },
];

function Documents({ patient }: { patient: WithId<Patient> }) {
    const author = selectCurrentUserRoleResource();
    const { response, prepareResultBundle } = useDocuments(patient);
    return (
        <RenderRemoteData remoteData={response} renderLoading={Spinner}>
            {(resourcesMap) => (
                <Routes>
                    <Route path="/" element={<PatientDocuments patient={patient} />} />
                    <Route
                        path="/new/:questionnaireId"
                        element={
                            <PatientDocument
                                patient={patient}
                                author={author}
                                autoSave={true}
                                onSuccess={({ extracted, questionnaireResponse, extractedBundle }) => {
                                    if (extracted && questionnaireResponse.questionnaire === 'curated-ips') {
                                        const bundleWithComposition = extractedBundle[0] as Bundle<Composition>;
                                        const composition =
                                            extractBundleResources(bundleWithComposition).Composition[0];
                                        const ipsBundle = prepareResultBundle(composition, resourcesMap);
                                        confirm({
                                            icon: <CheckCircleOutlined />,
                                            title: t`IPS Bundle is prepared`,
                                            onOk: () => {
                                                navigator.clipboard.writeText(JSON.stringify(ipsBundle, null, 2));
                                                window.history.back();
                                            },
                                            onCancel: () => {
                                                window.history.back();
                                            },
                                            okType: 'primary',
                                            okText: t`Copy to clipboard`,
                                            cancelText: t`Cancel`,
                                        });
                                    }
                                }}
                            />
                        }
                    />
                    <Route path="/:qrId/*" element={<PatientDocumentDetails patient={patient} />} />
                </Routes>
            )}
        </RenderRemoteData>
    );
}

export function PatientDetails() {
    return (
        <PatientDashboardProvider dashboard={dashboard}>
            <ResourceDetailPage<Patient>
                resourceType="Patient"
                getSearchParams={({ id }) => ({ _id: id })}
                getTitle={({ resource, bundle }) => getName(resource, { bundle })!}
                tabs={tabs}
            />
        </PatientDashboardProvider>
    );
}
