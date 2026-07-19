"use client";

import Link from 'next/link';
import Image from 'next/image'; // <-- Importe o componente Image do Next.js
import { usePathname } from 'next/navigation';
import { AnimatedThemeToggler } from './mode-toggle';

// Componentes Animate-UI
import { ChartNoAxesColumnIncreasing } from './animate-ui/icons/chart-no-axes-column-increasing';
import { Lightbulb } from './animate-ui/icons/lightbulb';
import { AnimateIcon } from './animate-ui/icons/icon';
import { Search } from './animate-ui/icons/search';
import { MessageCircleMore } from './animate-ui/icons/message-circle-more';
import { Settings } from './animate-ui/icons/settings';

const navItems = [
  { name: 'Dashboard', href: '/', icon: ChartNoAxesColumnIncreasing },
  { name: 'Produtos', href: '/produtos', icon: Lightbulb },
  { name: 'Sinônimos', href: '/sinonimos', icon: MessageCircleMore  },
  { name: 'Testar Busca', href: '/teste', icon: Search },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-background text-foreground">
      {/* Container da Logo ajustado com gap para separar a imagem do texto */}
      <div className="flex h-14 items-center gap-3 border-b border-border px-6 font-bold text-lg tracking-tight">
        <Image 
          src="/cat.svg" 
          alt="Logo do Painel" 
          width={28} 
          height={28} 
          className="shrink-0" // Evita que a logo esmague se o espaço apertar
        />
        CatGrep
      </div>
      
      <nav className="flex flex-1 flex-col p-4">
        <ul className="flex flex-col gap-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground font-medium'
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center">
                    {/* O segredo aqui é o asChild. 
                      Isso permite que o AnimateIcon passe as propriedades de animação 
                      para o componente <Icon /> sem dar erro de tipo.
                    */}
                    <AnimateIcon animateOnHover animate={isActive} asChild>
                      <Icon size={18} />
                    </AnimateIcon>
                  </div>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-auto pt-4 flex items-center">
          <AnimatedThemeToggler />
        </div>
      </nav>
    </aside>
  );
}