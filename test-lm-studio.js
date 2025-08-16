// Simple test script to verify LM Studio connection
async function testLMStudio() {
  const API_URL = 'http://localhost:1234/v1';
  
  try {
    // Test connection
    console.log('Testing LM Studio connection...');
    const modelsResponse = await fetch(`${API_URL}/models`);
    if (!modelsResponse.ok) {
      throw new Error(`Connection failed: ${modelsResponse.status}`);
    }
    console.log('✅ LM Studio connection successful');
    
    // Test chat completion
    console.log('Testing calculator generation...');
    const chatResponse = await fetch(`${API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-3b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a calculator specification generator. Return only valid JSON.'
          },
          {
            role: 'user',
            content: 'Generate a calculator specification for: tip calculator'
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    if (!chatResponse.ok) {
      throw new Error(`Chat completion failed: ${chatResponse.status}`);
    }
    
    const result = await chatResponse.json();
    console.log('✅ Calculator generation test successful');
    console.log('Sample response:', result.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. LM Studio is running');
    console.log('2. Server is started on port 1234');
    console.log('3. llama-3.2-3b-instruct model is loaded');
  }
}

testLMStudio();
