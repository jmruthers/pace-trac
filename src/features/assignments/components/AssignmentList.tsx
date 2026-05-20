import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSpinner,
} from '@solvera/pace-core/components';
import { AssignmentDialog } from '@/features/assignments/components/AssignmentDialog';
import { CapacityPressureBadge } from '@/features/assignments/components/CapacityPressureBadge';
import {
  formatHeadcountLine,
  getAssignedCount,
  getCapacityPressure,
} from '@/features/assignments/headcount';
import { useAssignmentsForResource } from '@/features/assignments/hooks/useAssignmentsForResource';
import { useAssignmentMutations } from '@/features/assignments/hooks/useAssignmentMutations';
import type { ResourceSummary, TracResourceType } from '@/features/assignments/types';

interface AssignmentListProps {
  resourceType: TracResourceType;
  resource: ResourceSummary;
}

export function AssignmentList({ resourceType, resource }: AssignmentListProps) {
  const { assignments, isLoading, isError, error, refetch } = useAssignmentsForResource(
    resourceType,
    resource.id
  );
  const { canCreate } = useAssignmentMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const assignedCount = getAssignedCount(assignments);
  const pressure = getCapacityPressure(assignedCount, resource.capacity);

  const assignedApplicationIds = useMemo(
    () => new Set(assignments.map((a) => a.application_id)),
    [assignments]
  );

  const selected = assignments.find((a) => a.id === selectedId);

  if (isLoading) return <LoadingSpinner label="Loading assignments…" />;

  if (isError) {
    return (
      <Alert variant="destructive">
        {error instanceof Error ? error.message : 'Failed to load assignments'}
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignments</CardTitle>
        <CapacityPressureBadge pressure={pressure} />
        <p>{formatHeadcountLine(assignedCount, resource.capacity)}</p>
        {canCreate ? (
          <Button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setDialogOpen(true);
            }}
          >
            Add assignment
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p>No assignments yet.</p>
        ) : (
          <ul>
            {assignments.map((item) => (
              <li key={item.id}>
                <article>
                  <h3>{item.participantLabel}</h3>
                  {item.notes ? <p>{item.notes}</p> : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedId(item.id);
                      setDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </article>
              </li>
            ))}
          </ul>
        )}

        <AssignmentDialog
          key={selected?.id ?? 'create'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={selected ? 'edit' : 'create'}
          resourceType={resourceType}
          resource={resource}
          assignment={selected}
          assignedCount={assignedCount}
          assignedApplicationIds={assignedApplicationIds}
          onSaved={() => void refetch()}
        />
      </CardContent>
    </Card>
  );
}
