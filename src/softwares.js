// import { CommandNotFoundError } from './error.js'
// import { AddressNotFoundError } from './error.js'
// import { AddressIsEmptyError } from './error.js'
// import * as Error from 'error.js'

var cmdLine_;
var output_;
/**
 * A function to padronize every output/return as a terminal print/echo function
 * 
 * @param {String} html The string to be returned as a print in terminal
 */
function output(html) {
    return new Promise(function(resolve, reject){
        output_.insertAdjacentHTML('beforeEnd', '<p>' + html + '</p>');
        resolve(true)
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

var connectionsDatabase;


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
    cmdLine_ = document.querySelector(cmdLineContainer);
    output_ = document.querySelector(outputContainer);
    date = date;
    
    CMDS_ = [
        'clear', 'date', 'echo', 'help', 'mail', 'read'
      ];

    $.ajax({
        url:"config/connections.json",
        dataType:"text",
        success:function(data)
        {
            connectionsDatabase = JSON.parse(data)
        }
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

    help: function(){
        return new Promise(function(resolve, reject) {
            resolve('<div class="ls-files">' + CMDS_.join('<br>') + '</div>')
        })
    },
    
    login: function(args){
        var ans = []

        return new Promise(function(resolve, reject) {
            $.ajax({
                url:"config/database.db",
                dataType:"text",
                success:function(data)
                {
                    database = JSON.parse(data)
                    try {
                        args = args[0].split('@')
                        $.each(database, function(index, value){
                            if (args[0] == value.id && args[1] == value.password){
                                logged = value.id;
                                userDatabase = value;
                                // userMailDatabase = value.mail;
                                output_.innerHTML = '';
                                ans.push(header)
                                ans.push('Login successful')
                                prompt_text = '[' + value.user + '@' + terminalID + '] > '
                                $('.prompt').html(prompt_text);
                            }
                        })
                    } catch (error) {
                    }
                    finally{
                        if(!logged){
                            ans.push(`This isn't a valid ID.`);
                            ans.push(`Try: login id@pass`);
                        }
                        resolve(ans)
                    }
                }
            });
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
                    ans.push(`To: ` + database.id + `@` + terminalID)
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
            $.each(connectionsDatabase, function(index, value) {
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
            $.each(connectionsDatabase, function(index, value) {
                if (value.serverAddress == args){
                    serverFound = true

                    serverAddress = value.serverAddress
                    serverName = value.serverName
                    iconName = value.iconName
                    terminalID = value.terminalID
                    defaultUser = value.defaultUser
                    randomSeed = value.randomSeed
                    // serverFiles = value.serverFiles

                    // Setting correct header icon and terminal name
                    if (conf.randomSeed) {
                        prompt_text = '[' + defaultUser + date.getTime() + '@' + terminalID + '] # '
                    }
                    else {
                        prompt_text = '[' + defaultUser  + '@' + terminalID + '] # '
                    }
                    header = `
                    <img align="left" src="icon/` + iconName + `" width="100" height="100" style="padding: 0px 10px 20px 0px">
                    <h2 style="letter-spacing: 4px">` + serverName + `</h2>
                    <p>Logged in: ` + serverAddress + ` ( ` + date.getUTCFullYear() + ` ) </p>
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
        $.ajax({
            url:"config/softwares.json",
            dataType:"text",
            success:function(data)
            {
                database = JSON.parse(data)
                message = false
                try {
                    args = app.split('.')
                    $.each(database, function(index, value){
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
            }
        });
    })
}
