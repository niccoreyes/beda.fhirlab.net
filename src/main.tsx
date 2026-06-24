import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';
import { I18nProvider } from '@lingui/react';
import { Coding, Reference } from 'fhir/r4b';
import React, { useEffect } from 'react';
// eslint-disable-next-line import/order
import { createRoot } from 'react-dom/client';

import '@beda.software/emr/dist/services/initialize';
import 'antd/dist/reset.css';
import '@beda.software/emr/dist/style.css';

// You can copy dashboard into your project workspace and adjust appearance and widgets.
// Use https://github.com/beda-software/fhir-emr/blob/master/src/dashboard.config.ts as example;

// You can specify your own theme to ajdust color,
// Use you https://github.com/beda-software/fhir-emr/blob/master/src/theme/ThemeProvider.tsx as example
import { Route } from 'react-router-dom';

import { User } from '@beda.software/aidbox-types';
import { AidboxFormsBuilder, EMR } from '@beda.software/emr/containers';
import { ValueSetExpandProvider } from '@beda.software/emr/contexts';
import { PatientDashboardProvider } from '@beda.software/emr/dist/components/Dashboard/contexts';
import { fetchUserRoleDetails } from '@beda.software/emr/dist/containers/App/utils';
import { dashboard } from '@beda.software/emr/dist/dashboard.config';
import {
    InvoicesIcon,
    ServicesIcon,
    EncountersIcon,
    PatientsIcon,
    PractitionersIcon,
    MedicationsIcon,
    OrganizationsIcon,
} from '@beda.software/emr/icons';
import { createFHIRResource, expandExternalTerminology, getUserInfo } from '@beda.software/emr/services';
import { sharedAuthorizedUser } from '@beda.software/emr/sharedState';
import { ThemeProvider } from '@beda.software/emr/theme';
import { matchCurrentUserRole, Role } from '@beda.software/emr/utils';
import { isSuccess, RemoteDataResult, isFailure } from '@beda.software/remote-data';

import { Analytics } from './containers/Analytics';
import { EncountersUberList } from './containers/EncountersUberList';
import { ImmunizationsUberList } from './containers/ImmunizationsUberList ';
import { MedicationsUberList } from './containers/MedicationsUberList';
import { ObservationsUberList } from './containers/ObservationsUberList';
import { OrganizationsUberList } from './containers/OrganizationsUberList';
import { PatientUberList } from './containers/PatientsUberList';
import { PatientDetails } from './containers/PatientsUberList/detail';
import { PractitionerRolesUberList } from './containers/PractitionerRolesUberList';
import { PractitionersUberList } from './containers/PractitionersUberList ';
import { ProceduresUberList } from './containers/ProceduresUberList';
import { QuestionnaireList } from './containers/Questionnaire/list';
import { SignIn } from './containers/SignIn';
import { dynamicActivate, getCurrentLocale } from './services/i18n';

async function expandEMRValueSet(
    answerValueSet: string | undefined,
    searchText: string,
    preferredTerminologyServer?: string,
): Promise<Coding[]> {
    if (!answerValueSet) {
        return [];
    }

    if (answerValueSet) {
        const res = await expandExternalTerminology(
            preferredTerminologyServer ?? 'https://tx.fhirlab.net/fhir',
            answerValueSet,
            searchText,
        );
        if (isSuccess(res)) {
            return res.data;
        }
    }

    return [];
}

interface AidboxRole {
    resourceType: 'Role';
    name: string;
    user: Reference;
    links: Record<string, Reference>;
}

export async function populateUserInfoSharedState(): Promise<RemoteDataResult<User>> {
    const userResponse = await getUserInfo();

    if (isFailure(userResponse)) {
        return userResponse;
    }
    const user = userResponse.data;

    sharedAuthorizedUser.setSharedState(user);

    if (user.role) {
        await fetchUserRoleDetails(user);
    } else {
        await createFHIRResource<AidboxRole>(
            {
                resourceType: 'Role',
                name: 'admin',
                user: {
                    reference: `User/${user.id}`,
                },
                links: {
                    organization: {
                        reference: 'Organization/beda-emr',
                    },
                },
            },
            { '.user.id': user.id },
        );
        const updatedUserResponse = await getUserInfo();
        if (isFailure(updatedUserResponse)) {
            return updatedUserResponse;
        }
        const updatedUser = updatedUserResponse.data;
        sharedAuthorizedUser.setSharedState(updatedUser);
        await fetchUserRoleDetails(updatedUser);
        return updatedUserResponse;
    }

    return userResponse;
}

