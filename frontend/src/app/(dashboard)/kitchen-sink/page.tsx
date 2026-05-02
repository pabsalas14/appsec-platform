"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Bell, CheckCircle2, DollarSign, Info, ListTodo, Sparkles, Users, XCircle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  MultiSelect,
  PageHeader,
  PageWrapper,
  PremiumPageHeader,
  PremiumPanel,
  premiumShellCardClass,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Select,
  Separator,
  Skeleton,
  Spinner,
  StatCard,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function KitchenSinkPage() {
  const [checked, setChecked] = useState(false);
  const [switched, setSwitched] = useState(true);
  const [progress, setProgress] = useState(42);
  const [selectedMulti, setSelectedMulti] = useState<number[]>([]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Kitchen Sink"
        description="Live gallery of every UI primitive in the framework. Use this page to discover which component fits your use-case."
      />

      {/* Typography */}
      <Section title="Typography" description="Text scale and semantic tokens.">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Heading 1</h1>
          <h2 className="text-2xl font-semibold text-foreground">Heading 2</h2>
          <h3 className="text-xl font-medium text-foreground">Heading 3</h3>
          <p className="text-sm text-foreground">Body — foreground text</p>
          <p className="text-sm text-muted-foreground">Body — muted foreground</p>
          <p className="text-xs text-muted-foreground">Caption</p>
        </div>
      </Section>

      {/* Premium module shell (catálogos / workspace — mismo lenguaje visual que dashboards) */}
      <Section
        title="Premium module shell"
        description="PremiumPageHeader + PremiumPanel + premiumShellCardClass — usar en listados CRUD y hubs."
      >
        <div className="space-y-4">
          <PremiumPageHeader
            eyebrow="Ejemplo — AppSec"
            icon={Sparkles}
            title="Cabecera premium"
            description="Eyebrow en mayúsculas, icono opcional, gradiente sutil y acciones a la derecha."
            action={<Button size="sm">Acción demo</Button>}
          />
          <PremiumPanel className="p-4">
            <div
              className={cn(
                'rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground',
                premiumShellCardClass,
              )}
            >
              Contenido dentro de <code className="text-xs">PremiumPanel</code> (filtros, tabla, formularios).
            </div>
          </PremiumPanel>
        </div>
      </Section>

      {/* Colors */}
      <Section title="Colors" description="Semantic tokens that react to theme changes.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { name: 'primary', className: 'bg-primary text-primary-foreground' },
            { name: 'secondary', className: 'bg-secondary text-secondary-foreground' },
            { name: 'accent', className: 'bg-accent text-accent-foreground' },
            { name: 'muted', className: 'bg-muted text-muted-foreground' },
            { name: 'card', className: 'bg-card text-foreground border border-border' },
            { name: 'destructive', className: 'bg-destructive text-destructive-foreground' },
            { name: 'border', className: 'bg-background border border-border text-foreground' },
            { name: 'ring', className: 'bg-background ring-2 ring-ring text-foreground' },
          ].map((c) => (
            <div
              key={c.name}
              className={`flex h-16 items-center justify-center rounded-lg text-xs ${c.className}`}
            >
              {c.name}
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="glass">Glass</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Form inputs">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="demo-input">Input</Label>
            <Input id="demo-input" placeholder="Type something" />
          </div>
          <div>
            <Label htmlFor="demo-textarea">Textarea</Label>
            <Textarea id="demo-textarea" placeholder="Multi-line" />
          </div>
          <div>
            <Label htmlFor="demo-select">Select</Label>
            <Select
              options={[
                { value: 'a', label: 'Option A' },
                { value: 'b', label: 'Option B' },
                { value: 'c', label: 'Option C' },
              ]}
            />
          </div>
          <div>
            <Label>MultiSelect</Label>
            <MultiSelect
              options={[
                { value: 1, label: 'Alpha' },
                { value: 2, label: 'Beta' },
                { value: 3, label: 'Gamma' },
              ]}
              value={selectedMulti}
              onChange={setSelectedMulti}
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="demo-check"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <Label htmlFor="demo-check">Checkbox</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={switched} onCheckedChange={setSwitched} />
            <Label>Switch</Label>
          </div>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="severity" severityName="high">Severity: high</Badge>
          <Badge variant="severity" severityName="low">Severity: low</Badge>
          <Badge variant="severity" severityName="info">Severity: info</Badge>
        </div>
      </Section>

      {/* Avatars */}
      <Section title="Avatars">
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback>AA</AvatarFallback>
          </Avatar>
          <Avatar className="h-10 w-10">
            <AvatarFallback>BB</AvatarFallback>
          </Avatar>
          <Avatar className="h-14 w-14 text-lg">
            <AvatarFallback>CC</AvatarFallback>
          </Avatar>
        </div>
      </Section>

      {/* Progress + loaders */}
      <Section title="Progress & loaders">
        <div className="space-y-4">
          <Progress value={progress} />
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
              -10
            </Button>
            <Button variant="outline" size="sm" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
              +10
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Spinner />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </Section>

      {/* Stat cards */}
      <Section title="Stat cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Users" value={124} icon={Users} trend={{ value: 12, label: 'this week' }} />
          <StatCard label="Tasks" value={58} icon={ListTodo} trend={{ value: -4, label: 'overdue' }} />
          <StatCard label="Revenue" value="$4.2k" icon={DollarSign} trend={{ value: 8, label: 'MTD' }} />
        </div>
      </Section>

      {/* Tabs */}
      <Section title="Tabs">
        <Tabs defaultValue="tab-1">
          <TabsList>
            <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab-3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab-1">Contents of tab 1</TabsContent>
          <TabsContent value="tab-2">Contents of tab 2</TabsContent>
          <TabsContent value="tab-3">Contents of tab 3</TabsContent>
        </Tabs>
      </Section>

      {/* Breadcrumbs */}
      <Section title="Breadcrumbs">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Section</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      {/* Overlays */}
      <Section title="Overlays" description="Dialog, alert dialog, popover, tooltip, dropdown.">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog title</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Any content goes here.</p>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="danger">Delete thing</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Popover</Button>
            </PopoverTrigger>
            <PopoverContent>Arbitrary popover content.</PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>I am a tooltip</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Dropdown</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Section>

      {/* Toasts */}
      <Section title="Toasts (sonner)">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast('Default toast')}>
            <Bell className="mr-2 h-4 w-4" />
            Default
          </Button>
          <Button variant="outline" onClick={() => toast.success('Saved!')}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Success
          </Button>
          <Button variant="outline" onClick={() => toast.error('Something broke')}>
            <XCircle className="mr-2 h-4 w-4" />
            Error
          </Button>
          <Button variant="outline" onClick={() => toast.warning('Careful!')}>
            <AlertCircle className="mr-2 h-4 w-4" />
            Warning
          </Button>
          <Button variant="outline" onClick={() => toast.info('FYI')}>
            <Info className="mr-2 h-4 w-4" />
            Info
          </Button>
        </div>
      </Section>

      <Separator />

      <p className="text-xs text-muted-foreground">
        Every primitive shown above is exported from <code>@/components/ui</code>. Use this page
        as a visual catalog and copy-paste starting point.
      </p>
    </PageWrapper>
  );
}
