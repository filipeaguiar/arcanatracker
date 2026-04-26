"use client";

import { useState, useEffect, useTransition } from "react";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
} from "@/lib/actions/categories";
import { getCategoryColor, getCategoryBgColor } from "@/lib/utils/category-colors";
import { formatCategoryName } from "@/lib/utils/format";
import { Settings, Plus, Pencil, Trash2, Check, X, Tag, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [isPending, startTransition] = useTransition();

  async function loadCategories() {
    setLoading(true);
    const data = await listCategories();
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function startEditing(cat: Category) {
    setEditingId(cat.id);
    setEditName(formatCategoryName(cat.name));
    setEditType(cat.type);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
  }

  async function handleUpdate(id: string) {
    startTransition(async () => {
      await updateCategory(id, { name: editName, type: editType });
      setEditingId(null);
      loadCategories();
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir a categoria "${formatCategoryName(name)}"? Transações existentes ficarão sem categoria.`)) return;
    startTransition(async () => {
      await deleteCategory(id);
      loadCategories();
    });
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      await createCategory(newName, newType);
      setNewName("");
      loadCategories();
    });
  }

  const expenses = categories.filter((c) => c.type === "expense");
  const income = categories.filter((c) => c.type === "income");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <header>
        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: "800", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <Settings size={28} /> Configurações
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Gerencie suas categorias de lançamentos.
        </p>
      </header>

      {/* Formulário de nova categoria */}
      <div className="glass" style={{ padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "600", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Plus size={18} /> Nova Categoria
        </h3>
        <div className="settings-form-inline">
          <div style={{ flex: 1 }}>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Nome</label>
            <input
              className="input"
              placeholder="Ex: academia, uber, freelance..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              disabled={isPending}
            />
          </div>
          <div>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Tipo</label>
            <select
              className="input"
              value={newType}
              onChange={(e) => setNewType(e.target.value as "income" | "expense")}
              disabled={isPending}
              style={{ minWidth: "140px", background: "var(--color-bg-secondary)" }}
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={isPending || !newName.trim()}>
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass card" style={{ padding: "var(--space-10)", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>Carregando categorias...</p>
        </div>
      ) : (
        <div className="settings-categories-grid">
          {/* Despesas */}
          <div className="glass" style={{ overflow: "hidden" }}>
            <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <ArrowDownRight size={18} color="var(--color-expense)" />
              <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-expense)" }}>
                Despesas ({expenses.length})
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {expenses.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  isEditing={editingId === cat.id}
                  editName={editName}
                  editType={editType}
                  isPending={isPending}
                  onStartEdit={() => startEditing(cat)}
                  onCancelEdit={cancelEditing}
                  onSave={() => handleUpdate(cat.id)}
                  onDelete={() => handleDelete(cat.id, cat.name)}
                  onEditNameChange={setEditName}
                  onEditTypeChange={setEditType}
                />
              ))}
            </div>
          </div>

          {/* Receitas */}
          <div className="glass" style={{ overflow: "hidden" }}>
            <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <ArrowUpRight size={18} color="var(--color-income)" />
              <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-income)" }}>
                Receitas ({income.length})
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {income.length === 0 ? (
                <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)" }}>
                  Nenhuma categoria de receita.
                </div>
              ) : (
                income.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    isEditing={editingId === cat.id}
                    editName={editName}
                    editType={editType}
                    isPending={isPending}
                    onStartEdit={() => startEditing(cat)}
                    onCancelEdit={cancelEditing}
                    onSave={() => handleUpdate(cat.id)}
                    onDelete={() => handleDelete(cat.id, cat.name)}
                    onEditNameChange={setEditName}
                    onEditTypeChange={setEditType}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de linha de categoria (inline editing)
function CategoryRow({
  category,
  isEditing,
  editName,
  editType,
  isPending,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onEditNameChange,
  onEditTypeChange,
}: {
  category: Category;
  isEditing: boolean;
  editName: string;
  editType: "income" | "expense";
  isPending: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditNameChange: (v: string) => void;
  onEditTypeChange: (v: "income" | "expense") => void;
}) {
  const color = getCategoryColor(category.name);
  const bgColor = getCategoryBgColor(category.name, 0.1);

  if (isEditing) {
    return (
      <div
        className="category-edit-row"
        style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-6)",
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "rgba(99, 102, 241, 0.05)",
        }}
      >
        <input
          className="input"
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave()}
          disabled={isPending}
          style={{ flex: 1, padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-sm)" }}
          autoFocus
        />
        <select
          className="input"
          value={editType}
          onChange={(e) => onEditTypeChange(e.target.value as "income" | "expense")}
          disabled={isPending}
          style={{ width: "120px", padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-sm)", background: "var(--color-bg-secondary)" }}
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
        <button onClick={onSave} className="btn btn-ghost" disabled={isPending} style={{ padding: "var(--space-2)", color: "var(--color-income)" }} title="Salvar">
          <Check size={16} />
        </button>
        <button onClick={onCancelEdit} className="btn btn-ghost" style={{ padding: "var(--space-2)" }} title="Cancelar">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="hover-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-6)",
        borderBottom: "1px solid var(--color-border-subtle)",
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "2px",
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, fontSize: "var(--text-sm)", fontWeight: "500" }}>
        {formatCategoryName(category.name)}
      </span>
      <button onClick={onStartEdit} className="btn btn-ghost" style={{ padding: "var(--space-1)", opacity: 0.5 }} title="Editar">
        <Pencil size={14} />
      </button>
      <button onClick={onDelete} className="btn btn-ghost" style={{ padding: "var(--space-1)", color: "var(--color-expense)", opacity: 0.5 }} title="Excluir">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
