"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";
import { I18nProvider } from "react-aria-components";
import { Toaster } from "sonner";
import { getQueryClient } from "@/lib/query/client";

export function Providers({ children, locale }: { children: ReactNode; locale: string }) {
  const queryClient = getQueryClient();
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nProvider locale={locale}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ThemedToaster />
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster position="bottom-right" mobileOffset={{ bottom: 88 }} theme={resolvedTheme === "dark" ? "dark" : "light"} closeButton richColors />
  );
}
