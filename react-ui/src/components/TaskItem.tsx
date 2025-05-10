import React from 'react';
import { Clock, Edit2, Trash2, Play } from 'lucide-react';
import { Task } from '../types';
import { formatTime, priorityToColor } from '../utils/taskUtils';

interface TaskItemProps {
  task: Task;
  onSelect?: () => void;
  showActions?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onSelect, 
  showActions = false,
  onDelete,
  onEdit
}) => {
  return (
    <div 
      className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">{task.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${priorityToColor(task.priority)} capitalize`}>
          {task.priority}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-500">
          <Clock size={16} className="mr-1" />
          <span className="text-sm">{formatTime(task.timeAllocation)}</span>
        </div>

        <div className="flex space-x-2">
          {!task.completed && onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Play size={14} className="mr-1" />
              Choose
            </button>
          )}

          {showActions && !task.completed && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Edit task"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;