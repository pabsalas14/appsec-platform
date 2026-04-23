import { describe, it, expect } from 'vitest';
import { taskCreateSchema, taskUpdateSchema } from '@/lib/schemas/task.schema';

describe('taskCreateSchema', () => {
  it('accepts a valid payload', () => {
    const out = taskCreateSchema.safeParse({
      title: 'Buy milk',
      description: '',
      completed: false,
    });
    expect(out.success).toBe(true);
  });

  it('rejects an empty title', () => {
    const out = taskCreateSchema.safeParse({
      title: '',
      description: '',
      completed: false,
    });
    expect(out.success).toBe(false);
    if (!out.success) {
      expect(out.error.issues[0].message).toBe('Title is required');
    }
  });

  it('rejects a description longer than 2000 chars', () => {
    const out = taskCreateSchema.safeParse({
      title: 'ok',
      description: 'x'.repeat(2001),
      completed: false,
    });
    expect(out.success).toBe(false);
  });
});

describe('taskUpdateSchema', () => {
  it('accepts a partial payload', () => {
    expect(taskUpdateSchema.safeParse({ completed: true }).success).toBe(true);
    expect(taskUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('still validates provided fields', () => {
    const out = taskUpdateSchema.safeParse({ title: '' });
    expect(out.success).toBe(false);
  });
});
