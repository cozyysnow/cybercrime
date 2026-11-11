'use client';

import React, { useState, useEffect } from 'react';
import { 
  TASKS_DATA, 
  TaskItem, 
  CASES_DATA, 
  OfficerProfile,
  PriorityLevel
} from '@/data/collabData';
import { checkAdbDeviceStatus, sendAdbSms, AdbDeviceStatus } from '@/lib/hardwareService';
import { 
  CheckSquare, 
  AlertCircle, 
  Clock, 
  MapPin, 
  User, 
  ShieldAlert, 
  Plus, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  Calendar,
  X,
  ChevronRight,
  Flame,
  Radio,
  Send,
  Smartphone,
  ShieldCheck
} from 'lucide-react';

interface TaskManagementModuleProps {
  currentOfficer: OfficerProfile;
  onAuditLog?: (action: string, entityId: string, entityType: string) => void;
}

export default function TaskManagementModule({ currentOfficer, onAuditLog }: TaskManagementModuleProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(TASKS_DATA);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    caseId: CASES_DATA[0].id,
    assignedOfficerName: currentOfficer.name,
    assignedOfficerRole: currentOfficer.roleName,
    priority: 'Critical' as PriorityLevel,
    hoursToDeadline: '4',
    location: 'Jaipur North / Sindhi Camp',
    requiredAction: '',
  });

  // SMS Alert Modal & Hardware Bridge State
  const [smsModalTask, setSmsModalTask] = useState<TaskItem | null>(null);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCustomMessage, setSmsCustomMessage] = useState('');
  const [smsPriority, setSmsPriority] = useState<'FLASH_P1' | 'URGENT_P2'>('FLASH_P1');
  const [isTransmittingSms, setIsTransmittingSms] = useState(false);
  const [transmittingTaskId, setTransmittingTaskId] = useState<string | null>(null);
  const [dispatchedSmsTasks, setDispatchedSmsTasks] = useState<Record<string, { timestamp: string; phone: string }>>({});
  const [toastNotification, setToastNotification] = useState<{ id: number; title: string; subtitle: string } | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<AdbDeviceStatus>({
    connected: false,
    mode: 'simulation',
    deviceId: null,
    model: null,
    timestamp: '',
  });

  // Query live USB ADB Hardware connectivity
  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      const st = await checkAdbDeviceStatus();
      if (mounted) setHardwareStatus(st);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const statuses: TaskItem['status'][] = [
    'PENDING',
    'IN_PROGRESS',
    'BLOCKED',
    'COMPLETED',
    'OVERDUE',
    'CANCELLED',
  ];

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.caseId.toLowerCase().includes(q) ||
      t.assignedOfficerName.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q)
    );
  });

  const handleUpdateStatus = (taskId: string, newStatus: TaskItem['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (onAuditLog) {
      onAuditLog(`TASK_STATUS_UPDATED_TO_${newStatus}`, taskId, 'TASK');
    }
  };

  const handleEscalateTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isEscalated: true, priority: 'Critical' } : t))
    );
    if (onAuditLog) {
      onAuditLog('ESCALATED_TASK_4H_SLA', taskId, 'TASK');
    }
    alert(`[I4C SLA DIRECTIVE] Task ${taskId} escalated to State Nodal and Central Command under Section 4H Immediate Rapid Intervention Protocol.`);
  };

  const handleOpenSmsModal = (task: TaskItem) => {
    const officerPhones: Record<string, string> = {
      'SI Manoj Meena': '+91 98290 41209',
      'Priya Nambiar': '+91 99801 77312',
      'Insp. P. Verma': '+91 94140 88921',
      'Supt. R. Sharma': '+91 98110 55432',
      'Dr. A. K. Saxena': '+91 98100 23411',
    };
    const defaultPhone = officerPhones[task.assignedOfficerName] || '+91 98290 41209';
    
    setSmsModalTask(task);
    setSmsPhone(defaultPhone);
    setSmsPriority(task.priority === 'Critical' ? 'FLASH_P1' : 'URGENT_P2');
    setSmsCustomMessage(
      `[CYBERCAST FLASH DIRECTIVE] URGENT INTERVENTION: Deploy immediately to ${task.location} for Case ${task.caseId}. Mandate: ${task.requiredAction}. Target SLA: ${task.deadline}. Authorized by: ${currentOfficer.name} (${currentOfficer.roleName}). Confirm arrival on site.`
    );
  };

  // Direct 1-Click Send Alert SMS CTA on Task Card
  const handleDirectSendSms = async (task: TaskItem) => {
    const officerPhones: Record<string, string> = {
      'SI Manoj Meena': '+91 98290 41209',
      'Priya Nambiar': '+91 99801 77312',
      'Insp. P. Verma': '+91 94140 88921',
      'Supt. R. Sharma': '+91 98110 55432',
      'Dr. A. K. Saxena': '+91 98100 23411',
    };
    const targetPhone = officerPhones[task.assignedOfficerName] || '+91 98290 41209';
    const message = `[CYBERCAST FLASH DIRECTIVE] URGENT INTERVENTION: Deploy immediately to ${task.location} for Case ${task.caseId}. Mandate: ${task.requiredAction}. Target SLA: ${task.deadline}. Authorized by: ${currentOfficer.name} (${currentOfficer.roleName}). Confirm arrival on site.`;

    setTransmittingTaskId(task.id);
    const result = await sendAdbSms({
      phone: targetPhone,
      message,
      priority: task.priority === 'Critical' ? 'FLASH_P1' : 'URGENT_P2',
      officerName: task.assignedOfficerName,
      caseId: task.caseId,
    });

    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST';
    setDispatchedSmsTasks((prev) => ({
      ...prev,
      [task.id]: { timestamp: nowTime, phone: targetPhone },
    }));
    setTransmittingTaskId(null);

    if (onAuditLog) {
      onAuditLog(`DISPATCHED_IMMEDIATE_SMS_ALERT_TO_${task.assignedOfficerName.toUpperCase().replace(/[^A-Z]/g, '_')}`, task.id, 'TASK');
    }

    const toastId = Date.now();
    setToastNotification({
      id: toastId,
      title: result.mode === 'hardware'
        ? `Hardware SMS Transmitted: ${task.assignedOfficerName} (${targetPhone})`
        : result.mode === 'cloud_bridge'
        ? `Cloud Bridge SMS Relayed: ${task.assignedOfficerName} (${targetPhone})`
        : `Simulated SMS Transmitted: ${task.assignedOfficerName} (${targetPhone})`,
      subtitle: result.mode === 'hardware'
        ? `Direct Android Intent launched on physical device ${result.deviceId || 'ZD222K9HBL'} (${result.model || 'Android'}). DLT Ref #${result.dltReference}.`
        : result.mode === 'cloud_bridge'
        ? `Dispatched via Cloud-to-Local Bridge to physical device ${result.deviceId || 'ZD222K9HBL'}. DLT Ref #${result.dltReference}.`
        : `Encrypted directive dispatched via fallback simulation trunk. DLT Ref #${result.dltReference}.`,
    });

    setTimeout(() => {
      setToastNotification((curr) => (curr?.id === toastId ? null : curr));
    }, 7000);
  };

  // Form submit handler for SMS Directive Modal
  const handleTransmitSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsModalTask) return;

    setIsTransmittingSms(true);
    const taskId = smsModalTask.id;
    const targetOfficer = smsModalTask.assignedOfficerName;
    const targetPhone = smsPhone;

    const result = await sendAdbSms({
      phone: targetPhone,
      message: smsCustomMessage,
      priority: smsPriority,
      officerName: targetOfficer,
      caseId: smsModalTask.caseId,
    });

    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST';

    setDispatchedSmsTasks((prev) => ({
      ...prev,
      [taskId]: { timestamp: nowTime, phone: targetPhone },
    }));

    setIsTransmittingSms(false);
    setSmsModalTask(null);

    if (onAuditLog) {
      onAuditLog(`DISPATCHED_IMMEDIATE_SMS_ALERT_TO_${targetOfficer.toUpperCase().replace(/[^A-Z]/g, '_')}`, taskId, 'TASK');
    }

    const toastId = Date.now();
    setToastNotification({
      id: toastId,
      title: result.mode === 'hardware'
        ? `Police Alert SMS Transmitted: ${targetOfficer} (${targetPhone})`
        : result.mode === 'cloud_bridge'
        ? `Cloud Bridge SMS Relayed: ${targetOfficer} (${targetPhone})`
        : `Simulated Police Alert SMS: ${targetOfficer} (${targetPhone})`,
      subtitle: result.mode === 'hardware'
        ? `Live SMS app popup launched on physical device ${result.deviceId || 'ZD222K9HBL'} (${result.model || 'Android'}). DLT Ref #${result.dltReference}.`
        : result.mode === 'cloud_bridge'
        ? `Relayed via Cloud-to-Local Bridge to physical device ${result.deviceId || 'ZD222K9HBL'}. DLT Ref #${result.dltReference}.`
        : `Encrypted directive sent via DLT Trunk (1407/POLICE-FLASH). Reference #${result.dltReference}.`,
    });

    setTimeout(() => {
      setToastNotification((curr) => (curr?.id === toastId ? null : curr));
    }, 7000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title || !newTaskForm.requiredAction) {
      alert('Please fill all required fields.');
      return;
    }

    const deadlineDate = new Date();
    deadlineDate.setHours(deadlineDate.getHours() + parseInt(newTaskForm.hoursToDeadline, 10));

    const newTask: TaskItem = {
      id: `TSK-2026-0${Math.floor(80 + tasks.length + 1)}`,
      title: newTaskForm.title,
      caseId: newTaskForm.caseId,
      assignedOfficerName: newTaskForm.assignedOfficerName,
      assignedOfficerRole: newTaskForm.assignedOfficerRole,
      priority: newTaskForm.priority,
      deadline: deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + deadlineDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      location: newTaskForm.location,
      requiredAction: newTaskForm.requiredAction,
      status: 'PENDING',
      isEscalated: false,
    };

    setTasks([newTask, ...tasks]);
    setShowCreateModal(false);

    if (onAuditLog) {
      onAuditLog('CREATED_RAPID_FIELD_TASK', newTask.id, 'TASK');
    }
  };

  const stats = {
    total: tasks.length,
    critical: tasks.filter((t) => t.priority === 'Critical').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    overdue: tasks.filter((t) => t.status === 'OVERDUE' || t.isEscalated).length,
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Tactical Flash SMS Toast Banner */}
      {toastNotification && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span>[ DLT Protocol 1407 ]</span>
                <span className="text-amber-800">{toastNotification.title}</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">{toastNotification.subtitle}</div>
            </div>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Module Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Module 06 // Tactical Field & Investigation Tasks
            </span>
            <span className="text-xs text-slate-500 font-medium">4-Hour SLA Dispatch Engine</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Law Enforcement Task Coordination
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ATM patrol dispatch • CFCFRMS bank freeze mandates • Suspect interception directives
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live ADB Hardware Bridge Status Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg shadow-sm">
            <span className="relative flex h-2 w-2">
              {hardwareStatus.connected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : hardwareStatus.unauthorized ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
              )}
            </span>
            <span className="text-slate-500 uppercase text-[10px] font-semibold">Hardware Bridge:</span>
            {hardwareStatus.connected ? (
              <span className="text-emerald-700 font-semibold">
                Connected: <span className="text-slate-900">{hardwareStatus.deviceId}</span> {hardwareStatus.model ? `(${hardwareStatus.model})` : ''}
              </span>
            ) : hardwareStatus.unauthorized ? (
              <span className="text-amber-700 font-semibold animate-pulse">
                Attached ({hardwareStatus.deviceId}) — Tap Allow on phone
              </span>
            ) : (
              <span className="text-slate-600 font-medium">
                Simulation Mode (Offline)
              </span>
            )}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Operational Directive</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Active Directives</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">Total across sectors</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[11px] text-rose-600 uppercase font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            Critical Priority
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats.critical}</div>
          <div className="text-xs text-slate-400 mt-1">Immediate intervention</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[11px] text-sky-700 uppercase font-semibold">In Execution</div>
          <div className="text-2xl font-bold text-sky-700 mt-1">{stats.inProgress}</div>
          <div className="text-xs text-slate-400 mt-1">Field teams deployed</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[11px] text-emerald-700 uppercase font-semibold">Resolved / Frozen</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</div>
          <div className="text-xs text-slate-400 mt-1">Mandate fulfilled</div>
        </div>

        <div className="p-4 bg-white border border-rose-200 bg-rose-50/20 rounded-xl shadow-sm">
          <div className="text-[11px] text-rose-600 uppercase font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            SLA Escalated
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats.overdue}</div>
          <div className="text-xs text-rose-700 mt-1">&gt;4h SLA breach</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="md:col-span-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tasks by directive title, officer, case or location..."
            className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
          >
            <option value="ALL">All Lifecycle Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-800">No Operational Directives Found</div>
            <div className="text-xs text-slate-500 mt-1">Change status filters or create a new field directive</div>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isOverdue = t.status === 'OVERDUE' || t.isEscalated;

            return (
              <div
                key={t.id}
                className={`p-5 bg-white border transition-all rounded-xl shadow-sm ${
                  isOverdue
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column Info */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {t.id}
                      </span>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        Case: {t.caseId}
                      </span>

                      {/* Priority */}
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          t.priority === 'Critical'
                            ? 'text-rose-700 bg-rose-50 border-rose-200'
                            : t.priority === 'High'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-sky-700 bg-sky-50 border-sky-200'
                        }`}
                      >
                        {t.priority}
                      </span>

                      {/* Status */}
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          t.status === 'COMPLETED'
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'text-sky-700 bg-sky-50 border border-sky-200'
                            : t.status === 'OVERDUE'
                            ? 'text-rose-700 bg-rose-50 border border-rose-300'
                            : 'text-slate-600 bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>

                      {t.isEscalated && (
                        <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 border border-rose-300 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          SLA Escalated (I4C Notified)
                        </span>
                      )}

                      {dispatchedSmsTasks[t.id] && (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 border border-amber-200 rounded-full flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                          SMS Dispatched ({dispatchedSmsTasks[t.id].timestamp})
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 tracking-wide">
                      {t.title}
                    </h3>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                      <span className="text-blue-700 font-semibold uppercase">Required Action:</span> {t.requiredAction}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        {t.assignedOfficerName} ({t.assignedOfficerRole})
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        {t.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Target SLA: {t.deadline}
                      </span>
                    </div>
                  </div>

                  {/* Right Column Action Buttons */}
                  <div className="flex flex-wrap lg:flex-col items-stretch gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-4 min-w-[200px]">
                    {t.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark Completed</span>
                      </button>
                    )}

                    {t.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-sky-600" />
                        <span>Accept & Deploy</span>
                      </button>
                    )}

                    {!t.isEscalated && t.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleEscalateTask(t.id)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Escalate (4h SLA)</span>
                      </button>
                    )}

                    {t.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'BLOCKED')}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Report Impediment</span>
                      </button>
                    )}

                    {/* CTA Button: Send Immediate Alert SMS to Officer */}
                    {t.status !== 'COMPLETED' && (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => handleDirectSendSms(t)}
                          disabled={transmittingTaskId === t.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors border bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 shadow-sm cursor-pointer"
                          title="Directly trigger SMS dispatch to officer via ADB hardware bridge"
                        >
                          <Radio className={`w-3.5 h-3.5 ${transmittingTaskId === t.id ? 'text-amber-600 animate-spin' : dispatchedSmsTasks[t.id] ? 'text-amber-600' : 'text-amber-600 animate-pulse'}`} />
                          <span>
                            {transmittingTaskId === t.id
                              ? 'Dispatching SMS...'
                              : dispatchedSmsTasks[t.id]
                              ? 'Resend Alert SMS'
                              : 'Send Alert SMS'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenSmsModal(t)}
                          className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer"
                          title="Open directive console to customize phone or message"
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Issue Rapid Law Enforcement Directive
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                  Directive Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Station Patrol at ATM cluster #14"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                    Associate Case ID *
                  </label>
                  <select
                    value={newTaskForm.caseId}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, caseId: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {CASES_DATA.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} ({c.victimState})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as PriorityLevel })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Critical">Critical (&lt;2h Action)</option>
                    <option value="High">High (&lt;4h Action)</option>
                    <option value="Medium">Medium (&lt;12h Action)</option>
                    <option value="Low">Low (Routine Follow-up)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                    Assigned Officer
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.assignedOfficerName}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedOfficerName: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                    SLA Deadline Window
                  </label>
                  <select
                    value={newTaskForm.hoursToDeadline}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, hoursToDeadline: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="2">2 Hours (Emergency Freeze/Patrol)</option>
                    <option value="4">4 Hours (Standard Fast Escalation)</option>
                    <option value="8">8 Hours (End of Shift)</option>
                    <option value="24">24 Hours (Statutory Filing)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                  Target ATM / Field Location *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskForm.location}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, location: e.target.value })}
                  className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                  Operational Protocol / Specific Instructions *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newTaskForm.requiredAction}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, requiredAction: e.target.value })}
                  placeholder="Detail step-by-step directives for the squad or banking liaison..."
                  className="w-full bg-white border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Authorize Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Police SMS Dispatch Modal */}
      {smsModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col font-sans text-slate-900 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <Radio className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 font-semibold tracking-wider block uppercase">
                    MHA // I4C Police Dispatch Gateway • DLT Protocol 1407
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    Transmit Immediate Officer Alert SMS
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isTransmittingSms && setSmsModalTask(null)}
                disabled={isTransmittingSms}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleTransmitSms} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Hardware Bridge Status Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    {hardwareStatus.connected ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    )}
                  </span>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Judicial Showcase Bridge
                    </div>
                    <div className="font-semibold text-slate-900 text-xs">
                      {hardwareStatus.connected
                        ? `Physical Hardware: ${hardwareStatus.deviceId} (${hardwareStatus.model || 'Android'})`
                        : hardwareStatus.unauthorized
                        ? `USB Attached (${hardwareStatus.deviceId}) — Tap Allow on phone`
                        : 'Simulation Fallback (Device Offline)'}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${hardwareStatus.connected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {hardwareStatus.connected ? 'ADB Intent Active' : 'Fallback Sim'}
                </span>
              </div>

              {/* Recipient Details Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200 pb-1.5">
                  Target Field Investigator Profile
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recipient Officer</span>
                    <span className="font-semibold text-slate-900">{smsModalTask.assignedOfficerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Operational Role</span>
                    <span className="text-slate-700">{smsModalTask.assignedOfficerRole}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Linked Case</span>
                    <span className="text-blue-700 font-semibold">{smsModalTask.caseId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Location</span>
                    <span className="text-rose-700 font-semibold">{smsModalTask.location}</span>
                  </div>
                </div>
              </div>

              {/* Priority & Mobile Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                    Registered Mobile Number *
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      disabled={isTransmittingSms}
                      className="w-full bg-white border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">CCTNS Verified Mobile SIM</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                    Dispatch Priority *
                  </label>
                  <select
                    value={smsPriority}
                    onChange={(e) => setSmsPriority(e.target.value as any)}
                    disabled={isTransmittingSms}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                  >
                    <option value="FLASH_P1">P1 // Flash Priority (Immediate)</option>
                    <option value="URGENT_P2">P2 // High Priority Dispatch</option>
                  </select>
                  <span className="text-[10px] text-amber-700 mt-1 block font-medium">Carrier Class-0 Intercept Channel</span>
                </div>
              </div>

              {/* SMS Directive Payload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 uppercase">
                    Tactical Directive Message Payload *
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {smsCustomMessage.length} / 320 Chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={smsCustomMessage}
                  onChange={(e) => setSmsCustomMessage(e.target.value)}
                  disabled={isTransmittingSms}
                  className="w-full bg-white border border-slate-200 p-3 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 leading-relaxed disabled:opacity-50 font-mono"
                />
              </div>

              {/* Telecom Gateway Notice */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    TRAI DLT Registration: Verified
                  </span>
                  <span className="text-blue-700 font-mono font-medium">DLT ID: 1407982001</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Method A Intent Dispatch: Live Android SENDTO intent executed on physical terminal with auto-exit on transmission. Carrier Class-0 DLT protocol simulation active as high-availability fallback.
                </p>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSmsModalTask(null)}
                  disabled={isTransmittingSms}
                  className="px-4 py-2 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransmittingSms}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isTransmittingSms ? (
                    <>
                      <Radio className="w-4 h-4 animate-spin text-white" />
                      <span>Transmitting to Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmit Police SMS Directive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
