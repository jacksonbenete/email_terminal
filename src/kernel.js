var CMDS_
var date
var cmdLine_
var output_

function debugObject(obj) {
	for (var property in obj){
		console.log(property + ": " + obj[property]);
		output(property + ": " + obj[property])
   }
}

/**
 * Set Header and Prompt informations.
 * 
 * This function is useful to avoid code repetition.
 * 
 * @param {String} msg A message to be showed when done
 */
function setHeader(msg = '') {
	// Setting correct header icon and terminal name
	if (serverDatabase.randomSeed && !logged)
		prompt_text = '[' + userDatabase.userName + date.getTime() + '@' + serverDatabase.terminalID + '] # '
	else
		prompt_text = '[' + userDatabase.userName + '@' + serverDatabase.terminalID + '] # '

	header = `
    <img align="left" src="config/network/` + serverDatabase.serverAddress + `/` + serverDatabase.iconName + `" width="100" height="100" style="padding: 0px 10px 20px 0px">
    <h2 style="letter-spacing: 4px">` + serverDatabase.serverName + `</h2>
    <p>Logged in: ` + serverDatabase.serverAddress + ` ( ` + date_final + ` ) </p>
    <p>Enter "help" for more information.</p>
	`
	
	$.when( 
		system.clear() 
		)
		.then(function() {
			output([header, msg])
			$('.prompt').html(prompt_text)
		})
}

/**
 * Cross-browser impl to get document's height.
 * 
 * This function is necessary to auto-scroll to the end of page after each terminal command.
 */
function getDocHeight_() {
	var d = document
	return Math.max(
		Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
		Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
		Math.max(d.body.clientHeight, d.documentElement.clientHeight)
	)
}

/**
 * Scroll to bottom and clear the input value for a new line.
 * 
 * @param {Object} object The Input.cmdline right of the div.prompt
 */
function newLine(object = cmdLine_) {
	window.scrollTo(0, getDocHeight_())
	object.value = '' // Clear/setup line for next input.
}

/**
 * A function to padronize every output/return as a terminal print/echo function.
 * 
 * The output function now can handle both String and Array objects.
 * 
 * @param {String} data The string to be returned as a print in terminal
 * @param {Object} data The array to be returned as a print in terminal
 */
function output(data) {
	return new Promise(function(resolve, reject) {

		if (typeof(data) == 'object') {
			$.each(data, function(index, value) {
				output_.insertAdjacentHTML('beforeEnd', '<p>' + value + '</p>')
			})
		}
		if (typeof(data) == 'string') {
			output_.insertAdjacentHTML('beforeEnd', '<p>' + data + '</p>')
		}
		resolve(newLine())

	})
}

/**
 * Isn't working as needed
 * Needs to work with output() to output things one at time (delayed software message)
 * 
 * @param {Number} milliseconds 
 */
function sleep(milliseconds) {
	const date = Date.now()
	let currentDate = null
	do {
		currentDate = Date.now()
	} while (currentDate - date < milliseconds)
}

/**
 * The Kernel will handle all software (system calls).
 * 
 * The app name will be checked first if it exists as a system 'native' command.
 * If it doesn't, it will look for a custom software defined at software.json.
 * 
 * You can define commands with filetypes by naming the function as command_type.
 * The kernel will handle every `.` as a `_` when looking for the correct software.
 * i.e. the `bar_exe` function needs to be called as the `bar.exe` command in the Terminal.
 * 
 * @param {String} app The app name
 * @param {Array} args A list of Strings as args
 */
var kernel = function(app, args) {

	if (system[app])
		return (system[app](args))

	else if (system[app.replace('.', '_')])
		return (system[app.replace('.', '_')](args))

	else
		return (software(app, args))

}

/**
 * Recover the correct databases for the current server.
 * 
 * Some functions like `system.telnet()` needs to rewrite the databases variables.
 */
kernel.getDatabases = function() {
	userDatabase = serverDatabase.defaultUser
	$.when(
		$.get('config/network/' + serverDatabase.serverAddress + '/userlist.json', function(list) {
			userList = list
		})
		.fail(function() {
			userList = []
		}),
		$.get('config/network/' + serverDatabase.serverAddress + '/mailserver.json', function(list) {
			mailList = list
		})
		.fail(function(){
			mailList = []
		})
	).then(function() {
		return(true)
	})
}

