import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const configuration = new Configuration({ apiKey });
    const openai = new OpenAIApi(configuration);

    const { message } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful padel tennis assistant for the Padel Core platform. 
        You have expertise in:
        - Padel rules and techniques
        - Tournament information and schedules
        - Player rankings and statistics
        - Court reservations and bookings
        - Training tips and strategies
        
        Always be friendly and professional. Provide concise but informative answers.
        Use Spanish for responses as this is a Mexican platform.`,
      },
      {
        role: 'user',
        content: message,
      },
    ];

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.8,
      max_tokens: 500,
    });

    const response = completion.data.choices[0]?.message?.content || 
      'Lo siento, no pude procesar tu mensaje.';

    return new Response(
      JSON.stringify({ response }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal Server Error',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});