import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// @ts-ignore
import '@/app/globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from "@/components/theme-provider";

// Adicionado display: 'swap' para melhor performance de carregamento
const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    template: '%s | Painel de Busca',
    default: 'Painel de Busca - Gestão Meilisearch',
  },
  description: 'Gestão inteligente do motor de busca e sinônimos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <Sidebar />
            
            {/* O main gerencia a área restante. O overflow interno isola o scroll do conteúdo */}
            <main className="flex-1 flex flex-col min-w-0 border-l border-border">
              <div className="flex-1 overflow-y-auto p-8">
                {children}
              </div>
            </main>
          </div>
          
          {/* Posicionamento explícito para notificações mais elegantes */}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}