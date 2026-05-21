import { FileDisplay } from '@solvera/pace-core/components';
import { useFileDisplay } from '@solvera/pace-core/hooks';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import type { MasterPlanEventHeader } from '@/features/master-plan/hooks/useMasterPlanEventHeader';

interface MasterPlanHeaderProps {
  header: MasterPlanEventHeader;
}

export function MasterPlanHeader({ header }: MasterPlanHeaderProps) {
  const secureSupabase = useSecureSupabase();
  const { url: logoUrl } = useFileDisplay(header.logoFileReference, {
    client: secureSupabase as unknown as NonNullable<
      Parameters<typeof useFileDisplay>[1]
    >['client'],
  });

  return (
    <header className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
      {header.logoFileReference != null ? (
        <FileDisplay
          fileReference={header.logoFileReference}
          url={logoUrl}
          supabase={
            secureSupabase as unknown as NonNullable<
              Parameters<typeof FileDisplay>[0]['supabase']
            >
          }
          variant="inline"
          label={`${header.eventName} logo`}
        />
      ) : null}
      <section className="grid gap-2">
        <h1>Master Plan</h1>
        <p>{header.eventName}</p>
        <p>{header.dateRangeLabel}</p>
      </section>
    </header>
  );
}
