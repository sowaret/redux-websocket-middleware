import { ActionDefinitions, FixType, UserDefinitions } from 'types/client';
import { capitalize, lowercase } from './utils';
import webSocketActionDefinitions from './actions/websocket';
const webSocketActionEnums = Object.keys(webSocketActionDefinitions);

const getActionFunctionNameFromEnum = (actionEnum: string, prefix: string) => {
	const parts = capitalize(lowercase(actionEnum.split('_')));
	return [prefix, ...parts].join('');
};

interface BuildActionsParameters {
	definitions: ActionDefinitions
	prefix: string
};
const buildActions = ({ definitions, prefix }: BuildActionsParameters) => {
	const actions: FixType = {};

	for (const [actionEnum, { parameters }] of Object.entries(definitions)) {
		const functionName = getActionFunctionNameFromEnum(actionEnum, prefix);
		actions[functionName] = (params: FixType) => {
			const type = { type: actionEnum };

			// Omit parameters for actions that take none
			if (!parameters) return type;

			// Handle single parameters
			if (typeof parameters === 'string')
				return { [parameters]: params, ...type };

			// Filter parameters by the ones that the reducer uses
			const filteredParams = Object.fromEntries(
				Object.entries(params).filter(x => parameters.includes(x[0]))
			);
			return { ...filteredParams, ...type };
		};
	}

	return actions;
};

interface CreateActionsParameters {
	definitions?: UserDefinitions
	prefix?: string
};
interface CreateActionsReturn {
	actionDefinitions: ActionDefinitions
	actionEnumList: string[]
	actions: FixType
};
export = ({
	definitions = {},
	prefix = 'ws',
}: CreateActionsParameters = {}): CreateActionsReturn => {
	// Disallow passing reducers that would conflict with the WebSocket ones
	const disallowedReducerEnums = Object.keys(definitions).filter(
		x => webSocketActionEnums.includes(x)
	);
	if (disallowedReducerEnums.length) {
		throw 'Reducer enum cannot use built-in WebSocket enum: '
			+ disallowedReducerEnums.join(',');
	}

	const actionDefinitions = {
		...definitions,
		...webSocketActionDefinitions,
	};
	const actions = buildActions({ definitions: actionDefinitions, prefix });
	const actionEnumList = Object.keys(actionDefinitions);
	return { actionDefinitions, actionEnumList, actions };
};
