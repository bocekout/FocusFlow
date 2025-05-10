import React, { useState, useEffect, useRef } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { formatTimeForDisplay, calculateTimerProgress } from '../utils/timerUtils';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { priorityToGradient } from '../utils/taskUtils';

const TaskFocus: React.FC = () => {
  const { currentTask, completeCurrentTask, setCurrentTask } = useTaskContext();
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (currentTask) {
      setSecondsRemaining(currentTask.timeAllocation * 60);
      setIsRunning(true);
      setIsCompleted(false);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentTask]);
  
  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      setIsCompleted(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, secondsRemaining]);
  
  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };
  
  const handleComplete = () => {
    completeCurrentTask();
  };
  
  const handleSkip = () => {
    setCurrentTask(null);
  };
  
  if (!currentTask) {
    return null;
  }
  
  const totalSeconds = currentTask.timeAllocation * 60;
  const progress = calculateTimerProgress(totalSeconds - secondsRemaining, totalSeconds);
  
  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden min-h-[500px] flex flex-col">
      <div className={`h-2 bg-gradient-to-r ${priorityToGradient(currentTask.priority)}`} style={{ width: `${progress}%` }}></div>
      
      <div className="flex-1 p-6 flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{currentTask.title}</h2>
          <p className="text-gray-600">{currentTask.description}</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center mb-8">
          <div className="text-center">
            <div className="font-mono font-bold mb-2" style={{ fontSize: '6rem', lineHeight: '1' }}>
              {formatTimeForDisplay(secondsRemaining)}
            </div>
            <div className="text-gray-500 text-lg">
              Focus time remaining
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {isCompleted ? (
            <div className="text-center p-4 bg-green-50 rounded-lg mb-4">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
              <p className="text-green-700 font-medium">Time's up! How did you do?</p>
            </div>
          ) : null}
          
          <div className="flex space-x-4">
            <button
              onClick={toggleTimer}
              className={`flex-1 py-3 rounded-lg text-white font-medium transition-colors ${
                isRunning 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            
            <button
              onClick={handleComplete}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Complete
            </button>
          </div>
          
          <button
            onClick={handleSkip}
            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip this task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskFocus;