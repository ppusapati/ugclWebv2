// src/components/EChart.tsx
// eslint-disable-next-line qwik/no-use-visible-task
import { component$, useVisibleTask$, useSignal, type PropFunction } from '@builder.io/qwik';

export interface EChartProps {
  option: any;
  style?: string;
  onClick?: PropFunction<() => void>;
}

export const EChart = component$((props: EChartProps) => {
  const chartRef = useSignal<Element>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track, cleanup }) => {
    track(() => props.option);
    const el = chartRef.value;
    if (!el || !props.option) return;
    const echarts = await import('echarts');
    // Dispose any existing instance before (re)initialising
    const existing = echarts.getInstanceByDom(el as HTMLDivElement);
    if (existing) existing.dispose();
    const chart = echarts.init(el as HTMLDivElement);
    chart.setOption(props.option, true);
    if (props.onClick) chart.on('click', () => { props.onClick!(); });
    cleanup(() => chart.dispose());
  });

  return (
    <div ref={chartRef} style={props.style ?? "width:100%;height:320px;"} />
  );
});
