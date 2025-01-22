// OpenAI API configuration and types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  error?: string;
}

// Helper function to handle chat API calls
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert padel tennis assistant with deep knowledge of the sport. Your expertise includes:

            - Tournament formats, rules and strategies
            - Professional padel circuit and rankings
            - Technical advice for all skill levels
            - Match tactics and positioning
            - Training drills and exercises
            - Equipment recommendations
            - Common mistakes and how to fix them
            - Mental game and match preparation
            
            Provide specific, actionable advice drawing from your expertise. Use Spanish for all responses as this is a Mexican platform. Be encouraging and positive while maintaining professional authority.`
          },
          {
            role: "user",
            content: message
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error('Error al conectar con el servicio de chat');
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Respuesta inválida del servicio');
    }

    return {
      response: data.choices[0].message.content
    };
  } catch (error) {
    console.error('Chat error:', error);
    return {
      response: 'Lo siento, en este momento no puedo procesar tu mensaje. Por favor intenta más tarde.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}