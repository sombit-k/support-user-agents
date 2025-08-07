import { checkUser } from "@/lib/checkUser";
import { seedUserOnboardingData } from "@/actions/seed";
import { NextResponse } from "next/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // This will automatically check and sync the user if they're signed in
    const user = await checkUser();
    
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }
    
    // If user was just created (first time login), seed some onboarding data
    if (user?.isNewUser) {
      await seedUserOnboardingData(user.id);
    }

    return NextResponse.json({ success: true, user: { id: user.id, isNewUser: user.isNewUser } });
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
