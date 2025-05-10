import { Task } from '../types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const getTaskChoices = (tasks: Task[]): [Task, Task] | null => {
  const incompleteTasks = tasks.filter(task => !task.completed);
  
  if (incompleteTasks.length < 2) {
    return null;
  }
  
  // Sort tasks by priority first (high > medium > low)
  const sortedTasks = [...incompleteTasks].sort((a, b) => {
    const priorityValues = { high: 3, medium: 2, low: 1 };
    return priorityValues[b.priority] - priorityValues[a.priority];
  });
  
  // Return the top two tasks by priority
  return [sortedTasks[0], sortedTasks[1]];
};

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  
  return `${mins}m`;
};

export const priorityToColor = (priority: 'high' | 'medium' | 'low'): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const priorityToGradient = (priority: 'high' | 'medium' | 'low'): string => {
  switch (priority) {
    case 'high':
      return 'from-red-500 to-orange-500';
    case 'medium':
      return 'from-amber-500 to-yellow-500';
    case 'low':
      return 'from-blue-500 to-indigo-500';
    default:
      return 'from-gray-500 to-gray-600';
  }
};