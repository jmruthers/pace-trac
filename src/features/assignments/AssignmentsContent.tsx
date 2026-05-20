import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@solvera/pace-core/components';
import { AssignmentList } from '@/features/assignments/components/AssignmentList';
import { ResourcePicker } from '@/features/assignments/components/ResourcePicker';
import { useResourceSummaries } from '@/features/assignments/hooks/useResourceSummaries';
import { isLogisticsResourceKind } from '@/features/assignments/resource-labels';
import type { LogisticsResourceKind } from '@/features/planning/types';

const TAB_KINDS: LogisticsResourceKind[] = ['transport', 'accommodation', 'activity'];
const DEFAULT_KIND: LogisticsResourceKind = 'transport';

export function AssignmentsContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const kindParam = searchParams.get('kind');
  const activeKind: LogisticsResourceKind = isLogisticsResourceKind(kindParam) ? kindParam : DEFAULT_KIND;
  const resourceId = searchParams.get('resourceId');

  const { selectedSummary } = useResourceSummaries(activeKind);

  const syncUrl = useCallback(
    (kind: LogisticsResourceKind, id: string | null) => {
      const next = new URLSearchParams(searchParams);
      next.set('kind', kind);
      if (id) {
        next.set('resourceId', id);
      } else {
        next.delete('resourceId');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleKindChange = (kind: string) => {
    if (!isLogisticsResourceKind(kind)) return;
    syncUrl(kind, null);
  };

  const handleResourceChange = (id: string | null) => {
    syncUrl(activeKind, id);
  };

  const resource = resourceId != null ? selectedSummary(resourceId) : undefined;

  return (
    <>
      <h1>Assignments</h1>
      <p>
        Link approved participants to transport, accommodation, and activities. All assignment
        changes are managed here — Planning remains logistics-only.
      </p>

      <Tabs value={activeKind} onValueChange={handleKindChange}>
        <TabsList>
          <TabsTrigger value="transport">Transport</TabsTrigger>
          <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {TAB_KINDS.map((kind) => (
          <TabsContent key={kind} value={kind}>
            <section className="grid gap-4">
              <ResourcePicker
                kind={kind}
                resourceId={activeKind === kind ? resourceId : null}
                onResourceIdChange={(id) => {
                  if (activeKind === kind) handleResourceChange(id);
                }}
              />
              {activeKind === kind && resource ? (
                <AssignmentList resourceType={kind} resource={resource} />
              ) : activeKind === kind && resourceId && !resource ? (
                <p>Select a valid resource from the list.</p>
              ) : activeKind === kind ? (
                <p>Select a resource to view and manage assignments.</p>
              ) : null}
            </section>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
