import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Task } from '../types';
import { X, Clock, AlertTriangle } from 'lucide-react';

interface TaskFormProps {
  taskId?: string;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ taskId, onClose }) => {
  const { tasks, addTask, updateTask } = useTaskContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [timeAllocation, setTimeAllocation] = useState(25);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (taskId) {
      const taskToEdit = tasks.find(task => task.id === taskId);
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description);
        setPriority(taskToEdit.priority);
        setTimeAllocation(taskToEdit.timeAllocation);
      }
    }
  }, [taskId, tasks]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (timeAllocation < 5 || timeAllocation > 180) {
      setError('Time allocation must be between 5 and 180 minutes');
      return;
    }
    
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      timeAllocation
    };
    
    if (taskId) {
      const existingTask = tasks.find(task => task.id === taskId);
      if (existingTask) {
        updateTask({
          ...existingTask,
          ...taskData
        });
      }
    } else {
      addTask(taskData);
    }
    
    onClose();
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          {taskId ? 'Edit Task' : 'Add New Task'}
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
          <AlertTriangle size={16} className="mr-2" />
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Task Title*
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            placeholder="What needs to be done?"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow min-h-[100px] resize-y"
            placeholder="Add details about this task..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <div className="flex space-x-2">
              {['high', 'medium', 'low'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`px-4 py-2 rounded-md text-sm font-medium flex-1 border transition-colors ${
                    priority === p 
                      ? priorityColors[p as keyof typeof priorityColors]
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setPriority(p as 'high' | 'medium' | 'low')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="timeAllocation" className="block text-sm font-medium text-gray-700 mb-2">
              Focus Time
            </label>
            <div className="relative">
              <input
                type="number"
                id="timeAllocation"
                min="5"
                max="180"
                step="5"
                value={timeAllocation}
                onChange={(e) => {
                  setTimeAllocation(Number(e.target.value));
                  setError('');
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
              <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                min
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Set between 5-180 minutes
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {taskId ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;