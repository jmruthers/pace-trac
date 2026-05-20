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
import { ActivityDialog } from '@/features/planning/components/ActivityDialog';
import { PlanningStatusBadge } from '@/features/planning/components/PlanningStatusBadge';
import { useActivityList } from '@/features/planning/hooks/useLogisticsList';
import { useActivityMutations } from '@/features/planning/hooks/useLogisticsMutations';
import type { ActivityRow } from '@/features/planning/types';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function ActivityList() {
  const { items, isLoading, isError, error } = useActivityList();
  const { createItem, updateItem, deleteItem } = useActivityMutations();
  const { can: canCreate } = usePageCan('planning', 'create');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ActivityRow | undefined>();

  if (isLoading) return <LoadingSpinner />;
  if (isError) {
    return (
      <Alert variant="destructive">
        {error instanceof Error ? error.message : 'Failed to load activities'}
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activities</CardTitle>
        {canCreate ? (
          <Button
            type="button"
            onClick={() => {
              setSelected(undefined);
              setDialogOpen(true);
            }}
          >
            Add activity
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p>No activities planned yet.</p> : null}
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <article>
                <h3>{item.name}</h3>
                <PlanningStatusBadge status={item.status} />
                <p>
                  {formatWhen(item.start_time)} → {formatWhen(item.finish_time)}
                </p>
                <p>
                  {item.start_location_display_name ?? item.start_location_short_address ?? '—'} →{' '}
                  {item.finish_location_display_name ?? item.finish_location_short_address ?? '—'}
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
        <ActivityDialog
          key={selected?.id ?? 'create'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          activity={selected}
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
