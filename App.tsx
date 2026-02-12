
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { 
  User, 
  UserRole, 
  Patient, 
  CareTask, 
  TaskType, 
  TaskStatus,
  ActivityEvent
} from './types';
import { 
  USERS, 
  CURRENT_USER_KEY 
} from './constants';
import { stateService } from './services/stateService';
import { getPatientInsight } from './services/geminiService';
import { 
  IconStethoscope, 
  IconClipboard, 
  IconFlask, 
  IconPlus, 
  IconSearch 
} from './components/Icons';
import { KanbanBoard } from './components/KanbanBoard';
import { PatientTimeline } from './components/PatientTimeline';

const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((user: User) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
  }, []);

  return { currentUser, login, logout };
};

const Sidebar = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 print:hidden z-40">
      <div className="p-6">
        <div className="flex items-center space-x-2 text-blue-600 font-bold text-2xl tracking-tight">
          <IconStethoscope className="w-8 h-8" />
          <span>CareFlow</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link to="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition">
          <IconClipboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>
        <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Departments
        </div>
        <div className="space-y-1">
          {[UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB, UserRole.PHARMACY].map(role => (
            <div key={role} className={`flex items-center space-x-3 p-2 px-3 rounded-lg text-xs font-medium ${user.role === role ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${user.role === role ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span>{role} View</span>
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center space-x-3 mb-4">
          <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" loading="lazy" />
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-gray-800 leading-none truncate">{user.name}</div>
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter mt-1">{user.role}</div>
          </div>
        </div>
        <button onClick={onLogout} className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
          Log Out
        </button>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-white">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl text-blue-600 mb-4">
            <IconStethoscope className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CareFlow</h1>
          <p className="text-gray-500 mt-2">Sign in to coordinate patient care</p>
        </div>
        
        <div className="space-y-3">
          {USERS.map(u => (
            <button
              key={u.id}
              onClick={() => onLogin(u)}
              className="w-full flex items-center p-4 border border-gray-100 rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
            >
              <img src={u.avatar} className="w-12 h-12 rounded-full mr-4 shadow-sm" alt="" />
              <div className="text-left">
                <div className="font-bold text-gray-800 group-hover:text-blue-700">{u.name}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-widest">{u.role}</div>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">
                &rarr;
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientRoom, setNewPatientRoom] = useState('');
  const [newPatientAge, setNewPatientAge] = useState<number | string>(30);
  const [newPatientDiagnosis, setNewPatientDiagnosis] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('Male');
  const [newPatientCondition, setNewPatientCondition] = useState<Patient['condition']>('Stable');

  useEffect(() => {
    setPatients(stateService.getPatients());
    return stateService.subscribe(() => setPatients(stateService.getPatients()));
  }, []);

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const ageValue = typeof newPatientAge === 'string' ? parseInt(newPatientAge, 10) : newPatientAge;
    
    stateService.addPatient({
      name: newPatientName,
      age: isNaN(ageValue) ? 0 : ageValue,
      gender: newPatientGender,
      bloodGroup: 'O+', 
      admissionDate: new Date().toISOString(),
      roomNumber: newPatientRoom,
      diagnosis: newPatientDiagnosis,
      condition: newPatientCondition,
    });
    
    setNewPatientName('');
    setNewPatientRoom('');
    setNewPatientDiagnosis('');
    setNewPatientAge(30);
    setShowAddPatientModal(false);
  };

  const filtered = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-500">Managing {patients.length} active patients</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <IconSearch className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search patient or room..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-blue-100 transition shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddPatientModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition shadow-md shadow-blue-100"
          >
            <IconPlus className="w-5 h-5" />
            <span className="font-medium">New Patient</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
          <Link key={p.id} to={`/patient/${p.id}`}>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer relative overflow-hidden group">
              <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-[10px] font-bold uppercase ${
                p.condition === 'Critical' ? 'bg-red-500 text-white' : 
                p.condition === 'Stable' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
              }`}>
                {p.condition}
              </div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition">{p.name}</h3>
                  <p className="text-xs text-gray-400">Room {p.roomNumber} • {p.age}y • {p.bloodGroup}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Diagnosis</div>
                  <div className="text-sm text-gray-700 font-medium truncate">{p.diagnosis}</div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Admitted {new Date(p.admissionDate).toLocaleDateString()}</span>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] text-blue-600">+</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
            No patients match your search.
          </div>
        )}
      </div>

      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 transform animate-in slide-in-from-bottom-4 overflow-y-auto max-h-[90vh] scrollbar-hide">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Register New Patient</h2>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Patient Name</label>
                <input 
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. John Doe"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Age</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={newPatientAge}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPatientAge(val === '' ? '' : parseInt(val, 10));
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Gender</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Room Number</label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. 302-B"
                    value={newPatientRoom}
                    onChange={(e) => setNewPatientRoom(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={newPatientCondition}
                    onChange={(e) => setNewPatientCondition(e.target.value as Patient['condition'])}
                  >
                    <option value="Stable">Stable</option>
                    <option value="Guarded">Guarded</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Admission Diagnosis</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Primary reason for admission..."
                  value={newPatientDiagnosis}
                  onChange={(e) => setNewPatientDiagnosis(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                >
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PatientDetails = ({ user }: { user: User }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDept, setNewTaskDept] = useState<UserRole>(UserRole.LAB);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newAssignedStaffId, setNewAssignedStaffId] = useState<string>('');

  const filteredStaff = useMemo(() => {
    return USERS.filter(u => u.role === newTaskDept);
  }, [newTaskDept]);

  useEffect(() => {
    if (filteredStaff.length > 0) {
      setNewAssignedStaffId(filteredStaff[0].id);
    } else {
      setNewAssignedStaffId('');
    }
  }, [filteredStaff]);

  useEffect(() => {
    if (!id) return;
    const p = stateService.getPatient(id);
    if (!p) {
      navigate('/');
      return;
    }
    setPatient(p);
    setTasks(stateService.getPatientTasks(id));
    setActivities(stateService.getActivities(id));

    return stateService.subscribe(() => {
      setTasks(stateService.getPatientTasks(id));
      setActivities(stateService.getActivities(id));
    });
  }, [id, navigate]);

  const handleAiInsight = async () => {
    if (!patient) return;
    setIsAiLoading(true);
    try {
      const insight = await getPatientInsight(patient, tasks);
      setAiInsight(insight);
    } catch (err) {
      setAiInsight("AI Assistant is currently busy.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newTaskTitle) return;
    
    stateService.addTask({
      patientId: id,
      title: newTaskTitle,
      type: TaskType.INSTRUCTION,
      status: TaskStatus.PENDING,
      department: newTaskDept,
      description: newTaskDesc,
      assignedStaffId: newAssignedStaffId || undefined
    }, user);

    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowTaskModal(false);
  };

  if (!patient) return null;

  const mrnId = id?.match(/\d+/)?.join('') || '0000';

  return (
    <div className="max-w-7xl mx-auto p-8">
      <button 
        onClick={() => navigate('/')}
        className="mb-4 flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition group print:hidden focus:outline-none"
      >
        <span className="text-xl group-hover:-translate-x-1 transition">&larr;</span>
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-200">
            {patient.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-gray-900">{patient.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                patient.condition === 'Critical' ? 'bg-red-100 text-red-600' : 
                patient.condition === 'Stable' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {patient.condition}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              Room {patient.roomNumber} • MRN-2024-{mrnId} • {patient.age}y • {patient.bloodGroup}
            </p>
          </div>
        </div>
        <div className="flex space-x-3 print:hidden">
          {user.role === UserRole.DOCTOR && (
            <button 
              onClick={() => setShowTaskModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100 font-semibold"
            >
              <IconPlus className="w-5 h-5" />
              <span>Create Action</span>
            </button>
          )}
          <button 
            onClick={() => window.print()}
            className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl hover:bg-gray-50 transition font-semibold"
          >
            Export Chart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl print:hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg"><IconFlask className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">AI Clinical Summary</h3>
                  <p className="text-blue-100 text-xs">Real-time status analysis by Gemini</p>
                </div>
              </div>
              <button 
                onClick={handleAiInsight}
                disabled={isAiLoading}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold border border-white/20 transition-all disabled:opacity-50"
              >
                {isAiLoading ? 'Analyzing...' : 'Refresh Insights'}
              </button>
            </div>
            {aiInsight ? (
              <div className="bg-black/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm leading-relaxed">{aiInsight}</p>
              </div>
            ) : (
              <p className="text-sm italic text-blue-100">Click refresh to generate AI-powered summary.</p>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center print:hidden">
              <h2 className="text-xl font-bold text-gray-900">Patient Workflow</h2>
            </div>
            <KanbanBoard tasks={tasks} currentUser={user} patientId={id!} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Diagnosis & Notes</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl leading-relaxed">
                {patient.diagnosis}. Patient reports persistent discomfort. 
                Vitals being monitored every 4 hours. No known allergies recorded.
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Recent Vitals</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm"><span className="text-gray-500">BP</span><span className="font-bold text-gray-800">128/84</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Heart Rate</span><span className="font-bold text-gray-800">72 bpm</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Oxygen</span><span className="font-bold text-green-600">98% SpO2</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[600px] overflow-hidden print:shadow-none print:border-none">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">Clinical History</h2></div>
            <div className="overflow-y-auto max-h-[700px] scrollbar-hide"><PatientTimeline activities={activities} /></div>
          </div>
        </div>
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 transform animate-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">New Care Action</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Title</label>
                <input autoFocus className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Chest X-Ray" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Assigned Dept</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100" value={newTaskDept} onChange={(e) => setNewTaskDept(e.target.value as UserRole)}>
                    <option value={UserRole.LAB}>Lab</option>
                    <option value={UserRole.PHARMACY}>Pharmacy</option>
                    <option value={UserRole.NURSE}>Nursing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Assigned Staff</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100" value={newAssignedStaffId} onChange={(e) => setNewAssignedStaffId(e.target.value)}>
                    {filteredStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <textarea rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Instructions..." value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const { currentUser, login, logout } = useAuth();
  if (!currentUser) return <LoginPage onLogin={login} />;
  return (
    <HashRouter>
      <div className="min-h-screen pl-64 bg-[#f8fafc] print:pl-0">
        <Sidebar user={currentUser} onLogout={logout} />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patient/:id" element={<PatientDetails user={currentUser} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
