
import React from 'react';
import { CareTask, TaskStatus, User, UserRole } from '../types';
import { USERS } from '../constants';
import { stateService } from '../services/stateService';

interface KanbanBoardProps {
  tasks: CareTask[];
  currentUser: User;
  patientId: string;
}

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-50 border-blue-200 text-blue-700',
  [TaskStatus.COMPLETED]: 'bg-green-50 border-green-200 text-green-700',
  [TaskStatus.CANCELLED]: 'bg-gray-50 border-gray-200 text-gray-700',
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, currentUser, patientId }) => {
  const columns: { title: string; status: TaskStatus }[] = [
    { title: 'Pending', status: TaskStatus.PENDING },
    { title: 'In Progress', status: TaskStatus.IN_PROGRESS },
    { title: 'Completed', status: TaskStatus.COMPLETED }
  ];

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    stateService.updateTaskStatus(taskId, newStatus, currentUser);
  };

  // Filter tasks based on current user role for specific views
  // If Doctor or Admin, show all. If Lab, Pharmacy, only show their tasks
  const filteredTasks = (status: TaskStatus) => {
    return tasks.filter(t => {
      const isCorrectStatus = t.status === status;
      if (currentUser.role === UserRole.DOCTOR || currentUser.role === UserRole.ADMIN) {
        return isCorrectStatus;
      }
      return isCorrectStatus && t.department === currentUser.role;
    });
  };

  const getAssignedStaff = (staffId?: string) => {
    if (!staffId) return null;
    return USERS.find(u => u.id === staffId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {columns.map(col => (
        <div key={col.status} className="flex flex-col min-h-[400px]">
          <h3 className="font-bold text-gray-600 mb-4 flex items-center justify-between">
            {col.title}
            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              {filteredTasks(col.status).length}
            </span>
          </h3>
          <div className="flex-1 space-y-4 bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200">
            {filteredTasks(col.status).map(task => {
              const assignedStaff = getAssignedStaff(task.assignedStaffId);
              
              return (
                <div key={task.id} className={`p-4 rounded-lg border-l-4 shadow-sm bg-white border-l-blue-500`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider ${
                      task.department === UserRole.LAB ? 'bg-purple-100 text-purple-700' :
                      task.department === UserRole.PHARMACY ? 'bg-orange-100 text-orange-700' :
                      'bg-cyan-100 text-cyan-700'
                    }`}>
                      {task.department}
                    </span>
                    <div className="flex gap-1">
                      {col.status !== TaskStatus.COMPLETED && (
                        <button 
                          onClick={() => handleStatusChange(task.id, col.status === TaskStatus.PENDING ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED)}
                          className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                        >
                          Advance
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                  
                  {assignedStaff && (
                    <div className="mt-3 flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <img src={assignedStaff.avatar} className="w-5 h-5 rounded-full" alt="" />
                      <span className="text-[10px] font-medium text-gray-600">{assignedStaff.name}</span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Updated {new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
            {filteredTasks(col.status).length === 0 && (
              <div className="text-center py-10 text-gray-300 text-xs italic">
                No {col.title.toLowerCase()} tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
