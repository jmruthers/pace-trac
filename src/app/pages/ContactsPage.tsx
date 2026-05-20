import { LoadingSpinner } from '@solvera/pace-core/components';
import { AccessDenied, PagePermissionGuard } from '@solvera/pace-core/rbac';
import { ContactsContent } from '@/features/contacts/ContactsContent';

/** SLICE-06 — event contacts CRUD at `/contacts`. */
export function ContactsPage() {
  return (
    <PagePermissionGuard
      pageName="contacts"
      operation="read"
      loading={
        <main className="grid min-h-[50vh] place-items-center px-4" aria-busy="true">
          <LoadingSpinner label="Checking access…" />
        </main>
      }
      fallback={<AccessDenied />}
    >
      <ContactsContent />
    </PagePermissionGuard>
  );
}
