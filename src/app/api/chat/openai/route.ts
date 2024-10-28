import { Configuration, OpenAIApi } from 'openai-edge'
import { OpenAIStream } from 'ai'
import { aiConfig } from '@/config/ai'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const response = await openai.createChatCompletion({
      model: aiConfig.model,
      stream: true,
      temperature: aiConfig.temperature,
      messages: [
        { 
          role: 'system', 
          content: aiConfig.systemPrompt 
        },
        ...messages
      ]
    })

    // Create the stream
    const stream = OpenAIStream(response)
    
    // Return a standard Response object with the stream
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (error) {
    let errorMessage = 'Failed to process AI request'
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message
      // Handle specific error types if needed
      if (error.name === 'OpenAIError') {
        statusCode = 400
      }
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }), 
      { 
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}