// Global scope variables
let logged = false;
let serverDatabase = {};
let userDatabase = {};
let userList = [];
let mailList = [];
let cmdLine_;
let output_;

function debugObject( obj ) {
    for ( const property in obj ) {
        console.log( `${ property }: ${ JSON.stringify( obj[ property ] ) }` );
        output( `${ property }: ${ JSON.stringify( obj[ property ] ) }` );
    }
}

/**
 * Set Header and Prompt informations.
 *
 * This function is useful to avoid code repetition.
 *
 * @param {String} msg A message to be showed when done
 */
function setHeader( msg = "" ) {
    // Setting correct header icon and terminal name
    const date = new Date();
    let promptText = "";
    if ( serverDatabase.randomSeed && !logged ) {
        promptText = `[${ userDatabase.userName }${ date.getTime() }@${ serverDatabase.terminalID }] # `;
    } else {
        promptText = `[${ userDatabase.userName }@${ serverDatabase.terminalID }] # `;
    }

    const dateStr = `${ date.getDay() }/${ date.getMonth() }/${ serverDatabase.year }`;
    const header = `
    <img align="left" src="config/network/${ serverDatabase.serverAddress }/${ serverDatabase.iconName }" width="100" height="100" style="padding: 0px 10px 20px 0px">
    <h2 style="letter-spacing: 4px">${ serverDatabase.serverName }</h2>
    <p>Logged in: ${ serverDatabase.serverAddress } ( ${ dateStr } ) </p>
    <p>Enter "help" for more information.</p>
    `;
    output_.innerHTML = "";
    cmdLine_.value = "";
    if ( term ) {
        term.loadHistoryFromLocalStorage( serverDatabase.initialHistory );
    }
    output( [ header, msg ] );
    $( ".prompt" ).html( promptText );
}

/**
 * Cross-browser impl to get document's height.
 *
 * This function is necessary to auto-scroll to the end of page after each terminal command.
 */
function getDocHeight_() {
    const doc = document;
    return Math.max(
        Math.max( doc.body.scrollHeight, doc.documentElement.scrollHeight ),
        Math.max( doc.body.offsetHeight, doc.documentElement.offsetHeight ),
        Math.max( doc.body.clientHeight, doc.documentElement.clientHeight )
    );
}

/**
 * Scroll to bottom and clear the input value for a new line.
 */
function newLine() {
    window.scrollTo( 0, getDocHeight_() );
    cmdLine_.value = ""; // Clear/setup line for next input.
}

/**
 * A function to padronize every output/return as a terminal print/echo function.
 *
 * The output function now can handle both String and Array objects.
 *
 * @param {String} data The string to be returned as a print in terminal
 * @param {Object} data The array to be returned as a print in terminal
 */
function output( data ) {
    return new Promise( ( resolve ) => {
        let delayed = 0;

        if ( typeof( data ) === "object" && data.text ) {
            delayed = data.delayed;
            data = data.text;
        }

        if ( typeof( data ) === "object" ) {
            if ( delayed && data.length > 0 ) {
                outputLinesWithDelay( data, delayed );
            } else {
                $.each( data, ( _, value ) => {
                    printLine( value );
                } );
            }
        } else if ( data ) {
            printLine( data );
        }
        resolve( newLine() );
    } );
}

/**
 * Print lines of content with some delay between them.
 *
 * @param {Array} lines list of content to display
 * @param {Number} delayed delay in milliseconds between which to display lines
 */
function outputLinesWithDelay( lines, delayed ) {
    const line = lines.shift();
    printLine( line );
    if ( lines.length > 0 ) {
        setTimeout( outputLinesWithDelay, delayed, lines, delayed );
    }
}

/**
 * Display some text, or an image, on a new line.
 *
 * @param {String} data text to display
 * @param {Object} data information on what to display
 */
