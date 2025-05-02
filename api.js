// api.js
export async function sendProgress(data) {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to send progress');
      }
    } catch (error) {
      console.error('Error sending progress:', error);
      throw error;
    }
  }
  
  export async function logAnxiety(level, anxietyLevel) {
    try {
      const response = await fetch('/api/anxiety', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level, anxietyLevel }),
      });
      if (!response.ok) {
        throw new Error('Failed to log anxiety');
      }
    } catch (error) {
      console.error('Error logging anxiety:', error);
      throw error;
    }
  }
  
  export function handleApiError(errorDetails) {
    console.error('API Error:', errorDetails);
    // Add custom error handling here if needed
  }