async function getToken() {
  try {
    const res = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'CREATEX_CSI_ADMIN', 
        password: '9390091939@csikare' 
      })
    });
    const data = await res.json();
    if (data.token) {
      console.log('TOKEN:' + data.token);
    } else {
      console.error('Login Failed:', data);
      process.exit(1);
    }
  } catch (e) {
    console.error('Fetch Error:', e.message);
    process.exit(1);
  }
}
getToken();
