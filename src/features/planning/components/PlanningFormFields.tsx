import { useState } from 'react';
import {
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@solvera/pace-core/components';
import { TRAC_STATUS_LABELS, TRAC_STATUS_VALUES } from '@/features/planning/enums';

interface PlanningSharedFieldsProps {
  status: string;
  onStatusChange: (value: string) => void;
  capacity: number | null;
  onCapacityChange: (value: number | null) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  bookingReference: string;
  onBookingReferenceChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  primaryCost: number | null;
  onPrimaryCostChange: (value: number | null) => void;
  secondaryCost: number | null;
  onSecondaryCostChange: (value: number | null) => void;
  primaryCostLabel?: string;
  secondaryCostLabel?: string;
}

export function PlanningSharedFields({
  status,
  onStatusChange,
  capacity,
  onCapacityChange,
  notes,
  onNotesChange,
  bookingReference,
  onBookingReferenceChange,
  currency,
  onCurrencyChange,
  primaryCost,
  onPrimaryCostChange,
  secondaryCost,
  onSecondaryCostChange,
  primaryCostLabel = 'Cost',
  secondaryCostLabel = 'Also track alternate cost',
}: PlanningSharedFieldsProps) {
  const [showSecondaryCost, setShowSecondaryCost] = useState(
    secondaryCost != null && secondaryCost !== 0
  );

  return (
    <>
      <Label>
        Status
        <Select value={status} onValueChange={(value) => value != null && onStatusChange(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {TRAC_STATUS_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {TRAC_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>
      <Label>
        Capacity (leave empty for uncapped)
        <Input
          type="number"
          value={capacity == null ? '' : String(capacity)}
          onChange={(value) => onCapacityChange(value === '' ? null : Number(value))}
        />
      </Label>
      <Label>
        Booking reference
        <Input value={bookingReference} onChange={onBookingReferenceChange} />
      </Label>
      <Label>
        Currency (3-letter)
        <Input value={currency} onChange={onCurrencyChange} maxLength={3} />
      </Label>
      <Label>
        {primaryCostLabel}
        <Input
          type="number"
          value={primaryCost == null ? '' : String(primaryCost)}
          onChange={(value) => onPrimaryCostChange(value === '' ? null : Number(value))}
        />
      </Label>
      <Label>
        <Checkbox
          checked={showSecondaryCost}
          onChange={(checked) => setShowSecondaryCost(checked)}
        />
        {secondaryCostLabel}
      </Label>
      {showSecondaryCost ? (
        <Label>
          Secondary cost
          <Input
            type="number"
            value={secondaryCost == null ? '' : String(secondaryCost)}
            onChange={(value) => onSecondaryCostChange(value === '' ? null : Number(value))}
          />
        </Label>
      ) : null}
      <Label>
        Notes
        <Textarea value={notes} onChange={onNotesChange} />
      </Label>
    </>
  );
}
