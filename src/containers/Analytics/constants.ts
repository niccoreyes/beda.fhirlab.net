import { Coding } from 'fhir/r4b';

export const GENDER_OPTIONS: Coding[] = [
    {
        code: 'male',
        system: 'http://hl7.org/fhir/administrative-gender',
        display: 'Male',
    },
    {
        code: 'female',
        system: 'http://hl7.org/fhir/administrative-gender',
        display: 'Female',
    },
    {
        code: 'other',
        system: 'http://hl7.org/fhir/administrative-gender',
        display: 'Other',
    },
    {
        code: 'unknown',
        system: 'http://hl7.org/fhir/administrative-gender',
        display: 'Unknown',
    },
];

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
