import { UserHeader } from "@/app/components/UserHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <UserHeader showBack backHref="/" />
      <main>{children}</main>
    </div>
  );
}
