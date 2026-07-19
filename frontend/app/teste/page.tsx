"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Package, Image as ImageIcon, MapPin, CheckCircle2 } from "lucide-react"

export default function TestePage() {
  const [termo, setTermo] = useState("")
  const [resultados, setResultados] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  
  // 1. ALTERADO: Agora o padrão Nacional é a string "BR"
  const [estado, setEstado] = useState<string>("BR") 
  const [apenasComEstoque, setApenasComEstoque] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // 2. ALTERADO: Ajustada a regra para limpar a tela se o estado for o padrão "BR"
      if (!termo.trim() && estado === "BR" && !apenasComEstoque) {
        setResultados([])
        return
      }
      
      setCarregando(true)
      try {
        let url = `/search?termo=${encodeURIComponent(termo)}&limit=20`
        // Como o estado agora nunca é vazio, ele sempre vai enviar &estado=BR (ou MA, TO, PA)
        if (estado) url += `&estado=${estado}`
        if (apenasComEstoque) url += `&apenasComEstoque=true`

        const data = await api.get(url)
        setResultados(data.produtos || [])
      } catch (error) {
        console.error("Erro na busca", error)
      } finally {
        setCarregando(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [termo, estado, apenasComEstoque])

  const formatarMoeda = (valor: any) => {
    const num = typeof valor === "string" ? parseFloat(valor) : valor;
    if (!num) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  }

  const obterPrecoContextual = (p: any) => {
    if (estado === 'MA' && p.preco_sug_MA) return p.preco_sug_MA;
    if (estado === 'TO' && p.preco_venda_TO) return p.preco_venda_TO;
    if (estado === 'PA' && p.preco_venda_PA) return p.preco_venda_PA;
    return p.price || 0; // Nacional ("BR") cai aqui
  }

  const obterSaldoContextual = (p: any) => {
    if (estado === 'MA') return p.saldo_MA || 0;
    if (estado === 'TO') return p.saldo_TO || 0;
    if (estado === 'PA') return p.saldo_PA || 0;
    return p.quantityAvailable || 0; // Nacional ("BR") cai aqui
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8 px-4">
      <div className="text-center space-y-3 pb-4">
        <h2 className="text-4xl font-bold tracking-tight text-foreground">Playground de Busca</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Simule a experiência do cliente. Teste a inteligência por trás dos filtros logísticos e preços regionais em tempo real.
        </p>
      </div>

      <div className="relative group max-w-3xl mx-auto space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            className="pl-16 h-20 text-2xl rounded-2xl border-2 shadow-sm focus-visible:ring-primary/20 bg-background transition-all"
            placeholder="O que procura hoje?"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
          {carregando && (
            <Loader2 className="absolute right-6 top-1/2 h-6 w-6 -translate-y-1/2 animate-spin text-primary" />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
          <div className="flex flex-wrap items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mr-1" />
            <span className="text-sm font-medium text-muted-foreground mr-2">Simular Estado:</span>
            
            {/* 3. ALTERADO: Botão Nacional agora define e testa "BR" */}
            <Button 
              variant={estado === "BR" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setEstado("BR")}
              className="rounded-full"
            >
              Nacional
            </Button>
            <Button 
              variant={estado === "MA" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setEstado("MA")}
              className="rounded-full"
            >
              Maranhão (MA)
            </Button>
            <Button 
              variant={estado === "TO" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setEstado("TO")}
              className="rounded-full"
            >
              Tocantins (TO)
            </Button>
            <Button 
              variant={estado === "PA" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setEstado("PA")}
              className="rounded-full"
            >
              Pará (PA)
            </Button>
          </div>

          <div className="flex items-center">
            <Button
              variant={apenasComEstoque ? "default" : "outline"}
              size="sm"
              onClick={() => setApenasComEstoque(!apenasComEstoque)}
              className={`rounded-full transition-colors ${apenasComEstoque ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              <CheckCircle2 className={`w-4 h-4 mr-2 ${apenasComEstoque ? 'text-white' : 'text-muted-foreground'}`} />
              Apenas com Estoque
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-8">
        {resultados.length === 0 && (termo.trim() !== "" || estado !== "BR" || apenasComEstoque) && !carregando && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
            <Package className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-xl font-medium text-foreground">Nenhum resultado encontrado.</p>
            <p className="text-sm mt-1">Tente ajustar os filtros ou os termos da busca.</p>
          </div>
        )}
        
        {resultados.map((p) => (
          <Card 
            key={p.sku} 
            className="group flex flex-col sm:flex-row overflow-hidden transition-all hover:shadow-md border-border/40 bg-card"
          >
            <div className="w-full sm:w-48 sm:h-auto h-48 bg-white shrink-0 border-r border-border/40 flex items-center justify-center relative p-2">
              <Badge className="absolute top-2 left-2 bg-black/70 text-white border-none z-10 text-[10px]">
                Score: {p._searchScore}
              </Badge>
              {p.image ? (
                <img 
                  src={p.image} 
                  alt={p.name} 
                  className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
              )}
            </div>

            <div className="p-5 sm:p-6 flex flex-col justify-between grow">
              <div>
                <div className="flex flex-col-reverse sm:flex-row justify-between items-start gap-2">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground tracking-tight leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">
                      SKU: {p.sku}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-2xl font-bold text-primary">
                      {formatarMoeda(obterPrecoContextual(p))}
                    </span>
                    <Badge variant={obterSaldoContextual(p) > 0 ? "default" : "destructive"} className="mt-1">
                      Estoque: {obterSaldoContextual(p)}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mt-4">
                  <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-normal">
                    {p.segmento}
                  </Badge>
                  {p.categories?.split(',').map((c: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs bg-background">
                      {c.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-6 mt-6 pt-4 border-t border-border/40 text-sm">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Marca</span>
                  <span className="font-medium text-foreground">{p.brand}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Fornecedor</span>
                  <span className="font-medium text-foreground truncate max-w-50" title={p.fornecedor}>
                    {p.fornecedor}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}