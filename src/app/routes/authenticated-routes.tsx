import { useCallback, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import {
  ProtectedRoute,
  PaceAppLayout,
  LoadingSpinner,
  Dialog,
  DialogPortal,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  PasswordChangeForm,
} from '@solvera/pace-core/components';
import { useContextTheme } from '@solvera/pace-core/hooks';
import { useUnifiedAuthContext } from '@solvera/pace-core';
import { AccessDenied, usePageCan } from '@solvera/pace-core/rbac';
import { APP_NAME } from '@/app-config';
import { getEnabledTracNavItems } from '@/app/navigation/trac-nav';
import {
  getTracRoutePermissionForPath,
  TRAC_ROUTE_PERMISSIONS,
} from '@/app/navigation/trac-route-permissions';
import {
  LEGACY_USER_DASHBOARD_PATH,
  resolveUserDashboardRedirectTarget,
} from '@/app/routes/route-redirects';
import { ShellHomePage } from '@/app/pages/ShellHomePage';
import { ContactsPage } from '@/app/pages/ContactsPage';
import { PlanningPage } from '@/app/pages/PlanningPage';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { TracNoEventFallback } from '@/app/shell/TracNoEventFallback';

function getUserDisplayName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
} | null | undefined): string {
  if (user == null) return '';
  const metadata = user.user_metadata ?? {};
  const keys = ['full_name', 'name', 'display_name'] as const;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  const firstName = typeof metadata.first_name === 'string' ? metadata.first_name.trim() : '';
  const lastName = typeof metadata.last_name === 'string' ? metadata.last_name.trim() : '';
  const combined = `${firstName} ${lastName}`.trim();
  if (combined !== '') return combined;
  return user.email?.trim() ?? '';
}

function useTracShellRouteAccessDenied(): boolean {
  const { pathname } = useLocation();
  const routePermission = getTracRoutePermissionForPath(pathname);
  const pageName = routePermission?.pageName ?? '';
  const { can, isLoading } = usePageCan(
    pageName,
    routePermission?.operation ?? 'read',
    undefined,
    pageName || undefined
  );
  if (routePermission == null) return false;
  if (isLoading) return false;
  return !can;
}

function AuthenticatedShellLayout() {
  useContextTheme();
  const routeAccessDenied = useTracShellRouteAccessDenied();
  const { user, signOut, updatePassword } = useUnifiedAuthContext();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const userDisplayName = getUserDisplayName(user);
  const userEmail = user?.email?.trim() ?? '';

  const handleUserMenuSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  const handleOpenChangePassword = useCallback(() => {
    setIsChangePasswordOpen(true);
  }, []);

  const handleCloseChangePassword = useCallback(() => {
    setIsChangePasswordOpen(false);
  }, []);

  const handlePasswordChange = useCallback(
    async (values: { newPassword: string; confirmPassword: string }) => {
      const result = await updatePassword(values.newPassword);
      if (result.error != null) {
        return { error: { message: result.error.message } };
      }
      return {};
    },
    [updatePassword]
  );

  const homePath = resolveUserDashboardRedirectTarget();

  return (
    <>
      <PaceAppLayout
        appName={APP_NAME}
        userFullName={userDisplayName}
        userEmail={userEmail}
        onUserMenuSignOut={handleUserMenuSignOut}
        onUserMenuChangePassword={handleOpenChangePassword}
        navItems={getEnabledTracNavItems()}
        logoHref={homePath}
        showContextSelector
        showOrganisations={false}
        showEvents
        enforcePermissions
        routePermissions={TRAC_ROUTE_PERMISSIONS}
        routeAccessDenied={routeAccessDenied}
        permissionFallback={<AccessDenied />}
      >
        <Outlet />
      </PaceAppLayout>
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogPortal>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Account settings</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <PasswordChangeForm
                onSubmit={handlePasswordChange}
                onSuccess={handleCloseChangePassword}
                onCancel={handleCloseChangePassword}
              />
            </DialogBody>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}

export function AuthenticatedRoutes() {
  const homePath = resolveUserDashboardRedirectTarget();

  return (
    <Routes>
      <Route
        path="/"
        element={<AuthenticatedShellLayout />}
      >
        <Route
          path={LEGACY_USER_DASHBOARD_PATH.slice(1)}
          element={<Navigate to={homePath} replace />}
        />
        <Route
          element={
            <ProtectedRoute
              requireEvent
              noEventsFallback={<TracNoEventFallback />}
              loadingFallback={<LoadingSpinner />}
            />
          }
        >
          <Route index element={<ShellHomePage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="contacts" element={<ContactsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
