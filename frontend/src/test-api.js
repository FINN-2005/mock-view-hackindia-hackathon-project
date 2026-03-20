// Test file to check if the API client works properly
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

async function test() {
  try {
    console.log('Testing manual profile creation...')
    const res = await api.post('/api/progress/manual', {
      name: 'Test User',
      roles: ['Backend Engineer'],
      experience: '1–3 years',
      skills: ['Python']
    })
    
    console.log('Status:', res.status)
    console.log('Has user_uuid:', 'user_uuid' in res.data)
    console.log('Has profile:', 'profile' in res.data)
    console.log('✅ Manual profile works')
  } catch (e) {
    console.error('Error:', e.response?.data || e.message)
  }
}

test()
