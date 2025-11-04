import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export interface BusPass {
  id: string;
  user_id: string;
  pass_id: string;
  route: string;
  boarding_point: string;
  valid_from: string;
  valid_to: string;
  status: string;
  qr_code_path?: string;
  admin_comments?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface BusPassCreate {
  user_id: string;
  route: string;
  boarding_point: string;
}

export interface BusPassUpdate {
  route?: string;
  boarding_point?: string;
  status?: string;
}

export async function getBusPasses(user_id: string) {
  const res = await axios.get<BusPass[]>(`${API_BASE}/api/v1/bus-passes`, { params: { user_id } });
  return res.data;
}

export async function getBusPass(id: string) {
  const res = await axios.get<BusPass>(`${API_BASE}/api/v1/bus-passes/${id}`);
  return res.data;
}

export async function createBusPass(data: BusPassCreate) {
  const formData = new FormData();
  formData.append('user_id', data.user_id);
  formData.append('route', data.route);
  formData.append('boarding_point', data.boarding_point);
  
  const res = await axios.post<BusPass>(`${API_BASE}/api/v1/bus-passes`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function updateBusPass(id: string, data: BusPassUpdate) {
  const res = await axios.put<BusPass>(`${API_BASE}/api/v1/bus-passes/${id}`, data);
  return res.data;
}

export async function deleteBusPass(id: string) {
  const res = await axios.delete<{ detail: string }>(`${API_BASE}/api/v1/bus-passes/${id}`);
  return res.data;
}

export async function downloadBusPassQRCode(id: string) {
  const res = await axios.get(`${API_BASE}/api/v1/bus-passes/${id}/qr-code`, {
    responseType: 'blob'
  });
  return res.data;
}

export async function downloadBusPass(id: string) {
  const res = await axios.get(`${API_BASE}/api/v1/bus-passes/${id}/download`, {
    responseType: 'blob'
  });
  return res.data;
}

// Admin endpoints
export async function getAllBusPasses(status?: string) {
  const params = status ? { status } : {};
  const res = await axios.get<BusPass[]>(`${API_BASE}/api/v1/bus-passes/admin/all`, { params });
  return res.data;
}

export async function reviewBusPass(id: string, status: 'approved' | 'rejected', admin_comments?: string) {
  const formData = new FormData();
  formData.append('status', status);
  if (admin_comments) {
    formData.append('admin_comments', admin_comments);
  }
  
  const res = await axios.put<BusPass>(`${API_BASE}/api/v1/bus-passes/admin/${id}/review`, formData);
  return res.data;
}
