import WebSocket from 'ws';
import {
	ClientData,
	ClientDataNoType,
	CancelDispatchFunction,
	OnCloseFunction,
	UserClass,
	UserController,
	UserControllers,
	WebSocketClient,
	WebSocketClientAndClassInstance,
} from 'types/server';
import { generateClientId, send } from './utils';

interface DispatchActionParameters extends WebSocketClientAndClassInstance {
	cancelDispatch: CancelDispatchFunction
	controller: UserController
	data: ClientDataNoType
	type: string
};
const dispatchAction = async ({
	cancelDispatch,
	client,
	controller,
	data,
	type,
	wsClassInstance,
	wsClassParamName,
}: DispatchActionParameters) => {
	if (cancelDispatch({ client, type })) return;
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
	cancelDispatch: CancelDispatchFunction,
	controllers: UserControllers
	onClose: OnCloseFunction
};
const connectClient = ({
	cancelDispatch,
	client,
	controllers,
	onClose,
	wsClassInstance,
	wsClassParamName,
}: ConnectClientParameters) => {
	client.id = generateClientId();
	client.isAlive = true;
	configureClient({
		cancelDispatch,
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
	cancelDispatch,
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
				cancelDispatch,
				client,
				controller: controllers[type],
				data: payload,
				type,
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
	cancelDispatch: CancelDispatchFunction
	controllers: UserControllers
	onClose: OnCloseFunction
	port: number
	wsClass: UserClass
	wsClassParamName: string
};
export = ({
	cancelDispatch = () => {},
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
			cancelDispatch,
			client,
			controllers,
			onClose,
			wsClassInstance,
			wsClassParamName,
		})
	);
	return wsServer;
};
