export function generateAIResponse(messages, systemPrompt) {
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const lower = lastUserMsg.toLowerCase().trim();

  if (/^(hi|hello|hey|greetings)\b/.test(lower)) {
    return "Hello! I'm your AI assistant. How can I help you today? Feel free to ask me anything \u2014 I can help with questions, writing, analysis, coding, and much more.";
  }

  if (lower.includes('weather')) {
    return "I don't have access to real-time weather data, but I'd recommend checking a weather service like weather.gov or your local meteorological service for the most accurate and up-to-date forecasts for your area.";
  }

  if (
    lower.includes('code') ||
    lower.includes('programming') ||
    lower.includes('function')
  ) {
    return "I'd be happy to help with coding! Here's a general approach:\n\n1. Break down the problem into smaller pieces\n2. Write pseudocode to outline your logic\n3. Implement one piece at a time\n4. Test each piece as you go\n\nCould you share more details about what you're trying to build? I can provide more specific guidance and code examples.";
  }

  if (
    lower.includes('math') ||
    lower.includes('calculate') ||
    /\d+\s*[+\-*/]\s*\d+/.test(lower)
  ) {
    return "I can help with math! While I can work through mathematical concepts and show solution steps, for complex calculations I'd recommend double-checking with a calculator. What specific math problem are you working on?";
  }

  if (lower.includes('thank')) {
    return "You're welcome! If you have any more questions, don't hesitate to ask. I'm here to help!";
  }

  if (lower.includes('bye') || lower.includes('goodbye')) {
    return 'Goodbye! It was great chatting with you. Feel free to come back anytime you need help. Have a wonderful day!';
  }

  if (lower.includes('help')) {
    return "Of course! I can assist you with a wide range of tasks:\n\n- Questions & Research: Ask me about any topic\n- Writing: Drafts, editing, summaries\n- Coding: Debug, explain, or write code\n- Analysis: Break down complex topics\n- Math: Work through problems step by step\n\nWhat would you like help with?";
  }

  if (systemPrompt && systemPrompt !== 'You are a helpful assistant.') {
    return (
      'Based on my instructions, I\'ll do my best to help with your request: "' +
      lastUserMsg.substring(0, 60) +
      '"\n\nThis is an interesting question that I\'ll approach from the perspective outlined in my system instructions. Let me break this down and provide a thoughtful response.\n\nWould you like me to elaborate on any specific aspect?'
    );
  }

  const preview =
    lastUserMsg.substring(0, 80) + (lastUserMsg.length > 80 ? '...' : '');
  return (
    'That\'s a great question about "' +
    preview +
    '". Let me share my thoughts:\n\nHere are some key points to consider:\n\n1. Context matters \u2014 understanding the full picture helps provide better guidance\n2. Start simple \u2014 begin with the fundamentals before diving into complexity\n3. Iterate \u2014 refine your approach based on what you learn\n\nWould you like me to go deeper into any of these points, or do you have a specific aspect you\'d like to focus on?'
  );
}
