'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FunctionSquare, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger, Badge, Button, Card, CardContent, DataTable, DataTableBody,
  DataTableCell, DataTableHead, DataTableRow, DataTableTh, Dialog, DialogClose,
  DialogContent, DialogHeader, DialogTitle, DialogTrigger, EmptyState, Input,
  PageHeader, PageWrapper,
} from '@/components/ui';
import { useIndicadorFormulas, useCreateIndicadorFormula, useUpdateIndicadorFormula, useDeleteIndicadorFormula } from '@/hooks/useIndicadorFormulas';
import { IndicadorFormulaCreateSchema, type IndicadorFormula } from '@/lib/schemas/indicador_formula.schema';
import { extractErrorMessage } from '@/lib/utils';

const MOTORES = ['sql', 'python', 'formula', 'manual'];
const PERIODICIDADES = ['diaria', 'semanal', 'mensual', 'trimestral', 'anual'];

const formSchema = IndicadorFormulaCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function IndicadoresFormulasPage() {
  const formulasQuery = useIndicadorFormulas();
  const items = formulasQuery?.data ?? [];
  const isLoading = Boolean(formulasQuery?.isLoading);
  const createMut = useCreateIndicadorFormula();
  const updateMut = useUpdateIndicadorFormula();
  const deleteMut = useDeleteIndicadorFormula();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IndicadorFormula | null>(null);
  const [formulaText, setFormulaText] = useState('{}');
  const [formulaError, setFormulaError] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: '', nombre: '', motor: MOTORES[0], formula: {}, sla_config: null, threshold_green: null, threshold_yellow: null, threshold_red: null, periodicidad: PERIODICIDADES[2] },
  });

  const parseFormula = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setFormulaError('');
      return parsed;
    } catch {
      setFormulaError('JSON inválido');
      return null;
    }
  };

  const resetAndOpen = useCallback(() => {
    form.reset({ code: '', nombre: '', motor: MOTORES[0], formula: {}, sla_config: null, threshold_green: null, threshold_yellow: null, threshold_red: null, periodicidad: PERIODICIDADES[2] });
    setFormulaText('{}');
    setFormulaError('');
    setCreateOpen(true);
  }, [form]);

  const openEdit = useCallback((item: IndicadorFormula) => {
    form.reset({ code: item.code, nombre: item.nombre, motor: item.motor, formula: item.formula, sla_config: item.sla_config ?? null, threshold_green: item.threshold_green ?? null, threshold_yellow: item.threshold_yellow ?? null, threshold_red: item.threshold_red ?? null, periodicidad: item.periodicidad });
    setFormulaText(JSON.stringify(item.formula, null, 2));
    setFormulaError('');
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    const parsedFormula = parseFormula(formulaText);
    if (!parsedFormula) return;
    try {
      const payload = { ...values, formula: parsedFormula };
      if (editTarget) {
        await updateMut?.mutateAsync?.({ id: editTarget.id, ...payload });
        toast.success('Fórmula actualizada');
        setEditTarget(null);
      } else {
        await createMut?.mutateAsync?.(payload);
        toast.success('Fórmula creada');
        setCreateOpen(false);
      }
      form.reset();
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al guardar fórmula'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMut?.mutateAsync?.(id);
      toast.success('Fórmula eliminada');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al eliminar'));
    }
  };

  const dialogForm = (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Código *</label>
          <Input className="mt-1 font-mono" maxLength={50} placeholder="VULN_OPEN_RATE" {...form.register('code')} />
        </div>
        <div>
          <label className="text-sm font-medium">Periodicidad *</label>
          <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.watch('periodicidad')} onChange={(e) => form.setValue('periodicidad', e.target.value, { shouldValidate: true })}>
            {PERIODICIDADES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Nombre *</label>
        <Input className="mt-1" maxLength={255} {...form.register('nombre')} />
      </div>
      <div>
        <label className="text-sm font-medium">Motor *</label>
        <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.watch('motor')} onChange={(e) => form.setValue('motor', e.target.value, { shouldValidate: true })}>
          {MOTORES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Fórmula (JSON) *</label>
        <textarea
          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono bg-background resize-none ${formulaError ? 'border-destructive' : 'border-input'}`}
          rows={5}
          value={formulaText}
          onChange={(e) => setFormulaText(e.target.value)}
        />
        {formulaError && <p className="text-xs text-destructive mt-1">{formulaError}</p>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-sm font-medium">Umbral verde</label>
          <Input className="mt-1" type="number" step="0.01" value={form.watch('threshold_green') ?? ''} onChange={(e) => form.setValue('threshold_green', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div>
          <label className="text-sm font-medium">Umbral amarillo</label>
          <Input className="mt-1" type="number" step="0.01" value={form.watch('threshold_yellow') ?? ''} onChange={(e) => form.setValue('threshold_yellow', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div>
          <label className="text-sm font-medium">Umbral rojo</label>
          <Input className="mt-1" type="number" step="0.01" value={form.watch('threshold_red') ?? ''} onChange={(e) => form.setValue('threshold_red', e.target.value ? Number(e.target.value) : null)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={() => { setEditTarget(null); form.reset(); setFormulaText('{}'); }}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={Boolean(createMut?.isPending) || Boolean(updateMut?.isPending)}>
          {(Boolean(createMut?.isPending) || Boolean(updateMut?.isPending)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editTarget ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Fórmulas de Indicadores" description="Motor de cálculo de KPIs de seguridad — define código, fórmula JSON y umbrales de semáforo.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen}><Plus className="mr-2 h-4 w-4" />Nueva fórmula</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nueva fórmula de indicador</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={FunctionSquare} title="Sin fórmulas" description="Define la primera fórmula de indicador con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Código</DataTableTh>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Motor</DataTableTh>
                  <DataTableTh>Periodicidad</DataTableTh>
                  <DataTableTh>Umbrales</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-mono text-xs font-semibold">{item.code}</DataTableCell>
                    <DataTableCell className="max-w-[200px] truncate">{item.nombre}</DataTableCell>
                    <DataTableCell>
                      <Badge className="bg-blue-100 text-blue-800" variant="outline">{item.motor}</Badge>
                    </DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{item.periodicidad}</DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground">
                      {item.threshold_green != null && <span className="text-green-600">{item.threshold_green}</span>}
                      {item.threshold_yellow != null && <span className="text-amber-600"> / {item.threshold_yellow}</span>}
                      {item.threshold_red != null && <span className="text-red-600"> / {item.threshold_red}</span>}
                      {item.threshold_green == null && '—'}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Dialog open={editTarget?.id === item.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); form.reset(); setFormulaText('{}'); } }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Editar fórmula</DialogTitle></DialogHeader>
                            {dialogForm}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar fórmula</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void onDelete(item.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
