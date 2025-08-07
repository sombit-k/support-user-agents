"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * UserSync component - handles automatic user synchronization
 * This component runs on the client side and ensures that when a user
 * signs in with Clerk, they are automatically added to our database
 * and gets some initial onboarding data for first-time users
 */
export default function UserSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !user) return;

      try {
        // Call a server action to sync the user
        const response = await fetch('/api/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Failed to sync user');
        }
      } catch (error) {
        console.error('UserSync error:', error);
      }
    }

    syncUser();
  }, [user, isLoaded]);

  // This component doesn't render anything visible
  return null;
}
