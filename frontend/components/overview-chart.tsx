"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface ChartProps {
  data: {
    termo: string;
    quantidade: number;
  }[];
}

export function OverviewChart({ data }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-75 items-center justify-center text-sm text-muted-foreground">
        Nenhum dado suficiente para o gráfico.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="termo"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          cursor={{ fill: 'var(--accent)' }}
          contentStyle={{ 
            backgroundColor: 'var(--background)', 
            borderColor: 'var(--border)',
            borderRadius: '8px',
            color: 'var(--foreground)'
          }}
        />
        {/* A cor 'currentColor' faz o gráfico herdar a cor do texto/tema atual */}
        <Bar
          dataKey="quantidade"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary" 
        />
      </BarChart>
    </ResponsiveContainer>
  )
}