import { OverviewChart } from "@/components/overview-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { Activity, Search, AlertCircle, Target, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  // Chamadas para a API (Server-side rendering do Next.js)
  const metricas = await api.get('/metricas').catch(() => null);
  const cadastrados = await api.get('/cadastrados').catch(() => null);

  const totalPesquisas = metricas?.total_pesquisas_realizadas || 0;
  const totalProdutos = cadastrados?.total_produtos || 0;
  const topTermos = metricas?.top_10_termos_buscados || [];
  const semResultado = metricas?.top_10_pesquisas_sem_resultado || [];

  // Cálculos para métricas
  const totalFalhas = semResultado.reduce((acc: number, item: any) => acc + (item.quantidade || 0), 0);
  const taxaSucesso = totalPesquisas > 0 ? (((totalPesquisas - totalFalhas) / totalPesquisas) * 100).toFixed(1) : 0;

  return (
    /* Container travado no tamanho da tela para não ter scroll na página inteira */
    <div className="flex flex-col h-[calc(100vh-4rem)] p-8 pt-6 overflow-hidden">
      
      {/* Título da Página */}
      <div className="flex-none mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
      </div>
      
      {/* Container Principal simulando o layout da imagem (Esquerda 2/3, Direita 1/3) */}
      <div className="flex-1 min-h-0 grid gap-6 lg:grid-cols-3">
        
        {/* COLUNA ESQUERDA (Métricas + Gráfico) */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          
          {/* Grid 2x2 de Cards de Resumo - Fortemente reduzidos para dar espaço ao gráfico */}
          <div className="grid gap-3 md:grid-cols-4 shrink-0">
            <Card className="border border-border/60 rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Pesquisas</CardTitle>
                <Search className="h-3.5 w-3.5 text-muted-foreground/70" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-lg font-bold tracking-tight">{totalPesquisas}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center">
                  <TrendingUp className="h-2.5 w-2.5 mr-1" /> Ativas
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/60 rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Produtos</CardTitle>
                <Activity className="h-3.5 w-3.5 text-muted-foreground/70" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-lg font-bold tracking-tight">{totalProdutos}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Indexados
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/60 rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Falhas</CardTitle>
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/70" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-lg font-bold tracking-tight">{totalFalhas}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Sem retorno
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/60 rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Sucesso</CardTitle>
                <Target className="h-3.5 w-3.5 text-muted-foreground/70" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-lg font-bold tracking-tight">{taxaSucesso}%</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Com resultados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Overview - Agora ocupará muito mais espaço */}
          <Card className="border border-border/60 rounded-xl shadow-sm pt-2 flex-1 flex flex-col min-h-0">
            <CardHeader className="shrink-0 p-4 pb-0">
              <CardTitle className="text-base font-semibold">Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-0 flex-1 min-h-0 pb-4 pt-2">
              <div className="h-full w-full">
                <OverviewChart data={topTermos} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA (Listas e Barras) */}
        <div className="flex flex-col gap-4 min-h-0">
          
          {/* Painel Top Termos */}
          <Card className="border border-border/60 rounded-xl shadow-sm flex flex-col flex-1 min-h-0">
            <CardHeader className="flex flex-row items-start justify-between p-4 shrink-0">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">Top Buscas</CardTitle>
                <CardDescription className="text-[11px]">Termos populares.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3.5 overflow-y-auto flex-1">
              {topTermos.slice(0, 5).map((item: any) => {
                // Cálculo Ajustado: Porcentagem baseada no total geral de pesquisas
                const percentage = totalPesquisas > 0 
                  ? ((item.quantidade / totalPesquisas) * 100).toFixed(1) 
                  : 0;
                
                // Para a barra visual, talvez ainda faça sentido usar a proporção do maior item 
                // para que as barras não fiquem todas minúsculas se a % real for pequena (ex: 2%).
                // Mas estou ajustando para usar a % real na barra também para ser consistente.
                // Se ficar visualmente ruim, podemos separar a % exibida no texto da % da largura da barra.
                
                return (
                  <div key={item.termo} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{item.termo}</span>
                      <span className="font-medium">{item.quantidade} <span className="text-muted-foreground font-normal">({percentage}%)</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                      <div className="h-full bg-foreground transition-all rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
              {topTermos.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado encontrado</p>
              )}
            </CardContent>
          </Card>

          {/* Painel Oportunidades Perdidas */}
          <Card className="border border-border/60 rounded-xl shadow-sm flex flex-col flex-1 min-h-0">
            <CardHeader className="p-4 shrink-0">
              <CardTitle className="text-sm font-semibold">Oportunidades Perdidas</CardTitle>
              <CardDescription className="text-[11px]">Buscas sem resultados.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4 overflow-y-auto flex-1">
              {semResultado.slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="flex items-start justify-between space-x-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold leading-none">{item.termo}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                      Rever sinónimos.
                    </p>
                  </div>
                  <div className="flex items-center justify-center h-5 px-2 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold shrink-0">
                    {item.quantidade}x
                  </div>
                </div>
              ))}
              {semResultado.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Tudo perfeito por enquanto</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}