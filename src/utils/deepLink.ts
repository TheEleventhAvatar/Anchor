import { listen } from '@tauri-apps/api/event';

/**
 * Sets up deep link listener for Linux Single Instance plugin
 * @param onDeepLink - Callback function to handle deep link URLs
 * @returns Cleanup function to remove the listener
 */
export function setupDeepLinkListener(onDeepLink: (url: string) => void) {
  const unlisten = listen<string[]>("deep-link://new-url", (event) => {
    console.log("Deep link received from Single Instance:", event.payload);
    
    const args = event.payload;
    if (args.length > 0) {
      // Find the deep link URL in the arguments
      const deepLinkUrl = args.find(arg => arg.startsWith("anchor://"));
      if (deepLinkUrl) {
        console.log("Processing deep link:", deepLinkUrl);
        onDeepLink(deepLinkUrl);
      }
    }
  });

  return () => {
    unlisten.then(fn => fn()).catch(console.error);
  };
}

/**
 * Extract auth parameters from deep link URL
 * @param url - Deep link URL (e.g., "anchor://auth?token=abc123")
 * @returns Parsed parameters object
 */
export function parseDeepLinkUrl(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch (error) {
    console.error("Failed to parse deep link URL:", error);
    return {};
  }
}

// Usage example:
// const cleanup = setupDeepLinkListener((url) => {
//   const params = parseDeepLinkUrl(url);
//   console.log("Auth params:", params);
//   // Handle authentication...
// });
