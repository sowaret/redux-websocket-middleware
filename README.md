WebSocket server middleware implementation for Redux


## Installation

```bash
$ npm install @sowaret/redux-websocket-middleware
```


## File structure

The setup instructions below correspond with the following file structure:
```
client/
├─ websocket/
│  ├─ actions.js
│  ├─ middleware.js
│  ├─ module.js
├─ store.js

server/
├─ websocket/
│  ├─ controllers.js
├─ server.js
```


## Setup: Client

### Create action definitions:

#### `websocket/actions.js`
```js
const definitions = {
    ACTION_NAME: {
        parameters: ['id', 'name'],
        // Parameters accepted by this action
        // Can be a string, a list of strings, or omitted

        reducerName: 'DID_ACTION_NAME',
        // Payload `type` returned from the server that corresponds with this action
        // If this is not defined, the enum will be used (ACTION_NAME above)

        reducer: ({ dispatch, payload }) => { /* ... */ },
        // Function to execute when `reducerName` is received from the server
    },
    ANOTHER_ACTION: {
        parameters: 'id',
        // ...
    },
    // ...
};
const otherReducers = {
    // These reducers will not have actions generated for them.
    // These are defined similarly to the above and will execute when such
    // a response is received from the server.
    REDUCER_NAME: ({ dispatch, payload }) => { /* ... */ },
    // ...
};
export { definitions, otherReducers };
```


### Create a file to build the WebSocket module:

#### `websocket/module.js`
```js
import { buildWebSocketModule } from '@sowaret/redux-websocket-middleware';
import { definitions, otherReducers } from './actions';

const { actions, actionEnumList, responseReducers } = buildWebSocketModule({
    definitions,
    otherReducers,
    prefix: 'ws', // default
});

module.exports = {
    ...actions, // Spread `actions` for easier access
    actions,
    actionEnumList,
    responseReducers,
};
```


### Create a file to build and export your store's middleware:

#### `websocket/middleware.js`
```js
import { createSocketMiddleware } from '@sowaret/redux-websocket-middleware';
import {
    actionEnumList,
    responseReducers,
    // ...plus any actions needed when building the middleware
    // e.g. for `onSocketOpen`
} from './module';

export default createSocketMiddleware({
    actionEnumList,
    responseReducers,
    // Optional callback to execute containing any response from each reducer
    onReducerResponse({ dispatch, res, type }) => { /* ... */ },
    // Optional callback to execute when a connection is established
    onSocketOpen: store => { /* ... */ },
});
```


### Implement the middleware in the Redux store:

#### `store.js`
```js
import { applyMiddleware, createStore } from 'redux';
import webSocketMiddleware from './websocket/middleware';

// ...

export default createStore(
    reducer,
    initialState,
    applyMiddleware(webSocketMiddleware)
);
```


## Setup: Server

### Create controllers to handle messages from the client:

Controller names should correspond to the action names in `client/websocket/actions.js`.

#### `websocket/controllers.js`
```js
export const CONTROLLER_NAME = {
    try: async ({ client, data, Main }) => {
        // Pass data and client to a method on the Main class instance,
        // send message to client,
        // etc.
    },
    catch: async ({ client, error }) => {
        // Handle error; send message to client, etc.
    },
};
// ...
```


### Use `createWebSocketServer` in your server file:

#### `server.js`
```js
import { createWebSocketServer } from '@sowaret/redux-websocket-middleware';
// Import your controllers
import controllers from './websocket/controllers';
// Import the class to use that will keep the database in sync with the WebSocket state
import MainClass from './websocket/classes';

createWebSocketServer({
    // Optional function to execute before dispatching each action
    // If this function returns `true`, the action will not be dispatched
    cancelDispatch: ({ client, type }) => { /* ... */ },
    controllers,
    // Optional callback to execute when a connection is closed
    onClose: client => { /* ... */ },
    port: 8080, // default
    wsClass: MainClass,
    // Parameter name to use when passing the class instance to your actions
    wsClassParamName: 'Main',
});

// ... the rest of your server declaration
```


## Usage
Action function names are generated as CamelCase versions of the enums in `actions.js`, prefixed by the optional string passed to `prefix` in `buildWebSocketModule` (`'ws'` is the default).

```js
import { wsActionName, wsAnotherAction } from './websocket/module';
// ...
dispatch(wsActionName({ id, name }));
dispatch(wsAnotherAction(id));
```
