
export enum UserRole {
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  LAB = 'LAB',
  PHARMACY = 'PHARMACY',
  ADMIN = 'ADMIN'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskType {
  PRESCRIPTION = 'PRESCRIPTION',
  LAB_TEST = 'LAB_TEST',
  PROCEDURE = 'PROCEDURE',
  REFERRAL = 'REFERRAL',
  INSTRUCTION = 'INSTRUCTION'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  admissionDate: string;
  roomNumber: string;
  diagnosis: string;
  condition: 'Stable' | 'Critical' | 'Guarded';
}

export interface CareTask {
  id: string;
  patientId: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  department: UserRole;
  description: string;
  assignedStaffId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ActivityEvent {
  id: string;
  patientId: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details?: string;
}
