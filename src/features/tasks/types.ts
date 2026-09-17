export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  groupId: string;
  typeId: string;
  title: string;
  description: string;
  priceCents: number;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate?: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetailSubtask {
  id: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  priceCents: number;
  amountCents: number;
  assigneeId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetail {
  id: string;
  groupId: string;
  typeId: string;
  typeCode: string;
  typeName: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  priceCents: number;
  amountCents: number;
  assigneeId: string | null;
  status: string;
  subtasks: TaskDetailSubtask[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskType {
  id: string;
  name: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  typeId: string;
  priceCents: number;
  assigneeId: string | null;
}

export interface AssignTaskInput {
  assigneeId: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priceCents?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}
