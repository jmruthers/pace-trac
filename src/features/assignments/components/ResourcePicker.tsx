import {
  Label,
  LoadingSpinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@solvera/pace-core/components';
import { useResourceSummaries } from '@/features/assignments/hooks/useResourceSummaries';
import type { LogisticsResourceKind } from '@/features/planning/types';

interface ResourcePickerProps {
  kind: LogisticsResourceKind;
  resourceId: string | null;
  onResourceIdChange: (id: string | null) => void;
}

export function ResourcePicker({ kind, resourceId, onResourceIdChange }: ResourcePickerProps) {
  const { summaries, isLoading, isError, error } = useResourceSummaries(kind);

  if (isLoading) {
    return <LoadingSpinner label="Loading resources…" />;
  }

  if (isError) {
    return <p>{error instanceof Error ? error.message : 'Failed to load resources'}</p>;
  }

  if (summaries.length === 0) {
    return <p>No logistics rows for this type yet. Add resources on Planning first.</p>;
  }

  return (
    <Label>
      Resource
      <Select
        value={resourceId ?? ''}
        onValueChange={(value) => onResourceIdChange(value === '' ? null : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a resource" />
        </SelectTrigger>
        <SelectContent>
          {summaries.map((summary) => (
            <SelectItem key={summary.id} value={summary.id}>
              {summary.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
}
