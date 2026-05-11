import { Redirect } from 'expo-router';

/**
 * Root index — redirects to the auth landing screen.
 * The auth flow lives at /auth (landing), /auth/login, /auth/signup.
 */
export default function Index() {
  return <Redirect href="/auth" />;
}
