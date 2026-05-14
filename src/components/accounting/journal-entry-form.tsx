"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface JournalLine {
    ledgerId: string;
    debit: number;
    credit: number;
    description: string;
}

interface JournalEntryFormProps {
    ledgers: any[];
}

export function JournalEntryForm({ ledgers }: JournalEntryFormProps) {
    const router = useRouter();

    const [entryDate, setEntryDate] = useState<Date>(new Date());
    const [description, setDescription] = useState("");
    const [lines, setLines] = useState<JournalLine[]>([
        { ledgerId: "", debit: 0, credit: 0, description: "" },
        { ledgerId: "", debit: 0, credit: 0, description: "" },
    ]);

    const addLine = () => {
        setLines([...lines, { ledgerId: "", debit: 0, credit: 0, description: "" }]);
    };

    const removeLine = (index: number) => {
        if (lines.length <= 2) return;
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof JournalLine, value: any) => {
        const updated = [...lines];
        (updated[index] as any)[field] = value;
        // If debit is entered, clear credit and vice versa
        if (field === "debit" && value > 0) updated[index].credit = 0;
        if (field === "credit" && value > 0) updated[index].debit = 0;
        setLines(updated);
    };

    const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    // Only non-group ledgers for posting
    const postableLedgers = ledgers.filter((l: any) => !l.isGroup);

    const onSubmit = async () => {
        if (!isBalanced) {
            toast.error("Debit and Credit totals must be equal");
            return;
        }

        const hasEmptyLedger = lines.some((l) => !l.ledgerId);
        if (hasEmptyLedger) {
            toast.error("All lines must have a ledger selected");
            return;
        }

        try {
            await apiFetch("/api/accounting/journal-entries", {
                method: "POST",
                body: JSON.stringify({
                    entryDate,
                    description,
                    lines: lines.map((l) => ({
                        ledgerId: l.ledgerId,
                        debit: l.debit || null,
                        credit: l.credit || null,
                        description: l.description,
                    })),
                }),
            });
            toast.success("Journal entry created successfully");
            router.push("/accounting/journal-entries");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to create journal entry");
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label>Entry Date</Label>
                    <DatePicker
                        value={entryDate}
                        onChange={(d) => d && setEntryDate(d)}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Description / Narration</Label>
                    <Textarea
                        placeholder="What is this journal entry for?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>

            {/* Journal Lines Table */}
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Journal Lines</h3>
                    <Button size="sm" variant="outline" onClick={addLine}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Line
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left p-3 min-w-[200px]">Ledger</th>
                                <th className="text-right p-3 w-[140px]">Debit (₹)</th>
                                <th className="text-right p-3 w-[140px]">Credit (₹)</th>
                                <th className="text-left p-3 min-w-[150px]">Description</th>
                                <th className="p-3 w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">
                                        <Select
                                            value={line.ledgerId}
                                            onValueChange={(val) => updateLine(index, "ledgerId", val)}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select ledger" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {postableLedgers.map((l: any) => (
                                                    <SelectItem key={l.id} value={l.id}>
                                                        {l.code} — {l.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-9 text-right"
                                            value={line.debit || ""}
                                            onChange={(e) =>
                                                updateLine(index, "debit", parseFloat(e.target.value) || 0)
                                            }
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-9 text-right"
                                            value={line.credit || ""}
                                            onChange={(e) =>
                                                updateLine(index, "credit", parseFloat(e.target.value) || 0)
                                            }
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            className="h-9"
                                            value={line.description}
                                            onChange={(e) => updateLine(index, "description", e.target.value)}
                                            placeholder="Line note"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => removeLine(index)}
                                            disabled={lines.length <= 2}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-muted/30 font-semibold">
                                <td className="p-3 text-right">Total</td>
                                <td className="p-3 text-right">₹ {totalDebit.toFixed(2)}</td>
                                <td className="p-3 text-right">₹ {totalCredit.toFixed(2)}</td>
                                <td className="p-3" colSpan={2}>
                                    {isBalanced ? (
                                        <span className="text-green-600 text-xs font-medium">✓ Balanced</span>
                                    ) : (
                                        <span className="text-red-600 text-xs font-medium">
                                            ✗ Difference: ₹ {Math.abs(totalDebit - totalCredit).toFixed(2)}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button onClick={onSubmit} disabled={!isBalanced}>
                    Create Journal Entry
                </Button>
            </div>
        </div>
    );
}
