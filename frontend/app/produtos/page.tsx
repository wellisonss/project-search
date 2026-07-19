"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner" 
import { PackageSearch, ChevronLeft, ChevronRight, Activity, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalReal, setTotalReal] = useState(0) 
  const itensPorPagina = 50 
  
  const carregarProdutos = async () => {
    setCarregando(true)
    try {
      const data = await api.get('/cadastrados')
      setProdutos(data.produtos || [])
      setTotalReal(data.total_produtos || 0)
    } catch (error) {
      toast.error("Erro", { description: "Falha ao carregar produtos." }) 
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  // Paginação local simples
  const totalPaginas = Math.ceil(produtos.length / itensPorPagina)
  const indiceInicial = (paginaAtual - 1) * itensPorPagina
  const produtosExibidos = produtos.slice(indiceInicial, indiceInicial + itensPorPagina)

  const formatCurrency = (val: any) => {
    if (!val) return "R$ 0,00";
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  }

  return (
    /* Container travado no tamanho da tela para não ter scroll na página inteira */
    <div className="flex flex-col h-[calc(100vh-4rem)] p-8 pt-6 overflow-hidden">
      
      {/* Título da Página */}
      <div className="flex-none mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Catálogo de Produtos</h2>
        <div className="flex items-center mt-1">
          <p className="text-sm text-muted-foreground">
            Visão geral de todos os SKUs e saldos regionais no Meilisearch. 
          </p>
          <Badge variant="default" className="ml-3 shadow-none text-[10px] h-5 px-2 rounded-sm">
            Total: {totalReal}
          </Badge>
        </div>
      </div>

      {/* Container da Tabela (Ocupa o espaço restante e controla o scroll interno) */}
      <div className="flex-1 min-h-0 flex flex-col border border-border/60 rounded-xl shadow-sm bg-card overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card/95 backdrop-blur z-10 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20 text-xs font-semibold">SKU</TableHead>
                <TableHead className="min-w-62.5 text-xs font-semibold">Produto & Categoria</TableHead>
                <TableHead className="text-xs font-semibold">Preço Base</TableHead>
                <TableHead className="text-xs font-semibold">Saldo MA</TableHead>
                <TableHead className="text-xs font-semibold">Saldo TO</TableHead>
                <TableHead className="text-xs font-semibold">Saldo PA</TableHead>
                <TableHead className="text-right text-xs font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground font-medium">
                    Carregando catálogo completo...
                  </TableCell>
                </TableRow>
              ) : produtosExibidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center flex-col items-center justify-center">
                    <PackageSearch className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Nenhum produto indexado ainda.</p>
                  </TableCell>
                </TableRow>
              ) : (
                produtosExibidos.map((prod) => (
                  <TableRow key={prod.sku} className="border-border/40">
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                      {prod.sku}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm leading-tight text-foreground">{prod.name}</div>
                      <div className="flex gap-2 mt-1.5 items-center">
                        <Badge variant="secondary" className="text-[9px] px-1.5 font-semibold h-4 rounded-sm shadow-none">
                          {prod.brand}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground truncate max-w-50 font-medium">
                          {prod.categories}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {formatCurrency(prod.price)}
                    </TableCell>
                    
                    {/* Saldos e Preços Regionais */}
                    <TableCell>
                      <Badge variant={prod.saldo_MA > 0 ? "default" : "secondary"} className="h-5 text-[10px] shadow-none rounded-sm">
                        {prod.saldo_MA || 0}
                      </Badge>
                      {prod.preco_sug_MA && <div className="text-[10px] mt-1 font-medium text-muted-foreground">Sugerido: {formatCurrency(prod.preco_sug_MA)}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={prod.saldo_TO > 0 ? "default" : "secondary"} className="h-5 text-[10px] shadow-none rounded-sm">
                        {prod.saldo_TO || 0}
                      </Badge>
                      {prod.preco_venda_TO && <div className="text-[10px] mt-1 font-medium text-muted-foreground">Venda: {formatCurrency(prod.preco_venda_TO)}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={prod.saldo_PA > 0 ? "default" : "secondary"} className="h-5 text-[10px] shadow-none rounded-sm">
                        {prod.saldo_PA || 0}
                      </Badge>
                      {prod.preco_venda_PA && <div className="text-[10px] mt-1 font-medium text-muted-foreground">Venda: {formatCurrency(prod.preco_venda_PA)}</div>}
                    </TableCell>

                    <TableCell className="text-right">
                      {prod.isActive === 'S' || prod.isActive === true ? (
                        <Badge className="bg-emerald-100/80 text-emerald-700 rounded-sm border-emerald-200/50 shadow-none text-[10px] font-bold h-5">
                          <Activity className="w-3 h-3 mr-1" /> Ativo
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="shadow-none text-[10px] font-bold h-5 bg-destructive/10 text-destructive border-transparent">
                          <XCircle className="w-3 h-3 mr-1" /> Inativo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex-none pt-4 flex items-center justify-between">
          <p className="text-[11px] font-medium text-muted-foreground">
            Mostrando <span className="text-foreground">{indiceInicial + 1}</span> a <span className="text-foreground">{Math.min(indiceInicial + itensPorPagina, produtos.length)}</span> de <span className="text-foreground">{produtos.length}</span> produtos.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-3 font-semibold rounded-md shadow-sm border-border/60"
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-3 font-semibold rounded-md shadow-sm border-border/60"
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
            >
              Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}