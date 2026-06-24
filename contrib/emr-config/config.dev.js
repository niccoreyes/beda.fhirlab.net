const config = {
    clientId: 'web-local',

    wearablesAccessConsentCodingSystem: 'https://fhir.emr.beda.software/CodeSystem/consent-subject',

    tier: 'production',
    baseURL: 'https://aidbox.fhirlab.net',
    sdcIdeUrl: 'https://sdc.beda.software',
    aiQuestionnaireBuilderUrl: 'https://builder.emr.beda.software',

    sdcBackendUrl: null,
    webSentryDSN: null,
    mobileSentryDSN: null,
    jitsiMeetServer: 'video.emr.beda.software/',
    wearablesDataStreamService: 'https://ingest.emr.beda.software/api/v1',
    metriportIdentifierSystem: 'https://api.sandbox.metriport.com',
    aiAssistantServiceUrl: 'https://scribe.emr.beda.software',
    bedaFormsUrl: 'https://beda-forms.emr.beda.software/',
};

export { config as default };
