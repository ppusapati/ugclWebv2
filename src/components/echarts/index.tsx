// src/components/EChart.tsx
import { component$, useVisibleTask$, useSignal, type PropFunction } from '@builder.io/qwik';

export interface EChartProps {
  option: any;
  style?: string;
  onClick?: PropFunction<() => void>;
}

export const EChart = component$((props: EChartProps) => {
  const chartRef = useSignal<Element>();

  useVisibleTask$(async ({ track }) => {
    track(() => props.option);
    if (chartRef.value) {
      // Dynamically import echarts to avoid SSR issues and build problems
      const echarts = await import('echarts');
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
