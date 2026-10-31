import { useEffect, useId, useMemo, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  CheckCircleIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FileCsvIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import * as transactionsService from "@/services/transactions.service";
import type { Category, TransactionType, Wallet } from "@/types";
import { formatRupiah } from "@/libs/number";
import { nowLocalDateTime } from "@/libs/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAX_ROWS = 1000;

const PDF_TO_CSV_PROMPT = `Kamu adalah asisten yang mengubah rekening koran / mutasi bank (PDF terlampir) menjadi CSV.

Aturan output:
- Keluarkan HANYA isi CSV dalam satu code block, tanpa penjelasan.
- Baris pertama (header) persis: date,description,debit,credit,category
- date: format YYYY-MM-DD HH:mm:ss (jika jam tidak ada, pakai 00:00:00).
- description: keterangan transaksi apa adanya; jika mengandung koma, apit dengan tanda kutip ganda.
- debit: nominal uang KELUAR, angka bulat tanpa titik/koma/simbol "Rp"; isi 0 jika bukan pengeluaran.
- credit: nominal uang MASUK, angka bulat tanpa titik/koma/simbol "Rp"; isi 0 jika bukan pemasukan.
- category: kosongkan jika tidak yakin.
- Satu baris per transaksi, urut dari yang paling lama. Jangan sertakan baris saldo awal/akhir atau total.
- Jangan mengarang data; lewati baris yang tidak terbaca.

Contoh:
date,description,debit,credit,category
2026-10-01 08:10:00,GAJI OKTOBER,0,8000000,
2026-10-01 12:45:00,QRIS WARUNG MAKAN,35000,0,`;

interface ImportRow {
  key: string;
  date: string; // yyyy-MM-ddTHH:mm (waktu lokal)
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string;
  selected: boolean;
}

interface ImportTransactionsDialogProps {
  wallets: Wallet[];
  categories: Category[];
  ownerId?: string;
  onImported: () => void;
}

let rowCounter = 0;
const nextKey = () => `row-${++rowCounter}`;

const pad = (n: number) => String(n).padStart(2, "0");

const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Menerima ISO ("2026-10-01 08:10:00", "2026-10-01T08:10") maupun dd/mm/yyyy [HH:mm].
function parseDate(raw: string): string {
  const str = raw.trim();
  const dmy = str.match(
    /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?/
  );
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    const d = new Date(
      Number(year),
      Number(dmy[2]) - 1,
      Number(dmy[1]),
      Number(dmy[4] ?? 0),
      Number(dmy[5] ?? 0)
    );
    return isNaN(d.getTime()) ? "" : toLocalInput(d);
  }
  const d = new Date(str.replace(" ", "T"));
  return isNaN(d.getTime()) ? "" : toLocalInput(d);
}

// "1.250.000" / "1,250,000.50" / "Rp 35000" -> angka
function parseAmount(raw: unknown): number {
  const str = String(raw ?? "").replace(/[^\d.,-]/g, "");
  if (!str) return 0;
  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");
  let normalized = str;
  if (lastComma > -1 && lastDot > -1) {
    normalized =
      lastComma > lastDot
        ? str.replace(/\./g, "").replace(",", ".")
        : str.replace(/,/g, "");
  } else if (lastComma > -1 || lastDot > -1) {
    const sep = lastComma > -1 ? "," : ".";
    const parts = str.split(sep);
    const isThousands = parts.length > 2 || parts[parts.length - 1].length === 3;
    normalized = isThousands ? parts.join("") : parts.join(".");
  }
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : Math.round(n); // Rupiah tanpa desimal
}

const findKey = (keys: string[], pattern: RegExp) =>
  keys.find((k) => pattern.test(k.trim().toLowerCase()));

function categoriesFor(categories: Category[], type: TransactionType) {
  return categories.filter(
    (c) => c.is_active && (c.type === "both" || c.type === type)
  );
}

function rowError(row: ImportRow, categories: Category[]): string | null {
  if (!row.date || isNaN(new Date(row.date).getTime())) return "Tanggal tidak valid";
  if (!(row.amount > 0)) return "Nominal harus lebih dari 0";
  if (!categoriesFor(categories, row.type).some((c) => c.id === row.categoryId))
    return "Kategori tidak sesuai";
  return null;
}

