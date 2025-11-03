import ChatPage from './ChatPage'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

// This wrapper will override document loading to show ALL documents for admin
export default function AdminChatPage() {
  // Optionally, you can pass a prop to ChatPage to indicate admin mode
  // Or, you can override the document loading logic here if needed
  // For now, reuse ChatPage (it loads all documents for admin by default if backend supports)
  return <ChatPage adminMode={true} />
}
