import { t } from '@lingui/macro';
import { Flex } from 'antd';
import { Coding } from 'fhir/r4b';
import { Moment } from 'moment';
import { useCallback, useState } from 'react';
import { SingleValue } from 'react-select';

import { DatePicker, PageContainer, Select } from '@beda.software/emr/components';

const { RangePicker } = DatePicker;

interface AnalyticsFilters {
    selectedGender: SingleValue<Coding> | null;
    birthDateRange: [Moment | null, Moment | null] | null;
}

const GENDER_OPTIONS: Coding[] = [
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

function AnalyticsHeader() {
    const [filters, setFilters] = useState<AnalyticsFilters>({
        selectedGender: null,
        birthDateRange: null,
    });
    console.log('filters', filters);

    const handleGenderChange = useCallback((newValue: SingleValue<Coding>) => {
        setFilters((prev) => ({
            ...prev,
            selectedGender: newValue,
        }));
    }, []);

    const handleDateRangeChange = useCallback(
        (dates: [Moment | null, Moment | null] | null) => {
            setFilters((prev) => ({
                ...prev,
                birthDateRange: dates,
            }));
        },
        [],
    );

    const getOptionLabel = useCallback((option: Coding) => {
        return option?.display || '';
    }, []);

    return (
        <Flex gap="middle">
            <Select<Coding>
                value={filters.selectedGender}
                options={GENDER_OPTIONS}
                onChange={handleGenderChange}
                getOptionLabel={getOptionLabel}
                classNamePrefix="react-select"
                placeholder={t`Choose gender`}
                isClearable
            />
            <RangePicker
                placeholder={[t`Start date`, t`End date`]}
                value={filters.birthDateRange}
                onChange={handleDateRangeChange}
                allowClear
            />
        </Flex>
    );
}

export function Analytics() {
    return (
        <PageContainer title={t`Analytics`} headerContent={<AnalyticsHeader />}>
            <Flex flex={1}>
                <div>Analytics</div>
            </Flex>
        </PageContainer>
    );
}
