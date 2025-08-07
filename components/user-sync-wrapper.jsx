"use client";

import dynamic from "next/dynamic";

// Dynamically import UserSync to avoid SSR issues during build
const UserSync = dynamic(() => import("@/components/user-sync"), {
  ssr: false
});

export default function UserSyncWrapper() {
  return <UserSync />;
}
