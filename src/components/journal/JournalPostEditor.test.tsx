import type { ReactNode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalPostEditor } from '@/components/journal/JournalPostEditor';

/* eslint-disable pace-core-compliance/prefer-pace-core-form, pace-core-compliance/prefer-pace-core-components -- Form stub for isolated editor tests */
vi.mock('@solvera/pace-core/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/components')>();
  return {
    ...actual,
    Form: function MockForm<T extends { title: string; content: string; status: string }>({
      children,
      onSubmit,
      defaultValues,
    }: {
      children: (methods: { control: object }) => ReactNode;
      onSubmit: (values: T) => void;
      defaultValues?: Partial<T>;
    }) {
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({
              title: String(defaultValues?.title ?? ''),
              content: String(defaultValues?.content ?? ''),
              status: (defaultValues?.status as 'draft' | 'published') ?? 'published',
            } as T);
          }}
        >
          {children({ control: {} })}
        </form>
      );
    },
    FormField: function MockFormField({
      name,
      label,
      render,
    }: {
      name: string;
      label?: string;
      render?: (props: { field: { value: string; onChange: (v: string) => void; onBlur: () => void } }) => ReactNode;
    }) {
      const field = {
        value:
          name === 'title' ? 'Title value' : name === 'status' ? 'published' : 'Content value',
        onChange: vi.fn(),
        onBlur: vi.fn(),
      };
      return (
        <label>
          {label}
          {render != null ? render({ field }) : <input aria-label={label} defaultValue={field.value} />}
        </label>
      );
    },
  };
});

describe('JournalPostEditor', () => {
  afterEach(cleanup);

  it('renders new entry dialog fields when open', () => {
    render(
      <JournalPostEditor
        open
        onOpenChange={vi.fn()}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />
    );
    expect(screen.getByText('New journal entry')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(document.getElementById('journal-content')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('submits save with form values', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<JournalPostEditor open onOpenChange={vi.fn()} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({
      title: '',
      content: '',
      status: 'published',
      images: [],
    });
  });
});
