import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth error (e.g. user denied consent)
  if (error) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(loginUrl.toString());
  }

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'Authentication failed. Please try again.');
      return NextResponse.redirect(loginUrl.toString());
    }

    return NextResponse.redirect(`${origin}/`);
  }

  // No code and no error — redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
