
import React from 'react';
import { ActivityEvent } from '../types';

interface PatientTimelineProps {
  activities: ActivityEvent[];
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({ activities }) => {
  return (
    <div className="flow-root mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 px-4">Activity Timeline</h3>
      <ul className="-mb-8">
        {activities.map((activity, idx) => (
          <li key={activity.id}>
            <div className="relative pb-8 px-4">
              {idx !== activities.length - 1 ? (
                <span className="absolute top-4 left-9 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center ring-8 ring-white">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{activity.userName}</span>
                      {' '}{activity.action}
                    </p>
                    {activity.details && (
                      <p className="mt-1 text-xs text-gray-400 italic">
                        {activity.details}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-500">
                    <time dateTime={activity.timestamp}>
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
        {activities.length === 0 && (
          <li className="text-center py-10 text-gray-400 text-sm">No activity logs found.</li>
        )}
      </ul>
    </div>
  );
};
