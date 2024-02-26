This is your new *vault*.

Make a note of something, [[create a link]], or try [the Importer](https://help.obsidian.md/Plugins/Importer)!

When you're ready, delete this note and make the vault your own.


https://www.w3schools.com/html/tryit.asp?filename=tryhtml_intro
```html
<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
<style>
.workspace-tab-header-container {
	display: flex;
    background-color: #363636;
    /* background-color: #AAAAAA; */
    position: relative;
    flex: 0 0 auto;
    color: white;
    align-items: center;
    justify-content: center;
}

.workspace-tab-header-tab-user-container {
	width: 60px;
  	height: 40px;
    display: flex;
    border-left: 3px solid #adadad;
    align-items: center;
    justify-content: center;
}

.workspace-tab-header-spacer {
	display: flex;
    flex-grow: 1;
}

.userContainer {
	display: inline-block;
    cursor: pointer;
    justify-content: center;
}

.workspace-tab-header-tab-list > :not(:first-child) {
	margin-left: 5px;
}

/* Style for user circles */
.userCircle {
	position: relative;
    border-radius: 50%;
  	display: inline flex;
    border: 3px solid;
}

/* Style for the 'more' circle */
.moreCircle {
	position: relative;
    display: inline flex;
  	width: 40px;
  	height: 40px;
  	border-radius: 50%;
  	cursor: pointer;
  	background: grey;
    align-items: center;
    justify-content: center;
}

</style>
</head>
<body>
<div class="workspace-tab-header-container">
	<div class="workspace-tab-header-spacer"></div>
	<div class="workspace-tab-header-tab-list"></div>
    <div class="workspace-tab-header-tab-user-container">
    	
    	<div class="workspace-tab-current-user"></div>
    </div>
    
</div>

<h1>Some Heading</h1>
<p>content.</p>
<div>
	<input type="text" id="usernameInput" placeholder="Enter text">
	<button onclick="createUser()">Create User</button>
</div>
<br>
<div>
	<input type="text" id="textInput" placeholder="Enter text">
	<button onclick="sendText()">Send Text</button>
</div>
<div class="view-header-title-parent"><span class="view-header-breadcrumb">Personal Notes</span><span class="view-header-breadcrumb-separator">/</span><span class="view-header-breadcrumb">Custom Plugin</span><span class="view-header-breadcrumb-separator">/</span><span class="view-header-breadcrumb">Obsidian-Collab</span><span class="view-header-breadcrumb-separator">/</span><span class="view-header-breadcrumb">Sockets &amp; Collaboration</span><span class="view-header-breadcrumb-separator">/</span></div>
<script>
let userListContainer = document.querySelector("div.workspace-tab-header-tab-list");

let currentUser = 'ollie';

let curUsers = ['ollie', 'user', 'other'];
updateUserUI(currentUser, curUsers);

let currentPath = getFilePath();

function updateUserUI(curUser, users) {
	userListContainer.innerHTML = ''; // Clear the previous content
    
    currentUserContainer = document.querySelector("div.workspace-tab-current-user");
    if (currentUserContainer.innerHTML === '') {
    	currentUserContainer.appendChild(createUserCircle(curUser));
    }
       
	const maxDisplayUsers = 4;
    userListContainer.innerHTML = Math.min(users.length, maxDisplayUsers);
	for (let i = 0; i < Math.min(users.length, maxDisplayUsers); i++) {
		console.log('creating circle');
		const userCircle = createUserCircle(users[i]);
		console.log(userCircle);
		userListContainer.appendChild(userCircle);
	}

	if (users.length > maxDisplayUsers) {
		const moreCircle = createMoreCircle(users.length - maxDisplayUsers);
		userListContainer.appendChild(moreCircle);
	}
}

function createUserCircle(userId) {
	const userContainer = document.createElement('div');
	const userCircle = document.createElement('div');
    const userSVG = `<svg width="40px" height="40px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#1C274C" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0" transform="translate(2.040000000000001,2.040000000000001), scale(0.83)"><rect x="0" y="0" width="24.00" height="24.00" rx="12" fill="#ffffff" strokewidth="0"></rect></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.43200000000000005"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="#003cff"></path> <path d="M16.807 19.0112C15.4398 19.9504 13.7841 20.5 12 20.5C10.2159 20.5 8.56023 19.9503 7.193 19.0111C6.58915 18.5963 6.33109 17.8062 6.68219 17.1632C7.41001 15.8302 8.90973 15 12 15C15.0903 15 16.59 15.8303 17.3178 17.1632C17.6689 17.8062 17.4108 18.5964 16.807 19.0112Z" fill="#003cff"></path> <path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3432 6 9.00004 7.34315 9.00004 9C9.00004 10.6569 10.3432 12 12 12Z" fill="#003cff"></path> </g></svg>`;
    userContainer.className = "userContainer";
	userCircle.className = 'userCircle';
    
    userContainer.appendChild(userCircle);
   	
    userCircle.innerHTML = userSVG;
    
    userCircle.style.color = 'red';
    //userCircle.style.backgroundColor = 'red';
	// You can set background color or other styles based on the user
	userCircle.title = 'User: ' + userId;
	return userContainer;
}

