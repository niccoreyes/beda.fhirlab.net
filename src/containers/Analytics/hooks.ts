import { Coding } from 'fhir/r4b';
import { Moment } from 'moment';
import { useCallback, useState } from 'react';
import { SingleValue } from 'react-select';

import { service } from '@beda.software/emr/services';
import { useService } from '@beda.software/fhir-react';

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
    const [response] = useService(async () => {
        const sqlResponse = await service<ChartData[]>({
            url: '/$sql',
            method: 'POST',
            data: [
                "select resource#>>'{vaccineCode,coding, 0,display}' as title,resource#>>'{vaccineCode,coding, 0,code}' as code, count(id) from immunization group by resource#>>'{vaccineCode,coding, 0,display}',resource#>>'{vaccineCode,coding, 0,code}'",
            ],
        });
        return sqlResponse;
    });
    const [filters, setFilters] = useState<AnalyticsFilters>({
        selectedGender: null,
        birthDateRange: null,
    });

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
