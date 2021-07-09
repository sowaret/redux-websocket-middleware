import { WebSocketClient } from 'types/server';

export const generateClientId = () =>
	Math.floor((1 + Math.random()) * 0x10000).toString(16);

export const send = (client: WebSocketClient, data: object) =>
	client.send(JSON.stringify(data));
