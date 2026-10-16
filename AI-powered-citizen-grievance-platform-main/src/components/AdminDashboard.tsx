import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Grievance,
  Department,
  Officer,
  GrievanceStatus,
  GrievancePriority,
  AuditLog,
} from '../types';
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  Search,
  Filter,
  Download,
  UserPlus,
  Edit,
  Eye,
  X,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Send,
} from 'lucide-react';

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 font-medium">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export const AdminDashboard: React.FC = () => {
  const { language, t, showToast, triggerRefresh, refreshKey } = useApp();

  const [complaints, setComplaints] = useState<Grievance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Form states
  const [targetOfficerId, setTargetOfficerId] = useState('');
  const [newStatus, setNewStatus] = useState<GrievanceStatus>('In Progress');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [compList, deptList, offList, logs] = await Promise.all([
        api.getComplaints(),
        api.getDepartments(),
        api.getOfficers(),
        api.getAuditLogs(),
      ]);
      setComplaints(compList);
      setDepartments(deptList);
      setOfficers(offList);
      setAuditLogs(logs);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Filter logic
  const filtered = complaints.filter((c) => {
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (departmentFilter !== 'All' && c.departmentId !== departmentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.citizenName.toLowerCase().includes(q) ||
        c.summaryEn.toLowerCase().includes(q) ||
        c.summaryTa.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q) ||
        c.location.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate KPIs
  const totalCount = complaints.length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const pendingCount = totalCount - resolvedCount;
  const criticalCount = complaints.filter(
    (c) => (c.priority === 'Critical' || c.priority === 'High') && c.status !== 'Resolved'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Under Review'
  ).length;

  // Handle Officer Assignment
  const handleAssignOfficer = async () => {
    if (!selectedGrievance || !targetOfficerId) return;
    setIsSubmittingAction(true);
    try {
      const updated = await api.assignOfficer(
        selectedGrievance.id,
        targetOfficerId,
        'Zonal Administrator'
      );
      setSelectedGrievance(updated);
      setIsAssignModalOpen(false);
      setIsSubmittingAction(false);
      triggerRefresh();
      showToast('Field officer assigned successfully', 'success');
    } catch (err: any) {
      setIsSubmittingAction(false);
      showToast(err.message || 'Failed to assign officer', 'error');
    }
  };

  // Handle Status & Remarks Update
  const handleStatusUpdate = async () => {
    if (!selectedGrievance) return;
    setIsSubmittingAction(true);
    try {
      const updated = await api.updateComplaintStatus(selectedGrievance.id, {
        status: newStatus,
        remarks: adminRemarks || `Status changed to ${newStatus} by Administrator`,
        updatedBy: 'Zonal Administrator',
        role: 'ADMIN',
      });
      setSelectedGrievance(updated);
      setIsStatusModalOpen(false);
      setAdminRemarks('');
      setIsSubmittingAction(false);
      triggerRefresh();
      showToast(`Grievance updated to ${newStatus}`, 'success');
    } catch (err: any) {
      setIsSubmittingAction(false);
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Grievance ID',
      'Citizen Name',
      'Citizen Phone',
      'Category',
      'Department',
      'Priority',
      'Status',
      'District',
      'Address',
      'Created Date',
      'Target Date',
      'Assigned Officer',
    ];

    const rows = filtered.map((c) => [
      c.id,
      `"${c.citizenName}"`,
      c.citizenPhone,
      `"${c.category}"`,
      `"${c.departmentName}"`,
      c.priority,
      c.status,
      `"${c.location.district}"`,
      `"${c.location.address}"`,
      c.createdAt,
      c.targetResolutionDate,
      `"${c.assignedOfficerName || 'Unassigned'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NivaranAI_Grievances_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Grievance report exported to CSV', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-600 text-white rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-sans">
                {t.adminPortalTitle}
              </h2>
              <p className="text-xs text-slate-500">
                Tamil Nadu Public Grievances Executive Command & Dispatch Center
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsAuditDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{t.btnExportReport}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase">{t.totalGrievances}</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{totalCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-orange-700 uppercase">{t.pendingGrievances}</span>
          <p className="text-2xl font-bold text-orange-600 mt-1 font-mono">{pendingCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-red-700 uppercase">{t.criticalGrievances}</span>
          <p className="text-2xl font-bold text-red-600 mt-1 font-mono">{criticalCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-indigo-700 uppercase">{t.inProgressGrievances}</span>
          <p className="text-2xl font-bold text-indigo-700 mt-1 font-mono">{inProgressCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-green-700 uppercase">{t.resolvedGrievances}</span>
          <p className="text-2xl font-bold text-green-600 mt-1 font-mono">{resolvedCount}</p>
        </div>
      </div>

      {/* Main Grievances Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none bg-white font-medium"
            >
              <option value="All">All Categories</option>
              <option value="Street Light">Street Light</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Roads & Potholes">Roads & Potholes</option>
              <option value="Sanitation & Drainage">Sanitation & Drainage</option>
              <option value="Electricity & Power">Electricity & Power</option>
              <option value="Public Health & Fogging">Public Health</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none bg-white font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none bg-white font-medium"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical 🔴</option>
              <option value="High">High 🟠</option>
              <option value="Medium">Medium 🟡</option>
              <option value="Low">Low 🟢</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Grievance ID</th>
                <th className="py-3 px-3">Citizen & District</th>
                <th className="py-3 px-3">Category & Summary</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Assigned Officer</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No complaints matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-indigo-900">
                      <HighlightText text={g.id} highlight={searchQuery} />
                      <span className="block text-[10px] font-normal text-slate-400">
                        {new Date(g.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900">
                        <HighlightText text={g.citizenName} highlight={searchQuery} />
                      </p>
                      <p className="text-[11px] text-slate-500">
                        <HighlightText text={g.location.district} highlight={searchQuery} />
                      </p>
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded">
                        <HighlightText text={g.category} highlight={searchQuery} />
                      </span>
                      <p className="text-xs text-slate-800 font-medium truncate mt-0.5">
                        <HighlightText text={g.summaryEn} highlight={searchQuery} />
                      </p>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          g.priority === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : g.priority === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        ● {g.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                          g.status === 'Resolved'
                            ? 'bg-green-50 text-green-800 border-green-200'
                            : g.status === 'In Progress'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {g.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {g.assignedOfficerName ? (
                        <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                          {g.assignedOfficerName}
                        </p>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedGrievance(g)}
                          className="p-1.5 text-slate-600 hover:text-indigo-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGrievance(g);
                            setIsAssignModalOpen(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Assign Officer"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGrievance(g);
                            setNewStatus(g.status);
                            setIsStatusModalOpen(true);
                          }}
                          className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                          title="Update Status"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: GRIEVANCE FULL DETAILS DRAWER ================= */}
      {selectedGrievance && !isAssignModalOpen && !isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-indigo-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-amber-300 font-mono font-bold text-base">
                  {selectedGrievance.id}
                </span>
                <span className="text-xs text-indigo-200">| Complete Audit Record</span>
              </div>
              <button
                onClick={() => setSelectedGrievance(null)}
                className="p-1 text-indigo-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">CITIZEN</span>
                  <p className="font-bold text-slate-900">{selectedGrievance.citizenName}</p>
                  <p className="text-slate-600 font-mono">{selectedGrievance.citizenPhone}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">LOCATION</span>
                  <p className="font-bold text-slate-900">
                    {selectedGrievance.location.address}, {selectedGrievance.location.district}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200 space-y-1">
                <span className="font-bold text-indigo-950 block">AI CLASSIFICATION SUMMARY</span>
                <p className="text-slate-800 font-medium">{selectedGrievance.summaryEn}</p>
                {selectedGrievance.summaryTa && (
                  <p className="text-slate-600 italic">"{selectedGrievance.summaryTa}"</p>
                )}
                <p className="text-[11px] text-indigo-700 font-semibold pt-1">
                  Department: {selectedGrievance.departmentName}
                </p>
                <p className="text-[11px] text-red-700 font-semibold">
                  Priority Rationale: {selectedGrievance.priorityReason}
                </p>
              </div>

              {selectedGrievance.statusHistory.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-2">STATUS HISTORY AUDIT</span>
                  <div className="space-y-2">
                    {selectedGrievance.statusHistory.map((h, i) => (
                      <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900">{h.status}</span>
                          <p className="text-slate-600 mt-0.5">{h.remarks}</p>
                          <p className="text-[10px] text-blue-700">By: {h.updatedBy}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(h.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                Assign Field Officer
              </button>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Change Status / Remarks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ASSIGN OFFICER ================= */}
      {isAssignModalOpen && selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900">Assign Field Officer</h3>
                <p className="text-xs text-slate-500 font-mono">For {selectedGrievance.id}</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {officers.map((off) => (
                <div
                  key={off.id}
                  onClick={() => setTargetOfficerId(off.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    targetOfficerId === off.id
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img src={off.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-slate-900">{off.name}</p>
                      <p className="text-slate-500 text-[11px]">{off.designation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-semibold">
                      {off.activeCount} active cases
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetOfficerId || isSubmittingAction}
                onClick={handleAssignOfficer}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {isSubmittingAction ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPDATE STATUS & REMARKS ================= */}
      {isStatusModalOpen && selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900">Update Grievance Status</h3>
                <p className="text-xs text-slate-500 font-mono">For {selectedGrievance.id}</p>
              </div>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Workflow Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as GrievanceStatus)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 font-medium"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved & Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Remarks</label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Explain remediation steps, field findings, or resolution details..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleStatusUpdate}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                {isSubmittingAction ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DRAWER: AUDIT LOGS ================= */}
      {isAuditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <h3 className="font-bold text-base text-slate-900">System Audit Trail</h3>
                <button
                  onClick={() => setIsAuditDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[80vh] text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-900">{log.action}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-1">{log.details}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      User: {log.userName} ({log.userRole})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsAuditDrawerOpen(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
