import { redirect } from '@sveltejs/kit';

export async function load(event) {
  const u = new URL(event.url);

  const hadPreviewParams =
    u.searchParams.has('token') ||
    u.searchParams.has('documentId') ||
    u.searchParams.has('websitePreviewId');

  if (hadPreviewParams) {
    u.searchParams.delete('token');
    u.searchParams.delete('documentId');
    u.searchParams.delete('websitePreviewId');

    throw redirect(302, u.pathname + (u.search ? u.search : '') + (u.hash ? u.hash : ''));
  }

  // ... dein bisheriger layout load code
}
