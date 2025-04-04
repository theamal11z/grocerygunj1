import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
  description?: string;
  onClick?: () => void;
  trend?: {
    data: number[];
    color?: string;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-primary",
  className,
  description,
  onClick,
  trend
}) => {
  const bgColorClass = useMemo(() => {
    if (!iconColor) return 'bg-primary/10';
    
    // Extract the color name without the shade
    const matches = iconColor.match(/text-(.*?)(-\d+)?$/);
    if (matches && matches[1]) {
      return `bg-${matches[1]}-100 dark:bg-${matches[1]}-900/30`;
    }
    
    return iconColor.replace("text-", "bg-") + "/10";
  }, [iconColor]);
  
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-semibold">{value}</p>
              
              {change && (
                <div className="flex items-center">
                  <span
                    className={cn(
                      "text-xs font-medium flex items-center gap-1",
                      change.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {change.isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {change.value}
                  </span>
                </div>
              )}
            </div>
            
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          
          <div className={cn(
            "p-3 rounded-full",
            bgColorClass
          )}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 h-8">
            <div className="flex items-end h-full w-full gap-[2px]">
              {trend.data.map((item, index) => {
                const height = Math.max(10, Math.min(100, item)) + '%';
                return (
                  <div 
                    key={index}
                    className={cn(
                      "flex-1 rounded-sm",
                      trend.color || "bg-primary/15"
                    )} 
                    style={{ 
                      height,
                      transition: 'height 0.3s ease',
                      transitionDelay: `${index * 50}ms`
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
