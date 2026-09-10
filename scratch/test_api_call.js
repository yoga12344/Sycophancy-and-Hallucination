async function testTides() {
  const res = await fetch('http://127.0.0.1:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "What causes tides in Earth's oceans?" })
  });
  const data = await res.json();
  console.log('Delivered Text:\n', data.final);
  console.log('Contains generic phrase:', data.final.includes('the key factor is understanding how'));
}
testTides();
