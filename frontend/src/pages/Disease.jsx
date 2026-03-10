import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useParams } from 'react-router-dom'

export default function Disease() {
  const { id } = useParams()
  const [disease, setDisease] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/diseases/${id}`)
      .then(res => setDisease(res.data?.data?.disease))
      .catch(err => setError(err.response?.data?.error || err.message))
  }, [id])

  if (error) return <div className="error">{error}</div>
  if (!disease) return <div>Loading...</div>

  return (
    <div>
      <h1>{disease.name}</h1>
      <p>{disease.description}</p>
    </div>
  )
}