export function ImportTransactionsDialog({
  wallets,
  categories,
  ownerId,
  onImported,
}: ImportTransactionsDialogProps) {
  const fileInputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const walletId = selectedWalletId || wallets[0]?.id || "";
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [duplicateKeys, setDuplicateKeys] = useState<Set<string>>(new Set());
  const [isChecking, setIsChecking] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const defaultCategoryId = (type: TransactionType) =>
    categoriesFor(categories, type)[0]?.id ?? "";

  const reset = () => {
    setRows([]);
    setFileName("");
    setPasteText("");
    setDuplicateKeys(new Set());
    setIsConfirmOpen(false);
    setIsSaving(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) reset();
  };

  const parseCsvText = (text: string, sourceLabel: string): boolean => {
    let ok = false;
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const keys = results.meta.fields ?? [];
        const dateKey = findKey(keys, /^(date|tanggal|tgl)/);
        const noteKey = findKey(keys, /^(description|deskripsi|keterangan|uraian|note|catatan)/);
        const debitKey = findKey(keys, /^(debit|db|keluar)$/);
        const creditKey = findKey(keys, /^(credit|kredit|cr|masuk)$/);
        const amountKey = findKey(keys, /^(amount|nominal|jumlah)$/);
        const typeKey = findKey(keys, /^(type|jenis)$/);
        const categoryKey = findKey(keys, /^(category|kategori)$/);

        if (!dateKey || (!debitKey && !creditKey && !amountKey)) {
          toast.error(
            "Header CSV tidak dikenali. Wajib ada kolom date dan debit/credit (atau amount + type)."
          );
          return;
        }

        const parsed: ImportRow[] = [];
        for (const record of results.data) {
          let type: TransactionType = "expense";
          let amount: number;

          if (debitKey || creditKey) {
            const debit = parseAmount(record[debitKey ?? ""]);
            const credit = parseAmount(record[creditKey ?? ""]);
            if (credit > 0) {
              type = "income";
              amount = credit;
            } else {
              amount = debit;
            }
          } else {
            const raw = parseAmount(record[amountKey ?? ""]);
            const typeText = String(record[typeKey ?? ""] ?? "").toLowerCase();
            const isIncome = /income|masuk|pemasukan|credit|kredit/.test(typeText);
            type = isIncome ? "income" : "expense";
            amount = Math.abs(raw);
          }

          const categoryName = String(record[categoryKey ?? ""] ?? "")
            .trim()
            .toLowerCase();
          const matched = categoriesFor(categories, type).find(
            (c) => c.name.toLowerCase() === categoryName
          );

          parsed.push({
            key: nextKey(),
            date: parseDate(String(record[dateKey] ?? "")),
            type,
            amount,
            categoryId: matched?.id ?? defaultCategoryId(type),
            note: String(record[noteKey ?? ""] ?? "").trim(),
            selected: true,
          });
        }

        if (parsed.length === 0) {
          toast.error("Tidak ada baris data di CSV");
          return;
        }
        if (parsed.length > MAX_ROWS) {
          toast.error(`Maksimal ${MAX_ROWS} baris per import (CSV berisi ${parsed.length})`);
          return;
        }

        setFileName(sourceLabel);
        setRows(parsed);
        ok = true;
      },
    });
    return ok;
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Format berkas harus .csv");
      return;
    }
    try {
      parseCsvText(await file.text(), file.name);
    } catch (err) {
      toast.error(`Gagal membaca CSV: ${err instanceof Error ? err.message : "tidak diketahui"}`);
    }
  };

  const handlePasteProcess = () => {
    if (!pasteText.trim()) {
      toast.error("Tempel isi CSV terlebih dahulu");
      return;
    }
    if (parseCsvText(pasteText, "CSV dari tempel")) setPasteText("");
  };

  const updateRow = <K extends keyof ImportRow>(
    key: string,
    field: K,
    value: ImportRow[K]
  ) =>
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, [field]: value };
        if (field === "type") {
          const type = value as TransactionType;
          if (!categoriesFor(categories, type).some((c) => c.id === next.categoryId)) {
            next.categoryId = defaultCategoryId(type);
          }
        }
        return next;
      })
    );

  const addManualRow = () => {
    if (rows.length >= MAX_ROWS) {
      toast.error(`Maksimal ${MAX_ROWS} baris per import`);
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        key: nextKey(),
        date: nowLocalDateTime(),
        type: "expense",
        amount: 0,
        categoryId: defaultCategoryId("expense"),
        note: "",
        selected: true,
      },
    ]);
  };

  const errors = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      const err = rowError(row, categories);
      if (err) map.set(row.key, err);
    }
    return map;
  }, [rows, categories]);

  // Cek duplikat ke server (debounce) setiap isi baris yang valid berubah.
  const checkSignature = useMemo(
    () =>
      JSON.stringify([
        walletId,
        rows
          .filter((r) => !errors.has(r.key))
          .map((r) => [r.key, r.type, r.amount, r.date, r.note]),
      ]),
    [rows, errors, walletId]
  );

  useEffect(() => {
    const valid = rows.filter((r) => !errors.has(r.key));
    if (!walletId || valid.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const indexes = await transactionsService.checkDuplicateTransactions(
          walletId,
          valid.map((r) => ({
            type: r.type,
            amount: r.amount,
            date: new Date(r.date).toISOString(),
            note: r.note,
          }))
        );
        if (!cancelled) {
          setDuplicateKeys(new Set(indexes.map((i) => valid[i].key)));
        }
      } catch {
        if (!cancelled) {
          setDuplicateKeys(new Set());
          toast.error("Gagal mengecek duplikat; server tetap melewati duplikat saat simpan");
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkSignature]);

  const toSave = rows.filter((r) => r.selected && !duplicateKeys.has(r.key));
  const skippedDuplicates = rows.filter(
    (r) => r.selected && duplicateKeys.has(r.key)
  ).length;
  const hasBlockingError = rows.some((r) => r.selected && errors.has(r.key));
  const totalIncome = toSave
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = toSave
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);
  const dates = toSave
    .map((r) => new Date(r.date).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);
  const rangeLabel =
    dates.length > 0
      ? `${new Date(dates[0]).toLocaleDateString("id-ID")} – ${new Date(dates[dates.length - 1]).toLocaleDateString("id-ID")}`
      : "-";

  const canSubmit =
    !!walletId && toSave.length > 0 && !hasBlockingError && !isChecking;

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      const result = await transactionsService.bulkCreateTransactions({
        wallet_id: walletId,
        owner_id: ownerId,
        items: toSave.map((r) => ({
          category_id: r.categoryId,
          type: r.type,
          amount: r.amount,
          date: new Date(r.date).toISOString(),
          note: r.note || undefined,
        })),
      });
      toast.success(
        `${result.inserted} transaksi disimpan${result.skipped > 0 ? `, ${result.skipped} dilewati karena sudah ada` : ""}`
      );
      onImported();
      handleOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan transaksi. Data di preview dipertahankan, silakan coba lagi.");
      setIsConfirmOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PDF_TO_CSV_PROMPT);
      toast.success("Prompt disalin. Tempel ke ChatGPT/Claude bersama file PDF Anda.");
    } catch {
      toast.error("Gagal menyalin prompt");
    }
  };

  const downloadTemplate = () => {
    const sample = [
      "date,description,debit,credit,category",
      "2026-10-01 08:10:00,GAJI OKTOBER,0,8000000,",
      "2026-10-01 12:45:00,QRIS WARUNG MAKAN,35000,0,",
      "2026-10-02 09:00:00,TARIK TUNAI ATM,500000,0,",
      "",
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([sample], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_import_transaksi.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileCsvIcon className="size-4" />
            Import CSV
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[1200px] w-[96vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border/60">
            <DialogTitle>Import Transaksi (CSV)</DialogTitle>
            <DialogDescription>
              Unggah CSV hasil parsing rekening koran, periksa dan edit di preview, lalu simpan sekaligus. Anda juga bisa menambah baris manual.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 min-w-[240px]">
                <Label className="text-xs font-semibold">Wallet tujuan</Label>
                <Select value={walletId} onValueChange={setSelectedWalletId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Pilih wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id} className="text-xs">
                        {w.name} ({formatRupiah(w.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                id={fileInputId}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                <UploadSimpleIcon className="size-4" />
                {fileName ? "Ganti CSV" : "Pilih CSV"}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" onClick={downloadTemplate}>
                <DownloadSimpleIcon className="size-4" />
                Template
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={addManualRow}>
                <PlusIcon className="size-4" />
                Tambah baris
              </Button>
              {fileName && (
                <span className="text-xs text-muted-foreground">{fileName}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span>
                Data masih berupa PDF? Salin prompt, tempel ke ChatGPT/Claude bersama PDF-nya, lalu unggah CSV hasilnya.
              </span>
              <Button variant="outline" size="sm" className="gap-2 h-7" onClick={copyPrompt}>
                <CopyIcon className="size-3.5" />
                Salin prompt PDF → CSV
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Atau tempel isi CSV</Label>
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"date,description,debit,credit,category\n2026-10-01 08:10:00,GAJI OKTOBER,0,8000000,"}
                spellCheck={false}
                className="font-mono text-xs min-h-24 max-h-48"
              />
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                disabled={!pasteText.trim()}
                onClick={handlePasteProcess}
              >
                <CheckCircleIcon className="size-4" />
                Proses CSV
              </Button>
            </div>

            {rows.length === 0 ? (
              <div className="border-2 border-dashed rounded-xl p-10 text-center text-sm text-muted-foreground">
                Belum ada data. Pilih/tempel CSV atau klik &quot;Tambah baris&quot; untuk input manual.
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-auto max-h-[55vh]">
                  <Table className="text-xs min-w-[1000px]">
                    <TableHeader className="bg-muted/60 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-[40px] text-center">
                          <Checkbox
                            checked={rows.every((r) => r.selected)}
                            onCheckedChange={(c) =>
                              setRows((prev) =>
                                prev.map((r) => ({ ...r, selected: Boolean(c) }))
                              )
                            }
                          />
                        </TableHead>
                        <TableHead className="w-[170px]">Tanggal & jam</TableHead>
                        <TableHead className="w-[115px]">Jenis</TableHead>
                        <TableHead className="min-w-[320px]">Catatan</TableHead>
                        <TableHead className="w-[150px]">Kategori</TableHead>
                        <TableHead className="w-[140px] text-right">Nominal</TableHead>
                        <TableHead className="w-[90px]">Status</TableHead>
                        <TableHead className="w-[40px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => {
                        const error = errors.get(row.key);
                        const isDuplicate = duplicateKeys.has(row.key);
                        return (
                          <TableRow
                            key={row.key}
                            className={
                              error && row.selected
                                ? "bg-rose-500/5"
                                : !row.selected || isDuplicate
                                  ? "opacity-50"
                                  : ""
                            }
                          >
                            <TableCell className="text-center">
                              <Checkbox
                                checked={row.selected}
                                onCheckedChange={(c) =>
                                  updateRow(row.key, "selected", Boolean(c))
                                }
                              />
                            </TableCell>
                            <TableCell className="p-1.5">
                              <Input
                                type="datetime-local"
                                value={row.date}
                                onChange={(e) => updateRow(row.key, "date", e.target.value)}
                                className="h-7 text-xs px-1.5"
                              />
                            </TableCell>
                            <TableCell className="p-1.5">
                              <Select
                                value={row.type}
                                onValueChange={(v) =>
                                  updateRow(row.key, "type", v as TransactionType)
                                }
                              >
                                <SelectTrigger className="h-7 text-xs px-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="expense" className="text-xs">
                                    Pengeluaran
                                  </SelectItem>
                                  <SelectItem value="income" className="text-xs">
                                    Pemasukan
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="p-1.5">
                              <Textarea
                                rows={2}
                                value={row.note}
                                onChange={(e) => updateRow(row.key, "note", e.target.value)}
                                className="min-h-[2.75rem] resize-y text-xs leading-snug px-2 py-1"
                              />
                            </TableCell>
                            <TableCell className="p-1.5">
                              <Select
                                value={row.categoryId}
                                onValueChange={(v) => updateRow(row.key, "categoryId", v)}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue placeholder="Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoriesFor(categories, row.type).map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="text-xs">
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="p-1.5">
                              <CurrencyInput
                                value={row.amount || ""}
                                onValueChange={(n) => updateRow(row.key, "amount", n)}
                                className="text-right font-semibold"
                              />
                            </TableCell>
                            <TableCell className="p-1.5">
                              {error ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  {error}
                                </Badge>
                              ) : isDuplicate ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  Sudah ada
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  Baru
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="p-1 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-muted-foreground hover:text-rose-600"
                                onClick={() =>
                                  setRows((prev) => prev.filter((r) => r.key !== row.key))
                                }
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

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {rows.length} baris · akan disimpan <strong>{toSave.length}</strong>
                    {skippedDuplicates > 0 && <> · {skippedDuplicates} duplikat dilewati</>}
                    {isChecking && " · mengecek duplikat..."}
                  </span>
                  <span>
                    Masuk{" "}
                    <strong className="text-emerald-600">{formatRupiah(totalIncome)}</strong>
                    {" · "}Keluar{" "}
                    <strong className="text-rose-600">{formatRupiah(totalExpense)}</strong>
                  </span>
                </div>
                {hasBlockingError && (
                  <p className="text-xs text-rose-600">
                    Perbaiki atau hapus baris yang bermasalah (atau hilangkan centangnya) sebelum menyimpan.
                  </p>
                )}
              </>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/20">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Batal
            </Button>
            <Button
              className="gap-2"
              disabled={!canSubmit}
              onClick={() => setIsConfirmOpen(true)}
            >
              <CheckCircleIcon className="size-4" />
              Simpan {toSave.length} transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Simpan transaksi ini?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>{toSave.length}</strong> transaksi akan disimpan ke{" "}
                  <strong>{wallets.find((w) => w.id === walletId)?.name}</strong>
                  {skippedDuplicates > 0 && <>, {skippedDuplicates} duplikat dilewati</>}.
                </p>
                <p>Rentang tanggal: {rangeLabel}</p>
                <p>
                  Total masuk {formatRupiah(totalIncome)} · total keluar{" "}
                  {formatRupiah(totalExpense)}
                </p>
                <p className="text-muted-foreground">
                  Transaksi yang sudah tersimpan tidak bisa dihapus, hanya bisa dibatalkan (void).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              {isSaving ? "Menyimpan..." : "Ya, simpan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
