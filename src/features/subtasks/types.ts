export type SubtaskStatus = 'todo' | 'done' | 'blocked';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  status: SubtaskStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtaskInput {
  title: string;
}

export interface UpdateSubtaskInput {
  title?: string;
  status?: SubtaskStatus;
  order?: number;
}
