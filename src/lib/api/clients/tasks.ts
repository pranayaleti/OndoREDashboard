import { apiGet, apiPost, apiPut, apiDelete } from "../http";

export interface Task {
  id: string;
  title: string;
  description: string;
  taskType: string;
  status: string;
  priority: string;
  propertyId: string | null;
  assignedTo: string | null;
  createdBy: string;
  dueDate: string | null;
  completedAt: string | null;
  relatedId: string | null;
  relatedType: string | null;
  metadata: Record<string, unknown>;
  checklistItems?: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  label: string;
  isDone: boolean;
  photoUrl: string | null;
  notes: string | null;
  sortOrder: number;
}

export interface TaskStats {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  overdueCount: number;
  total: number;
}

export const tasksApi = {
  async listTasks(filters?: Record<string, string>): Promise<Task[]> {
    const params = new URLSearchParams(filters || {}).toString();
    const url = params ? `/tasks?${params}` : '/tasks';
    const res = await apiGet<{ data: Task[] }>(url);
    return res.data;
  },
  async getTask(id: string): Promise<Task> {
    const res = await apiGet<{ data: Task }>(`/tasks/${id}`);
    return res.data;
  },
  async createTask(task: Partial<Task> & { title: string; taskType: string }): Promise<Task> {
    const res = await apiPost<{ data: Task }>('/tasks', task);
    return res.data;
  },
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await apiPut<{ data: Task }>(`/tasks/${id}`, updates);
    return res.data;
  },
  async deleteTask(id: string): Promise<void> {
    await apiDelete(`/tasks/${id}`);
  },
  async getStats(): Promise<TaskStats> {
    const res = await apiGet<{ data: TaskStats }>('/tasks/stats');
    return res.data;
  },
  async toggleChecklistItem(itemId: string): Promise<ChecklistItem> {
    const res = await apiPost<{ data: ChecklistItem }>(`/tasks/checklist-items/${itemId}/toggle`, {});
    return res.data;
  },
  async addChecklistItem(taskId: string, label: string): Promise<ChecklistItem> {
    const res = await apiPost<{ data: ChecklistItem }>(`/tasks/${taskId}/checklist`, { label });
    return res.data;
  },
};
