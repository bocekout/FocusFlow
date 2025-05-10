import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskContextType } from '../types';
import { generateId, getTaskChoices as getChoices } from '../utils/taskUtils';

const defaultTasks: Task[] = [
  {
    id: generateId(),
    title: 'Update project documentation',
    description: 'Review and update the project documentation with recent changes.',
    priority: 'medium',
    timeAllocation: 25,
    completed: false,
    createdAt: new Date()
  },
  {
    id: generateId(),
    title: 'Fix critical bug in login flow',
    description: 'Users are unable to log in on mobile devices. Investigate and fix the issue.',
    priority: 'high',
    timeAllocation: 45,
    completed: false,
    createdAt: new Date()
  },
  {
    id: generateId(),
    title: 'Prepare for client presentation',
    description: 'Create slides and talking points for the upcoming client presentation.',
    priority: 'high',
    timeAllocation: 60,
    completed: false,
    createdAt: new Date()
  },
  {
    id: generateId(),
    title: 'Review pull requests',
    description: 'Review and provide feedback on pending pull requests from the team.',
    priority: 'medium',
    timeAllocation: 30,
    completed: false,
    createdAt: new Date()
  },
  {
    id: generateId(),
    title: 'Check emails',
    description: 'Respond to important emails and clear inbox.',
    priority: 'low',
    timeAllocation: 15,
    completed: false,
    createdAt: new Date()
  }
];

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedTasks = localStorage.getItem('tasks');
    return storedTasks ? JSON.parse(storedTasks) : defaultTasks;
  });
  
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      completed: false,
      createdAt: new Date()
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    
    if (currentTask?.id === updatedTask.id) {
      setCurrentTask(updatedTask);
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    
    if (currentTask?.id === id) {
      setCurrentTask(null);
    }
  };

  const getTaskChoices = () => {
    return getChoices(tasks);
  };

  const completeCurrentTask = () => {
    if (currentTask) {
      const completedTask = { ...currentTask, completed: true };
      updateTask(completedTask);
      setCurrentTask(null);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        getTaskChoices,
        currentTask,
        setCurrentTask,
        completeCurrentTask
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  
  return context;
};