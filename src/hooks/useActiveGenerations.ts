'use client'

import { useEffect, useState } from 'react'

interface ActiveGeneration {
  id: string
  status: string
  name: string
}

export function useActiveGenerations() {
  const [activeGenerations, setActiveGenerations] = useState<ActiveGeneration[]>([])
  const [hasActive, setHasActive] = useState(false)

  useEffect(() => {
    const checkActiveGenerations = async () => {
      try {
        const response = await fetch('/api/generations/active')
        if (response.ok) {
          const data = await response.json()
          setActiveGenerations(data.active)
          setHasActive(data.count > 0)
          
          if (data.count > 0) {
            console.log(`${data.count} активных генераций:`, data.active.map((g: any) => `${g.name} (${g.status})`))
          }
        }
      } catch (error) {
        console.error('Error checking active generations:', error)
      }
    }

    // Проверяем сразу
    checkActiveGenerations()

    // Проверяем каждые 3 секунды
    const interval = setInterval(checkActiveGenerations, 3000)

    return () => clearInterval(interval)
  }, [])

  return { activeGenerations, hasActive }
}
