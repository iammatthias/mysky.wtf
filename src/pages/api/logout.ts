import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Clear the session cookie
  cookies.delete('ms_session', { path: '/' });

  return redirect('/');
};
