import { t } from '@lingui/macro';
import { Coding } from 'fhir/r4b';
import { Moment } from 'moment';
import { useCallback } from 'react';
import { SingleValue } from 'react-select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { DatePicker, PageContainer, Select } from '@beda.software/emr/components';
import { RenderRemoteData } from '@beda.software/fhir-react';

import { S } from './Analytics.styles';
import { COLORS, GENDER_OPTIONS } from './constants';
import { AnalyticsFilters, useAnalytics } from './hooks';

const { RangePicker } = DatePicker;

interface AnalyticsHeaderProps {
    filters: AnalyticsFilters;
    handleGenderChange: (newValue: SingleValue<Coding>) => void;
    handleDateRangeChange: (dates: [Moment | null, Moment | null] | null) => void;
}

function AnalyticsHeader(props: AnalyticsHeaderProps) {
    const { filters, handleGenderChange, handleDateRangeChange } = props;
    console.log('filters', filters);
    const getOptionLabel = useCallback((option: Coding) => {
        return option?.display || '';
    }, []);

    return (
        <S.HeaderContainer>
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
        </S.HeaderContainer>
    );
}

export function Analytics() {
    const { response, filters, handleGenderChange, handleDateRangeChange } = useAnalytics();

    return (
        <PageContainer
            title={t`Analytics`}
            headerContent={
                <AnalyticsHeader
                    filters={filters}
                    handleGenderChange={handleGenderChange}
                    handleDateRangeChange={handleDateRangeChange}
                />
            }
        >
            <RenderRemoteData remoteData={response}>
                {(data) => {
                    return (
                        <S.MainContainer>
                            {/* Responsive Chart Container */}
                            <S.ChartContainer>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data}
                                            dataKey="count"
                                            nameKey="title"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius="80%" // scales with container width
                                        >
                                            {data.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </S.ChartContainer>

                            {/* Legend */}
                            <S.LegendContainer>
                                {data.map((entry, index) => (
                                    <S.LegendItem key={index}>
                                        <S.ColorIndicator $color={COLORS[index % COLORS.length]} />
                                        <S.LegendText>{entry.title}</S.LegendText>
                                    </S.LegendItem>
                                ))}
                            </S.LegendContainer>
                        </S.MainContainer>
                    );
                }}
            </RenderRemoteData>
        </PageContainer>
    );
}
