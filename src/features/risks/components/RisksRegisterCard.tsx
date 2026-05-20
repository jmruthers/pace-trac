import type { ReactNode } from 'react';
import { Card, CardContent } from '@solvera/pace-core/components';

/** Printable risk register table container (TR09 print page-break). */
export function RisksRegisterCard({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="print:break-inside-avoid">{children}</CardContent>
    </Card>
  );
}
