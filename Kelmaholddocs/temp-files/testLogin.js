(async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hirer@example.com', password: 'test' })
    });
    const data = await response.json();
    console.log('Login stub response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error during testLogin:', err);
  }
})(); 