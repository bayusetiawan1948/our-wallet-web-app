import React, { useState, useId } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useMockStore } from "@/lib/mock-store";
import {
  FileXlsIcon,
  UploadSimpleIcon,
  CheckCircleIcon,
  TrashIcon,
  SparkleIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export interface ParsedItem {
  id: string;
  date: string; // YYYY-MM-DD
  type: "income" | "expense";
  amount: number;
  categoryId: string;
  note: string;
  selected: boolean;
  rawText?: string;
}

export function ImportTransactionsDialog() {
  const fileInputId = useId();
  const store = useMockStore();
  const activeUser = store.getActiveUser();
  const accessibleWallets = store.getAccessibleWallets();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    accessibleWallets[0]?.id || ""
  );
  const [selectedOwnerId] = useState<string>(activeUser.id);
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = () => {
    setFile(null);
    setParsedItems([]);
    setIsProcessing(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetState();
  };

  // Utility to match or pick default category
  const guessCategory = (description: string, type: "income" | "expense") => {
    const descLower = description.toLowerCase();
    const available = store.categories.filter(
      (c) => c.is_active && (c.type === "both" || c.type === type)
    );

    // Try keyword match
    const matched = available.find((c) => {
      const catName = c.name.toLowerCase();
      if (catName.includes("makanan") || catName.includes("resto")) {
        return (
          descLower.includes("makan") ||
          descLower.includes("resto") ||
          descLower.includes("cafe") ||
          descLower.includes("food") ||
          descLower.includes("grabfood") ||
          descLower.includes("gofood")
        );
      }
      if (catName.includes("gaji") || catName.includes("bonus")) {
        return (
          descLower.includes("gaji") ||
          descLower.includes("salary") ||
          descLower.includes("bonus") ||
          descLower.includes("payroll")
        );
      }
      if (catName.includes("bensin") || catName.includes("transport")) {
        return (
          descLower.includes("bensin") ||
          descLower.includes("pertamina") ||
          descLower.includes("shell") ||
          descLower.includes("gojek") ||
          descLower.includes("grab") ||
          descLower.includes("parkir") ||
          descLower.includes("toll")
        );
      }
      if (catName.includes("tagihan") || catName.includes("utilitas")) {
        return (
          descLower.includes("pln") ||
          descLower.includes("listrik") ||
          descLower.includes("air") ||
          descLower.includes("pdam") ||
          descLower.includes("wifi") ||
          descLower.includes("indihome") ||
          descLower.includes("pulsa")
        );
      }
      if (catName.includes("belanja")) {
        return (
          descLower.includes("supermarket") ||
          descLower.includes("tokopedia") ||
          descLower.includes("shopee") ||
          descLower.includes("indomaret") ||
          descLower.includes("alfamart")
        );
      }
      return descLower.includes(catName);
    });

    if (matched) return matched.id;
    return available[0]?.id || store.categories[0]?.id || "";
  };

  // Helper to parse dates into YYYY-MM-DD
  const normalizeDate = (rawDate: unknown): string => {
    if (!rawDate) return new Date().toISOString().split("T")[0];

    // Excel serial number format
    if (typeof rawDate === "number") {
      const parsedExcelDate = XLSX.SSF.parse_date_code(rawDate);
      if (parsedExcelDate) {
        const y = parsedExcelDate.y;
        const m = String(parsedExcelDate.m).padStart(2, "0");
        const d = String(parsedExcelDate.d).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }

    const str = String(rawDate).trim();
    // Check if DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[/\-.](d{1,2})[/\-.](d{2,4})$/);
    if (ddmmyyyy) {
      const d = ddmmyyyy[1].padStart(2, "0");
      const m = ddmmyyyy[2].padStart(2, "0");
      let y = ddmmyyyy[3];
      if (y.length === 2) y = "20" + y;
      return `${y}-${m}-${d}`;
    }

    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split("T")[0];
    }

    return new Date().toISOString().split("T")[0];
  };

  const processRowData = (rows: Record<string, unknown>[]) => {
    const items: ParsedItem[] = [];

    rows.forEach((rowRecord, idx) => {
      const row = rowRecord as Record<string, unknown> | unknown[];
      // Handle array format or object format
      let rawDate: unknown = "";
      let rawDesc: string = "";
      let rawAmount: number = 0;
      let type: "income" | "expense" = "expense";

      if (Array.isArray(row)) {
        if (row.length < 2) return;
        // Skip header if first row has text 'tanggal' or 'date'
        if (idx === 0 && String(row[0]).toLowerCase().includes("tang")) return;

        rawDate = row[0];
        rawDesc = String(row[1] || row[2] || "Transaksi Bank");

        // Find numeric value
        for (let i = 2; i < row.length; i++) {
          const val = row[i];
          if (typeof val === "number" && val !== 0) {
            rawAmount = val;
            break;
          } else if (typeof val === "string") {
            const clean = val.replace(/[^0-9.-]/g, "");
            const parsedNum = parseFloat(clean);
            if (!isNaN(parsedNum) && parsedNum !== 0) {
              rawAmount = parsedNum;
              break;
            }
          }
        }
      } else if (typeof row === "object" && row !== null) {
        const keys = Object.keys(row);
        const dateKey = keys.find((k) => /date|tanggal|tgl/i.test(k)) || keys[0];
        const descKey = keys.find((k) => /desc|keterangan|uraian|note|remark/i.test(k)) || keys[1];
        const amountKey = keys.find((k) => /amount|nominal|jumlah|mutasi/i.test(k));
        const typeKey = keys.find((k) => /type|jenis|db\/cr|cr\/db/i.test(k));

        rawDate = row[dateKey];
        rawDesc = String(row[descKey] || "Import Transaksi");

        if (amountKey && row[amountKey] !== undefined) {
          const val = row[amountKey];
          if (typeof val === "number") rawAmount = val;
          else {
            const clean = String(val).replace(/[^0-9.-]/g, "");
            rawAmount = parseFloat(clean) || 0;
          }
        } else {
          // Check income / expense split columns (Debit / Kredit)
          const debitKey = keys.find((k) => /debit|db|keluar/i.test(k));
          const creditKey = keys.find((k) => /kredit|cr|masuk/i.test(k));

          const debitVal = debitKey ? parseFloat(String(row[debitKey]).replace(/[^0-9.-]/g, "")) || 0 : 0;
          const creditVal = creditKey ? parseFloat(String(row[creditKey]).replace(/[^0-9.-]/g, "")) || 0 : 0;

          if (creditVal > 0) {
            rawAmount = creditVal;
            type = "income";
          } else if (debitVal > 0) {
            rawAmount = debitVal;
            type = "expense";
          }
        }

        if (typeKey && row[typeKey]) {
          const typeStr = String(row[typeKey]).toLowerCase();
          if (typeStr.includes("in") || typeStr.includes("cr") || typeStr.includes("masuk") || typeStr.includes("pemasukan")) {
            type = "income";
          } else if (typeStr.includes("out") || typeStr.includes("db") || typeStr.includes("keluar") || typeStr.includes("pengeluaran")) {
            type = "expense";
          }
        }
      }

      if (rawAmount < 0) {
        type = "expense";
        rawAmount = Math.abs(rawAmount);
      }

      if (rawAmount > 0) {
        const formattedDate = normalizeDate(rawDate);
        items.push({
          id: `import-${idx}-${Date.now()}`,
          date: formattedDate,
          type,
          amount: rawAmount,
          categoryId: guessCategory(rawDesc, type),
          note: rawDesc,
          selected: true,
          rawText: JSON.stringify(row),
        });
      }
    });

    setParsedItems(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    const ext = uploadedFile.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            processRowData(results.data as Record<string, unknown>[]);
          } else {
            // fallback no header
            Papa.parse(uploadedFile, {
              header: false,
              skipEmptyLines: true,
              complete: (resNoHeader) => {
                processRowData(resNoHeader.data as Record<string, unknown>[]);
              },
            });
          }
          setIsProcessing(false);
        },
        error: (err) => {
          toast.error(`Gagal membaca berkas CSV: ${err.message}`);
          setIsProcessing(false);
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as Record<string, unknown>[];
          processRowData(data);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Format tidak didukung";
          toast.error(`Gagal mengurai file Excel: ${msg}`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(uploadedFile);
    } else {
      toast.error("Format berkas tidak didukung! Harap unggah CSV atau Excel (.xlsx/.xls)");
      setIsProcessing(false);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  const handleToggleSelectItem = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleUpdateItem = <K extends keyof ParsedItem>(id: string, key: K, value: ParsedItem[K]) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setParsedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const selectedCount = parsedItems.filter((i) => i.selected).length;
  const totalAmountSelected = parsedItems
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + (i.type === "income" ? i.amount : -i.amount), 0);

  const handleImportSubmit = () => {
    const toImport = parsedItems.filter((i) => i.selected);

    if (toImport.length === 0) {
      toast.error("Tidak ada transaksi yang dipilih untuk di-import!");
      return;
    }

    if (!selectedWalletId) {
      toast.error("Pilih Wallet Target terlebih dahulu!");
      return;
    }

    let successCount = 0;
    toImport.forEach((item) => {
      const ok = store.addTransaction({
        wallet_id: selectedWalletId,
        category_id: item.categoryId,
        owner_id: selectedOwnerId,
        type: item.type,
        amount: item.amount,
        date: item.date,
        note: item.note,
      });
      if (ok) successCount++;
    });

    toast.success(`Berhasil meng-import ${successCount} transaksi ke dalam wallet!`);
    handleOpenChange(false);
  };

  const downloadSampleCSV = () => {
    const sample = `Tanggal,Deskripsi,Jenis,Nominal
2026-07-20,Gaji Bulanan PT Utama,pemasukan,15000000
2026-07-21,Supermarket Grand Indonesia,pengeluaran,450000
2026-07-22,Bensin Pertamax BCA,pengeluaran,250000
2026-07-23,Transfer Honor Project,pemasukan,2500000
2026-07-24,Pembayaran Tagihan PLN,pengeluaran,650000`;

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_import_rekening.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-border/80 hover:border-primary/50 shadow-2xs">
          <FileXlsIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
          Import Rekening / Statement
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[760px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileXlsIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
              Import Bank Statement (CSV / Excel)
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadSampleCSV}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <DownloadSimpleIcon className="size-3.5" />
              Download Template CSV
            </Button>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Unggah mutasi rekening bulanan Anda dalam format CSV atau Excel (.xlsx/.xls). Data akan diurai secara instan di browser Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Top Form Controls: Global Wallet Selection */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border/60">
            <div className="space-y-1.5 max-w-sm">
              <Label className="text-xs font-semibold">Target Wallet (Rekening Tujuan)</Label>
              <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                <SelectTrigger className="bg-background text-xs">
                  <SelectValue placeholder="Pilih Wallet" />
                </SelectTrigger>
                <SelectContent>
                  {accessibleWallets.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-xs">
                      {w.name} (Rp {w.balance.toLocaleString("id-ID")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload Area */}
          {parsedItems.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/20 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center space-y-3">
              <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UploadSimpleIcon className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pilih atau Seret Berkas Rekening Anda</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mendukung format file <strong>.csv, .xlsx, .xls</strong>
                </p>
              </div>
              <div className="pt-2">
                <Input
                  id={fileInputId}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => document.getElementById(fileInputId)?.click()}
                  disabled={isProcessing}
                  className="gap-2 text-xs font-medium cursor-pointer"
                >
                  {isProcessing ? "Membaca Berkas..." : "Jelajahi Berkas"}
                </Button>
              </div>
            </div>
          ) : (
            /* Preview Table & Items Actions */
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-lg text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
                  <SparkleIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Berhasil membaca <strong>{parsedItems.length}</strong> transaksi dari <em>{file?.name}</em>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="h-7 text-xs text-muted-foreground hover:text-rose-600"
                >
                  Ganti Berkas
                </Button>
              </div>

              {/* Table wrapper */}
              <div className="border rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/60 sticky top-0 z-10 shadow-xs">
                    <TableRow>
                      <TableHead className="w-[40px] text-center">
                        <Checkbox
                          checked={
                            parsedItems.length > 0 && parsedItems.every((i) => i.selected)
                          }
                          onCheckedChange={(c) => handleToggleSelectAll(Boolean(c))}
                        />
                      </TableHead>
                      <TableHead className="w-[110px]">Tanggal</TableHead>
                      <TableHead className="w-[90px]">Jenis</TableHead>
                      <TableHead>Deskripsi / Catatan</TableHead>
                      <TableHead className="w-[160px]">Kategori</TableHead>
                      <TableHead className="w-[120px] text-right">Nominal</TableHead>
                      <TableHead className="w-[45px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedItems.map((item) => {
                      const availableCats = store.categories.filter(
                        (c) => c.is_active && (c.type === "both" || c.type === item.type)
                      );

                      return (
                        <TableRow
                          key={item.id}
                          className={!item.selected ? "opacity-40 bg-muted/10" : ""}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={() => handleToggleSelectItem(item.id)}
                            />
                          </TableCell>

                          {/* Editable Date */}
                          <TableCell className="p-1.5">
                            <Input
                              type="date"
                              value={item.date}
                              onChange={(e) =>
                                handleUpdateItem(item.id, "date", e.target.value)
                              }
                              className="h-7 text-xs px-1.5 font-mono"
                            />
                          </TableCell>

                          {/* Editable Type */}
                          <TableCell className="p-1.5">
                            <Select
                              value={item.type}
                              onValueChange={(val: "income" | "expense") => {
                                handleUpdateItem(item.id, "type", val);
                                // Adjust category if invalid
                                const newAvailable = store.categories.filter(
                                  (c) => c.is_active && (c.type === "both" || c.type === val)
                                );
                                if (!newAvailable.some((c) => c.id === item.categoryId)) {
                                  handleUpdateItem(item.id, "categoryId", newAvailable[0]?.id || "");
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs px-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="expense" className="text-xs text-rose-600">
                                  Pengeluaran
                                </SelectItem>
                                <SelectItem value="income" className="text-xs text-emerald-600">
                                  Pemasukan
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Editable Note */}
                          <TableCell className="p-1.5">
                            <Input
                              value={item.note}
                              onChange={(e) =>
                                handleUpdateItem(item.id, "note", e.target.value)
                              }
                              className="h-7 text-xs"
                            />
                          </TableCell>

                          {/* Editable Category */}
                          <TableCell className="p-1.5">
                            <Select
                              value={item.categoryId}
                              onValueChange={(val) =>
                                handleUpdateItem(item.id, "categoryId", val)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCats.map((c) => (
                                  <SelectItem key={c.id} value={c.id} className="text-xs">
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Editable Amount */}
                          <TableCell className="p-1.5 text-right font-medium">
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "amount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className={`h-7 text-xs text-right font-semibold ${item.type === "income"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-foreground"
                                }`}
                            />
                          </TableCell>

                          {/* Delete Item */}
                          <TableCell className="p-1 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="size-6 text-muted-foreground hover:text-rose-600"
                            >
                              <TrashIcon className="size-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Stats Footer inside content */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-1">
                <span>
                  Dipilih: <strong>{selectedCount}</strong> dari {parsedItems.length} transaksi
                </span>
                <span>
                  Net Mutasi Terpilih:{" "}
                  <strong
                    className={
                      totalAmountSelected >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {totalAmountSelected >= 0 ? "+" : ""} Rp{" "}
                    {totalAmountSelected.toLocaleString("id-ID")}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/60 bg-muted/20">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            onClick={handleImportSubmit}
            disabled={parsedItems.length === 0 || selectedCount === 0 || !selectedWalletId}
            className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <CheckCircleIcon className="size-4" />
            Import {selectedCount} Transaksi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