function printLine( data ) {
    if ( typeof( data ) === "object" ) {
        if ( data.type === "img" ) {
            const attributesAsTring = Object.keys( data ).map( ( key ) => `${ key }="${ data[ key ] }"` ).join( " " );
            output_.insertAdjacentHTML( "beforeEnd", `<img ${ attributesAsTring }>` );
        }
    } else {
        output_.insertAdjacentHTML( "beforeEnd", `<p>${ data }</p>` );
    }
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
function kernel( app, args ) {
    if ( system[ app ] ) {
        return ( system[ app ]( args ) );
    } else if ( system[ app.replace( ".", "_" ) ] ) {
        return ( system[ app.replace( ".", "_" ) ]( args ) );
    }

    return ( software( app, args ) );
}

/**
 * Recover the correct databases for the current server.
 *
 * Some functions like `system.telnet()` needs to rewrite the databases variables.
 */
kernel.getDatabases = function getDatabases() {
    userDatabase = serverDatabase.defaultUser;
    $.when(
        $.get( `config/network/${ serverDatabase.serverAddress }/userlist.json`, ( list ) => {
            userList = list;
        } ),
        $.get( `config/network/${ serverDatabase.serverAddress }/mailserver.json`, ( list ) => {
            mailList = list;
        } )
    ).then( () => ( true ) );
};

/**
 * This will initialize the kernel function.
 *
 * It will define the help functions, set some important variables and connect the databases.
 *
 * @param {Object} cmdLineContainer The Input.cmdline right of the div.prompt
 * @param {Object} outputContainer The output element inside the div#container
 */
kernel.init = function init( cmdLineContainer, outputContainer ) {
    return new Promise( ( resolve ) => {
        cmdLine_ = document.querySelector( cmdLineContainer );
        output_ = document.querySelector( outputContainer );

        $.get( "config/network/localhost/manifest.json", ( configuration ) => {
            serverDatabase = configuration;
            kernel.getDatabases();
        } )
            .done( () => {
                resolve( true );
            } );
    } );
};

/**
 * Internal command functions.
 *
 * This is where the internal commands are located.
 * This should have every non-custom software command functions.
 */
system = {
    dumpdb() {
        return new Promise( () => {
            output( ":: serverDatabase - connected server information" );
            debugObject( serverDatabase );
            output( "----------" );
            output( ":: userDatabase - connected user information" );
            debugObject( userDatabase );
            output( "----------" );
            output( ":: userList - list of users registered in the connected server" );
            debugObject( userList );
        } );
    },

    whoami() {
        return new Promise( ( resolve ) => {
            resolve(
                `${ serverDatabase.serverAddress }/${ userDatabase.userId }`
            );
        } );
    },

    clear() {
        return new Promise( ( resolve ) => {
            setHeader();
            resolve( false );
        } );
    },

    date() {
        return new Promise( ( resolve ) => {
            resolve( String( new Date() ) );
        } );
    },

    echo( args ) {
        return new Promise( ( resolve ) => {
            resolve( args.join( " " ) );
        } );
    },

    help( args ) {
        return new Promise( ( resolve ) => {
            const COMMANDS = [ "clear", "date", "echo", "help", "login", "mail", "read", "ping", "telnet" ];
            if ( args.length === 0 ) {
                resolve( [ "You can read the help of a specific command by entering as follows: 'help commandName'", "List of useful commands:", `<div class="ls-files">${ COMMANDS.join( "<br>" ) }</div>` ] );
            }
            if ( args[ 0 ] === "clear" ) {
                resolve( [ "Usage:", "> clear", "The clear command will completely wipeout the entire screen, but it will not affect the history or whatever have been made into the terminal." ] );
            }
            if ( args[ 0 ] === "echo" ) {
                resolve( [ "Usage:", "> echo args", "The echo command will print args into terminal." ] );
            }
            if ( args[ 0 ] === "login" ) {
                resolve( [ "Usage:", "> login username@password", "If you're a registered user into the server, you can login to access your data files and messages." ] );
            }
            if ( args[ 0 ] === "read" ) {
                resolve( [ "Usage:", "> read x", "If you're logged in you can read your mail messages if any." ] );
            }
            if ( args[ 0 ] === "telnet" ) {
                resolve( [ "Usage:", "> telnet address", "> telnet address@password", "You can connect to a valid address to access a specific server if the server is at internet.", "Intranet servers can only be accessed locally.", "You may need a password if it isn't a public server." ] );
            }
            if ( args[ 0 ] === "date" ) {
                resolve( [ "Usage:", "> date", "The date command will print the current date-time into terminal." ] );
            }
            if ( args[ 0 ] === "help" ) {
                resolve( [ "Usage:", "> help", "The default help message.", "It will show some of the available commands in a server.", "Note that some existent commands may not have been show at help message." ] );
            }
            if ( args[ 0 ] === "mail" ) {
                resolve( [ "Usage:", "> mail", "If you're logged in you can list your mail messages if any." ] );
            }
            if ( args[ 0 ] === "ping" ) {
                resolve( [ "Usage:", "> ping address", "The ping command will try to reach a valid address.", "If the ping doesn't return a valid response, the address may be incorrect, may not exist or can't be reached locally." ] );
            }
        } );
    },

    login( args ) {
        let userFound = false;

        return new Promise( ( resolve, reject ) => {
            if ( args === "" ) {
                reject( new UsernameIsEmptyError() );
                return;
            }
            args = args[ 0 ].split( "@" );
            $.each( userList, ( _, value ) => {
                if ( args[ 0 ] === value.userId && args[ 1 ] === value.password ) {
                    userFound = true;
                    userDatabase = value;
                    logged = true;
                }
            } );
            if ( !userFound ) {
                reject( new UsernameIsEmptyError() );
                return;
            }

            setHeader( "Login successful" );
            resolve();
        } );
    },

    logout() {
        return new Promise( ( resolve, reject ) => {
            if ( !logged ) {
                reject( new LoginIsFalseError() );
                return;
            }

            logged = false;
            userDatabase = serverDatabase.defaultUser;
            setHeader( "Logout completed" );
            resolve();
        } );
    },

    mail() {
        return new Promise( ( resolve, reject ) => {
            const messageList = [];

            $.each( mailList, ( index, mail ) => {
                if ( mail.to.includes( userDatabase.userId ) ) {
                    messageList.push( `[${ index }] ${ mail.title }` );
                }
            } );

            if ( messageList === "" ) {
                reject( new MailServerIsEmptyError() );
                return;
            }

            resolve( messageList );
        } );
    },

    read( args ) {
        return new Promise( ( resolve, reject ) => {
            const message = [];

            let readOption = false;
            $.each( mailList, ( index, mail ) => {
                if ( mail.to.includes( userDatabase.userId ) && Number( args[ 0 ] ) === index ) {
                    readOption = true;
                    message.push( "---------------------------------------------" );
                    message.push( `From: ${ mail.from }` );
                    message.push( `To: ${ userDatabase.userId }@${ serverDatabase.terminalID }` );
                    message.push( "---------------------------------------------" );

                    $.each( mail.body.split( "  " ), ( _, line ) => {
                        message.push( line );
                    } );
                }
            } );

            if ( !readOption ) {
                reject( new InvalidMessageKeyError() );
                return;
            }

            resolve( message );
        } );
    },

    ping( args ) {
        return new Promise( ( resolve, reject ) => {
            if ( args === "" ) {
                reject( new AddressIsEmptyError() );
                return;
            }

            $.get( `config/network/${ args }/manifest.json`, ( serverInfo ) => {
                resolve( `Server ${ serverInfo.serverAddress } (${ serverInfo.serverName }) can be reached` );
            } )
                .fail( () => reject( new AddressNotFoundError( args ) ) );
        } );
    },

    telnet( args ) {
        return new Promise( ( resolve, reject ) => {
            if ( args === "" ) {
                reject( new AddressIsEmptyError() );
                return;
            }

            if ( args === serverDatabase.serverAddress ) {
                reject( new AddressDuplicatedError( args ) );
                return;
            }

            $.get( `config/network/${ args }/manifest.json`, ( serverInfo ) => {
                logged = false;
                serverDatabase = serverInfo;
                kernel.getDatabases();
            } )
                .done( () => {
                    setHeader( "Connection successful" );
                    resolve();
                } )
                .fail( () => {
                    reject( new AddressNotFoundError( args ) );
                } );
        } );
    }
};

/**
 * The custom software caller.
 *
 * This will look for custom softwares installed at the `software` folder.
 *
 * @param {String} app The software name
 * @param {String} args Args to be handle if any
 */
software = function software( app ) {
    return new Promise( ( resolve, reject ) => {
        const appName = app.split( "." )[ 0 ];
        const appFiletype = app.split( "." )[ 1 ];

        $.get( `config/software/${ appName }.json`, ( softwareInfo ) => {
            if (
                appFiletype === softwareInfo.filetype &&
                    ( softwareInfo.location.includes( serverDatabase.serverAddress ) || softwareInfo.location.includes( "all" ) ) &&
                    ( !softwareInfo.protection || softwareInfo.protection.includes( userDatabase.userId ) )
            ) {
                if ( softwareInfo.clear ) {
                    system.clear();
                }
                resolve( { text: softwareInfo.message, delayed: softwareInfo.delayed } );
            } else {
                reject( new CommandNotFoundError( app ) );
            }
        } )
            .fail( () => {
                reject( new CommandNotFoundError( app ) );
            } );
    } );
};
