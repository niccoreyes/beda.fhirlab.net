export interface ReferralFormData {
    sendingPractitionerPRCId: string;
    sendingPractitionerName: string;
    sendingPractitionerRole: string;

    sendingFacilityId: string;
    sendingFacilityName: string;
    sendingFacilityNHFR: string;
    sendingFacilityHCPN: string;

    receivingPractitionerPRCId: string;
    receivingPractitionerName: string;
    receivingPractitionerRole: string;

    receivingFacilityId: string;
    receivingFacilityName: string;
    receivingFacilityNHFR: string;
    receivingFacilityHCPN: string;

    referralDate: string;
    referralCategory: 'emergency' | 'outpatient';
    reasonForReferralCode: string;
    reasonForReferralDisplay: string;
    reasonForReferralText: string;

    patientId: string;

    encounterId: string;
    encounterDate: string;

    chiefComplaint: string;
    chiefComplaintCode: string;
    workingImpression: string;
    workingImpressionCode: string;
    clinicalHistory: string;

    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    heartRate: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    temperature: number;
    weight: number;

    treatmentGiven: string;
    labResults: string;
    labResultsAttachment: string;

    clinicalNote: string;
    requisitionId: string;
}
