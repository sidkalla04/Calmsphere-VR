export async function sendProgress({ phobia, level }) {
    const userId = localStorage.getItem('cs_user_id'); // set on login
    return fetch('https://api.calmsphere.com/vret/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, phobia, level, timestamp: new Date() })
    })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    });
  }
  