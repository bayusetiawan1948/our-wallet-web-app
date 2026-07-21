import { useState } from "react";
import { formatCompactNumber } from "@/libs/utils";
import { PADDING_GLOBAL } from "@/consts/style.global";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CaretDownIcon } from "@phosphor-icons/react";

const CURRENCIES = [
  { value: "IDR", label: "IDR (Rp)" },
  { value: "USD", label: "USD ($)" },
  { value: "JPY", label: "JPY (¥)" },
];

const DUMMY_WALLETS = [
  { id: "main", name: "MAIN WALLET" },
  { id: "savings", name: "SAVINGS WALLET" },
  { id: "investment", name: "INVESTMENT WALLET" },
  { id: "emergency", name: "EMERGENCY FUND" },
];

export default function Page() {
  const [currency, setCurrency] = useState<string>("IDR");
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>(["main"]);

  const toggleWallet = (id: string) => {
    setSelectedWalletIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const getWalletDisplayLabel = () => {
    if (selectedWalletIds.length === 0) return "Select Wallet";

    const firstSelected = DUMMY_WALLETS.find((w) => selectedWalletIds.includes(w.id));
    const firstName = firstSelected ? firstSelected.name : "MAIN WALLET";

    if (selectedWalletIds.length === 1) {
      return firstName;
    }

    const extraCount = selectedWalletIds.length - 1;
    return `${firstName} +${extraCount}`;
  };

  return (
    <div className='flex flex-1 flex-col min-w-0 w-full py-8 sm:px-8 sm:py-6 gap-4'>
      <div className='px-10 sm:p-0'>
        <h1 className="body-md">Dashboard</h1>
        <p className="caption-sm">Real-time financial status tracking</p>
      </div>
      <div className="flex flex-col gap-8 min-w-0 w-full sm:flex-row sm:gap-1">
        <div className="relative flex w-full max-w-full min-w-0 border-2 border-primary overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <Marquee pauseOnHover className="caption-sm num-financial py-1" repeat={4}>
            <p>{`BCA ${formatCompactNumber(10000000)}`}</p>
            <p>{`NIAGA ${formatCompactNumber(10000000)}`}</p>
            <p>{`BNI ${formatCompactNumber(112334432)}`}</p>
            <p>{`BMRI ${formatCompactNumber(10000000)}`}</p>
          </Marquee>
        </div>
        <div className="flex items-center justify-end gap-3">
          {/* Currency Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 font-medium">
                <span>{currency}</span>
                <CaretDownIcon className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel>Mata Uang</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={currency} onValueChange={setCurrency}>
                {CURRENCIES.map((item) => (
                  <DropdownMenuRadioItem key={item.value} value={item.value}>
                    {item.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Wallet Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 font-medium">
                <span>{getWalletDisplayLabel()}</span>
                <CaretDownIcon className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Pilih Wallet</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {DUMMY_WALLETS.map((wallet) => (
                <DropdownMenuCheckboxItem
                  key={wallet.id}
                  checked={selectedWalletIds.includes(wallet.id)}
                  onCheckedChange={() => toggleWallet(wallet.id)}
                >
                  {wallet.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
