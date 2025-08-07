import { inter } from "@/app/ui/font"
import { NavbarDemo } from "@/app/ui/navbar";
import Footer from "@/components/footer";
import UserSyncWrapper from "@/components/user-sync-wrapper";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import {
  ClerkProvider,
} from '@clerk/nextjs'


export const metadata = {
  title: {
    template: '%s | Support Agent',
    default: 'Support Agent',
  },
  description: 'Easily manage your support tickets with Support Agent.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">


        <body className={`${inter.className} antialiased  `}>
          {/* User Sync - Automatically syncs signed-in users to database */}
          <UserSyncWrapper />

          {/* Header */}

          <NavbarDemo />

          {/* Main Content */}

          <main className="min-h-screen   ">
            {children}
          </main>

          {/* Footer */}

          <Footer />

        </body>
      </html>
    </ClerkProvider>
  );
}
