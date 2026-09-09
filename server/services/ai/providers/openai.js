/**
 * OpenAI-compatible provider implementation.
 * Uses fetch so it works with OpenAI, OpenRouter, or any
 * OpenAI-compatible chat completions endpoint.
 */
class OpenAIProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.AI_API_KEY;
    this.baseURL = (config.baseURL || process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    this.model = config.model || process.env.AI_MODEL || 'gpt-4o-mini';
  }

  async generate(payload) {
    const { system, messages, temperature = 0.7, maxTokens = 2000, json = false } = payload;

    if (!this.apiKey) {
      throw new Error('AI_API_KEY is not configured');
    }

    const body = {
      model: this.model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages
      ],
      temperature,
      max_tokens: maxTokens
    };

    if (json) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI provider error (${res.status}): ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AI provider returned an empty response');
    }
    return content.trim();
  }
}

module.exports = OpenAIProvider;
