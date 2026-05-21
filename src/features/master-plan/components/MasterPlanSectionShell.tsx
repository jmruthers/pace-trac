import type { ReactNode } from 'react';
import { Alert, LoadingSpinner } from '@solvera/pace-core/components';

interface MasterPlanSectionShellProps {
  title: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export function MasterPlanSectionShell({
  title,
  isLoading = false,
  isError = false,
  error = null,
  children,
  className,
}: MasterPlanSectionShellProps) {
  return (
    <section className={className} aria-labelledby={`masterplan-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <h2 id={`masterplan-${title.replace(/\s+/g, '-').toLowerCase()}`}>{title}</h2>
      {isLoading ? (
        <output className="grid min-h-[8rem] place-items-center" aria-busy="true">
          <LoadingSpinner label={`Loading ${title.toLowerCase()}…`} />
        </output>
      ) : null}
      {!isLoading && isError && error != null ? (
        <Alert variant="destructive" role="alert">
          <p>{error}</p>
        </Alert>
      ) : null}
      {!isLoading && !isError ? children : null}
    </section>
  );
}
