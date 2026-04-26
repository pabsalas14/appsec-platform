"use client";

import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  useActionTypes,
  useAIRules,
  useCreateAIRule,
  useDeleteAIRule,
  useTriggerTypes,
  useTestAIRule,
  useUpdateAIRule,
} from "@/hooks/useAIRules";
import type { AIRuleCreate, AIRuleRead, AIRuleUpdate } from "@/types/ai-rules";

type FormData = AIRuleCreate & { id?: string };

const DEFAULT_FORM: Omit<FormData, "id"> = {
  name: "",
  description: "",
  trigger_type: "on_vulnerability_created",
  trigger_config: {},
  action_type: "send_notification",
  action_config: {},
  enabled: true,
  max_retries: 3,
  timeout_seconds: 30,
};

function RuleForm({
  initialData,
  onSubmit,
  isLoading,
}: {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<FormData>(
    initialData ? { ...initialData, ...DEFAULT_FORM } : { ...DEFAULT_FORM }
  );
  const { data: triggers = [] } = useTriggerTypes();
  const { data: actions = [] } = useActionTypes();

  const handleChange = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfigChange = (type: "trigger" | "action", key: string, value: unknown) => {
    const configKey = type === "trigger" ? "trigger_config" : "action_config";
    setForm((prev) => ({
      ...prev,
      [configKey]: {
        ...prev[configKey],
        [key]: value,
      },
    }));
  };

  const selectedTrigger = triggers.find((t) => t.id === form.trigger_type);
  const selectedAction = actions.find((a) => a.id === form.action_type);

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Rule Name</label>
        <Input
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Generate summary for critical vulns"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={form.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Optional description"
        />
      </div>

      {/* Trigger Configuration */}
      <div className="rounded-lg border p-4">
        <h4 className="mb-3 font-semibold text-sm">Trigger Configuration</h4>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Trigger Type</label>
            <Select
              value={form.trigger_type}
              onChange={(e) => handleChange("trigger_type", e.target.value)}
              options={triggers.map((t) => ({
                value: t.id,
                label: t.label,
              }))}
            />
            {selectedTrigger && (
              <p className="text-xs text-muted-foreground">{selectedTrigger.description}</p>
            )}
          </div>

          {selectedTrigger?.configurable_fields.map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium capitalize">{field}</label>
              <Input
                value={(form.trigger_config?.[field] as string) || ""}
                onChange={(e) => handleConfigChange("trigger", field, e.target.value)}
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Action Configuration */}
      <div className="rounded-lg border p-4">
        <h4 className="mb-3 font-semibold text-sm">Action Configuration</h4>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Action Type</label>
            <Select
              value={form.action_type}
              onChange={(e) => handleChange("action_type", e.target.value)}
              options={actions.map((a) => ({
                value: a.id,
                label: a.label,
              }))}
            />
            {selectedAction && (
              <p className="text-xs text-muted-foreground">{selectedAction.description}</p>
            )}
          </div>

          {selectedAction?.configurable_fields.map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium capitalize">{field}</label>
              <Input
                value={(form.action_config?.[field] as string) || ""}
                onChange={(e) => handleConfigChange("action", field, e.target.value)}
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Advanced */}
      <div className="rounded-lg border p-4">
        <h4 className="mb-3 font-semibold text-sm">Advanced Settings</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Retries</label>
              <Input
                type="number"
                min="0"
                max="10"
                value={form.max_retries}
                onChange={(e) => handleChange("max_retries", parseInt(e.target.value, 10))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeout (seconds)</label>
              <Input
                type="number"
                min="5"
                max="300"
                value={form.timeout_seconds}
                onChange={(e) => handleChange("timeout_seconds", parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-transparent bg-muted/50 p-3">
            <label className="text-sm font-medium">Enable Rule</label>
            <Switch
              checked={form.enabled}
              onCheckedChange={(checked) => handleChange("enabled", checked)}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={() => onSubmit(form)}
        disabled={isLoading || !form.name.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            {initialData?.id ? "Update Rule" : "Create Rule"}
          </>
        )}
      </Button>
    </div>
  );
}

function RuleCard({
  rule,
  onEdit,
  onDelete,
  onTest,
}: {
  rule: AIRuleRead;
  onEdit: (rule: AIRuleRead) => void;
  onDelete: (id: string) => Promise<void>;
  onTest: (id: string) => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta regla?")) return;
    try {
      setIsDeleting(true);
      await onDelete(rule.id as unknown as string);
      toast.success("Regla eliminada");
    } catch (error) {
      toast.error("Error al eliminar regla");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTest = async () => {
    try {
      setIsTesting(true);
      await onTest(rule.id as unknown as string);
      toast.success("Test ejecutado");
    } catch (error) {
      toast.error("Error en test");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              {rule.name}
            </CardTitle>
            {rule.description && (
              <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
            )}
          </div>
          <Switch
            checked={rule.enabled}
            onCheckedChange={() => {}} // Would update via API
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-muted p-2">
            <div className="text-muted-foreground">Trigger</div>
            <div className="font-mono">{rule.trigger_type}</div>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <div className="text-muted-foreground">Action</div>
            <div className="font-mono">{rule.action_type}</div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(rule)}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Test
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAIRulesPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AIRuleRead | null>(null);
  const [search, setSearch] = useState("");
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const { data: rulesData, isLoading: isLoadingRules } = useAIRules(skip, limit, {
    search: search || undefined,
    enabled: filterEnabled ?? undefined,
  });

  const createMutation = useCreateAIRule();
  const updateMutation = useUpdateAIRule(editingRule?.id as unknown as string);
  const deleteMutation = useDeleteAIRule();
  const testMutation = useTestAIRule();

  const handleCreate = async (formData: FormData) => {
    try {
      const { id, ...data } = formData;
      await createMutation.mutateAsync(data as AIRuleCreate);
      toast.success("Regla creada exitosamente");
      setOpenDialog(false);
    } catch (error) {
      toast.error("Error al crear regla");
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingRule) return;
    try {
      const { id, ...data } = formData;
      await updateMutation.mutateAsync(data as AIRuleUpdate);
      toast.success("Regla actualizada");
      setEditingRule(null);
      setOpenDialog(false);
    } catch (error) {
      toast.error("Error al actualizar regla");
    }
  };

  const handleEdit = (rule: AIRuleRead) => {
    setEditingRule(rule);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setEditingRule(null);
    setOpenDialog(false);
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="AI Automation Rules"
        description="Configure automatic actions triggered by events. Rules execute actions based on events like vulnerability creation, status changes, and scheduled times."
      />

      <Tabs defaultValue="rules" className="w-full">
        <TabsList>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="config">IA Configuration</TabsTrigger>
        </TabsList>

        {/* AUTOMATION RULES TAB */}
        <TabsContent value="rules" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium">Search</label>
                  <Input
                    placeholder="Search rules..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSkip(0);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Status</label>
                  <Select
                    value={filterEnabled === null ? "" : String(filterEnabled)}
                    onChange={(e) => {
                      setFilterEnabled(e.target.value === "" ? null : e.target.value === "true");
                      setSkip(0);
                    }}
                    options={[
                      { value: "", label: "All" },
                      { value: "true", label: "Enabled" },
                      { value: "false", label: "Disabled" },
                    ]}
                  />
                </div>
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Rule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rules Grid */}
          {isLoadingRules ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (rulesData?.items ?? []).length === 0 ? (
            <Card>
              <CardContent className="pt-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No rules found. Create your first automation rule.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rulesData!.items.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutateAsync(id)}
                    onTest={(id) =>
                      testMutation.mutateAsync({
                        ruleId: id,
                        payload: { data: {} },
                      })
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {rulesData!.items.length} of {rulesData!.total} rules
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSkip(Math.max(0, skip - limit))}
                    disabled={skip === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSkip(skip + limit)}
                    disabled={!rulesData || skip + limit >= rulesData.total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* IA CONFIGURATION TAB */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IA Provider Configuration</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure the AI provider and model used for LLM-based actions.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p>IA Configuration is managed in a separate section. Update provider, model, and credentials there.</p>
              </div>
              <Button variant="outline">Go to IA Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for creating/editing rules */}
      <Dialog open={openDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Create New AI Automation Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule
                ? "Modify the rule configuration below."
                : "Configure a new automation rule with trigger and action."}
            </DialogDescription>
          </DialogHeader>
          <RuleForm
            initialData={editingRule}
            onSubmit={editingRule ? handleUpdate : handleCreate}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
          <DialogClose />
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
