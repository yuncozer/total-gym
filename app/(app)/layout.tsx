import { UserHeader } from "@/app/components/UserHeader";
import { XPBar } from "@/app/components/XPBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <UserHeader showBack backHref="/" />
      <main className="pb-20">{children}</main>
      <XPBar />
    </div>
  );
}
