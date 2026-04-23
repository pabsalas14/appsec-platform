import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse, Attachment, PaginatedResponse } from '@/types';

async function listUploads(): Promise<Attachment[]> {
  const res = await api.get<PaginatedResponse<Attachment>>('/uploads', {
    params: { page_size: 100 },
  });
  return res.data.data;
}

async function uploadFile(file: File): Promise<Attachment> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<ApiResponse<Attachment>>('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

async function deleteUpload(id: string): Promise<void> {
  await api.delete(`/uploads/${id}`);
}

export function useUploads() {
  return useQuery({ queryKey: ['uploads'], queryFn: listUploads });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['uploads'] }),
  });
}

export function useDeleteUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUpload,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['uploads'] }),
  });
}
