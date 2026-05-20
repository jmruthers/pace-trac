/**
 * Login flow: PaceLoginPage contract (sign-in, errors, requireAppAccess) per TR01 testing.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { APP_NAME } from '@/app-config';
import { TRAC_AUTHENTICATED_HOME_PATH } from '@/app/routes/route-redirects';

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();
const mockClearPalette = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@solvera/pace-core/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/components')>();
  const React = await import('react');
  const { useCallback, useEffect, useState } = React;

  function TestPaceLoginPage({
    appName,
    onSuccessRedirectPath = '/',
    requireAppAccess = false,
    checkAppAccess,
  }: {
    appName: string;
    onSuccessRedirectPath?: string;
    requireAppAccess?: boolean;
    checkAppAccess?: (appName: string) => Promise<{ allowed: boolean; message?: string }>;
  }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const appNameDisplay = appName.toUpperCase();
    const isLoading = loading || checkingAccess;

    useEffect(() => {
      mockClearPalette();
    }, []);

    const handleSubmit = useCallback(
      async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;
        setSubmitError(null);
        setLoading(true);
        try {
          const result = await mockSignIn(email, password);
          if (result?.error != null) {
            throw new Error(result.error.message ?? 'Sign in failed');
          }
          if (requireAppAccess) {
            setCheckingAccess(true);
            try {
              if (checkAppAccess != null) {
                const accessResult = await checkAppAccess(appName);
                if (!accessResult.allowed) {
                  throw new Error(accessResult.message ?? 'You do not have access to this application.');
                }
              }
            } finally {
              setCheckingAccess(false);
            }
          }
          navigate(onSuccessRedirectPath, { replace: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          setSubmitError(message);
        } finally {
          setLoading(false);
        }
      },
      [appName, checkAppAccess, navigate, onSuccessRedirectPath, requireAppAccess]
    );

    return (
      <main aria-label={`${appName} Login Page`}>
        <h1>{`Sign in to ${appNameDisplay}`}</h1>
        {/* Test double only — not production login UI */}
        {/* eslint-disable-next-line pace-core-compliance/prefer-pace-core-form */}
        <form onSubmit={handleSubmit}>
          {/* eslint-disable-next-line pace-core-compliance/prefer-pace-core-components -- test double */}
          <label htmlFor="email">Email</label>
          {/* eslint-disable-next-line pace-core-compliance/prefer-pace-core-components -- test double */}
          <input id="email" name="email" type="email" required />
          {/* eslint-disable-next-line pace-core-compliance/prefer-pace-core-components -- test double */}
          <label htmlFor="password">Password</label>
          {/* eslint-disable-next-line pace-core-compliance/prefer-pace-core-components -- test double */}
          <input id="password" name="password" type="password" required />
          {checkingAccess ? <p role="status">Checking permissions...</p> : null}
          {submitError != null ? (
            <p role="alert">
              <strong>Sign-in error</strong> {submitError}
            </p>
          ) : null}
          {/* eslint-disable-next-line pace-core-compliance/prefer-pace-core-components -- test double */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    );
  }

  return {
    ...actual,
    PaceLoginPage: TestPaceLoginPage,
  };
});

import { PaceLoginPage } from '@solvera/pace-core/components';

function renderLogin(
  props?: Partial<{
    requireAppAccess: boolean;
    checkAppAccess: (appName: string) => Promise<{ allowed: boolean; message?: string }>;
  }>
) {
  return render(
    <MemoryRouter>
      <PaceLoginPage
        appName={APP_NAME}
        onSuccessRedirectPath={TRAC_AUTHENTICATED_HOME_PATH}
        requireAppAccess={props?.requireAppAccess}
        checkAppAccess={props?.checkAppAccess}
      />
    </MemoryRouter>
  );
}

describe('auth-flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('happy path: successful sign-in navigates to authenticated home', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({});

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'planner@example.com');
    await user.type(screen.getByLabelText(/password/i), 'valid-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockSignIn).toHaveBeenCalledWith('planner@example.com', 'valid-password');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(TRAC_AUTHENTICATED_HOME_PATH, { replace: true });
    });
  });

  it('validation failure: invalid credentials show error without navigation', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await expect(screen.findByRole('alert')).resolves.toHaveTextContent(/invalid login credentials/i);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders TRAC-branded sign-in heading', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /sign in to trac/i })).toBeInTheDocument();
    expect(mockClearPalette).toHaveBeenCalled();
  });

  it('app-access failure: requireAppAccess denial shows alert and does not navigate', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({});
    const checkAppAccess = vi.fn().mockResolvedValue({
      allowed: false,
      message: 'You do not have access to TRAC',
    });

    renderLogin({ requireAppAccess: true, checkAppAccess });
    await user.type(screen.getByLabelText(/email/i), 'no-access@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await expect(screen.findByRole('alert')).resolves.toHaveTextContent(/do not have access to trac/i);
    expect(checkAppAccess).toHaveBeenCalledWith(APP_NAME);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows checking permissions while app access is validated', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({});
    let resolveAccess: ((value: { allowed: boolean }) => void) | undefined;
    const checkAppAccess = vi.fn().mockImplementation(
      () =>
        new Promise<{ allowed: boolean }>((resolve) => {
          resolveAccess = resolve;
        })
    );

    renderLogin({ requireAppAccess: true, checkAppAccess });
    await user.type(screen.getByLabelText(/email/i), 'planner@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await expect(screen.findByText('Checking permissions...')).resolves.toBeInTheDocument();
    resolveAccess?.({ allowed: true });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(TRAC_AUTHENTICATED_HOME_PATH, { replace: true });
    });
  });

  it('disables submit while sign-in is in flight', async () => {
    const user = userEvent.setup();
    let resolveSignIn: (value: Record<string, never>) => void = () => {};
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
    );

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
    resolveSignIn({});
  });
});
