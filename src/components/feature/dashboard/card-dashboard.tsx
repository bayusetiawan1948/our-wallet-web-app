import type { ElementType } from "react";
import { cn } from "@/libs/utils";
import {
  TrendUpIcon,
  TrendDownIcon,
  WalletIcon,
  MoneyIcon,
  CreditCardIcon,
  ChartLineUpIcon,
} from "@phosphor-icons/react";

export interface DashboardSummaryCard {
  id: string;
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: ElementType;
}

export const DUMMY_SUMMARY_CARDS: DashboardSummaryCard[] = [
  {
    id: "net-worth",
    title: "NET WORTH",
    value: "Rp 1.452.880k",
    trend: "+12.4% vs month",
    isPositive: true,
    icon: WalletIcon,
  },
  {
    id: "total-assets",
    title: "TOTAL ASSETS",
    value: "Rp 1.840.500k",
    trend: "+8.2% vs month",
    isPositive: true,
    icon: MoneyIcon,
  },
  {
    id: "liabilities",
    title: "LIABILITIES",
    value: "Rp 387.620k",
    trend: "-2.1% vs month",
    isPositive: false,
    icon: CreditCardIcon,
  },
  {
    id: "savings-rate",
    title: "SAVINGS RATE",
    value: "42.5%",
    trend: "+1.5% vs month",
    isPositive: true,
    icon: ChartLineUpIcon,
  },
];

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
      <div
        className={cn(
          "flex flex-row items-center gap-2 px-4 py-1 caption-sm",
          card.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        )}
      >
        <TrendIcon className="w-3.5 h-3.5" />
        <span>{card.trend}</span>
      </div>
    </div>
  );
}
