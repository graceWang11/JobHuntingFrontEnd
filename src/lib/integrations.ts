// Backend seam for account linking. Replace each stub body with the real
// OAuth flow (popup / redirect) once the backend is wired up.

export type IntegrationProvider = 'google' | 'linkedin';

export interface LinkResult {
  provider: IntegrationProvider;
  connected: boolean;
  // Backend will return profile metadata it pulled from the provider.
  // We only need a placeholder shape on the frontend for now.
  email?: string;
  displayName?: string;
}

export async function connectGoogle(): Promise<LinkResult> {
  await new Promise((r) => setTimeout(r, 500));
  return { provider: 'google', connected: true };
}

export async function connectLinkedIn(): Promise<LinkResult> {
  await new Promise((r) => setTimeout(r, 500));
  return { provider: 'linkedin', connected: true };
}

export async function disconnect(
  provider: IntegrationProvider
): Promise<{ provider: IntegrationProvider; connected: false }> {
  await new Promise((r) => setTimeout(r, 200));
  return { provider, connected: false };
}
