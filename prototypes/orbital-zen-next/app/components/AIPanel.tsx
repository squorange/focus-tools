'use client';

import { useState } from 'react';
import { Task, Subtask, FocusSession } from '../lib/types';

type PanelState = 'details' | 'focus';

interface AIPanelProps {
  task: Task;
  subtask?: Subtask;
  focusSession?: FocusSession;
  onClose: () => void;
  onStartFocus?: () => void;
  onPauseFocus?: () => void;
  onResumeFocus?: () => void;
  onStopFocus?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIPanel({
  task,
  subtask,
  focusSession,
  onClose,
  onStartFocus,
  onPauseFocus,
  onResumeFocus,
  onStopFocus,
}: AIPanelProps) {
  // Determine if there's a focus session for this task/subtask
  const hasFocusSession = focusSession?.taskId === task.id &&
    (subtask ? focusSession.subtaskId === subtask.id : !focusSession.subtaskId);

  // Default to Focus tab if there's a focus session
  const [panelState, setPanelState] = useState<PanelState>(hasFocusSession ? 'focus' : 'details');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `I can help you with "${task.title}". What would you like to know or do?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate total focus time
  const totalFocusTime = subtask?.totalFocusTime || task.totalFocusTime || 0;
  const focusSessionCount = subtask?.focusSessionCount || task.focusSessionCount || 0;

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          taskId: task.id,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          role: data.message.role,
          content: data.message.content,
        },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-gradient-to-br from-gray-900 to-gray-800 border-l border-gray-700 shadow-2xl flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">{subtask ? subtask.title : task.title}</h2>
          <p className="text-sm text-gray-400">{subtask ? task.title : 'Task Details'}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* State Toggle */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setPanelState('details')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              panelState === 'details'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setPanelState('focus')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              panelState === 'focus'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Focus
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {panelState === 'details' ? (
          // Details View
          <div className="space-y-6">
            {/* Task Description */}
            {(subtask?.completed !== undefined || task.description) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                <p className="text-gray-200">
                  {subtask ? 'Subtask of ' + task.title : task.description || 'No description provided'}
                </p>
              </div>
            )}

            {/* Focus Session Metadata */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Focus History</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-300">Total time spent:</span>
                  <span className="text-white font-semibold">
                    {totalFocusTime > 0 ? formatTime(totalFocusTime) : '0m'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-300">Focus sessions:</span>
                  <span className="text-white font-semibold">{focusSessionCount}</span>
                </div>
              </div>
            </div>

            {/* Priority & Category */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Properties</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-300">Priority:</span>
                  <span className={`font-semibold capitalize ${
                    task.priority === 'urgent' ? 'text-red-400' :
                    task.priority === 'high' ? 'text-orange-400' :
                    task.priority === 'medium' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                {task.category && (
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-300">Category:</span>
                    <span className="text-white font-semibold capitalize">{task.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks count for parent task */}
            {!subtask && task.subtasks && task.subtasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Subtasks</h3>
                <div className="py-2 px-3 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-white font-semibold">{task.subtasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-300">Completed:</span>
                    <span className="text-white font-semibold">
                      {task.subtasks.filter(st => st.completed).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Focus View
          <div className="space-y-6">
            {/* Focus Status */}
            <div className="text-center">
              {hasFocusSession ? (
                <div className="space-y-3">
                  <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2))',
                      border: '2px solid',
                      borderImageSource: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.5), rgba(59, 130, 246, 0.5))',
                      borderImageSlice: 1,
                    }}
                  >
                    <svg className="w-10 h-10 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {focusSession?.isActive ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-purple-300 font-semibold text-lg">
                      {focusSession?.isActive ? 'In Focus' : 'Focus Paused'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {focusSession?.isActive ? 'Stay focused on your task' : 'Ready to continue when you are'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-300 font-semibold text-lg">Ready to Focus</p>
                    <p className="text-gray-400 text-sm mt-1">Start a focus session to begin</p>
                  </div>
                </div>
              )}
            </div>

            {/* Focus Controls */}
            <div className="space-y-3">
              {!hasFocusSession ? (
                <button
                  onClick={onStartFocus}
                  className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(to right, rgba(168, 85, 247, 0.8), rgba(59, 130, 246, 0.8))',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Focus Session
                </button>
              ) : (
                <>
                  {focusSession?.isActive ? (
                    <button
                      onClick={onPauseFocus}
                      className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={onResumeFocus}
                      className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(to right, rgba(168, 85, 247, 0.8), rgba(59, 130, 246, 0.8))',
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Continue Focus Session
                    </button>
                  )}
                  <button
                    onClick={onStopFocus}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Stop & Save
                  </button>
                </>
              )}
            </div>

            {/* Tips */}
            <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Focus Tips</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Eliminate distractions before starting</li>
                <li>• Take breaks every 25-30 minutes</li>
                <li>• Use pause if you need a quick break</li>
                <li>• Stop when task is complete or switching tasks</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
