export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeAllocation: number; // in minutes
  completed: boolean;
  createdAt: Date;
}

export interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  getTaskChoices: () => [Task, Task] | null;
  currentTask: Task | null;
  setCurrentTask: (task: Task | null) => void;
  completeCurrentTask: () => void;
}