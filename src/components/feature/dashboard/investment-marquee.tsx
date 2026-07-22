import { Marquee } from "@/components/ui/marquee";
import { formatRupiah } from "@/libs/number";
import { TrendUp, TrendDown } from "@phosphor-icons/react";

export interface InvestmentItem {
  symbol: string;
  name: string;
  type: "Saham" | "Crypto" | "Emas" | string;
  badge: string;
  costBasis: number;
  marketValue: number;
  unrealizedPl: number;
  unrealizedPlPercent: number;
  badgeColorClass?: string;
  typeBadgeClass?: string;
}

export const DEFAULT_INVESTMENT_ITEMS: InvestmentItem[] = [
  {
    symbol: "BBCA.JK",
    name: "Bank Central Asia",
    type: "Saham",
    badge: "BB",
    costBasis: 450000000,
    marketValue: 512450000,
    unrealizedPl: 62450000,
    unrealizedPlPercent: 13.8,
    badgeColorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    typeBadgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    symbol: "ETH/IDR",
    name: "Ethereum Network",
    type: "Crypto",
    badge: "ET",
    costBasis: 200000000,
    marketValue: 245890000,
    unrealizedPl: 45890000,
    unrealizedPlPercent: 22.9,
    badgeColorClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    typeBadgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    symbol: "Logam Mulia",
    name: "Antam 24K Physical",
    type: "Emas",
    badge: "AU",
    costBasis: 120000000,
    marketValue: 125400000,
    unrealizedPl: 5400000,
    unrealizedPlPercent: 4.5,
    badgeColorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    typeBadgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  {
    symbol: "TLKM.JK",
    name: "Telkom Indonesia",
    type: "Saham",
    badge: "TL",
    costBasis: 180000000,
    marketValue: 172500000,
    unrealizedPl: -7500000,
    unrealizedPlPercent: -4.1,
    badgeColorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    typeBadgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
];

interface InvestmentMarqueeProps {
  items?: InvestmentItem[];
}

export function InvestmentMarquee({ items = DEFAULT_INVESTMENT_ITEMS }: InvestmentMarqueeProps) {
  return (
    <div className="relative flex w-full max-w-full min-w-0 items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
      <Marquee pauseOnHover className="py-1" repeat={4}>
        {items.map((item, index) => {
          const isPositive = item.unrealizedPl >= 0;
          return (
            <div
              key={`${item.symbol}-${index}`}
              className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-card/60 px-3 py-1.5 backdrop-blur-xs transition-colors hover:bg-card/90"
            >
              {/* Badge initials */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border text-[11px] font-bold tracking-tight ${
                  item.badgeColorClass || "bg-muted text-muted-foreground"
                }`}
              >
                {item.badge}
              </div>

              {/* Instrument Info */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold tracking-tight text-foreground">
                    {item.symbol}
                  </span>
                  <span
                    className={`rounded px-1 py-0.2 text-[10px] font-medium border ${
                      item.typeBadgeClass || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-foreground/80 num-financial">
                  {formatRupiah(item.marketValue)}
                </span>
              </div>

              {/* Unrealized P/L */}
              <div className="ml-1 flex items-center gap-1 text-xs font-medium num-financial">
                {isPositive ? (
                  <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                    <TrendUp className="h-3.5 w-3.5 shrink-0" />
                    <span>+{item.unrealizedPlPercent.toFixed(1)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                    <TrendDown className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.unrealizedPlPercent.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Marquee>
    </div>
  );
}
