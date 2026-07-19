"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus, BookType, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"

export default function SinonimosPage() {
  const [sinonimosAtuais, setSinonimosAtuais] = useState<Record<string, string[]>>({})
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    termoPrincipal: "",
    equivalentes: ""
  })

  const carregarSinonimos = async () => {
    try {
      const data = await api.get('/sinonimos')
      setSinonimosAtuais(data || {})
    } catch (error) {
      toast.error("Erro", { description: "Falha ao carregar sinónimos." })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarSinonimos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const listaEquivalentes = form.equivalentes
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== "")

    if (listaEquivalentes.length === 0) {
      toast.warning("Aviso", { description: "Insira pelo menos uma variação." })
      return
    }

    try {
      const payload = { [form.termoPrincipal.toLowerCase()]: listaEquivalentes }
      await api.post('/sinonimos', payload)
      toast.success("Sucesso", { description: "Sinônimos atualizados com sucesso!" })
      setForm({ termoPrincipal: "", equivalentes: "" })
      setModalAberto(false)
      carregarSinonimos()
    } catch (error) {
      toast.error("Erro", { description: "Não foi possível salvar." })
    }
  }

  const handleExcluir = async (palavra: string) => {
    if (!confirm(`Tem certeza que deseja excluir a regra de sinônimo para "${palavra}"?`)) return

    setIsDeleting(palavra)
    try {
      await api.delete(`/sinonimos/${palavra}`)
      toast.success("Sucesso", { description: `Regra para "${palavra}" excluída!` })
      carregarSinonimos()
    } catch (error) {
      toast.error("Erro", { description: "Falha ao excluir o sinônimo." })
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-8 pt-6 overflow-hidden">
      
      {/* Cabeçalho */}
      <div className="flex-none mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dicionário de Sinônimos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ensine o motor de busca a entender o vocabulário e os erros de digitação dos seus clientes.
          </p>
        </div>
        
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button className="h-9 px-4 shadow-sm rounded-lg font-medium">
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-106.25 border-border/60 rounded-xl shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">Adicionar Sinônimos</DialogTitle>
              <DialogDescription className="text-xs">
                Crie uma associação entre a palavra correta e as formas que os clientes pesquisam.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-5 py-2">
              <div className="grid gap-2">
                <Label htmlFor="termo" className="text-xs font-semibold">Palavra Principal (Termo correto)</Label>
                <Input 
                  id="termo" 
                  required 
                  value={form.termoPrincipal}
                  onChange={e => setForm({...form, termoPrincipal: e.target.value})}
                  placeholder="Ex: racao whiskas" 
                  className="h-9 text-sm rounded-lg shadow-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="equivalentes" className="text-xs font-semibold">Variações / Erros (Separados por vírgula)</Label>
                <Input 
                  id="equivalentes" 
                  required 
                  value={form.equivalentes}
                  onChange={e => setForm({...form, equivalentes: e.target.value})}
                  placeholder="Ex: wiskas, wiscas, wis kas" 
                  className="h-9 text-sm rounded-lg shadow-sm"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="h-9 rounded-lg shadow-sm">Salvar Regra</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Container da Tabela com Scroll Interno */}
      <div className="flex-1 min-h-0 flex flex-col border border-border/60 rounded-xl shadow-sm bg-card overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card/95 backdrop-blur z-10 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-75 text-xs font-semibold">Palavra Principal / Correta</TableHead>
                <TableHead className="text-xs font-semibold">Variações / Erros de Digitação</TableHead>
                <TableHead className="w-25 text-right text-xs font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground font-medium">
                    Carregando dicionário...
                  </TableCell>
                </TableRow>
              ) : Object.keys(sinonimosAtuais).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-48 text-center flex-col items-center justify-center">
                    <BookType className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Nenhuma regra de sinônimo cadastrada.</p>
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(sinonimosAtuais).map(([chave, equivalentes]) => (
                  <TableRow key={chave} className="border-border/40">
                    <TableCell className="font-semibold text-sm capitalize text-foreground">
                      {chave}
                    </TableCell>
                    
                    {/* NOVO VISUAL DAS VARIAÇÕES */}
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {equivalentes.map((eq, i) => (
                          <Badge 
                            key={i} 
                            variant="default" 
                            className="text-[11px] px-2.5 h-6 font-medium rounded-sm transition-all duration-200 cursor-default"
                          >
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => handleExcluir(chave)}
                        disabled={isDeleting === chave}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}