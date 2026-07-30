import { UserHeader } from "@/app/components/UserHeader";
import { LevelFAB } from "@/app/components/LevelFAB";
import { NotificationBanner } from "@/app/components/NotificationBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <UserHeader showBack backHref="/" />
      <main className="pb-4">{children}</main>
      <LevelFAB />
      <NotificationBanner />
    </div>
  );
}
