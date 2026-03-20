import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

// ── Progress ──────────────────────────────────────────────────────────────────

export const checkUser = (uuid) => api.get(`/api/progress/check/${uuid}`)

export const uploadFiles = (formData) =>
  api.post('/api/progress/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const createManualProfile = (body) => api.post('/api/progress/manual', body)

// ── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = (uuid) => api.get(`/api/profile/${uuid}`)
export const getHistory = (uuid) => api.get(`/api/profile/${uuid}/history`)
export const editProfileAI = (uuid, message) =>
  api.post(`/api/profile/${uuid}/edit-ai`, { message })

// ── Interview ─────────────────────────────────────────────────────────────────

export const startInterview = (user_uuid, interview_config) =>
  api.post('/api/interview/start', { user_uuid, interview_config })

export const nextTurn = (user_uuid, answer, code_editor_content = '', scratch_pad_content = '') =>
  api.post('/api/interview/next-turn', {
    user_uuid,
    answer,
    code_editor_content,
    scratch_pad_content,
  })

export const endInterview = (user_uuid) =>
  api.post('/api/interview/end', { user_uuid })

// ── Results ───────────────────────────────────────────────────────────────────

export const getResults = (uuid) => api.get(`/api/results/${uuid}`)
