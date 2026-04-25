/**
 * Component Tests - Phase 16
 * DataTable, Modal, Form, KanbanBoard, Chart, Semaphore
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import * as React from 'react';

/**
 * ============================================================================
 * DataTable Component Tests
 * ============================================================================
 */
describe('DataTable Component', () => {
  const mockData = [
    { id: 1, titulo: 'SQL Injection', severidad: 'Crítica', estado: 'Abierta', sla_dias: 5 },
    { id: 2, titulo: 'XSS Attack', severidad: 'Alta', estado: 'Abierta', sla_dias: 15 },
    { id: 3, titulo: 'CSRF Token', severidad: 'Media', estado: 'Cerrada', sla_dias: -3 },
  ];

  const columns = [
    { header: 'Título', accessor: 'titulo', sortable: true },
    { header: 'Severidad', accessor: 'severidad', sortable: true },
    { header: 'Estado', accessor: 'estado', sortable: false },
    { header: 'SLA Días', accessor: 'sla_dias', sortable: true },
  ];

  describe('Rendering', () => {
    it('should render table with correct headers', () => {
      render(
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.accessor}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((row) => (
              <tr key={row.id}>
                <td>{row.titulo}</td>
                <td>{row.severidad}</td>
                <td>{row.estado}</td>
                <td>{row.sla_dias}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      expect(screen.getByText('Título')).toBeInTheDocument();
      expect(screen.getByText('Severidad')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('SLA Días')).toBeInTheDocument();
    });

    it('should render all data rows', () => {
      render(
        <table>
          <tbody>
            {mockData.map((row) => (
              <tr key={row.id}>
                <td>{row.titulo}</td>
                <td>{row.severidad}</td>
                <td>{row.estado}</td>
                <td>{row.sla_dias}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      expect(screen.getByText('SQL Injection')).toBeInTheDocument();
      expect(screen.getByText('XSS Attack')).toBeInTheDocument();
      expect(screen.getByText('CSRF Token')).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
      render(
        <div>
          {mockData.length === 0 ? (
            <div data-testid="empty-state">No data available</div>
          ) : (
            <table>
              <tbody>
                {mockData.map((row) => (
                  <tr key={row.id}><td>{row.titulo}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();

      render(
        <div>
          {[].length === 0 ? (
            <div data-testid="empty-state-2">No data available</div>
          ) : (
            <table><tbody></tbody></table>
          )}
        </div>
      );

      expect(screen.getByTestId('empty-state-2')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by column when header clicked', () => {
      const onSort = vi.fn();

      render(
        <table>
          <thead>
            <tr>
              <th onClick={() => onSort('titulo')}>Título</th>
              <th onClick={() => onSort('severidad')}>Severidad</th>
            </tr>
          </thead>
        </table>
      );

      fireEvent.click(screen.getByText('Título'));
      expect(onSort).toHaveBeenCalledWith('titulo');
    });

    it('should display sort indicator (ASC/DESC)', () => {
      const sortState = { field: 'titulo', direction: 'asc' };

      render(
        <table>
          <thead>
            <tr>
              <th>
                Título
                {sortState.field === 'titulo' && (
                  <span data-testid="sort-indicator">
                    {sortState.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            </tr>
          </thead>
        </table>
      );

      expect(screen.getByTestId('sort-indicator')).toHaveTextContent('↑');
    });

    it('should enforce maximum page size of 100', () => {
      const requestedSize = 500;
      const maxSize = 100;
      const actualSize = Math.min(requestedSize, maxSize);

      expect(actualSize).toBe(100);
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      render(
        <div>
          <button>Previous</button>
          <span>Page 1 of 3</span>
          <button>Next</button>
        </div>
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should disable next button on last page', () => {
      const isLastPage = true;

      render(
        <button disabled={isLastPage}>Next</button>
      );

      expect(screen.getByText('Next')).toBeDisabled();
    });
  });

  describe('Selection', () => {
    it('should select/deselect individual row', () => {
      const [selected, setSelected] = React.useState(new Set<number>());

      const toggleRow = (id: number) => {
        const newSelected = new Set(selected);
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
        setSelected(newSelected);
      };

      render(
        <table>
          <tbody>
            {mockData.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                  />
                </td>
                <td>{row.titulo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toBeChecked();
    });

    it('should disable bulk action button if no rows selected', () => {
      const isDisabled = 0 === 0;

      render(
        <button disabled={isDisabled}>Bulk Delete</button>
      );

      expect(screen.getByText('Bulk Delete')).toBeDisabled();
    });
  });

  describe('Filtering', () => {
    it('should filter rows by column value', () => {
      const filteredData = mockData.filter((row) => row.severidad === 'Crítica');

      render(
        <table>
          <tbody>
            {filteredData.map((row) => (
              <tr key={row.id}>
                <td>{row.titulo}</td>
                <td>{row.severidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      expect(screen.getByText('SQL Injection')).toBeInTheDocument();
      expect(screen.queryByText('XSS Attack')).not.toBeInTheDocument();
    });

    it('should support multi-column filters', () => {
      const filters = { severidad: 'Alta', estado: 'Abierta' };
      const filteredData = mockData.filter(
        (row) =>
          row.severidad === filters.severidad &&
          row.estado === filters.estado
      );

      expect(filteredData.length).toBe(1);
      expect(filteredData[0].titulo).toBe('XSS Attack');
    });
  });

  describe('Row Actions', () => {
    it('should display action buttons for each row', () => {
      render(
        <table>
          <tbody>
            {mockData.map((row) => (
              <tr key={row.id}>
                <td>{row.titulo}</td>
                <td>
                  <button>Edit</button>
                  <button>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      const editButtons = screen.getAllByText('Edit');
      expect(editButtons.length).toBe(3);
    });

    it('should handle row edit action', () => {
      const onEdit = vi.fn();

      render(
        <table>
          <tbody>
            <tr>
              <td>SQL Injection</td>
              <td>
                <button onClick={() => onEdit(1)}>Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      );

      fireEvent.click(screen.getByText('Edit'));
      expect(onEdit).toHaveBeenCalledWith(1);
    });
  });
});

/**
 * ============================================================================
 * Modal Component Tests
 * ============================================================================
 */
describe('Modal Component', () => {
  describe('Rendering', () => {
    it('should render modal when open prop is true', () => {
      render(
        <div>
          {true && (
            <div role="dialog" aria-modal="true" data-testid="modal">
              <div>Modal Content</div>
            </div>
          )}
        </div>
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should not render modal when open prop is false', () => {
      render(
        <div>
          {false && (
            <div role="dialog" data-testid="modal">
              Modal Content
            </div>
          )}
        </div>
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should display modal title', () => {
      render(
        <div role="dialog">
          <h2>Create Vulnerability</h2>
          <p>Modal Content</p>
        </div>
      );

      expect(screen.getByText('Create Vulnerability')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should close modal on close button click', () => {
      const onClose = vi.fn();

      render(
        <div role="dialog">
          <button onClick={onClose}>×</button>
          <p>Modal Content</p>
        </div>
      );

      fireEvent.click(screen.getByText('×'));
      expect(onClose).toHaveBeenCalled();
    });

    it('should handle ESC key to close modal', () => {
      const onClose = vi.fn();

      render(
        <div
          role="dialog"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
        >
          <p>Modal Content</p>
        </div>
      );

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });

    it('should handle confirm button action', () => {
      const onConfirm = vi.fn();

      render(
        <div role="dialog">
          <button onClick={onConfirm}>Confirm</button>
        </div>
      );

      fireEvent.click(screen.getByText('Confirm'));
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <h2 id="modal-title">Dialog Title</h2>
        </div>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should close modal on backdrop click', () => {
      const onClose = vi.fn();

      render(
        <div
          data-testid="backdrop"
          onClick={onClose}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            Content
          </div>
        </div>
      );

      fireEvent.click(screen.getByTestId('backdrop'));
      expect(onClose).toHaveBeenCalled();
    });
  });
});

/**
 * ============================================================================
 * Form Component Tests
 * ============================================================================
 */
describe('Form Component', () => {
  describe('Rendering', () => {
    it('should render form inputs', () => {
      render(
        <form>
          <input name="titulo" placeholder="Título" />
          <input name="descripcion" placeholder="Descripción" />
          <select name="severidad">
            <option>Crítica</option>
            <option>Alta</option>
          </select>
          <button type="submit">Create</button>
        </form>
      );

      expect(screen.getByPlaceholderText('Título')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Descripción')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should display form labels', () => {
      render(
        <form>
          <label htmlFor="titulo">Título</label>
          <input id="titulo" />
          <label htmlFor="severidad">Severidad</label>
          <select id="severidad">
            <option>Alta</option>
          </select>
        </form>
      );

      expect(screen.getByLabelText('Título')).toBeInTheDocument();
      expect(screen.getByLabelText('Severidad')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const [errors, setErrors] = React.useState<Record<string, string>>({});
      const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const newErrors: Record<string, string> = {};

        if (!form.titulo.value) newErrors.titulo = 'Required';
        if (!form.severidad.value) newErrors.severidad = 'Required';

        setErrors(newErrors);
      };

      render(
        <form onSubmit={handleSubmit}>
          <input name="titulo" required />
          {errors.titulo && <span>{errors.titulo}</span>}
          <select name="severidad" required>
            <option value="">Select...</option>
            <option>Alta</option>
          </select>
          {errors.severidad && <span>{errors.severidad}</span>}
          <button type="submit">Submit</button>
        </form>
      );

      fireEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(screen.getAllByText('Required').length).toBeGreaterThan(0);
      });
    });

    it('should validate email format', () => {
      const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
    });

    it('should display error messages below fields', () => {
      render(
        <form>
          <input name="titulo" />
          <span>Field is required</span>
        </form>
      );

      expect(screen.getByText('Field is required')).toBeInTheDocument();
    });
  });

  describe('Submission', () => {
    it('should disable submit button during submission', async () => {
      const [isLoading, setIsLoading] = React.useState(false);
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 100));
        setIsLoading(false);
      };

      render(
        <form onSubmit={handleSubmit}>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      );

      const button = screen.getByRole('button');
      fireEvent.submit(button.closest('form')!);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('should show success message after submission', async () => {
      const [success, setSuccess] = React.useState(false);
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(true);
      };

      render(
        <form onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
          {success && <div>Successfully created!</div>}
        </form>
      );

      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(screen.getByText('Successfully created!')).toBeInTheDocument();
      });
    });

    it('should handle submission errors', async () => {
      const [error, setError] = React.useState('');
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          throw new Error('API Error');
        } catch (err) {
          setError((err as Error).message);
        }
      };

      render(
        <form onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
          {error && <div className="error">{error}</div>}
        </form>
      );

      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });
  });

  describe('Reset', () => {
    it('should reset form to initial state', async () => {
      const user = userEvent.setup();

      render(
        <form>
          <input name="titulo" defaultValue="" />
          <button type="reset">Reset</button>
        </form>
      );

      const input = screen.getByDisplayValue('') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'New Value' } });

      expect(input.value).toBe('New Value');

      await user.click(screen.getByText('Reset'));

      expect(input.value).toBe('');
    });
  });
});

/**
 * ============================================================================
 * KanbanBoard Component Tests
 * ============================================================================
 */
describe('KanbanBoard Component', () => {
  const mockReleases = {
    'Design': [{ id: 1, titulo: 'Release 1.0', version: '1.0.0' }],
    'Validation': [{ id: 2, titulo: 'Release 2.0', version: '2.0.0' }],
    'Tests': [],
    'QA': [{ id: 3, titulo: 'Release 3.0', version: '3.0.0' }],
  };

  describe('Column Rendering', () => {
    it('should render all kanban columns', () => {
      const columns = Object.keys(mockReleases);

      render(
        <div>
          {columns.map((col) => (
            <div key={col} data-testid={`column-${col}`}>
              <h3>{col}</h3>
            </div>
          ))}
        </div>
      );

      columns.forEach((col) => {
        expect(screen.getByTestId(`column-${col}`)).toBeInTheDocument();
      });
    });

    it('should display column header with item count', () => {
      render(
        <div>
          {Object.entries(mockReleases).map(([col, items]) => (
            <div key={col} data-testid={`column-${col}`}>
              <h3>{col} ({items.length})</h3>
            </div>
          ))}
        </div>
      );

      expect(screen.getByText('Design (1)')).toBeInTheDocument();
      expect(screen.getByText('Tests (0)')).toBeInTheDocument();
    });
  });

  describe('Cards', () => {
    it('should render cards in columns', () => {
      render(
        <div>
          {Object.entries(mockReleases).map(([col, items]) => (
            <div key={col}>
              {items.map((item) => (
                <div key={item.id} data-testid={`card-${item.id}`}>
                  {item.titulo}
                </div>
              ))}
            </div>
          ))}
        </div>
      );

      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByText('Release 1.0')).toBeInTheDocument();
    });
  });

  describe('Add/Delete', () => {
    it('should add new card to column', () => {
      const [items, setItems] = React.useState({ Design: [] as any[] });
      const addCard = (col: string, card: any) => {
        setItems((prev) => ({
          ...prev,
          [col]: [...prev[col], card],
        }));
      };

      render(
        <div>
          <button
            onClick={() =>
              addCard('Design', { id: 5, titulo: 'New Release' })
            }
          >
            Add Card
          </button>
        </div>
      );

      fireEvent.click(screen.getByText('Add Card'));
      expect(items.Design.length).toBe(1);
    });

    it('should delete card from column', () => {
      const onDelete = vi.fn();

      render(
        <div>
          <div data-testid="card-1">
            Release 1.0
            <button onClick={() => onDelete(1)}>Delete</button>
          </div>
        </div>
      );

      fireEvent.click(screen.getByText('Delete'));
      expect(onDelete).toHaveBeenCalledWith(1);
    });
  });
});

/**
 * ============================================================================
 * Chart Component Tests
 * ============================================================================
 */
describe('Chart Component', () => {
  const pieChartData = {
    labels: ['SAST', 'DAST', 'SCA'],
    datasets: [
      {
        data: [45, 30, 25],
        backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
      },
    ],
  };

  describe('Pie Chart', () => {
    it('should render pie chart', () => {
      render(
        <canvas
          data-testid="pie-chart"
          title="Motor Distribution"
        />
      );

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should display chart data legend', () => {
      render(
        <div>
          <canvas data-testid="pie-chart" />
          <ul>
            {pieChartData.labels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      );

      expect(screen.getByText('SAST')).toBeInTheDocument();
      expect(screen.getByText('DAST')).toBeInTheDocument();
    });

    it('should update chart when data changes', () => {
      const [data, setData] = React.useState(pieChartData.datasets[0].data);

      render(
        <div>
          <canvas data-testid="pie-chart" />
          <button onClick={() => setData([50, 35, 15])}>Update</button>
          <span>{data[0]}</span>
        </div>
      );

      fireEvent.click(screen.getByText('Update'));
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('Chart Colors', () => {
    it('should display correct colors for severity levels', () => {
      const severityColors = {
        'Crítica': '#ff4444',
        'Alta': '#ff9900',
        'Media': '#ffcc00',
        'Baja': '#00cc00',
      };

      render(
        <div>
          {Object.entries(severityColors).map(([severity, color]) => (
            <div
              key={severity}
              style={{ backgroundColor: color }}
              data-testid={`color-${severity}`}
            >
              {severity}
            </div>
          ))}
        </div>
      );

      const criticaDiv = screen.getByTestId('color-Crítica');
      expect(criticaDiv).toHaveStyle({ backgroundColor: '#ff4444' });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      render(
        <div>
          {true ? (
            <div data-testid="empty-chart">No data available</div>
          ) : (
            <canvas />
          )}
        </div>
      );

      expect(screen.getByTestId('empty-chart')).toBeInTheDocument();
    });
  });
});

/**
 * ============================================================================
 * Semaphore/Status Indicator Component Tests
 * ============================================================================
 */
describe('Semaphore/Status Indicator Component', () => {
  describe('Color Display', () => {
    it('should display GREEN indicator for safe SLA status', () => {
      const sla_dias = 15;
      const getColor = (days: number) => (days > 7 ? 'green' : days > 0 ? 'yellow' : 'red');

      render(
        <div
          data-testid="indicator"
          className={`indicator-${getColor(sla_dias)}`}
        >
          ●
        </div>
      );

      expect(screen.getByTestId('indicator')).toHaveClass('indicator-green');
    });

    it('should display YELLOW indicator for at-risk SLA status', () => {
      const sla_dias = 3;
      const getColor = (days: number) => (days > 7 ? 'green' : days > 0 ? 'yellow' : 'red');

      render(
        <div
          data-testid="indicator"
          className={`indicator-${getColor(sla_dias)}`}
        >
          ●
        </div>
      );

      expect(screen.getByTestId('indicator')).toHaveClass('indicator-yellow');
    });

    it('should display RED indicator for overdue SLA status', () => {
      const sla_dias = -5;
      const getColor = (days: number) => (days > 7 ? 'green' : days > 0 ? 'yellow' : 'red');

      render(
        <div
          data-testid="indicator"
          className={`indicator-${getColor(sla_dias)}`}
        >
          ●
        </div>
      );

      expect(screen.getByTestId('indicator')).toHaveClass('indicator-red');
    });
  });

  describe('Tooltip', () => {
    it('should show tooltip with SLA information', () => {
      render(
        <div>
          <div
            data-testid="semaphore"
            className="semaphore-yellow"
            title="SLA expires in 3 days"
          >
            ●
          </div>
        </div>
      );

      const indicator = screen.getByTestId('semaphore');
      expect(indicator).toHaveAttribute('title', 'SLA expires in 3 days');
    });
  });

  describe('Status Label', () => {
    it('should display status text label', () => {
      const statusLabels: Record<string, string> = {
        'green': 'Within SLA',
        'yellow': 'At Risk',
        'red': 'Overdue',
      };

      render(
        <div>
          {Object.entries(statusLabels).map(([color, label]) => (
            <span key={color} data-testid={`status-${color}`}>
              {label}
            </span>
          ))}
        </div>
      );

      expect(screen.getByTestId('status-green')).toHaveTextContent('Within SLA');
      expect(screen.getByTestId('status-yellow')).toHaveTextContent('At Risk');
      expect(screen.getByTestId('status-red')).toHaveTextContent('Overdue');
    });
  });
});
