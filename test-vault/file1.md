# h1
## h2
### h3
#### h4
###### h5
#### Project Milestones:
- [ ] Implement basic functionality.
- [ ] Create Unit tests.
- [ ] Publish the plugin in the official Obsidian Repository.
- [ ] Create Github actions to publish automatically.

Lets say I'm developing a typescript plugin for the Obsidian application which allows me to spin up a http server locally accessable on the network, hosted by my computer. Within my code, I define the server controller which implements the use of http, express, and websocket libraries. When setting up the server, I have users login by giving just a name. However, I'm confued on two things:

The first is whether using http, express and websocket is the best way to attach a user to a session? My plugin's server will need to keep track of who is accessing what page, how many users are accessing a given  page, and how to best deal with each user making changes to the contents of the page.

The second is 