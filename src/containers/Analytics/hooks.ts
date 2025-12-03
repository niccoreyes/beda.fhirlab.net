import { Coding } from 'fhir/r4b';
import { Moment } from 'moment';
import { useCallback, useState } from 'react';
import { SingleValue } from 'react-select';

import { service } from '@beda.software/emr/services';
import { formatFHIRDate, useService } from '@beda.software/fhir-react';

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

    return { response, filters, handleGenderChange, handleDateRangeChange };
}
