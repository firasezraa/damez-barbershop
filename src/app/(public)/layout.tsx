import type { ReactNode } from "react";
import { Navigation11 } from "@/components/navigation/Navigation11";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-ink text-text">
      {/* React Bits Pro Navigation 11 Component */}
      <Navigation11 />

      {/* Main Page Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