/**
 * This will initialize the kernel function.
 * 
 * It will define the help functions, set some important variables and connect the databases.
 * 
 * @param {Object} cmdLineContainer The Input.cmdline right of the div.prompt
 * @param {Object} outputContainer The output element inside the div#container
 */
kernel.init = function(cmdLineContainer, outputContainer) {
	return new Promise(function(resolve, reject) {
		cmdLine_ = document.querySelector(cmdLineContainer)
		output_ = document.querySelector(outputContainer)
		date = new Date()

		CMDS_ = [
			'clear', 'date', 'echo', 'help', 'login', 'mail', 'read', 'ping', 'telnet'
		]

		$.get("config/network/localhost/manifest.json", function(configuration) {
			serverDatabase = configuration
			date_final = date.getDay() + '/' + date.getMonth() + '/' + serverDatabase.year
			kernel.getDatabases()
		})
		.done(function(){
			resolve(true)
		})

	})
}

/**
 * Internal command functions.
 * 
 * This is where the internal commands are located.
 * This should have every non-custom software command functions.
 */
var system = {
	foo: function() {
		return new Promise(function(resolve, reject) {
			// resolve("bar")
			output(`:: serverDatabase - connected server information`)
			debugObject(serverDatabase)
			output(`----------`)
			output(`:: userDatabase - connected user information`)
			debugObject(userDatabase)
			output(`----------`)
			output(`:: userList - list of users registered in the connected server`)
			debugObject(userList)
		})
	},

	whoami: function() {
		return new Promise(function(resolve, reject) {
			resolve(
				serverDatabase.serverAddress + `/` + userDatabase.userId
			)
		})
	},

	clear: function() {
		return new Promise(function(resolve, reject) {
			output_.innerHTML = ''
			cmdLine_.value = ''
			resolve(true)
		})
	},

	date: function() {
		return new Promise(function(resolve, reject) {
			resolve(String(date))
		})
	},

	echo: function(args) {
		return new Promise(function(resolve, reject) {
			resolve(args.join(' '))
		})
	},

	bar_exe: function() {
		return new Promise(function(resolve, reject) {
			resolve(`foobar.exe`)
		})
	},

	help: function(args) {
		return new Promise(function(resolve, reject) {
			if (args == '') {
				resolve([
					`You can read the help of a specific command by entering as follows: 'help commandName'`,
					`List of useful commands:`,
					'<div class="ls-files">' + CMDS_.join('<br>') + '</div>'
				])
			}
			if (args[0] == 'clear') {
				resolve([
					`Usage:`,
					`> clear`,
					`The clear command will completely wipeout the entire screen, but it will not affect the history or whatever have been made into the terminal.`
				])
			}
			if (args[0] == 'echo') {
				resolve([
					`Usage:`,
					`> echo args`,
					`The echo command will print args into terminal.`
				])
			}
			if (args[0] == 'login') {
				resolve([
					`Usage:`,
					`> login username@password`,
					`If you're a registered user into the server, you can login to access your data files and messages.`
				])
			}
			if (args[0] == 'read') {
				resolve([
					`Usage:`,
					`> read x`,
					`If you're logged in you can read your mail messages if any.`
				])
			}
			if (args[0] == 'telnet') {
				resolve([
					`Usage:`,
					`> telnet address`,
					`> telnet address@password`,
					`You can connect to a valid address to access a specific server if the server is at internet.`,
					`Intranet servers can only be accessed locally.`,
					`You may need a password if it isn't a public server.`
				])
			}
			if (args[0] == 'date') {
				resolve([
					`Usage:`,
					`> date`,
					`The date command will print the current date-time into terminal.`
				])
			}
			if (args[0] == 'help') {
				resolve([
					`Usage:`,
					`> help`,
					`The default help message.`,
					`It will show some of the available commands in a server.`,
					`Note that some existent commands may not have been show at help message.`
				])
			}
			if (args[0] == 'mail') {
				resolve([
					`Usage:`,
					`> mail`,
					`If you're logged in you can list your mail messages if any.`
				])
			}
			if (args[0] == 'ping') {
				resolve([
					`Usage:`,
					`> ping address`,
					`The ping command will try to reach a valid address.`,
					`If the ping doesn't return a valid response, the address may be incorrect, may not exist or can't be reached locally.`
				])
			}
		})
	},

	login: function(args) {
		var userFound = false

		return new Promise(function(resolve, reject) {
			if (args == "")
				return reject(new UsernameIsEmptyError)
			args = args[0].split('@')
			$.each(userList, function(index, value) {
				if (args[0] == value.userId && args[1] == value.password) {
					userFound = true
					userDatabase = value
					logged = true
				}
			})
			if (!userFound)
				return reject(new UsernameIsEmptyError)
			
			resolve(setHeader('Login successful'))
		})

	},

	logout: function() {
		return new Promise(function(resolve, reject) {
			if (!logged)
				return reject(new LoginIsFalseError)

			logged = false
			userDatabase = serverDatabase.defaultUser
			resolve(setHeader('Logout completed'))
		})
	},

	mail: function() {
		return new Promise(function(resolve, reject) {

			var messageList = []

			$.each(mailList, function(index, mail) {
				if (mail.to.includes(userDatabase.userId))
					messageList.push(`[` + index + `] ` + mail.title)
			})

			if (messageList == "")
				return reject(new MailServerIsEmptyError)

			resolve(messageList)
		})
	},

	read: function(args) {
		return new Promise(function(resolve, reject) {

			var message = []

			readOption = false
			$.each(mailList, function(index, mail) {
				if (mail.to.includes(userDatabase.userId) && args[0] == index) {
					readOption = true
					message.push(`---------------------------------------------`)
					message.push(`From: ` + mail.from)
					message.push(`To: ` + userDatabase.userId + `@` + serverDatabase.terminalID)
					message.push(`---------------------------------------------`)

					$.each(mail.body.split("  "), function(i, b) {
						message.push(b)
					})
				}
			})

			if (!readOption)
				return reject(new InvalidMessageKeyError)

			resolve(message)
		})
	},

	ping: function(args) {
		return new Promise(function(resolve, reject) {
			if (args == "")
				return reject(new AddressIsEmptyError)

			$.get('config/network/' + args + '/manifest.json', function(serverInfo) {
				resolve(`Server ` + serverInfo.serverAddress + ` (` + serverInfo.serverName + `) can be reached`)
			})
			.fail(function(){
				return reject(new AddressNotFoundError(args))
			})
		})
	},

	telnet: function(args) {
		return new Promise(function(resolve, reject) {
			if (args == "")
				return reject(new AddressIsEmptyError)

			if (args == serverDatabase.serverAddress)
				return reject(new AddressDuplicatedError(args))
			
			$.get('config/network/' + args + '/manifest.json', function(serverInfo) {
				logged = false
				serverDatabase = serverInfo
				kernel.getDatabases()
			})
			.done(function(){
				resolve(setHeader('Connection successful'))
			})
			.fail(function(){
				reject(new AddressNotFoundError(args))
			})
		})
	}
}

/**
 * The custom software caller.
 * 
 * This will look for custom softwares installed at the `software` folder.
 * 
 * @param {String} app The software name
 * @param {String} args Args to be handle if any
 */
var software = function(app, args) {
	return new Promise(function(resolve, reject) {

		appName = app.split('.')[0]
		appFiletype = app.split('.')[1]

		$.get('config/software/' + appName + '.json', function(softwareInfo) {

				if (
					appFiletype == softwareInfo.filetype &&
					(softwareInfo.location.includes(serverDatabase.serverAddress) || softwareInfo.location.includes("all")) &&
					(!softwareInfo.protection || softwareInfo.protection.includes(userDatabase.userId))
				)
					resolve(softwareInfo.message)
				
				else
					reject(new CommandNotFoundError(app))
				
			})
			.fail(function() {
				reject(new CommandNotFoundError(app))
			})

	})
}