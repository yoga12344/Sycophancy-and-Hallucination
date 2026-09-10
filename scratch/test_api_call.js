async function testChatApi() {
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Write a quick Rust snippet to calculate hash of a file' })
    });
    const data = await res.json();
    console.log('API HTTP Status:', res.status);
    console.log('Intent Type:', data.analysis.intent.intentType);
    console.log('Expected Output:', data.analysis.intent.expectedOutputType);
    console.log('Response Grounding Status:', data.analysis.responseRelevance.status);
    console.log('Relevance Score:', data.analysis.responseRelevance.overallRelevanceScore);
    console.log('Delivered Text:', data.final.slice(0, 120).replace(/\n/g, ' '));
  } catch (err) {
    console.error('API call failed:', err);
    process.exit(1);
  }
}
testChatApi();
