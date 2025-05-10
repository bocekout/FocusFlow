import React from 'react';
import { Target } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">FocusFlow</span>
          </div>
          
          <nav className="flex space-x-1">
            {['focus', 'tasks'].map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === view
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                } capitalize transition-colors`}
              >
                {view}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;