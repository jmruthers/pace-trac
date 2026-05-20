import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSpinner,
} from '@solvera/pace-core/components';
import { usePageCan } from '@solvera/pace-core/rbac';
import { TransportDialog } from '@/features/planning/components/TransportDialog';
import { PlanningStatusBadge } from '@/features/planning/components/PlanningStatusBadge';
import { useTransportList } from '@/features/planning/hooks/useLogisticsList';
import { useTransportMutations } from '@/features/planning/hooks/useLogisticsMutations';
import type { TransportRow } from '@/features/planning/types';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function TransportList() {
  const { items, isLoading, isError, error } = useTransportList();
  const { createItem, updateItem, deleteItem } = useTransportMutations();
  const { can: canCreate } = usePageCan('planning', 'create');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<TransportRow | undefined>();

  if (isLoading) return <LoadingSpinner />;
  if (isError) {
    return (
      <Alert variant="destructive">
        {error instanceof Error ? error.message : 'Failed to load transport'}
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transport</CardTitle>
        {canCreate ? (
          <Button
            type="button"
            onClick={() => {
              setSelected(undefined);
              setDialogOpen(true);
            }}
          >
            Add transport
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p>No transport planned yet.</p> : null}
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <article>
                <h3>
                  {item.mode}
                  {item.transport_number ? ` — ${item.transport_number}` : ''}
                </h3>
                <PlanningStatusBadge status={item.status} />
                <p>
                  {formatWhen(item.departure_time)} → {formatWhen(item.arrival_time)}
                </p>
                <p>
                  {item.departure_display_name ?? item.departure_short_address ?? '—'} →{' '}
                  {item.arrival_display_name ?? item.arrival_short_address ?? '—'}
                </p>
                {item.capacity != null ? <p>Capacity: {item.capacity}</p> : <p>Capacity: uncapped</p>}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelected(item);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
              </article>
            </li>
          ))}
        </ul>
        <TransportDialog
          key={selected?.id ?? 'create'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transport={selected}
          mode={selected ? 'edit' : 'create'}
          onSave={async (payload) => {
            if (selected) {
              await updateItem({ id: selected.id, ...payload });
            } else {
              await createItem(payload);
            }
          }}
          onDelete={async (id) => deleteItem(id)}
        />
      </CardContent>
    </Card>
  );
}
