import type { WsgateOptions } from '@wsgate/express';

export const wsgateDocs: WsgateOptions = {
  title: 'Express Chat API',
  events: [
    {
      event: 'message:send',
      description: 'Send a message to the chat.',
      payload: { text: 'string', username: 'string' },
      response: 'message:receive',
      type: 'emit',
    },
    {
      event: 'message:receive',
      description: 'Receive a message from the chat.',
      payload: { text: 'string', username: 'string' },
      type: 'subscribe',
    },
    {
      event: 'join:room',
      description: 'Join a chat room.',
      payload: { room: 'string' },
      type: 'emit',
    },
  ],
};
