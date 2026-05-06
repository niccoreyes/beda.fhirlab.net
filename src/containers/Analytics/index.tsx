import { t } from '@lingui/macro';
import { Empty, Flex, Typography } from 'antd';
import { Coding } from 'fhir/r4b';
import { Moment } from 'moment';
import { useCallback } from 'react';
import { SingleValue } from 'react-select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { DatePicker, PageContainer, Select, Spinner } from '@beda.software/emr/components';
import { RenderRemoteData } from '@beda.software/fhir-react';

import { S } from './Analytics.styles';
import { COLORS, GENDER_OPTIONS } from './constants';
import { AnalyticsFilters, useActiveDataDetails, useAnalytics, ActiveDataDetailsProps } from './hooks';
const { RangePicker } = DatePicker;

interface AnalyticsHeaderProps {
    filters: AnalyticsFilters;
    handleGenderChange: (newValue: SingleValue<Coding>) => void;
    handleDateRangeChange: (dates: [Moment | null, Moment | null] | null) => void;
}

function ActiveDataDetails(props: ActiveDataDetailsProps) {
    const { response } = useActiveDataDetails(props);

    return (
        <S.ActiveDataDetailsContainer>
            <S.CloseButton type="link" onClick={props.onClose}>
                {t`Close`}
            </S.CloseButton>
            <RenderRemoteData remoteData={response} renderLoading={Spinner}>
                {(data) => {
                    return (
                        <S.DetailsTable
                            rowKey={props.activeData.code}
                            bordered
                            pagination={false}
                            dataSource={[
                                {
                                    total: data.total_patients,
                                    key: `${data.total_patients}-${props.activeData.code}`,
                                    vaccined: data.vaccinated_patients,
                                },
                            ]}
                            columns={[
                                { title: 'Total patients', dataIndex: 'total', key: 'total-patients' },
                                { title: 'Vaccined', dataIndex: 'vaccined', key: 'vaccined' },
                            ]}
                        />
                    );
                }}
            </RenderRemoteData>
        </S.ActiveDataDetailsContainer>
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
                    onChange={handleGenderChange as any}
                    getOptionLabel={getOptionLabel}
                    classNamePrefix="react-select"
                    placeholder={t`Choose gender`}
                    isClearable
                    isMulti={false}
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
            title={t`Immunization dashboard`}
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
                            {data.length > 0 ? (
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
                                                    onClick={(data:any) => {
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
                                            filters={filters}
                                            activeData={activeData}
                                            onClose={() => setActiveData(null)}
                                        />
                                    )}
                                </Flex>
                            ) : (
                                <Empty
                                    description={t`No data`}
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                            <S.LegendContainer>
                                {data.map((entry, index) => (
                                    <S.LegendItem key={index}>
                                        <S.ColorIndicator $color={COLORS[index % COLORS.length]} />
                                        <S.LegendText>
                                            {entry.title
                                                ? `${entry.title} | terminology code: ${entry.code}`
                                                : t`No data`}
                                        </S.LegendText>
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
