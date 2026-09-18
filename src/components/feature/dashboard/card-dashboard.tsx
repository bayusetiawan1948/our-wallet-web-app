import type { ElementType } from "react";
import { cn } from "@/libs/utils";
import { TrendUpIcon, TrendDownIcon } from "@phosphor-icons/react";

export interface DashboardSummaryCard {
  id: string;
  title: string;
  value: string;
  trend?: string;
  isPositive?: boolean;
  icon: ElementType;
}

interface CardDashboardProps {
  card: DashboardSummaryCard;
}

export function CardDashboard({ card }: CardDashboardProps) {
  const IconComponent = card.icon;
  const TrendIcon = card.isPositive ? TrendUpIcon : TrendDownIcon;

  return (
    <div className="w-full bg-card border border-border rounded-xs flex flex-col items-start gap-2 overflow-hidden shadow-xs">
      <div className="p-4 w-full flex flex-col items-start gap-2 bg-muted/40 rounded-b-xs border-b border-border/40">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-row items-center gap-2">
            <div className="w-0.5 h-4 bg-primary" />
            <p className="caption-sm text-muted-foreground uppercase">{card.title}</p>
          </div>
          <div className="text-primary">
            <IconComponent weight="fill" className="size-4" />
          </div>
        </div>
        <div>
          <p className="body-lg font-semibold num-financial text-card-foreground">{card.value}</p>
        </div>
      </div>
      {card.trend && (
        <div
          className={cn(
            "flex flex-row items-center gap-2 px-4 py-1 caption-sm",
            card.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}
        >
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{card.trend}</span>
        </div>
      )}
    </div>
  );
}
