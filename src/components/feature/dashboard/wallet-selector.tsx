import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaretDownIcon } from "@phosphor-icons/react";

export interface WalletOption {
  id: string;
  name: string;
}

interface WalletSelectorProps {
  selectedWalletIds: string[];
  onToggleWallet: (id: string) => void;
  wallets: WalletOption[];
}

export function WalletSelector({
  selectedWalletIds,
  onToggleWallet,
  wallets,
}: WalletSelectorProps) {
  const getWalletDisplayLabel = () => {
    if (wallets.length === 0) return "Tidak ada wallet";
    if (selectedWalletIds.length === 0) return "Select Wallet";

    const firstSelected = wallets.find((w) => selectedWalletIds.includes(w.id));
    const firstName = firstSelected ? firstSelected.name : wallets[0].name;

    if (selectedWalletIds.length === 1) {
      return firstName;
    }

    const extraCount = selectedWalletIds.length - 1;
    return `${firstName} +${extraCount}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-medium flex-1 xl:flex-none"
        >
          <span>{getWalletDisplayLabel()}</span>
          <CaretDownIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Pilih Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {wallets.map((wallet) => (
          <DropdownMenuCheckboxItem
            key={wallet.id}
            checked={selectedWalletIds.includes(wallet.id)}
            onCheckedChange={() => onToggleWallet(wallet.id)}
          >
            {wallet.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
