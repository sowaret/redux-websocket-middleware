import WebSocket from 'ws';

interface ClientData {
	type: string
	[key: string]: string
};
interface ClientDataNoType {
	[key: string]: string
};

interface ControllerActionParameters {
	client: WebSocketClient
	data: ClientDataNoType
	[key: string]: UserClassInstance | WebSocketClient | ClientDataNoType
};
interface ControllerActionErrorParameters {
	client: WebSocketClient
	error: Error
};

type CancelDispatchFunction = ({ client: WebSocketClient, type: string }) => any;
type OnCloseFunction = (client: WebSocketClient) => void;

type UserClass = new (...args: any[]) => void;
type UserClassInstance = InstanceType<UserClass>;

interface UserController {
	try: (args: ControllerActionParameters) => void
	catch: (args: ControllerActionErrorParameters) => void
	[key: string]: any
};
interface UserControllers {
	[key: string]: UserController
};

interface WebSocketClient extends WebSocket {
	id: string
	isAlive: boolean
};

interface WebSocketClientAndClassInstance {
	client: WebSocketClient
	wsClassInstance: UserClassInstance
	wsClassParamName: string
}
