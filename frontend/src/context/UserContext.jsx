import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [userUuid, setUserUuid] = useState(() => localStorage.getItem('user_uuid') || null)
  const [profile, setProfile] = useState(null)
  const [interviewConfig, setInterviewConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('interview_config') || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (userUuid) localStorage.setItem('user_uuid', userUuid)
  }, [userUuid])

  useEffect(() => {
    if (interviewConfig) localStorage.setItem('interview_config', JSON.stringify(interviewConfig))
  }, [interviewConfig])

  return (
    <UserContext.Provider
      value={{ userUuid, setUserUuid, profile, setProfile, interviewConfig, setInterviewConfig }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
