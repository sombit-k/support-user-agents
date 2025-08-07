import { checkUser } from "@/lib/checkUser";
import { seedUserOnboardingData } from "@/actions/seed";

/**
 * UserSync component - handles automatic user synchronization
 * This component runs on the server side and ensures that when a user
 * signs in with Clerk, they are automatically added to our database
 * and gets some initial onboarding data for first-time users
 */
export default async function UserSync() {
  try {
    // This will automatically check and sync the user if they're signed in
    const user = await checkUser();
    
    // If user was just created (first time login), seed some onboarding data
    if (user?.isNewUser) {
      await seedUserOnboardingData(user.id);
    }
  } catch (error) {
    // Log the error but don't break the page rendering
    console.error('UserSync error:', error);
  }

  // This component doesn't render anything visible
  return null;
}
