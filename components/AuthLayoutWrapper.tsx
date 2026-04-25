"use client";

import { usePathname } from "next/navigation";
import TabNavClient from "@/components/TabNavClient";
import { ToastProvider } from "@/components/Toast";

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <TabNavClient />
      {children}
    </ToastProvider>
  );
}
