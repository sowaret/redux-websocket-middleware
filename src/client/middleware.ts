import {
	FixType,
	ReducerFunctions,
	UserDefinedReducerResponse,
} from 'types/client';
import { AnyAction, Dispatch, Store } from 'redux';
import createActions from './actions';
const { actions } = createActions();

interface CreateSocketMiddlewareParameters {
	actionEnumList: string[]
	dispatchOnClose: boolean
	onReducerResponse: (res: UserDefinedReducerResponse) => void
	onSocketOpen: (store: Store) => void
	responseReducers: ReducerFunctions
};
export = ({
	actionEnumList,
	dispatchOnClose = true,
	onReducerResponse = () => {},
	onSocketOpen = () => {},
	responseReducers,
}: CreateSocketMiddlewareParameters) => {
	let socket: WebSocket | null = null;

	const onOpen = (store: Store) => (event: FixType) => {
		store.dispatch(actions.wsConnected(event.target.url));
		onSocketOpen(store);
	};

	const onClose = (store: Store) => () =>
		dispatchOnClose && store.dispatch(actions.wsDisconnected());

	const onMessage = (store: Store) => (event: FixType) => {
		if (event.data === 'ping') return socket!.send('pong');

		const dispatch = store.dispatch;
		const { type, ...payload } = JSON.parse(event.data);

		if (type in responseReducers) {
			const res: UserDefinedReducerResponse =
				responseReducers[type]({ dispatch, payload });
			onReducerResponse(res);
		}
	};

	// Return middleware
	// Sent to server
	return (store: Store) => (next: Dispatch) => (action: AnyAction) => {
		const { type } = action;
		if (type === 'CONNECT') {
			if (socket !== null) socket.close();
			socket = new WebSocket(action.host);
			socket.onopen = onOpen(store);
			socket.onclose = onClose(store);
			socket.onmessage = onMessage(store);
		}
		else if (type === 'DISCONNECT') {
			if (socket !== null) socket.close();
			socket = null;
		}
		else if (actionEnumList.includes(type))
			return socket!.send(JSON.stringify(action));

		next(action);
	};
};
