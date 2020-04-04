var cmdLine_;
var output_;

  /**
   * Cross-browser impl to get document's height.
   * 
   * This function is necessary to auto-scroll to the end of page after each terminal command.
   */
  function getDocHeight_() {
    var d = document;
    return Math.max(
        Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
        Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
        Math.max(d.body.clientHeight, d.documentElement.clientHeight)
    );
  }
function newLine(object = cmdLine_) {
    window.scrollTo(0, getDocHeight_());
    object.value = ''; // Clear/setup line for next input.
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
    return new Promise(function(resolve, reject){

        if (typeof(data) == 'object'){
            $.each(data, function(index, value) {
                output_.insertAdjacentHTML('beforeEnd', '<p>' + value + '</p>');
            })
        }
        if (typeof(data) == 'string'){
            output_.insertAdjacentHTML('beforeEnd', '<p>' + data + '</p>');
        }
        resolve(newLine())

    })
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

// A list of terminal implemented functions (to show in help)
var CMDS_;
var date;

var kernel = function(app, args){

    // if (app.substr(-4) == ".exe") {
    //     return(software[app.split('.')[0]](args))
    // }
    if (app.indexOf('.') != -1) {
        return(software(app, args))
    }
    else {
        return(system[app](args))
    }
}

kernel.init = function(cmdLineContainer, outputContainer, definedDate) {
    return new Promise(function(resolve, reject) {
        cmdLine_ = document.querySelector(cmdLineContainer);
        output_ = document.querySelector(outputContainer);
        date = date;
        
        CMDS_ = [
            'clear', 'date', 'echo', 'help', 'login', 'mail', 'read', 'ping', 'telnet'
          ];
    
        $.when(
            $.get('config/database.json', function(list){
                userList = list
            }),
            $.get('config/network.json', function(networkList){
                networkDatabase = networkList
            }),
            $.get('config/software.json', function(softwareList){
                softwareDatabase = softwareList
            })
        ).then(function() {
            resolve(true)
        })
    })
}

var system = {
    foo: function(){
        // return "bar"
        return new Promise(function(resolve, reject) {
            resolve("bar")
        })
    },

    clear: function(){
        return new Promise(function(resolve, reject) {
            output_.innerHTML = ''
            cmdLine_.value = ''
            resolve(false)
        })
    },

    date: function(){
        return new Promise(function(resolve, reject) {
            resolve(String(date))
        })
    },

    echo: function(args){
        return new Promise(function(resolve, reject) {
            resolve(args.join(' '))
        })
    },

    help: function(args){
        return new Promise(function(resolve, reject) {
            if (args == ''){
                resolve([
                    `You can read the help of a specific command by entering as follows: 'help commandName'`,
                    `List of useful commands:`,
                    '<div class="ls-files">' + CMDS_.join('<br>') + '</div>'
                ])
            }
            if (args[0] == 'clear'){
                resolve([
                    `Usage:`,
                    `> clear`,
                    `The clear command will completely wipeout the entire screen, but it will not affect the history or whatever have been made into the terminal.`
                ])
            }
            if (args[0] == 'echo'){
                resolve([
                    `Usage:`,
                    `> echo args`,
                    `The echo command will print args into terminal.`
                ])
            }
            if (args[0] == 'login'){
                resolve([
                    `Usage:`,
                    `> login username@password`,
                    `If you're a registered user into the server, you can login to access your data files and messages.`
                ])
            }
            if (args[0] == 'read'){
                resolve([
                    `Usage:`,
                    `> read x`,
                    `If you're logged in you can read your mail messages if any.`
                ])
            }
            if (args[0] == 'telnet'){
                resolve([
                    `Usage:`,
                    `> telnet address`,
                    `> telnet address@password`,
                    `You can connect to a valid address to access a specific server if the server is at internet.`,
                    `Intranet servers can only be accessed locally.`,
                    `You may need a password if it isn't a public server.`
                ])
            }
            if (args[0] == 'date'){
                resolve([
                    `Usage:`,
                    `> date`,
                    `The date command will print the current date-time into terminal.`
                ])
            }
            if (args[0] == 'help'){
                resolve([
                    `Usage:`,
                    `> help`,
                    `The default help message.`,
                    `It will show some of the available commands in a server.`,
                    `Note that some existent commands may not have been show at help message.`
                ])
            }
            if (args[0] == 'mail'){
                resolve([
                    `Usage:`,
                    `> mail`,
                    `If you're logged in you can list your mail messages if any.`
                ])
            }
            if (args[0] == 'ping'){
                resolve([
                    `Usage:`,
                    `> ping address`,
                    `The ping command will try to reach a valid address.`,
                    `If the ping doesn't return a valid response, the address may be incorrect, may not exist or can't be reached locally.`
                ])
            }
        })
    },
    
    login: function(args){
        var ans = []
        var userFound = false

        return new Promise(function(resolve, reject) {
            if ( args == "" ){
                throw new UsernameIsEmptyError
            }
            args = args[0].split('@')
            $.each(userList, function(index, value){
                if (args[0] == value.id && args[1] == value.password){
                    userFound = true
                    userDatabase = value;
                    logged = userDatabase.id;
                    output_.innerHTML = '';
                    ans.push(header)
                    ans.push('Login successful')
                    prompt_text = '[' + userDatabase.userName + '@' + serverDatabase.terminalID + '] > '
                    $('.prompt').html(prompt_text);
                }
            })
            if(!userFound){
                throw new UsernameIsEmptyError
            }
            resolve(ans)
        })
        
    },

    mail: function(){
        return new Promise(function(resolve, reject) { 
            if (!logged){
                resolve(`You need to login`)
            }
    
            var ans = []

            $.each(userDatabase.mail, function(index, mail){
                ans.push(`[` + index + `] ` + mail.title)
            })

            if (ans == ""){
                throw new MailServerIsEmptyError
            }
            resolve(ans)
        })
    },

    read: function(args){
        return new Promise(function(resolve, reject) {
            if (!logged){
                resolve(`You need to login`)
            }
            
            var ans = []

            readOption = false
            $.each(userDatabase.mail, function(index, mail){
                if (args[0] == index) {
                    readOption = true
                    ans.push(`---------------------------------------------`)
                    ans.push(`From: ` + mail.from)
                    ans.push(`To: ` + userDatabase.id + `@` + serverDatabase.terminalID)
                    ans.push(`---------------------------------------------`)
                    
                    $.each(mail.body.split("  "), function(i, b){
                        ans.push(b)
                    })
                }
            })
    
            if (!readOption) {
                ans.push(`Invalid message key`)
            }

            resolve(ans)
        })
    },

    ping: function(args){
        return new Promise(function(resolve, reject) {
            if (args == "") {
                throw new AddressIsEmptyError
            }

            serverFound = false
            $.each(networkDatabase, function(index, value) {
                if (value.serverAddress == args){
                    serverFound = true
                    resolve(`Server ` + value.serverAddress + ` (` + value.serverName + `) can be reached`)
                }
            })

            if (!serverFound)
                throw new AddressNotFoundError(args)
        })
    },

    telnet: function(args){
        return new Promise(function(resolve, reject) {
            if (args == "") {
                throw new AddressIsEmptyError
            }

            ans = []
            serverFound = false
            $.each(networkDatabase, function(index, value) {
                if (value.serverAddress == args){
                    serverFound = true
                    logged = false  // Lost email access if previous login
                    serverDatabase = value
                    userList = serverDatabase.userList
                    // serverFiles = value.serverFiles

                    // Setting correct header icon and terminal name
                    if (serverDatabase.randomSeed) {
                        prompt_text = '[' + serverDatabase.defaultUser + date.getTime() + '@' + serverDatabase.terminalID + '] # '
                    }
                    else {
                        prompt_text = '[' + serverDatabase.defaultUser  + '@' + serverDatabase.terminalID + '] # '
                    }
                    header = `
                    <img align="left" src="icon/` + serverDatabase.iconName + `" width="100" height="100" style="padding: 0px 10px 20px 0px">
                    <h2 style="letter-spacing: 4px">` + serverDatabase.serverName + `</h2>
                    <p>Logged in: ` + serverDatabase.serverAddress + ` ( ` + date_final + ` ) </p>
                    <p>Enter "help" for more information.</p>
                    `
                    ans.push(header)
                    ans.push('Login successful')
                    
                    system.clear()
                    $('.prompt').html(prompt_text);

                    resolve(ans)
                }
            })

            if (!serverFound)
                throw new AddressNotFoundError(args)
        })
    }
}

var software =  function(app, args){
    return new Promise(function(resolve, reject) {
        message = false
        try {
            args = app.split('.')
            $.each(softwareDatabase, function(index, value){
                if (args[0] == value.name && args[1] == value.filetype){
                    program = value.name
                    filetype = value.filetype
                    delayed = value.delayed
                    message = value.message
                }
            })
            if (!message)
                reject(new CommandNotFoundError(app))
        }
        finally{
            if (message && delayed) {
                // resolve({"delayed": true, "message": message})
                resolve(message)
            }
            else {
                resolve(message)
            }
        }
    })
}
