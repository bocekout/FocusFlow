import React, { useState, useEffect } from 'react';
import { TaskProvider } from './context/TaskContext';
import Header from './components/Header';
import TaskChoice from './components/TaskChoice';
import TaskFocus from './components/TaskFocus';
import TaskList from './components/TaskList';
import { useTaskContext } from './context/TaskContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('focus');
  const { currentTask } = useTaskContext();

  // Automatically switch to focus view when a task is selected
  useEffect(() => {
    if (currentTask) {
      setCurrentView('focus');
    }
  }, [currentTask]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'focus' ? (
          <div className="py-6">
            {currentTask ? (
              <TaskFocus />
            ) : (
              <TaskChoice />
            )}
          </div>
        ) : (
          <TaskList />
        )}
      </main>
      
      <footer className="mt-auto py-4 text-center text-sm text-gray-500">
        <p>FocusFlow - Boost your productivity</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}

export default App;