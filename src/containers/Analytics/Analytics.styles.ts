import { Flex } from 'antd';
import styled from 'styled-components';

export const S = {
    HeaderContainer: styled(Flex)`
        gap: 16px;
    `,
    ChartContainer: styled(Flex)`
        flex: 1 1 300px; /* grow on large screens, shrink on small */
        min-width: 260px; /* ensures chart fits on small screens */
        max-width: 400px; /* don't get excessively large */
        height: 350px; /* fixed height for Pie chart */
    `,
    MainContainer: styled(Flex)`
        width: 100%;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: center;
        gap: 32px;
    `,
    LegendContainer: styled(Flex)`
        flex: 1; /* shrinkable, but wide enough for labels */
        min-width: 200px;
        flex-direction: column;
        gap: 12px;
    `,
    LegendItem: styled(Flex)`
        align-items: center;
        gap: 8px;
    `,
    ColorIndicator: styled.div<{ $color: string }>`
        width: 12px;
        height: 12px;
        background-color: ${({ $color }) => $color};
        border-radius: 2px;
    `,
    LegendText: styled.span`
        word-break: break-word;
        color: ${({ theme }) => theme.primary};
    `,
};
