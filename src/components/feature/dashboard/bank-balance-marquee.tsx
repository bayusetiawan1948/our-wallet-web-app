import { Marquee } from "@/components/ui/marquee";
import { formatCompactNumber } from "@/libs/utils";

export interface BankBalanceItem {
  bank: string;
  amount: number;
}

export const DEFAULT_BANK_BALANCES: BankBalanceItem[] = [
  { bank: "BCA", amount: 10000000 },
  { bank: "NIAGA", amount: 10000000 },
  { bank: "BNI", amount: 112334432 },
  { bank: "BMRI", amount: 10000000 },
];

interface BankBalanceMarqueeProps {
  items?: BankBalanceItem[];
}

export function BankBalanceMarquee({ items = DEFAULT_BANK_BALANCES }: BankBalanceMarqueeProps) {
  return (
    <div className="relative flex w-full max-w-full min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <Marquee pauseOnHover className="py-1 caption-sm num-financial" repeat={4}>
        {items.map((item, index) => (
          <p key={`${item.bank}-${index}`}>{`${item.bank} ${formatCompactNumber(item.amount)}`}</p>
        ))}
      </Marquee>
    </div>
  );
}
