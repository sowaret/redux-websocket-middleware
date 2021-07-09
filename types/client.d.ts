import { Dispatch } from 'redux';

//
// Reducer functions
interface ReducerParameters {
	dispatch: Dispatch
	payload: any
}

type ReducerFunction = (args: ReducerParameters) => void
interface ReducerFunctions {
	[key: string]: ReducerFunction
}

//
// Reducer types
interface BareReducers {
	[key: string]: ReducerFunction
}

type UserDefinedReducerResponse = any;

//
// WebSocket and user-defined action definitions
interface WebSocketActionDefinitions {
	[key: string]: { parameters: 'host' }
}

interface UserDefinition {
	parameters?: string | string[]
	reducer: ReducerFunction
	reducerName: string
}
interface UserDefinitions {
	[key: string]: UserDefinition
}

interface ActionDefinitions {
	[key: string]: UserDefinition | WebSocketActionDefinition
}

//
// `any` types to fix
type FixType = any
