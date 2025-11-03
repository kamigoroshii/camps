import api from './api'

export interface DashboardStats {
  total_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  completed_requests: number
  avg_processing_time: number
  sla_compliance_rate: number
}

export interface RequestTypeStats {
  request_type: string
  count: number
  avg_processing_time: number
}

export interface RecentRequest {
  id: number
  request_number: string
  title: string
  status: string
  created_at: string
  sla_due_date: string
  priority: string
  request_type: string
}

export interface NotificationData {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  sent_at: string
}

export interface ActivityItem {
  id: number
  action: string
  entity_type: string
  entity_id: number
  created_at: string
  description: string
}

// Dashboard Stats API
export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Return mock data for now
  return {
    total_requests: 150,
    pending_requests: 25,
    approved_requests: 95,
    rejected_requests: 15,
    completed_requests: 110,
    avg_processing_time: 3.5,
    sla_compliance_rate: 94.2
  }
}

export const getRequestTypeStats = async (): Promise<RequestTypeStats[]> => {
  // Return mock data for now
  return [
    { request_type: 'Certificate Request', count: 45, avg_processing_time: 2.5 },
    { request_type: 'Scholarship Application', count: 35, avg_processing_time: 5.2 },
    { request_type: 'Bus Pass Request', count: 25, avg_processing_time: 1.8 },
    { request_type: 'Academic Record', count: 20, avg_processing_time: 3.1 },
    { request_type: 'Other', count: 25, avg_processing_time: 2.9 }
  ]
}

// Recent Requests API
export const getRecentRequests = async (limit: number = 5): Promise<RecentRequest[]> => {
  // Return mock data for now
  const mockRequests: RecentRequest[] = [
    {
      id: 1,
      request_number: 'REQ-2024-001',
      title: 'Certificate of Enrollment',
      status: 'APPROVED',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      sla_due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      priority: 'HIGH',
      request_type: 'Certificate Request'
    },
    {
      id: 2,
      request_number: 'REQ-2024-002',
      title: 'Scholarship Application Review',
      status: 'UNDER_REVIEW',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sla_due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'MEDIUM',
      request_type: 'Scholarship Application'
    },
    {
      id: 3,
      request_number: 'REQ-2024-003',
      title: 'Bus Pass Application',
      status: 'PENDING_APPROVAL',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      sla_due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: 'LOW',
      request_type: 'Bus Pass Request'
    }
  ]
  return mockRequests.slice(0, limit)
}

// Notifications API
export const getNotifications = async (unread_only: boolean = false, limit: number = 10): Promise<NotificationData[]> => {
  // Return mock data for now
  const mockNotifications: NotificationData[] = [
    {
      id: 1,
      title: 'Request Approved',
      message: 'Your certificate request has been approved',
      type: 'success',
      is_read: false,
      sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      title: 'Document Required',
      message: 'Additional documentation needed for scholarship application',
      type: 'warning',
      is_read: false,
      sent_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      title: 'System Maintenance',
      message: 'Scheduled maintenance tonight from 10 PM to 2 AM',
      type: 'info',
      is_read: true,
      sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ]
  
  const filtered = unread_only ? mockNotifications.filter(n => !n.is_read) : mockNotifications
  return filtered.slice(0, limit)
}

export const markNotificationRead = async (notificationId: number): Promise<void> => {
  // Mock implementation - in real app would update backend
  console.log(`Marking notification ${notificationId} as read`)
}

export const markAllNotificationsRead = async (): Promise<void> => {
  // Mock implementation - in real app would update backend
  console.log('Marking all notifications as read')
}

// Get unread notification count
export const getUnreadNotificationCount = async (): Promise<number> => {
  const unreadNotifications = await getNotifications(true, 100)
  return unreadNotifications.length
}

// Activity Feed (using audit logs or workflow logs)
export const getRecentActivity = async (limit: number = 5): Promise<ActivityItem[]> => {
  // This would need a backend endpoint for recent activities/audit logs
  // For now, we'll return mock data
  return [
    {
      id: 1,
      action: 'REQUEST_APPROVED',
      entity_type: 'ServiceRequest',
      entity_id: 1234,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      description: 'Request #1234 approved'
    },
    {
      id: 2,
      action: 'REQUEST_SUBMITTED',
      entity_type: 'ServiceRequest',
      entity_id: 1235,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      description: 'Action required on Request #1235'
    },
    {
      id: 3,
      action: 'NOTIFICATION_SENT',
      entity_type: 'Notification',
      entity_id: 567,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      description: 'New message from advisor'
    },
    {
      id: 4,
      action: 'REQUEST_CREATED',
      entity_type: 'ServiceRequest',
      entity_id: 1236,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Request #1236 submitted'
    }
  ]
}

// SLA Alerts - Return empty array to remove alerts
export const getSLAAlerts = async (): Promise<any[]> => {
  // Return empty array - no SLA alerts
  return []
}

// User-specific dashboard stats - Mock data
export const getUserDashboardStats = async () => {
  // Return mock user stats
  return {
    activeRequests: 5,
    pendingApprovals: 3,
    notifications: 7,
    completed: 12
  }
}

export default {
  getDashboardStats,
  getRequestTypeStats,
  getRecentRequests,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  getRecentActivity,
  getSLAAlerts,
  getUserDashboardStats
}