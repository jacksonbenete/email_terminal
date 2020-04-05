# Email Reader Terminal for tabletop RPGs

![Email Terminal Gif](docs/email_terminal.gif)

This is a simple, read-only, terminal experience for tabletop RPGs.
You can fork the project and change the code for your own configurations, like terminal name (or sector/station/node if sci-fi), image and messages.

The database is a simple JSON structured file.

You can host it on github pages for a free and fast experience and can share the link for your friends and players to use.

## Latest News

You can now configure and access extra servers at network.json to login via telnet.
Each server will treat their respective users (and mail messages) separatedly.

---
![Telnet v1](docs/telnet.gif)

You can now configure custom software at software.json to use it.
They're just simple simulations but I hope you enjoy it!

---
![Custom Software v1](docs/custom_software.gif)

The help command has been improved.
You can now show further help instructions for internal commands.

---
![Help v1](docs/help.gif)

## How to Configure

You can upload it to Github Pages or try it on your computer. 
You will find instructions for both options below.

## Customization

You will want to customize the terminal depending of the game setting you're playing. You just have to edit the `manifest.json` file.

More configuration files will be added when more functionality shows up.

The main server, which is the one the terminal will start at, is located as `localhost` at `config/network`.

The `network` folder is where every server available needs to be at. This is where you can configure new servers to be accessed via telnet command.

You need to create a folder with the name of the server address if you want to connect to custom servers.

Each server will have a distinct user list, mail messages and server files. That is, you can't access data of a user configured on database.json while you're at another server.

### manifest.json

The basic configuration at `manifest.json` is what you need to change for customize your terminal.
You can change the terminal year date, the server name, a customized icon, the terminal identification (this is what is written just before of the mouse cursor), as well as the default user id and name (normally will be "user", but can be whatever you want) and if you want a random number to be displayed right in front of the default username (randomSeed). Note however that once you login to the server the username will change.

```json
{
    "year": "2377",
    "serverAddress": "localhost",
    "serverName": "Node Y56 Intranet",
    "iconName": "Moon-icon.png",
    "terminalID": "Y56",
    "defaultUser": {
        "userId": "user",
        "password": "",
        "userName": "anonymous"
    },
    "randomSeed": true
}
```
---
![Example of a Sci-Fi / Space Opera Terminal](docs/scifi_example.png)

```json
{
    "year": "1972",
    "serverAddress": "127.0.0.1",
    "serverName": "FBI: X-Files Division",
    "iconName": "fbi.png",
    "terminalID": "fbi",
    "defaultUser": {
        "userId": "user",
        "password": "",
        "userName": "anonymous"
    },
    "randomSeed": false
}
```
---
![Example of a Sci-Fi / Space Opera Terminal](docs/fbi_example.png)

### userlist.json

The `userlist.json` file is where you will add your players as users of the main server, or the npcs users of other servers.
The basic structure of the file is as follows:

- userId: is the username identificantion for login
- password: is the password necessary to login
- userName: this is the name of the player character (if the terminal is where he check his emails) or the name of a npc (if he's hacking into someone else's computer/server)

You can register as many users and mail messages as you want, you just need to put a comma `,` right after the correct enclosing `}`. If you're in trouble you can check a basic JSON tutorial, it's easy.

```json
[
    {
        "userId": "8A73B5",
        "password": "trustno1",
        "userName": "Mulder, Fox"
    },

    {
        "userId": "admin",
        "password": "admin",
        "userName": "root"
    }
]
```

### mailserver.json

This is where you will register the server mails.
You can register as many mail messages as you want by adding a comma `,` right after the correct enclosing `}`.
You can register the same email for multiple users at once.

- from: the name of the person who supposedly send the message
- to: a list of users who will have access to the message after login
- title: the title of the message that will be given when listing mail messages
- body: the actual message to be displayed after selecting it to be read

Note that `user` will display the message for visitors if the `defaultUser` `userId` is registered as `user` in the respective server `manifest.json`.

On the body, you can break the line with a double space.

```json
[
    {
        "from": "admin",
        "to": ["8A73B5", "user"],
        "title": "Maintenance in all servers",
        "body": "This message is for all divisions of the bureau.  Starting today, the servers may suffer instability due to the latest maintenance mesures.    - admin"
    },

    {
        "from": "Mike",
        "to": ["admin"],
        "title": "wtf are you kidding me?",
        "body": "Are you kidding me? Why don't you change your password?  The system is entirely compromised until you correct it.  You're the sysadmin, if you're this dumb the corporation is at risk."
    }
]
```

### Software

You can create your own custom softwares.
At the moment you can just create simple software that will output some messages simulating an operation.

