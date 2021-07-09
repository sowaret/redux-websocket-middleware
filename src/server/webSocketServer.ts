import WebSocket from 'ws';
import {
	ClientData,
	ClientDataNoType,
	OnCloseFunction,
	UserClass,
	UserController,
	UserControllers,
	WebSocketClient,
	WebSocketClientAndClassInstance,
} from 'types/server';
import { generateClientId, send } from './utils';

interface DispatchActionParameters extends WebSocketClientAndClassInstance {
	controller: UserController
	data: ClientDataNoType
};
const dispatchAction = async ({
	client,
	controller,
	data,
	wsClassInstance,
	wsClassParamName,
}: DispatchActionParameters) => {
	try {
		await controller.try({
			client,
			data,
			[wsClassParamName]: wsClassInstance,
		});
	} catch (error) {
		controller.catch({ client, error });
	}
};

interface ConnectClientParameters extends WebSocketClientAndClassInstance {
	controllers: UserControllers
	onClose: OnCloseFunction
};
const connectClient = ({
	client,
	controllers,
	onClose,
	wsClassInstance,
	wsClassParamName,
}: ConnectClientParameters) => {
	client.id = generateClientId();
	client.isAlive = true;
	configureClient({
		client,
		controllers,
		onClose,
		wsClassInstance,
		wsClassParamName,
	});

	console.log(`${client.id} connected`);
	send(client, { type: 'WS_CONNECTED' });
};

const configureClient = ({
	client,
	controllers,
	onClose,
	wsClassInstance,
	wsClassParamName,
}: ConnectClientParameters) => client
	.on('message', async (dataString: string) => {
		if (dataString === 'pong') return client.isAlive = true;
		const data: ClientData = JSON.parse(dataString);

		const { type, ...payload } = data;
		if (type in controllers)
			await dispatchAction({
				client,
				controller: controllers[type],
				data: payload,
				wsClassInstance,
				wsClassParamName,
			});
	})
	.on('close', () => {
		console.log(`LEAVING: [${client.id}]`);
		onClose(client);
	});

const createClientPingInterval = (wsServer: WebSocket.Server) => setInterval(_ => {
	const clients = Array.from(wsServer.clients) as WebSocketClient[];
	clients.forEach(client => {
		if (!client.isAlive)
			return client.terminate();

		client.isAlive = false;
		client.send('ping');
	});
}, 30000);

interface CreateWebSocketServerParameters {
	controllers: UserControllers
	onClose: OnCloseFunction
	port: number
	wsClass: UserClass
	wsClassParamName: string
};
export = ({
	controllers,
	onClose = () => {},
	port = 8080,
	wsClass,
	wsClassParamName,
}: CreateWebSocketServerParameters) => {
	const wsServer = new WebSocket.Server({ port });
	createClientPingInterval(wsServer);
	const wsClassInstance = new wsClass();
	wsServer.on('connection', (client: WebSocketClient) =>
		connectClient({
			client,
			controllers,
			onClose,
			wsClassInstance,
			wsClassParamName,
		})
	);
	return wsServer;
};
