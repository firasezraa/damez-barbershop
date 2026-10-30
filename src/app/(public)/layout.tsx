import type { ReactNode } from "react";
import { Navigation11 } from "@/components/navigation/Navigation11";
import { BlurHighlight } from "@/components/ui/BlurHighlight";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-ink text-text">
      {/* React Bits Pro Navigation 11 Component */}
      <Navigation11 />

      {/* Main Page Content dengan Animasi Reveal Blur Saat Pertama Landing */}
      <BlurHighlight trigger="mount" blurAmount={10} blurDuration={0.9} className="flex-1">
        {children}
      </BlurHighlight>
    </div>
  );
}
