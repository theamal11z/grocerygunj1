import { useMemo } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  TooltipProps,
  Legend
} from "recharts";
import { 
  ValueType, 
  NameType
} from "recharts/types/component/DefaultTooltipContent";
// import { useTheme } from "@/components/theme-provider";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

// Sample data - would be replaced with real API data in production
const monthlyData = [
  { name: "Jan", revenue: 4000, orders: 40 },
  { name: "Feb", revenue: 3000, orders: 30 },
  { name: "Mar", revenue: 5000, orders: 50 },
  { name: "Apr", revenue: 8000, orders: 75 },
  { name: "May", revenue: 7000, orders: 65 },
  { name: "Jun", revenue: 9000, orders: 85 },
  { name: "Jul", revenue: 11000, orders: 95 },
  { name: "Aug", revenue: 12000, orders: 110 },
  { name: "Sep", revenue: 14000, orders: 120 },
  { name: "Oct", revenue: 13000, orders: 115 },
  { name: "Nov", revenue: 16000, orders: 130 },
  { name: "Dec", revenue: 18000, orders: 140 },
];

const weeklyData = [
  { name: "Week 1", revenue: 8500, orders: 72 },
  { name: "Week 2", revenue: 9200, orders: 84 },
  { name: "Week 3", revenue: 11000, orders: 96 },
  { name: "Week 4", revenue: 10500, orders: 90 },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg shadow-lg border border-border bg-card p-3">
        <p className="text-sm font-medium mb-1">{label}</p>
        <div className="space-y-1">
          <p className="text-primary text-lg font-semibold flex items-baseline gap-1">
            np{payload[0].value as number}
            <span className="text-xs text-muted-foreground">revenue</span>
          </p>
          {payload[1] && (
            <p className="text-sm text-indigo-500 font-medium">
              {payload[1].value as number} orders
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export const RevenueChart = () => {
  // const { theme } = useTheme();
  const [dataType, setDataType] = useState<'monthly' | 'weekly'>('monthly');

  // Select the appropriate data based on the data type
  const chartData = useMemo(() => {
    return dataType === 'monthly' ? monthlyData : weeklyData;
  }, [dataType]);

  // Format the data to always show $ for the tooltip
  const formattedData = useMemo(() => {
    return chartData.map(item => ({
      ...item,
      revenue: Number(item.revenue),
      orders: Number(item.orders)
    }));
  }, [chartData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Revenue Overview</CardTitle>
          <CardDescription>
            {dataType === 'monthly' 
              ? 'Monthly revenue and orders for the current year' 
              : 'Weekly revenue and orders for the current month'}
          </CardDescription>
        </div>
        <Select 
          value={dataType} 
          onValueChange={(value: 'monthly' | 'weekly') => setDataType(value)}
        >
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly View</SelectItem>
            <SelectItem value="weekly">Weekly View</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="p-0 pt-4">
        <div className="h-[350px] w-full px-4 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--indigo-500, 240 85% 60%))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--indigo-500, 240 85% 60%))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                className="text-muted-foreground"
                dy={10}
              />
              <YAxis 
                tickFormatter={(value) => `np${value}`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                className="text-muted-foreground"
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                formatter={(value) => (
                  <span className={`text-xs font-medium ${value === 'revenue' ? 'text-primary' : 'text-indigo-500'}`}>
                    {value === 'revenue' ? 'Revenue' : 'Orders'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'white' }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                name="orders"
                stroke="hsl(var(--indigo-500, 240 85% 60%))"
                strokeWidth={2}
                fillOpacity={0.5}
                fill="url(#ordersGradient)"
                activeDot={{ r: 5, stroke: 'hsl(var(--indigo-500, 240 85% 60%))', strokeWidth: 2, fill: 'white' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
