import type { ReactNode } from "react";
import authArt from "@/assets/auth-illustration.jpg";
import { Logo } from "./primitives";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <Logo inverted />
        <img src={authArt} alt="" className="mx-auto w-4/5 max-w-md rounded-3xl opacity-95" width={1024} height={1024} />
        <div>
          <p className="font-display text-3xl font-semibold leading-tight">Bring clarity to every tender.</p>
          <p className="mt-2 max-w-sm text-sm opacity-75">AI-assisted evidence matching for procurement review.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden"><Logo /></div>
          {children}
        </div>
      </div>
    </div>
  );
}
