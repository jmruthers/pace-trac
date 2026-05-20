import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { AccommodationDialog } from '@/features/planning/components/AccommodationDialog';
import { PlanningStatusBadge } from '@/features/planning/components/PlanningStatusBadge';
import { useAccommodationList } from '@/features/planning/hooks/useLogisticsList';
import { useAccommodationMutations } from '@/features/planning/hooks/useLogisticsMutations';
import type { AccommodationRow } from '@/features/planning/types';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function AccommodationList() {
  const { items, isLoading, isError, error } = useAccommodationList();
  const { createItem, updateItem, deleteItem } = useAccommodationMutations();
  const { can: canCreate } = usePageCan('planning', 'create');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<AccommodationRow | undefined>();

  if (isLoading) return <LoadingSpinner />;
  if (isError) {
    return (
      <Alert variant="destructive">
        {error instanceof Error ? error.message : 'Failed to load accommodation'}
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accommodation</CardTitle>
        {canCreate ? (
          <Button
            type="button"
            onClick={() => {
              setSelected(undefined);
              setDialogOpen(true);
            }}
          >
            Add accommodation
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p>No accommodation planned yet.</p> : null}
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <article>
                <h3>{item.name}</h3>
                <PlanningStatusBadge status={item.status} />
                <p>
                  {formatWhen(item.check_in_time)} → {formatWhen(item.check_out_time)}
                </p>
                <p>{item.location_display_name ?? item.location_short_address ?? '—'}</p>
                {item.capacity != null ? <p>Capacity: {item.capacity}</p> : <p>Capacity: uncapped</p>}
                <Link to={`/assignments?kind=accommodation&resourceId=${item.id}`}>Open assignments</Link>
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
        <AccommodationDialog
          key={selected?.id ?? 'create'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          accommodation={selected}
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
