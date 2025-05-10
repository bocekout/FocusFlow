import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import TaskItem from './TaskItem';
import { PlusCircle, List, Trash2 } from 'lucide-react';
import TaskForm from './TaskForm';

const TaskList: React.FC = () => {
  const { tasks, deleteTask, setCurrentTask } = useTaskContext();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleAddTask = () => {
    setIsAddingTask(true);
    setEditingTask(null);
  };

  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId);
    setIsAddingTask(false);
  };

  const handleCloseForm = () => {
    setIsAddingTask(false);
    setEditingTask(null);
  };

  const handleDeleteClick = (taskId: string) => {
    setShowDeleteConfirm(taskId);
  };

  const confirmDelete = (taskId: string) => {
    deleteTask(taskId);
    setShowDeleteConfirm(null);
  };

  const handleChooseTask = (task: Task) => {
    setCurrentTask(task);
  };

  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Your Tasks</h2>
        <button
          onClick={handleAddTask}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={18} className="mr-2" />
          <span>Add Task</span>
        </button>
      </div>

      {(isAddingTask || editingTask) && (
        <div className="mb-6">
          <TaskForm 
            taskId={editingTask || undefined} 
            onClose={handleCloseForm} 
          />
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <List size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">No tasks yet</h3>
          <p className="text-gray-400 mb-4">Create your first task to get started</p>
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <PlusCircle size={18} className="mr-2" />
            Add Your First Task
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {incompleteTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Active Tasks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incompleteTasks.map((task) => (
                  <div key={task.id} className="relative">
                    <TaskItem 
                      task={task}
                      showActions
                      onSelect={() => handleChooseTask(task)}
                      onEdit={() => handleEditTask(task.id)}
                      onDelete={() => handleDeleteClick(task.id)}
                    />
                    {showDeleteConfirm === task.id && (
                      <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center rounded-lg border border-red-200">
                        <div className="text-center p-4">
                          <Trash2 className="mx-auto mb-2 text-red-500" size={24} />
                          <p className="text-gray-800 mb-4">Delete this task?</p>
                          <div className="flex space-x-2 justify-center">
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => confirmDelete(task.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Completed Tasks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedTasks.map((task) => (
                  <TaskItem 
                    key={task.id}
                    task={task}
                    showActions
                    onDelete={() => handleDeleteClick(task.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList;