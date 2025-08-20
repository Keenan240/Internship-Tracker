'use client';

import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function SignInButton() {
  const supabase = useSupabaseClient();

  const handleLogin = async () => {
    const redirectUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}`
        : 'http://localhost:3000'; // fallback just in case

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-black text-white px-6 py-3 rounded-[12px] hover:bg-gray-800 cursor-pointer"
    >
      Access Testing Site
    </button>
  );
}
