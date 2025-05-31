declare module 'react-native-chart-kit' {
  import { ViewStyle } from 'react-native';

  export interface LineChartData {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: (opacity?: number) => string;
      strokeWidth?: number;
    }>;
  }

  export interface ChartConfig {
    backgroundGradientFrom: string;
    backgroundGradientTo: string;
    color: (opacity?: number) => string;
    strokeWidth?: number;
    barPercentage?: number;
    useShadowColorFromDataset?: boolean;
    decimalPlaces?: number;
    formatYLabel?: (value: string) => string;
    formatXLabel?: (value: string) => string;
  }

  export interface LineChartProps {
    data: LineChartData;
    width: number;
    height: number;
    chartConfig: ChartConfig;
    bezier?: boolean;
    style?: ViewStyle;
    withDots?: boolean;
    withInnerLines?: boolean;
    withOuterLines?: boolean;
    withVerticalLines?: boolean;
    withHorizontalLines?: boolean;
    withVerticalLabels?: boolean;
    withHorizontalLabels?: boolean;
    fromZero?: boolean;
    segments?: number;
    yAxisInterval?: number;
  }

  export class LineChart extends React.Component<LineChartProps> {}
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
} 