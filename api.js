/**
 * CalmSphere VRET API Interface
 * This file handles all API communication with the CalmSphere backend
 */

// Send user progress to the backend
export async function sendProgress({ phobia, level, duration, anxiety }) {
    const userId = localStorage.getItem('cs_user_id'); // set on login
    if (!userId) {
      console.error('User ID not found');
      return Promise.reject(new Error('User not authenticated'));
    }
    
    return fetch('https://api.calmsphere.com/vret/progress', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('cs_token') || ''}`
      },
      body: JSON.stringify({ 
        userId, 
        phobia, 
        level, 
        duration, 
        anxietyLevel: anxiety || 0,
        timestamp: new Date().toISOString()
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    });
  }
  
  // Log user anxiety levels during session
  export async function logAnxiety(level, value) {
    const userId = localStorage.getItem('cs_user_id');
    if (!userId) return Promise.reject(new Error('User not authenticated'));
    
    return fetch('https://api.calmsphere.com/vret/anxiety', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('cs_token') || ''}`
      },
      body: JSON.stringify({ 
        userId, 
        level,
        value,
        timestamp: new Date().toISOString()
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    });
  }
  
  // Get user's previous session data
  export async function getPreviousSessions() {
    const userId = localStorage.getItem('cs_user_id');
    if (!userId) return Promise.reject(new Error('User not authenticated'));
    
    return fetch(`https://api.calmsphere.com/vret/sessions?userId=${userId}`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('cs_token') || ''}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    });
  }
  
  // Error handler for failed API calls
  export function handleApiError(error) {
    console.error('API Error:', error);
    // Store failed requests for retry when connection is restored
    const pendingRequests = JSON.parse(localStorage.getItem('cs_pending_requests') || '[]');
    pendingRequests.push({
      type: error.requestType,
      data: error.data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('cs_pending_requests', JSON.stringify(pendingRequests));
  }