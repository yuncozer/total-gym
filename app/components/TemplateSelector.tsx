"use client";

import { useState, useEffect } from "react";
import { Bookmark, Loader2, Trash2, X } from "lucide-react";
import * as service from "@/lib/workout/service";
import type { WorkoutTemplate } from "@/lib/workout/types";

interface TemplateSelectorProps {
  onSelect: (template: WorkoutTemplate) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await service.loadTemplates();
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await service.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border rounded-2xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-accent" /> Mis templates
          </h3>
          <button onClick={onClose} className="p-1 text-icon hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Selecciona una rutina guardada para cargar sus ejercicios.
        </p>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-icon mx-auto mb-3" />
              <p className="text-muted-foreground">No tienes templates guardados</p>
            </div>
          ) : (
            templates.map(template => {
              const isDeleting = deletingId === template.id;
              return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                disabled={!!deletingId}
                className="w-full text-left bg-background hover:bg-muted border border rounded-xl p-4 cursor-pointer transition-colors group disabled:opacity-60 disabled:cursor-wait"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.exercises.length} ejercicios
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {template.exercises.slice(0, 5).map(ex => (
                        <span key={ex.exerciseId} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {ex.name}
                        </span>
                      ))}
                      {template.exercises.length > 5 && (
                        <span className="text-xs text-icon">+{template.exercises.length - 5}</span>
                      )}
                    </div>
                  </div>
                  <div
                    onClick={(e) => { if (!deletingId) handleDelete(template.id, e); }}
                    onKeyDown={(e) => { if (!deletingId && (e.key === "Enter" || e.key === " ")) handleDelete(template.id, e as any); }}
                    role="button"
                    tabIndex={deletingId ? -1 : 0}
                    className="p-1.5 text-icon hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:pointer-events-none"
                    title={isDeleting ? "Eliminando..." : "Eliminar template"}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
