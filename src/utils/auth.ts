import { signInSocial } from "@daveyplate/better-auth-tauri"
import { authClient } from "../auth-client"

/**
 * Sign in with a social provider using Better Auth Tauri
 * @param provider - The social provider (google, github, apple, etc.)
 */
export function signInWithProvider(provider: string) {
  signInSocial({
    authClient,
    provider
  });
}

/**
 * Pre-configured sign-in functions for common providers
 */
export const signInWithGoogle = () => signInWithProvider("google");
export const signInWithGitHub = () => signInWithProvider("github");
export const signInWithApple = () => signInWithProvider("apple");
export const signInWithDiscord = () => signInWithProvider("discord");

// Usage examples:
// signInWithGoogle();
// signInWithGitHub();
// signInWithProvider("twitter");
