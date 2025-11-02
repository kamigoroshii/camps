import api from './api'

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  full_name: string
  student_id?: string
  employee_id?: string
  role?: string
  department?: string
  course?: string
  year?: number
  phone?: string
}

export const authService = {
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
    return response.data
  },
}

export const requestService = {
  createRequest: async (data: any) => {
    const response = await api.post('/requests', data)
    return response.data
  },

  getRequests: async (params?: any) => {
    const response = await api.get('/requests', { params })
    return response.data
  },

  getRequest: async (id: number) => {
    const response = await api.get(`/requests/${id}`)
    return response.data
  },

  updateRequest: async (id: number, data: any) => {
    const response = await api.put(`/requests/${id}`, data)
    return response.data
  },

  cancelRequest: async (id: number) => {
    const response = await api.delete(`/requests/${id}`)
    return response.data
  },

  executeWorkflowAction: async (id: number, action: any) => {
    const response = await api.post(`/requests/${id}/workflow`, action)
    return response.data
  },

  getWorkflowHistory: async (id: number) => {
    const response = await api.get(`/requests/${id}/workflow-history`)
    return response.data
  },
}

export const documentService = {
  uploadDocument: async (requestId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`/documents/upload/${requestId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getDocuments: async (requestId: number) => {
    const response = await api.get(`/documents/${requestId}`)
    return response.data
  },

  deleteDocument: async (documentId: number) => {
    const response = await api.delete(`/documents/${documentId}`)
    return response.data
  },
}

export const notificationService = {
  getNotifications: async (params?: any) => {
    const response = await api.get('/notifications', { params })
    return response.data
  },

  markAsRead: async (notificationId: number) => {
    const response = await api.put(`/notifications/${notificationId}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all')
    return response.data
  },
}

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  getRequestTypeStats: async () => {
    const response = await api.get('/dashboard/request-type-stats')
    return response.data
  },
}

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me')
    return response.data
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/users/me', data)
    return response.data
  },
}