You just need to create a file with the name of the software terminating with `.json`.
After setting everything up you can just use it as the defined name.filetype (i.e. `cdata.exe` command defined in `cdata.json`).

- filename: the name of the file as metadata, this need to be the same as the actual filename terminating as `.json` in the software folder
- filetype: this is where you decide the termination to call at the terminal
- location: here you can specify which servers will have access to the software (where it is installed), you need to specify at least `localhost` if you want it to run in the main terminal
- protection: this is where you specify who can have access to the software, that is, which user have it installed (or which player have found it to use)
-  delayed: this will create an effect to each message to be slowly printed at terminal, the number is in milliseconds
- message: the actual message to be displayed as an emulation of the software running

```json
{
    "cdata": {
        "filename": "cdata",
        "filetype": "exe",
        "location": ["127.0.0.1", "localhost"],
        "protection": ["admin"],
                
        "delayed": 2000,
        "message": [
            "Corrupting data.",
            "Corrupting data..",
            "Corrupting data...",
            "0% complete",
            "11% complete",
            "47% complete",
            "98% complete",
            "System successfully corrupted!"
        ]
    }
}
```

## Login, Mail & Read Functions

The main functions are the `mail` and `read` terminal operations.

Once you `login`, you can write down the `mail` function to list the user emails and you can `read` those mails you want by entering the index code (the correspondent number, letter, or string). 

As a simple terminal emulation, you can't delete mails or mark as read. We maybe can work it out in the future, but those basic functions are enough to send some cool mysterious mails to your player's agents or if a character hacked into a company to investigate a clue or something.

---

To login you need to enter user@password

![How to login.](docs/login1.png)
---

Note the change in the terminal username

![Note the change in the terminal username.](docs/login2.png)
---

How to list and read mails

![Mail and Read functions.](docs/mail_n_read.png)

### Other Functions

You can try `help` to see a list of other functions disponible. The `clear` function may be a useful one.

## How to Install

As I've said, you can use Github Pages to do that for you.
If you're not used to Github, first create a github user by registering in [Github](github.com), so you can "fork" the project to your account by accessing the project page [email_terminal](github.com/jacksonbenete/email_terminal) and by clicking in the "fork" button.

![How to Fork a project.](docs/fork1.png)

Note that those two in red are the only two steps you need to take to put your terminal up and running. You need to click the Fork button, and after some seconds, the project will be there as one of your own repositories, and then you will click in the Settings button.

In the settings page, you will roll until Github Pages and will select the source as the master branch. 

![Github Pages on Settings.](docs/fork2.png)

After some seconds, you will be able to access your terminal at username.github.io/email_terminal (i.e. jacksonbenete.github.io/email_terminal).

Note that, you can create multiple repositories and name those repositories in the Settings for each of your game tables, that way you can have one terminal ready for each setting (or for each organization your players will hack into), ex: 
- username.github.io/spacestationX22
- username.github.io/PenTexCorp
- etc

You just need to share the correct link with your players and wait for them to read the clues and investigate.

### How to Configure for localhost

If you're testing this on your computer you'll need to install a http-server because isn't possible to open files for security reasons, and you need that for the ajax to work to access the database file. It will work without problems once it is forked and running as a github page.

```node
npm install http-server -g
```

Run it as `http-server C:\location\to\app` or just `http-server` if you're inside the directory. You can access it on `127.0.0.1:8080` in your browser. If you're debbuging it consider to go to "Network" in the Inspector and disable the cache.

## Future of the Project

That's really a simple terminal emulation, as I've said.
But, there is some things that could be also good to explore, like the creation of some local files or executable programs for the players to interact with.

If you want to, drop some ideas into my github repository or send me some messages at reddit u/jacksonbenete and we can work out something else.

## Acknowledgement
- Base code inspired by @AndrewBarfield, https://codepen.io/AndrewBarfield HTML5 Web Terminal.

### Icons Acknowledgement
- Moon-icon.png by: http://www.iconarchive.com/show/christmas-shadow-2-icons-by-pelfusion/Moon-icon.html and www.pelfusion.com
- tech.jpg icon by: https://favpng.com/png_user/GreatCthulhu
- cmd.png icon by: https://www.flaticon.com/br/packs/seo-and-web-5
- vision.svg icon by: https://www.flaticon.com/free-icon/company-vision_1465429
- world.svg icon by: https://www.flaticon.com/authors/turkkub
- fbi.png icon by: https://iconscout.com/contributors/icon-mafia

### Icons Acknowledgemente (not included)
- (non-free) DNA icon by: https://www.iconfinder.com/icons/378473/dna_icon 