## Server Side Tracking:
### - Pages

```TYPESCRIPT
PageInfo {
	updates: Update[], // List of updates (holding a change set and a client ID)
	title: string,
	activeUsers: CollabUser[],
	
}
```
##### Text Content
- The updates for the text contents (from @codemirror/collab package)
- The internal text on a given page
- The pagePath (set as title)
- The list of active users on a given page
#### - Users

```TYPESCRIPT
CollabUser {
	id: number, //randomly assigned user ID
	username: string,
	socketID?: number,
	color: string, //Color to be used for the user
}
```

- Need to track what user is on what page


#### Theoretical Side

```TYPESCRIPT
import {ChangeSet, Text} from "@codemirror/state"
import {Update, rebaseUpdates} from "@codemirror/collab"

// The updates received so far (updates.length gives the current
// version)
let updates: Update[] = []
// The current document
let doc = Text.of(["Start document"])
```

This code implements the three message types that the worker handles.
- **`pullUpdates`** is used to ask the authority if any new updates have come in since a given document version. It “blocks” until new changes come in when asked for the current version (this is what the `pending` variable is used for).
- **`pushUpdates`** is used to send an array of updates. The server stores the updates, rolls its document forward, and notifies any waiting `pullUpdates` requests.
- **`getDocument`** is used by new peers to retrieve a starting state.

https://codemirror.net/examples/collab/
https://discuss.codemirror.net/t/codemirror-6-proper-way-to-listen-for-changes/2395/10

#### Some notes

- I can use the `Text.toString()` when calling on obsidian's `this.plugin.app.vault.adapter.write`



##### My prompt for Phind.com
I'm trying to set up a server in typescript that allows the use of codemirror 6 on a variety of different pages from a local directory, onto the browser. These files are markdown files. My goal with this server is to set up a way for multiple users to make collaborative changes to these files in real time. As such, I intend to use the @codemirror/collab package. I'm using socketIO to handle the bi-directional websocket stream. However, I need have a few questions regarding its implementation:

1. How should I go about serving the event of a change in the text that a given user on a page has made? How could I implement the sending of an event from the client side of the codeMirror editor, and how could it be received in the server?