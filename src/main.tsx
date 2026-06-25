import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Set dummy auth token so sidebar renders
if (!localStorage.getItem('token')) {
    localStorage.setItem('token', 'anonymous');
}

import { sharedAuthorizedUser } from '@beda.software/emr/sharedState';

sharedAuthorizedUser.setSharedState({
    resourceType: 'User',
    id: 'anonymous',
} as any);

import '@beda.software/emr/dist/services/initialize';
import 'antd/dist/reset.css';
import '@beda.software/emr/dist/style.css';

import { BaseLayout } from '@beda.software/emr/components';
import { MenuLayout } from '@beda.software/emr/dist/components/BaseLayout/Sidebar/SidebarTop/context';
import { FooterLayout, defaultFooterLayout } from '@beda.software/emr/dist/components/BaseLayout/Footer/context';
import { ThemeProvider } from '@beda.software/emr/theme';

import { PatientList } from './containers/PatientList';
import { PatientDetail } from './containers/PatientDetail';
import { EncounterList } from './containers/EncounterList';
import { EncounterDetail } from './containers/EncounterDetail';
import { EncounterNew } from './containers/EncounterNew';
import { EReferralNew } from './containers/EReferralNew';
import { EReferralList } from './containers/EReferralList';
import { EReferralDetail } from './containers/EReferralDetail';
import { PractitionerList } from './containers/PractitionerList';
import { OrganizationList } from './containers/OrganizationList';
import {
    PatientsIcon,
    EncountersIcon,
    PractitionersIcon,
    OrganizationsIcon,
    QuestionnairesIcon,
} from '@beda.software/emr/icons';
import { dynamicActivate, getCurrentLocale } from './services/i18n';

const menuLayout = () => [
    { label: 'Patients', path: '/patients', icon: <PatientsIcon /> as React.ReactElement },
    { label: 'Encounters', path: '/encounters', icon: <EncountersIcon /> as React.ReactElement },
    { label: 'Practitioners', path: '/practitioners', icon: <PractitionersIcon /> as React.ReactElement },
    { label: 'Organizations', path: '/organizations', icon: <OrganizationsIcon /> as React.ReactElement },
    { label: 'Referrals', path: '/referrals', icon: <QuestionnairesIcon /> as React.ReactElement },
];

function AppLayout() {
    return (
        <MenuLayout.Provider value={menuLayout}>
            <FooterLayout.Provider value={defaultFooterLayout}>
                <BaseLayout>
                    <Routes>
                        <Route path="/patients" element={<PatientList />} />
                        <Route path="/patients/:id" element={<PatientDetail />} />
                        <Route path="/encounters" element={<EncounterList />} />
                        <Route path="/encounters/new" element={<EncounterNew />} />
                        <Route path="/encounters/:id" element={<EncounterDetail />} />
                        <Route path="/practitioners" element={<PractitionerList />} />
                        <Route path="/organizations" element={<OrganizationList />} />
                        <Route path="/referrals/new/:patientId" element={<EReferralNew />} />
                        <Route path="/referrals" element={<EReferralList />} />
                        <Route path="/referrals/:id" element={<EReferralDetail />} />
                        <Route path="*" element={<Navigate to="/patients" replace />} />
                    </Routes>
                </BaseLayout>
            </FooterLayout.Provider>
        </MenuLayout.Provider>
    );
}

export const AppWithContext = () => {
    useEffect(() => {
        dynamicActivate(getCurrentLocale());
    }, []);

    return (
        <I18nProvider i18n={i18n}>
            <ThemeProvider>
                <BrowserRouter>
                    <AppLayout />
                </BrowserRouter>
            </ThemeProvider>
        </I18nProvider>
    );
};

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppWithContext />
    </React.StrictMode>,
);
