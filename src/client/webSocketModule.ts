import {
	BareReducers,
	ReducerFunctions,
	UserDefinition,
	UserDefinitions,
} from 'types/client';
import createActions from './actions';

interface BuildWebSocketModuleParameters {
	definitions: UserDefinitions
	otherReducers: BareReducers
	prefix: string
};
export = ({
	definitions,
	otherReducers,
	prefix = 'ws',
}: BuildWebSocketModuleParameters) => {
	const {
		actionDefinitions,
		actionEnumList,
		actions,
	} = createActions({ definitions, prefix });

	// BUILD REDUCERS - websocket onMessage callbacks
	const responseReducers: ReducerFunctions = {};
	for (const [action, { reducer, reducerName }] of Object.entries(
		actionDefinitions
	) as [string, UserDefinition][]) {
		responseReducers[reducerName || action] = reducer;
	}
	
	for (const [reducerName, reducer] of Object.entries(otherReducers))
		responseReducers[reducerName] = reducer;

	return { actions, actionEnumList, responseReducers };
};
