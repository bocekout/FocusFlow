import React from 'react';
import { useTaskContext } from '../context/TaskContext';
import TaskItem from './TaskItem';
import { Clock, ListTodo } from 'lucide-react';

const TaskChoice: React.FC = () => {
  const { getTaskChoices, setCurrentTask } = useTaskContext();
  const taskChoices = getTaskChoices();

  if (!taskChoices) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 flex justify-center">
          <ListTodo size={48} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mb-3">No Tasks Available</h2>
        <p className="text-gray-600 mb-6">
          You've completed all your tasks or need to add more tasks to continue.
        </p>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            // This would ideally navigate to a task creation screen
            // For now, we'll just log a message
            console.log('Add new task clicked');
          }}
        >
          Add New Task
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center">Choose Your Next Task</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {taskChoices.map((task) => (
          <div 
            key={task.id}
            className="transform transition-all duration-300 hover:scale-105"
          >
            <TaskItem 
              task={task}
              onSelect={() => setCurrentTask(task)}
            />
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center text-gray-600 mb-2">
          <Clock size={18} className="mr-2" />
          <span className="text-sm font-medium">Choose wisely</span>
        </div>
        <p className="text-sm text-gray-500">
          Select the task that aligns with your current energy level and priorities.
        </p>
      </div>
    </div>
  );
};

export default TaskChoice;