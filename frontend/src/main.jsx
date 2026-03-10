import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

console.log('React app initializing...')

const root = document.getElementById('root')
if (!root) {
  console.error('Root element not found!')
  document.body.innerHTML = '<h1>ERROR: Root element not found</h1>'
} else {
  console.log('Root element found, mounting React...')
  createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
  console.log('React mounted successfully')
}
