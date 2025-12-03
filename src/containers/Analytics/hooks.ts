import { Coding } from 'fhir/r4b';
import { Moment } from 'moment';
import { useCallback, useState } from 'react';
import { SingleValue } from 'react-select';

import { service } from '@beda.software/emr/services';
import { formatFHIRDate, useService } from '@beda.software/fhir-react';
import { mapSuccess } from '@beda.software/remote-data';

export interface ChartData {
    title: string;
    code: string;
    count: number;
}
export interface AnalyticsFilters {
    selectedGender: SingleValue<Coding> | null;
    birthDateRange: [Moment | null, Moment | null] | null;
}

export function useAnalytics() {
    const [activeData, setActiveData] = useState<ChartData | null>(null);
    const [filters, setFilters] = useState<AnalyticsFilters>({
        selectedGender: null,
        birthDateRange: null,
    });
    const [response] = useService(async () => {
        const conditions: string[] = [];
        const params: (string | null)[] = [];

        if (filters.birthDateRange?.[0] && filters.birthDateRange?.[1]) {
            conditions.push("(p.resource#>>'{birthDate}')::date >= ? and (p.resource#>>'{birthDate}')::date <= ?");
            params.push(formatFHIRDate(filters.birthDateRange[0]), formatFHIRDate(filters.birthDateRange[1]));
        }

        if (filters.selectedGender?.code) {
            conditions.push("p.resource#>>'{gender}' = ?");
            params.push(filters.selectedGender.code);
        }

        const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
        const sqlQuery = `select i.resource#>>'{vaccineCode,coding,0,display}' as title, i.resource#>>'{vaccineCode,coding,0,code}' as code, count(i.id) from immunization i join patient p on i.resource#>>'{patient,id}' = p.id${whereClause} group by i.resource#>>'{vaccineCode,coding,0,display}', i.resource#>>'{vaccineCode,coding,0,code}'`;

        const sqlResponse = await service<ChartData[]>({
            url: '/$sql',
            method: 'POST',
            data: [sqlQuery, ...params],
        });
        return sqlResponse;
    }, [filters]);

    const handleGenderChange = useCallback((newValue: SingleValue<Coding>) => {
        setFilters((prev) => ({
            ...prev,
            selectedGender: newValue,
        }));
    }, []);

    const handleDateRangeChange = useCallback((dates: [Moment | null, Moment | null] | null) => {
        setFilters((prev) => ({
            ...prev,
            birthDateRange: dates,
        }));
    }, []);

    return { response, filters, handleGenderChange, handleDateRangeChange, activeData, setActiveData };
}

export interface ActiveDataDetailsProps {
    activeData: ChartData;
    onClose: () => void;
    filters: AnalyticsFilters;
}

export function useActiveDataDetails(props: ActiveDataDetailsProps) {
    const { activeData, filters } = props;

    const [response] = useService(async () => {
        const patientConditions: string[] = [];
        const params: (string | null)[] = [];

        if (filters.birthDateRange?.[0] && filters.birthDateRange?.[1]) {
            patientConditions.push("(resource#>>'{birthDate}')::date >= ? and (resource#>>'{birthDate}')::date <= ?");
            params.push(formatFHIRDate(filters.birthDateRange[0]), formatFHIRDate(filters.birthDateRange[1]));
        }

        if (filters.selectedGender?.code) {
            patientConditions.push("resource#>>'{gender}' = ?");
            params.push(filters.selectedGender.code);
        }
        const immunizationConditions = ["i.resource#>>'{vaccineCode,coding,0,code}' = ?"];
        params.push(activeData.code);
        const patientWhereClause = patientConditions.length > 0 ? `WHERE ${patientConditions.join(' AND ')}` : '';
        const immunizationWhereClause =
            immunizationConditions.length > 0 ? `WHERE ${immunizationConditions.join(' AND ')}` : '';

        const sqlQuery = `with filtered_patients as (select id from patient ${patientWhereClause}) select (select count(*) from filtered_patients) as total_patients, (select count(distinct i.resource#>>'{patient,id}') from immunization i join filtered_patients fp on i.resource#>>'{patient,id}' = fp.id ${immunizationWhereClause}) as vaccinated_patients`;
        const sqlResponse = mapSuccess(
            await service<Array<{ total_patients: number; vaccinated_patients: number }>>({
                url: '/$sql',
                method: 'POST',
                data: [sqlQuery, ...params],
            }),
            (data) => data[0],
        );
        return sqlResponse;
    }, [activeData.code, filters]);
    return { response };
}
