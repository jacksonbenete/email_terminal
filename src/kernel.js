// Global scope variables
let serverDatabase = {};
let userDatabase = {};
let userList = [];
let mailList = [];
let cmdLine_;
let output_;
let serverDate = {day: "", month: "", year: "", reference: ""};

function initDateObject() {
  const date = new Date();
  let day = serverDatabase.day ? serverDatabase.day : date.getDate();
  let month = serverDatabase.month ? serverDatabase.month : date.getMonth() + 1;
  let year = serverDatabase.year ? serverDatabase.year : date.getFullYear();
  let reference = serverDatabase.reference ? serverDatabase.reference : "(Solar System Standard Time)"
  serverDate = {day: day, month: month, year: year, reference: reference}
}

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
function setHeader( msg = "⠀" ) {
    // Setting correct header icon and terminal name
    const promptText = `[${ userDatabase.userName }@${ serverDatabase.terminalID }] # `;

    initDateObject()
    const dateStr = serverDate.day + "/" + serverDate.month + "/" + serverDate.year
    const header = `
    <img align="left" src="config/network/${ serverDatabase.serverAddress }/${ serverDatabase.iconName }" width="100" height="100" style="padding: 0px 10px 20px 0px">
    <h2 style="letter-spacing: 4px">${ serverDatabase.serverName }</h2>
    <p>Logged in: ${ serverDatabase.serverAddress } ( ${ dateStr } ) </p>
    <p>Enter "help" for more information.</p>
    `;
    // Clear content:
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
 * Display content as terminal output.
 *
 * @param {String} data The string to be returned as a print in terminal
 * @param {Array} data The array to be returned as a print in terminal
 */
function output( data ) {
    return new Promise( ( resolve ) => {
        let delayed = 0;

        if ( data && data.constructor === Object ) {
            delayed = data.delayed;
            data = data.text;
        }

        if ( data && data.constructor === Array ) {
            if ( delayed && data.length > 0 ) {
                outputLinesWithDelay( data, delayed, () => resolve( newLine() ) );
                return;
            }
            $.each( data, ( _, value ) => {
                printLine( value );
            } );
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
function outputLinesWithDelay( lines, delayed, resolve ) {
    const line = lines.shift();
    printLine( line );
    if ( lines.length > 0 ) {
        setTimeout( outputLinesWithDelay, delayed, lines, resolve, delayed );
    } else if ( resolve ) {
        resolve();
    }
}

/**
 * Display some text, or an image, on a new line.
 *
 * @param {String} data text to display
 * @param {Object} data information on what to display
 */
function printLine( data ) {
    if ( !data.startsWith( "<" ) ) {
        data = `<p>${ data }</p>`;
    }
    output_.insertAdjacentHTML( "beforeEnd", data );
    const elemInserted = output_.lastChild;
    if ( elemInserted.classList ) { // can be undefined if elemInserted is just Text, not an HTMLElement
        if ( elemInserted.classList.contains( "glitch" ) ) {
            glitchImage( elemInserted );
        }
        if ( elemInserted.classList.contains( "particle" ) ) {
            particleImage( elemInserted );
        }
        if ( elemInserted.classList.contains( "hack-reveal" ) ) {
            hackRevealText( elemInserted, elemInserted.dataset );
        }
    }
    const text = elemInserted.textContent.trim();
    if ( elemInserted.dataset && text ) { // can be undefined if elemInserted is just Text, not an HTMLElement
        elemInserted.dataset.text = text; // needed for "desync" effect
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
    const systemApp = system[ app ] || system[ app.replace( ".", "_" ) ];
    if ( systemApp ) {
        return systemApp( args );
    }
    return software( app, args );
}

/**
 * Attempts to connect to a server.
 * If successful, sets global variables serverDatabase / userDatabase / userList / mailList
 */
kernel.connectToServer = function connectToServer( serverAddress, userName, passwd ) {
    return new Promise( ( resolve, reject ) => {
        if ( serverAddress === serverDatabase.serverAddress ) {
            reject( new AlreadyOnServerError( serverAddress ) );
            return;
        }
        $.get( `config/network/${ serverAddress }/manifest.json`, ( serverInfo ) => {
            if ( !userName && serverInfo.defaultUser ) {
                serverDatabase = serverInfo;
                userDatabase = serverInfo.defaultUser;
                $.get( `config/network/${ serverInfo.serverAddress }/userlist.json`, ( users ) => {
                    userList = users;
                } );
                $.get( `config/network/${ serverInfo.serverAddress }/mailserver.json`, ( mails ) => {
                    mailList = mails;
                } );
                setHeader( "Connection successful" );
                resolve();
            } else if ( userName ) {
                $.get( `config/network/${ serverInfo.serverAddress }/userlist.json`, ( users ) => {
                    const matchingUser = users.find( ( user ) => user.userId === userName );
                    if ( !matchingUser ) {
                        reject( new UnknownUserError( userName ) );
                        return;
                    }
                    if ( matchingUser.password && matchingUser.password !== passwd ) {
                        reject( new InvalidPasswordError( userName ) );
                        return;
                    }
                    serverDatabase = serverInfo;
                    userDatabase = matchingUser;
                    userList = users;
                    $.get( `config/network/${ serverInfo.serverAddress }/mailserver.json`, ( mails ) => {
                        mailList = mails;
                    } );
                    setHeader( "Connection successful" );
                    resolve();
                } ).fail( () => {
                    reject( new AddressNotFoundError( serverAddress ) );
                } );
            } else {
                reject( new ServerRequireUsernameError( serverAddress ) );
            }
        } ).fail( () => {
            reject( new AddressNotFoundError( serverAddress ) );
        } );
    } );
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
    return new Promise( ( resolve, reject ) => {
        cmdLine_ = document.querySelector( cmdLineContainer );
        output_ = document.querySelector( outputContainer );

        $.when(
            $.get( "config/software.json", ( softwareData ) => {
                softwareInfo = softwareData;
            } ),
            kernel.connectToServer( "localhost" )
        )
            .done( () => {
                resolve( true );
            } )
            .fail( ( err, msg, details ) => {
                console.error( err, msg, details );
                reject( new JsonFetchParseError( msg ) );
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
            let date = new Date();
            let time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
            resolve( String( serverDate.month + " " + serverDate.day + " " + serverDate.year + " " + time + " " + serverDate.reference ) );
        } );
    },

    echo( args ) {
        return new Promise( ( resolve ) => {
            resolve( args.join( " " ) );
        } );
    },

    help( args ) {
        return new Promise( ( resolve ) => {
            const programs = allowedSoftwares();
            if ( args.length === 0 ) {
                const commands = Object.keys( system ).filter( ( cmd ) => cmd !== "dumpdb" );
                Array.prototype.push.apply( commands, Object.keys( programs ).filter( ( pName ) => !programs[ pName ].secretCommand ) );
                commands.sort();
                resolve( [
                    "You can read the help of a specific command by entering as follows: 'help commandName'",
                    "List of useful commands:",
                    `<div class="ls-files">${ commands.join( "<br>" ) }</div>`,
                    "You can navigate in the commands usage history using the UP & DOWN arrow keys.",
                    "The TAB key will provide command auto-completion."
                ] );
            } else if ( args[ 0 ] === "clear" ) {
                resolve( [ "Usage:", "> clear", "The clear command will completely wipeout the entire screen, but it will not affect the history." ] );
            } else if ( args[ 0 ] === "date" ) {
                resolve( [ "Usage:", "> date", "The date command will print the current date-time into terminal." ] );
            } else if ( args[ 0 ] === "echo" ) {
                resolve( [ "Usage:", "> echo args", "The echo command will print args into terminal." ] );
            } else if ( args[ 0 ] === "help" ) {
                resolve( [ "Usage:", "> help", "The default help message. It will show some of the available commands in a server." ] );
            } else if ( args[ 0 ] === "login" ) {
                resolve( [ "Usage:", "> login username:password", "Switch account: log in as another registered user on the server, to access your data files and messages." ] );
            } else if ( args[ 0 ] === "mail" ) {
                resolve( [ "Usage:", "> mail", "If you're logged in you can list your mail messages if any." ] );
            } else if ( args[ 0 ] === "ping" ) {
                resolve( [
                    "Usage:",
                    "> ping address",
                    "The ping command will try to reach a valid address.",
                    "If the ping doesn't return a valid response, the address may be incorrect, may not exist or can't be reached locally."
                ] );
            } else if ( args[ 0 ] === "read" ) {
                resolve( [ "Usage:", "> read x", "If you're logged in you can read your mail messages if any." ] );
            } else if ( args[ 0 ] === "ssh" ) {
                resolve( [
                    "Usage:",
                    "> ssh address",
                    "> ssh username@address",
                    "> ssh username:password@address",
                    "You can connect to a valid address to access a specific server on the Internet.",
                    "You may need to specify a username if the server has no default user.",
                    "You may need to specify a password if the user account is protected."
                ] );
            } else if ( args[ 0 ] === "whoami" ) {
                resolve( [ "Usage:", "> whoami", "Display the server you are currently connected to, and the login you are registered with." ] );
            } else if ( args[ 0 ] in softwareInfo ) {
                const customProgram = programs[ args[ 0 ] ];
                if ( customProgram.help ) {
                    resolve( [ "Usage:", `> ${ args[ 0 ] }`, customProgram.help ] );
                }
            } else if ( args[ 0 ] in system && args[ 0 ] !== "dumpdb" ) {
                console.error( `Missing help message for system command: ${ args[ 0 ] }` );
            } else {
                resolve( [ `Unknow command ${ args[ 0 ] }` ] );
            }
        } );
    },

    login( args ) {
        return new Promise( ( resolve, reject ) => {
            if ( !args ) {
                reject( new UsernameIsEmptyError() );
                return;
            }
            let userName = "";
            let passwd = "";
            try {
                [ userName, passwd ] = userPasswordFrom( args[ 0 ] );
            } catch ( error ) {
                reject( error );
                return;
            }
            if ( !userName ) {
                reject( new UsernameIsEmptyError() );
                return;
            }
            const matchingUser = userList.find( ( user ) => user.userId === userName );
            if ( !matchingUser ) {
                reject( new UnknownUserError() );
                return;
            }
            if ( matchingUser.password && matchingUser.password !== passwd ) {
                reject( new InvalidPasswordError( userName ) );
                return;
            }
            userDatabase = matchingUser;
            setHeader( "Login successful" );
            resolve();
        } );
    },

    logout() {
        return new Promise( () => {
            location.reload();
        } );
    },

    exit() {
        return new Promise( () => {
            location.reload();
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

    telnet() {
        return new Promise( ( _, reject ) => {
            reject( new Error( "telnet is unsecure and is deprecated - use ssh instead" ) );
        } );
    },

    ssh( args ) {
        return new Promise( ( resolve, reject ) => {
            if ( args === "" ) {
                reject( new AddressIsEmptyError() );
                return;
            }
            let userName = "";
            let passwd = "";
            let serverAddress = args[ 0 ];
            if ( serverAddress.includes( "@" ) ) {
                const splitted = serverAddress.split( "@" );
                if ( splitted.length !== 2 ) {
                    reject( new InvalidCommandParameter( "ssh" ) );
                    return;
                }
                serverAddress = splitted[ 1 ];
                try {
                    [ userName, passwd ] = userPasswordFrom( splitted[ 0 ] );
                } catch ( error ) {
                    reject( error );
                    return;
                }
            }
            kernel.connectToServer( serverAddress, userName, passwd ).then( resolve ).catch( reject );
        } );
    }
};

function userPasswordFrom( creds ) {
    if ( !creds.includes( ":" ) ) {
        return [ creds, "" ];
    }
    const splitted = creds.split( ":" );
    if ( splitted.length !== 2 ) {
        throw new InvalidCredsSyntaxError();
    }
    return splitted;
}

/**
 * The custom software caller.
 *
 * This will look for custom softwares from `software.json`.
 *
 * @param {String} progName The software name
 * @param {String} args Args to be handled if any
 */
function software( progName, args ) {
    return new Promise( ( resolve, reject ) => {
        const program = allowedSoftwares()[ progName ];
        if ( program ) {
            if ( program.clear ) {
                system.clear().then( runSoftware( progName, program, args ).then( resolve, reject ) );
            } else {
                runSoftware( progName, program, args ).then( resolve, reject );
            }
        } else {
            reject( new CommandNotFoundError( progName ) );
        }
    } );
}

/**
 * Run the specified program
 *
 * @param {String} progName The software name
 * @param {Object} program Command definition from sofwtare.json
 * @param {String} args Args to be handled if any
 */
function runSoftware( progName, program, args ) {
    return new Promise( ( resolve ) => {
        let msg;
        if ( program.message ) {
            msg = { text: program.message, delayed: program.delayed };
        } else {
            msg = window[ progName ]( args );
            if ( msg.constructor === Object ) {
                if ( !msg.onInput ) {
                    throw new Error( "An onInput callback must be defined!" );
                }
                if ( msg.message ) {
                    output( msg.message );
                }
                readPrompt( msg.prompt || ">" ).then( ( input ) => msg.onInput( input ) )
                    .then( ( finalMsg ) => resolve( finalMsg ) );
                return;
            }
        }
        resolve( msg );
    } );
}

/**
 * Read user input
 *
 * @param {String} promptText The text prefix to display before the <input> prompt
 */
function readPrompt( promptText ) {
    return new Promise( ( resolve ) => {
        const prevPromptText = $( "#input-line .prompt" ).text();
        $( "#input-line .prompt" ).text( promptText );
        term.removeCmdLineListeners();
        cmdLine_.addEventListener( "keydown", promptSubmitted );
        function promptSubmitted( e ) {
            if ( e.keyCode === 13 ) {
                cmdLine_.removeEventListener( "keydown", promptSubmitted );
                term.addCmdLineListeners();
                $( "#input-line .prompt" ).text( prevPromptText );
                resolve( this.value.trim() );
            }
        }
    } );
}

/**
 * List only details about programs the current user has access on the current server.
 */
function allowedSoftwares() {
    const softwares = {};
    for ( const app in softwareInfo ) {
        const program = softwareInfo[ app ];
        if (
            ( !program.location || program.location.includes( serverDatabase.serverAddress ) ) &&
            ( !program.protection || program.protection.includes( userDatabase.userId ) )
        ) {
            softwares[ app ] = program;
        }
    }
    return softwares;
}

/*
 * Wrapper to easily define sofwtare programs that act as dweets.
 * Reference code: https://github.com/lionleaf/dwitter/blob/master/dwitter/templates/dweet/dweet.html#L250
 * Notable difference with https://dwitter.net : default canvas dimensions are width=200 & height=200
 * There are usage examples in config/software.js
 */
const FPS = 60;
const epsilon = 1.5;
/* eslint-disable no-unused-vars */
const C = Math.cos;
const S = Math.sin;
const T = Math.tan;

function dweet( u, width, height ) {
    width = width || 200;
    height = height || 200;
    const id = Date.now().toString( 36 );
    let frame = 0;
    let nextFrameMs = 0;
    function loop( frameTime ) {
        frameTime = frameTime || 0;
        const c = document.getElementById( id );
        if ( !c ) {
            return;
        }
        requestAnimationFrame( loop );
        if ( frameTime < nextFrameMs - epsilon ) {
            return; // Skip this cycle as we are animating too quickly.
        }
        nextFrameMs = Math.max( nextFrameMs + 1000 / FPS, frameTime );
        let time = frame / FPS;
        if ( time * FPS | frame - 1 === 0 ) {
            time += 0.000001;
        }
        frame++;
        const x = c.getContext( "2d" );
        x.fillStyle = "white";
        x.strokeStyle = "white";
        x.beginPath();
        x.resetTransform();
        x.clearRect( 0, 0, width, height ); // clear canvas
        u( time, x, c );
    }
    setTimeout( loop, 50 ); // Small delay to let time for the canvas to be inserted
    return `<canvas id="${ id }" width="${ width }" height="${ height }">`;
}

function R( r, g, b, a ) {
    a = typeof a === "undefined" ? 1 : a;
    return `rgba(${ r | 0 },${ g | 0 },${ b | 0 },${ a })`;
}
