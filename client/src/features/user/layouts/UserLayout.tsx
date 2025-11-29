import { ReactNode } from "react";
import { UserHeader } from "@/components/headers/UserHeader";
import { UserFooter } from "@/components/footers/UserFooter";

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <UserHeader />
      <main className="flex-1">{children}</main>
      <UserFooter />
    </div>
  );
}
