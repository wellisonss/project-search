"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, ListOrdered, Save, GripVertical } from "lucide-react"; 
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3336/products";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [salvandoIa, setSalvandoIa] = useState(false);
  const [salvandoAtributos, setSalvandoAtributos] = useState(false);
  
  const [usarIa, setUsarIa] = useState(true);
  const [atributos, setAtributos] = useState<string[]>([]);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/config`);
      if (!res.ok) throw new Error("Erro ao carregar configurações");
      const data = await res.json();
      
      setUsarIa(data.usar_ia);
      setAtributos(data.ordem_atributos || []);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar as configurações do motor.");
    } finally {
      setLoading(false);
    }
  };

  const alternarIA = async () => {
    try {
      setSalvandoIa(true);
      const novoEstado = !usarIa;
      const res = await fetch(`${API_URL}/config/ia`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usar_ia: novoEstado }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");
      
      setUsarIa(novoEstado);
      toast.success(`Busca com Inteligência Artificial ${novoEstado ? "ATIVADA" : "DESATIVADA"}!`);
    } catch (error) {
      toast.error("Erro ao alterar configuração da IA.");
    } finally {
      setSalvandoIa(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const novaOrdem = Array.from(atributos);
    const [reorderedItem] = novaOrdem.splice(result.source.index, 1);
    novaOrdem.splice(result.destination.index, 0, reorderedItem);

    setAtributos(novaOrdem);
  };

  const salvarOrdemAtributos = async () => {
    try {
      setSalvandoAtributos(true);
      const res = await fetch(`${API_URL}/config/atributos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: atributos }),
      });

      if (!res.ok) throw new Error("Erro ao salvar ordem");
      
      toast.success("Prioridade de busca atualizada com sucesso no Meilisearch!");
    } catch (error) {
      toast.error("Erro ao atualizar a ordem dos atributos.");
    } finally {
      setSalvandoAtributos(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-sm font-medium text-muted-foreground">
        A carregar configurações...
      </div>
    );
  }

  return (
    /* Container principal travado com overflow-hidden */
    <div className="flex flex-col h-[calc(100vh-4rem)] p-8 pt-6 overflow-hidden">
      
      {/* Cabeçalho Fixo */}
      <div className="flex-none mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Configurações do Motor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gere o comportamento do motor de pesquisa, inteligência artificial e regras de relevância.
        </p>
      </div>

      {/* Área de rolagem para os cards (útil se adicionar mais configurações no futuro) */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
          
          {/* CARD DA IA */}
          <Card className="border border-border/60 rounded-xl shadow-sm h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-500" />
                Busca Híbrida com IA (Gemini)
              </CardTitle>
              <CardDescription className="text-xs">
                Ativa ou desativa a pesquisa semântica usando os embeddings do Google Gemini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/40 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado Atual</Label>
                  {usarIa ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-emerald-100/80 text-emerald-700 border-emerald-200/50 shadow-none text-[10px] font-bold hover:bg-emerald-100/80">Ativado</Badge>
                      <span className="text-xs font-medium text-muted-foreground">Resultados mais inteligentes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive border-transparent shadow-none text-[10px] font-bold hover:bg-destructive/10">Desativado</Badge>
                      <span className="text-xs font-medium text-muted-foreground">Apenas busca por texto exato</span>
                    </div>
                  )}
                </div>
                <Button 
                  variant={usarIa ? "outline" : "default"}
                  size="sm"
                  className={`h-9 px-4 shadow-sm rounded-lg font-medium transition-colors ${usarIa ? 'text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive' : ''}`}
                  onClick={alternarIA}
                  disabled={salvandoIa}
                >
                  {usarIa ? "Desativar IA" : "Ativar IA"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CARD DE PRIORIDADE DE ATRIBUTOS */}
          <Card className="border border-border/60 rounded-xl shadow-sm flex flex-col h-fit">
            <CardHeader className="pb-4 shrink-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-orange-500" />
                Prioridade de Busca
              </CardTitle>
              <CardDescription className="text-xs">
                A ordem define o que é mais importante ao pesquisar. O que estiver no topo tem maior peso no resultado final.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              
              {/* Drag and Drop Container */}
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="atributos-list">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="flex flex-col gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/40"
                    >
                      {atributos.map((attr, index) => (
                        <Draggable key={attr} draggableId={attr} index={index}>
                          {(prov, snap) => (
                            <div 
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className={`group flex items-center gap-3 bg-card p-2 px-3 rounded-lg border border-border/60 transition-all duration-200 ${
                                snap.isDragging 
                                  ? 'shadow-lg z-50 ring-1 ring-primary/20 scale-[1.02]' 
                                  : 'shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-border hover:shadow-sm'
                              }`}
                            >
                              {/* Handle de arrasto */}
                              <div 
                                {...prov.dragHandleProps} 
                                className="flex items-center justify-center p-1 text-muted-foreground/40 group-hover:text-foreground cursor-grab active:cursor-grabbing transition-colors rounded-md hover:bg-muted"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                              
                              <div className="flex items-center justify-center bg-muted/50 text-muted-foreground w-6 h-6 rounded-md text-[11px] font-bold border border-border/40 shrink-0">
                                {index + 1}
                              </div>
                              
                              <span className="font-semibold text-sm capitalize text-foreground truncate">
                                {attr}
                              </span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <Button 
                className="w-full gap-2 h-9 rounded-lg shadow-sm font-medium mt-2" 
                onClick={salvarOrdemAtributos}
                disabled={salvandoAtributos}
              >
                <Save className="w-4 h-4" />
                {salvandoAtributos ? "Salvando..." : "Salvar Nova Ordem"}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}