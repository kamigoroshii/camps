import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export interface MemoCard {
  id: string;
  user_id: string;
  memo_id: string;
  semester: string;
  academic_year: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  document_path?: string;
  created_at: string;
  updated_at?: string;
}

export interface MemoCardCreate {
  user_id: string;
  semester: string;
  academic_year: string;
  document?: File;
}

export interface MemoCardUpdate {
  semester?: string;
  academic_year?: string;
  status?: string;
}

export async function getMemoCards(user_id: string) {
  const res = await axios.get<MemoCard[]>(`${API_BASE}/api/v1/memo-cards`, { params: { user_id } });
  return res.data;
}

export async function getMemoCard(id: string) {
  const res = await axios.get<MemoCard>(`${API_BASE}/api/v1/memo-cards/${id}`);
  return res.data;
}

export async function createMemoCard(data: MemoCardCreate) {
  const formData = new FormData();
  formData.append('user_id', data.user_id);
  formData.append('semester', data.semester);
  formData.append('academic_year', data.academic_year);
  if (data.document) {
    formData.append('document', data.document);
  }
  
  const res = await axios.post<MemoCard>(`${API_BASE}/api/v1/memo-cards`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function updateMemoCard(id: string, data: MemoCardUpdate) {
  const res = await axios.put<MemoCard>(`${API_BASE}/api/v1/memo-cards/${id}`, data);
  return res.data;
}

export async function deleteMemoCard(id: string) {
  const res = await axios.delete<{ detail: string }>(`${API_BASE}/api/v1/memo-cards/${id}`);
  return res.data;
}

export async function downloadMemoDocument(id: string) {
  const res = await axios.get(`${API_BASE}/api/v1/memo-cards/${id}/download`, {
    responseType: 'blob'
  });
  return res.data;
}

export async function uploadMemoDocument(id: string, document: File) {
  const formData = new FormData();
  formData.append('document', document);
  
  const res = await axios.post(`${API_BASE}/api/v1/memo-cards/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}