function createMoreCircle(count) {
	const moreUsersContainer = document.createElement('div');
    const moreCircle = document.createElement('div');
	moreCircle.className = 'moreCircle';
	moreCircle.textContent = '+'+count.toString();
	moreCircle.title = 'Click to view more users';
	moreCircle.addEventListener('click', () => {
		// Implement logic to show a modal or expand the user list
		alert('List of all users: '+socket.rooms[pageId]);
	});
    return moreCircle;
}

function createUser() {
	var userId = document.getElementById("usernameInput").value;
    const userCircle = createUserCircle(userId);
	usersContainer.appendChild(userCircle);
    document.getElementById("usernameInput").value = "";
}

function sendText() {
	var userId = document.getElementById("textInput").value;

    // Call your function with the text value
    removeUser(userId);
    document.getElementById("textInput").value = "";
}

function removeUser(userId) {
	if (curUsers.includes(userId)) {
    	curUsers.splice(curUsers.indexOf(userId), 1);
    }
    updateUserUI(curUsers);
}
function getFilePath() {
        const currentUrl = window.location.href;
		console.log(currentUrl);
        let pagepath = '';
        const pageParents = document.querySelector("div.view-header-title-container");
        const pageTitle = document.querySelector("div.view-header-title-container div.view-header-title");
        const breadcrumbs = Array.from(document.getElementsByClassName('view-header-breadcrumb'));
        console.log(breadcrumbs);
        let curpath = breadcrumbs.map((span) => {if (span && span.innerText !== '') {return span.innerText;}}).join('/');
        console.log(curpath);
        curpath += pageTitle.innerText+'.md';
        console.log(curpath);
        return curpath;
    }

</script>
</body>
</html>
```


Light Mode User:
https://www.svgrepo.com/svg/525577/user-circle

Dark Mode user:
https://www.svgrepo.com/svg/527946/user-circle

<svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#0042ff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="#003cff"></path> <path d="M16.807 19.0112C15.4398 19.9504 13.7841 20.5 12 20.5C10.2159 20.5 8.56023 19.9503 7.193 19.0111C6.58915 18.5963 6.33109 17.8062 6.68219 17.1632C7.41001 15.8302 8.90973 15 12 15C15.0903 15 16.59 15.8303 17.3178 17.1632C17.6689 17.8062 17.4108 18.5964 16.807 19.0112Z" fill="#003cff"></path> <path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3432 6 9.00004 7.34315 9.00004 9C9.00004 10.6569 10.3432 12 12 12Z" fill="#003cff"></path> </g></svg>

<div class="sidebar-toggle-button mod-right" title="oliver"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0"></path><circle cx="12" cy="10" r="4"></circle><circle cx="12" cy="12" r="10"></circle></svg></div>
