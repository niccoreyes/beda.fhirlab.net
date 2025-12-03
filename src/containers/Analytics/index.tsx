import { t } from '@lingui/macro';
import { Button, Flex, Table, Typography } from 'antd';
import { Coding } from 'fhir/r4b';
import { Moment } from 'moment';
import { useCallback } from 'react';
import { SingleValue } from 'react-select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { DatePicker, PageContainer, Select, Spinner } from '@beda.software/emr/components';
import { RenderRemoteData } from '@beda.software/fhir-react';

import { S } from './Analytics.styles';
import { COLORS, GENDER_OPTIONS } from './constants';
import { AnalyticsFilters, ChartData, useAnalytics } from './hooks';
const { RangePicker } = DatePicker;

interface AnalyticsHeaderProps {
    filters: AnalyticsFilters;
    handleGenderChange: (newValue: SingleValue<Coding>) => void;
    handleDateRangeChange: (dates: [Moment | null, Moment | null] | null) => void;
}

interface ActiveDataDetailsProps {
    activeData: ChartData;
    total: number;
    onClose: () => void;
}

function ActiveDataDetails(props: ActiveDataDetailsProps) {
    return (
        <Flex style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }} vertical align="flex-start">
            <Button type="link" onClick={props.onClose} style={{ alignSelf: 'flex-end' }}>
                {t`Close`}
            </Button>
            <Table
                style={{ width: '100%' }}
                bordered
                pagination={false}
                dataSource={[{ total: props.total, vaccined: props.activeData.count }]}
                columns={[
                    { title: 'Total', dataIndex: 'total', key: 'total' },
                    { title: 'Vaccined', dataIndex: 'vaccined', key: 'vaccined' },
                ]}
            />
        </Flex>
    );
}

function AnalyticsHeader(props: AnalyticsHeaderProps) {
    const { filters, handleGenderChange, handleDateRangeChange } = props;
    const getOptionLabel = useCallback((option: Coding) => {
        return option?.display || '';
    }, []);

    return (
        <S.HeaderContainer>
            <S.FieldWrapper>
                <S.Label>{t`Gender`}</S.Label>
                <Select<Coding>
                    value={filters.selectedGender}
                    options={GENDER_OPTIONS}
                    onChange={handleGenderChange}
                    getOptionLabel={getOptionLabel}
                    classNamePrefix="react-select"
                    placeholder={t`Choose gender`}
                    isClearable
                />
            </S.FieldWrapper>
            <S.FieldWrapper>
                <S.Label>{t`Birth Date`}</S.Label>
                <RangePicker
                    placeholder={[t`Date from`, t`Date to`]}
                    value={filters.birthDateRange}
                    onChange={handleDateRangeChange}
                    allowClear
                />
            </S.FieldWrapper>
        </S.HeaderContainer>
    );
}

export function Analytics() {
    const { response, filters, handleGenderChange, handleDateRangeChange, activeData, setActiveData } = useAnalytics();

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
            <Typography.Title level={5}>{t`Immunizations by vaccine`}</Typography.Title>
            <RenderRemoteData remoteData={response} renderLoading={Spinner}>
                {(data) => {
                    return (
                        <S.MainContainer>
                            {/* Responsive Chart Container */}
                            <Flex vertical gap={16}>
                                <S.ChartContainer>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data}
                                                dataKey="count"
                                                nameKey="title"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius="80%"
                                                onClick={(data) => {
                                                    setActiveData({
                                                        code: data.code,
                                                        title: data.title,
                                                        count: data.count,
                                                    });
                                                }}
                                            >
                                                {data.map((_, index) => (
                                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </S.ChartContainer>
                                {activeData && (
                                    <ActiveDataDetails
                                        total={0}
                                        activeData={activeData}
                                        onClose={() => setActiveData(null)}
                                    />
                                )}
                            </Flex>
                            {/* Legend */}
                            <S.LegendContainer>
                                {data.map((entry, index) => (
                                    <S.LegendItem key={index}>
                                        <S.ColorIndicator $color={COLORS[index % COLORS.length]} />
                                        <S.LegendText>{`${entry.title} | terminology code: ${entry.code}`}</S.LegendText>
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
