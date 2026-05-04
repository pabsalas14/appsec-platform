"use client";

import { formatDistanceToNow, parseISO } from 'date-fns';
import { FileIcon, ImageIcon, Trash2, Upload, UploadCloud } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import AuthImage from '@/components/ui/AuthImage';
import {
  Badge,
  Button,
  Card,
  CardContent,
  PremiumPageHeader,
  PageWrapper,
  premiumShellCardClass,
  Skeleton,
} from '@/components/ui';
import { useDeleteUpload, useUploadFile, useUploads } from '@/hooks/useUploads';
import { cn } from '@/lib/utils';
import type { Attachment } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isImage(a: Attachment) {
  return a.content_type.startsWith('image/');
}

function isPdf(a: Attachment) {
  return a.content_type === 'application/pdf';
}

const API_PREFIX = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function UploadsPage() {
  const { data: files = [], isLoading } = useUploads();
  const uploadMut = useUploadFile();
  const deleteMut = useDeleteUpload();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList) return;
      for (const file of Array.from(fileList)) {
        try {
          await uploadMut.mutateAsync(file);
          toast.success(`${file.name} subido correctamente`);
        } catch {
          toast.error(`No se pudo subir ${file.name}`);
        }
      }
    },
    [uploadMut],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <PremiumPageHeader
        eyebrow="Archivos"
        icon={Upload}
        title="Carga de archivos"
        description="Arrastra archivos o elige desde disco. Almacenamiento por usuario con validación de tipo y tamaño (imágenes, PDF, texto hasta 10 MB)."
      />

      <Card className={premiumShellCardClass}>
        <CardContent className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
            )}
            role="button"
            tabIndex={0}
          >
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <div className="text-sm font-medium text-foreground">
              Arrastra archivos aquí o haz clic para elegir
            </div>
            <div className="text-xs text-muted-foreground">
              Imágenes, PDF, texto plano, JSON, zip — máx. 10 MB por archivo
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <CardContent className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="ml-auto h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Aún no hay archivos subidos
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((attachment) => (
            <Card key={attachment.id} className="overflow-hidden">
              <div className="flex h-40 items-center justify-center bg-muted/40">
                {isImage(attachment) ? (
                  <AuthImage
                    src={`${API_PREFIX}${attachment.url}`}
                    alt={attachment.filename}
                    className="h-full w-full object-cover"
                  />
                ) : isPdf(attachment) ? (
                  <iframe
                    title={attachment.filename}
                    src={`${API_PREFIX}${attachment.url}`}
                    className="h-full w-full border-0 bg-background"
                  />
                ) : (
                  <FileIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <CardContent className="space-y-2 p-3">
                <div className="flex items-center gap-2">
                  {isImage(attachment) ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="truncate text-sm font-medium text-foreground" title={attachment.filename}>
                    {attachment.filename}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="default" className="bg-background/60 text-[10px]">
                    {formatBytes(attachment.size)}
                  </Badge>
                  <span>
                    {formatDistanceToNow(parseISO(attachment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMut.mutate(attachment.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