function menuLayout() {
    return matchCurrentUserRole({
        [Role.Admin]: () => [
            { label: t`Patients`, path: '/patients-ph', icon: <PatientsIcon /> },
            { label: t`Encounters`, path: '/encounters-ph', icon: <EncountersIcon /> },
            {
                label: t`Practitioners`,
                path: '/practitioners-ph',
                icon: <PractitionersIcon />,
            },
            {
                label: t`Organizations`,
                path: '/organizations-ph',
                icon: <OrganizationsIcon />,
            },
            {
                label: t`Practitioner roles`,
                path: '/practitionerroles-ph',
                icon: <PractitionersIcon />,
            },
            { label: t`Immunizations`, path: '/immunizations-ph', icon: <InvoicesIcon /> },
            { label: t`Observations`, path: '/observations-ph', icon: <ServicesIcon /> },
            { label: t`Medications`, path: '/medications-ph', icon: <MedicationsIcon /> },
            { label: t`Procedures`, path: '/procedures-ph', icon: <ServicesIcon /> },
            { label: t`Questionnaire`, path: '/questionnaires-ph', icon: <ServicesIcon /> },
            { label: t`Analytics`, path: '/analytics-ph', icon: <ServicesIcon /> },
        ],
        [Role.Practitioner]: () => [],
        [Role.Patient]: () => [],
        [Role.Receptionist]: () => [],
    });
}

export const AppWithContext = () => {
    useEffect(() => {
        dynamicActivate(getCurrentLocale());
    }, []);

    return (
        <I18nProvider i18n={i18n}>
            <ValueSetExpandProvider.Provider value={expandEMRValueSet}>
                <PatientDashboardProvider dashboard={dashboard}>
                    <ThemeProvider>
                        <EMR
                            menuLayout={menuLayout}
                            populateUserInfoSharedState={populateUserInfoSharedState}
                            anonymousRoutes={
                                <>
                                    <Route path="/signin" element={<SignIn />} />
                                </>
                            }
                            authenticatedRoutes={
                                <>
                                    <Route path="/patients-ph" element={<PatientUberList />} />
                                    <Route path="/patients-ph/:id/*" element={<PatientDetails />} />
                                    <Route path="/encounters-ph" element={<EncountersUberList />} />
                                    <Route path="/practitioners-ph" element={<PractitionersUberList />} />
                                    <Route path="/organizations-ph" element={<OrganizationsUberList />} />
                                    <Route path="/practitionerroles-ph" element={<PractitionerRolesUberList />} />
                                    <Route path="/procedures-ph" element={<ProceduresUberList />} />
                                    <Route path="/immunizations-ph" element={<ImmunizationsUberList />} />
                                    <Route path="/observations-ph" element={<ObservationsUberList />} />
                                    <Route path="/medications-ph" element={<MedicationsUberList />} />
                                    <Route path="/questionnaires-ph" element={<QuestionnaireList />} />
                                    <Route path="/analytics-ph" element={<Analytics />} />
                                    <Route
                                        path="/questionnaires-ph/aidbox-forms-builder/new"
                                        element={<AidboxFormsBuilder />}
                                    />
                                    <Route
                                        path="/questionnaires-ph/aidbox-forms-builder/:id/edit"
                                        element={<AidboxFormsBuilder />}
                                    />
                                </>
                            }
                        />
                    </ThemeProvider>
                </PatientDashboardProvider>
            </ValueSetExpandProvider.Provider>
        </I18nProvider>
    );
};

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppWithContext />
    </React.StrictMode>,
);
