'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { logger } from '@/lib/logger';
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2, Edit } from 'lucide-react';
import NavigationPreview from './components/NavigationPreview';
import NavigationFormModal from './components/NavigationFormModal';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  orden: number;
  visible: boolean;
  required_role?: string;
  parent_id?: string;
  children?: NavigationItem[];
  created_at?: string;
  updated_at?: string;
}

export default function NavigationPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<NavigationItem | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'tree' | 'preview'>('tree');

  const queryClient = useQueryClient();

  // Fetch all items (flat list, we'll build tree in UI)
  const { data: listResponse, isLoading } = useQuery({
    queryKey: ['navigation-items'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/navigation', {
        params: { skip: 0, limit: 100 },
      });
      return data;
    },
  });

  // Build tree structure from flat list
  const tree = useMemo(() => {
    if (!listResponse?.items) return [];
    
    const items: NavigationItem[] = listResponse.items.filter(
      (item: NavigationItem) => !item.deleted_at
    );
    
    const itemMap = new Map<string, NavigationItem>();
    const roots: NavigationItem[] = [];

    // First pass: create items
    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree
    items.forEach((item) => {
      const treeItem = itemMap.get(item.id)!;
      if (item.parent_id) {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(treeItem);
        }
      } else {
        roots.push(treeItem);
      }
    });

    // Sort by orden
    const sort = (items: NavigationItem[]) => {
      items.sort((a, b) => a.orden - b.orden);
      items.forEach((item) => {
        if (item.children) sort(item.children);
      });
    };
    sort(roots);
    return roots;
  }, [listResponse?.items]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<NavigationItem>) => {
      const { data: result } = await api.post('/api/v1/admin/navigation', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      setIsFormOpen(false);
      setEditingItem(null);
      logger.info('navigation.item_created');
    },
    onError: (error) => {
      logger.error('navigation.create_error', { error: String(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<NavigationItem>) => {
      if (!editingItem?.id) throw new Error('No ID');
      const { data: result } = await api.patch(`/api/v1/admin/navigation/${editingItem.id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      setIsFormOpen(false);
      setEditingItem(null);
      logger.info('navigation.item_updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteItem?.id) throw new Error('No ID');
      await api.delete(`/api/v1/admin/navigation/${deleteItem.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      setIsDeleteOpen(false);
      setDeleteItem(null);
      logger.info('navigation.item_deleted');
    },
  });

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item: NavigationItem) => {
    setDeleteItem(item);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: Partial<NavigationItem>) => {
    if (editingItem) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const renderTreeNode = (item: NavigationItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.id);

    return (
      <div key={item.id} className="select-none">
        <div
          className="flex items-center gap-2 px-4 py-3 hover:bg-muted/50 rounded-lg transition-colors group"
          style={{ paddingLeft: `${depth * 20 + 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="p-1 hover:bg-muted rounded"
              aria-label="Toggle expand"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{item.label}</span>
              {item.parent_id && (
                <Badge variant="secondary" className="text-xs">
                  Submenu
                </Badge>
              )}
              {!item.visible && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Oculto
                </Badge>
              )}
              {item.required_role && (
                <Badge variant="outline" className="text-xs">
                  {item.required_role}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {item.href} • Orden: {item.orden}
            </div>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(item)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(item)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const items = listResponse?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Navigation Builder</h1>
          <p className="text-sm text-muted-foreground">
            Configura la navegación lateral de la aplicación
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo elemento
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'tree'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Vista jerárquica
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Vista previa
        </button>
      </div>

      {/* Content */}
      {activeTab === 'tree' ? (
        <Card className="border">
          <div className="divide-y">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Cargando...</div>
            ) : tree.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No hay elementos de navegación. Crea el primero.
              </div>
            ) : (
              <div className="space-y-0">
                {tree.map((item) => renderTreeNode(item))}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <Card className="border p-6">
            <h3 className="font-semibold mb-4">Vista Previa (Usuario)</h3>
            <NavigationPreview items={tree} userRole="user" />
          </Card>
          <Card className="border p-6">
            <h3 className="font-semibold mb-4">Vista Previa (Admin)</h3>
            <NavigationPreview items={tree} userRole="admin" />
          </Card>
        </div>
      )}

      {/* Form Modal */}
      <NavigationFormModal
        isOpen={isFormOpen}
        item={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
        allItems={items}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Eliminar elemento</AlertDialog.Title>
          </AlertDialog.Header>
          <AlertDialog.Description>
            ¿Está seguro que desea eliminar &quot;{deleteItem?.label}&quot;? Esta acción no se puede deshacer.
          </AlertDialog.Description>
          <AlertDialog.Footer>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutateAsync()}
              isLoading={deleteMutation.isPending}
            >
              Eliminar
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
}
