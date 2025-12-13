import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush } from 'recharts';
import { Transaction } from '../types';

interface PriceChartProps {
  data: Transaction[];
}

export const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  // Memoize the chart data processing to avoid expensive recalculations on re-renders
  const chartData = useMemo(() => {
    // 1. Sort by date first
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 2. Downsampling Algorithm
    // Rendering > 1000 SVG nodes kills performance and memory. 
    // We limit to ~500 points for visualization, which is enough to see the trend.
    const MAX_POINTS = 500;
    let processedData = sorted;

    if (sorted.length > MAX_POINTS) {
      const step = Math.ceil(sorted.length / MAX_POINTS);
      processedData = sorted.filter((_, index) => index % step === 0);
    }

    // 3. Format for Recharts
    return processedData.map(item => ({
      ...item,
      dateTimestamp: new Date(item.date).getTime(),
      displayPrice: Math.round(item.unitPrice / 10000)
    }));
  }, [data]);

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    return `${date.getFullYear()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-[480px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">單價分佈趨勢</h3>
        <div className="flex items-center gap-2">
            {data.length > 500 && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                    已優化顯示 {chartData.length} 筆 (總共 {data.length} 筆)
                </span>
            )}
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">可拖曳下方滑桿縮放</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="dateTimestamp" 
            domain={['auto', 'auto']} 
            name="日期" 
            tickFormatter={formatXAxis} 
            type="number"
            scale="time"
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            dataKey="displayPrice" 
            name="單價" 
            unit="萬" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            label={{ value: '單價 (萬)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: any, name: any, props: any) => {
                if (name === 'displayPrice' || name === '單價') return [`${value} 萬`, '單價'];
                if (name === 'dateTimestamp') return [new Date(value).toLocaleDateString(), '日期'];
                return [value, name];
            }}
            content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl text-sm min-w-[200px] z-50">
                      <div className="border-b border-slate-100 pb-2 mb-2">
                        <p className="font-bold text-slate-800 text-base">{data.project || '無建案名稱'}</p>
                        <p className="text-slate-500 text-xs">{data.address}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-slate-500">單價</span>
                            <span className="text-indigo-600 font-bold">{data.displayPrice} 萬/坪</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500">總價</span>
                            <span className="text-slate-700 font-medium">{Math.round(data.totalPrice / 10000)} 萬</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">日期</span>
                            <span className="text-slate-400">{data.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }}/>
          <Scatter 
            name="成交案件" 
            data={chartData} 
            fill="#6366f1" 
            opacity={0.6}
            stroke="#ffffff"
            strokeWidth={1}
            r={5}
            // Optimization: Do not animate dots when there are too many
            isAnimationActive={data.length < 100} 
          />
          <Brush 
            dataKey="dateTimestamp" 
            height={30} 
            stroke="#cbd5e1" 
            fill="#f8fafc" 
            tickFormatter={formatXAxis}
            travellerWidth={10}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};