import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Ledger } from "@/types"

interface LedgerSelectorProps {
  ledgers: Ledger[]
  currentLedger: Ledger | null
  onChange: (ledgerId: number) => void
}

export function LedgerSelector({ ledgers, currentLedger, onChange }: LedgerSelectorProps) {
  if (ledgers.length <= 1) return null

  return (
    <Select value={String(currentLedger?.id)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择账本" />
      </SelectTrigger>
      <SelectContent>
        {ledgers.map((ledger) => (
          <SelectItem key={ledger.id} value={String(ledger.id)}>
            {ledger.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
