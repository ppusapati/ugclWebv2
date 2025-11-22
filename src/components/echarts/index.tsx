// src/components/EChart.tsx
import { component$, useVisibleTask$, useSignal, PropFunction } from '@builder.io/qwik';
import * as echarts from 'echarts';

export interface EChartProps {
  option: any;
  style?: string;
  onClick?: PropFunction<() => void>;
}

export const EChart = component$((props: EChartProps) => {
  const chartRef = useSignal<Element>();

  useVisibleTask$(({ track }) => {
    track(() => props.option);
    if (chartRef.value) {
      const chart = echarts.init(chartRef.value as HTMLDivElement);
      chart.setOption(props.option, true);
      if (props.onClick) chart.on('click', () => { props.onClick!(); });
      return () => chart.dispose();
    }
  });

  return (
    <div ref={chartRef} style={props.style ?? "width:100%;height:320px;"} />
  );
});
