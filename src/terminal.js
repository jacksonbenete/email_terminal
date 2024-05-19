/**
 * Internal logic of terminal.
 *
 * Base code created by @AndrewBarfield, further development by @jacksonbenete & @Lucas-C.
 * This should contain all the basic code for the terminal behavior.
 */
const UP_ARROW_KEYCODE = 38;
const DOWN_ARROW_KEYCODE = 40;

let history_ = [];
let histpos_ = 0;

function Terminal() {
    loadHistoryFromLocalStorage();
    addCmdLineListeners();

    function addCmdLineListeners() {
        cmdLine_.addEventListener( "keydown", historyHandler_ );
        cmdLine_.addEventListener( "keydown", processNewCommand_ );
        cmdLine_.addEventListener( "keydown", tabSuggestionHandler_ );
    }

    function removeCmdLineListeners() {
        cmdLine_.removeEventListener( "keydown", historyHandler_ );
        cmdLine_.removeEventListener( "keydown", processNewCommand_ );
        cmdLine_.removeEventListener( "keydown", tabSuggestionHandler_ );
    }

    /**
     * A function for a `history` function implementation.
     *
     * You can navigate by pressing the up and down arrow for see or repeat previous commands.
     *
     * @param {Event} e
     */
    function historyHandler_( e ) {
        if ( history_.length === 0 || ( e.keyCode !== UP_ARROW_KEYCODE && e.keyCode !== DOWN_ARROW_KEYCODE ) ) {
            return;
        }
        let histTemp = 0;
        if ( history_[ histpos_ ] ) {
            history_[ histpos_ ] = this.value;
        } else {
            histTemp = this.value;
        }
        if ( e.keyCode === UP_ARROW_KEYCODE ) {
            histpos_--;
            if ( histpos_ < 0 ) {
                histpos_ = 0;
            }
        } else if ( e.keyCode === DOWN_ARROW_KEYCODE ) {
            histpos_++;
            // This avoid to repeat the history from the beggining
            if ( histpos_ > history_.length ) {
                histpos_ = history_.length;
            }
        }
        this.value = history_[ histpos_ ] ? history_[ histpos_ ] : histTemp;
        // Trick to move cursor to end of input, cf. https://stackoverflow.com/a/10576409/636849
        setTimeout( () => {
            /* eslint-disable-next-line no-multi-assign */
            this.selectionStart = this.selectionEnd = 10000;
        }, 10 );
    }

    /**
     * Prevents the `tab` key to lose/change focus.
     *
     * @param {Event} e
     */
    function tabSuggestionHandler_( e ) {
        if ( e.keyCode === 9 ) {
            e.preventDefault();
            const commands = Object.keys( system ).filter( ( cmd ) => cmd !== "dumpdb" );
            const programs = allowedSoftwares();
            Array.prototype.push.apply( commands, Object.keys( programs ).filter( ( pName ) => !programs[ pName ].secretCommand ) );
            const matchingProgNames = commands.filter( ( progName ) => progName.startsWith( this.value ) );
            if ( matchingProgNames.length === 0 ) {
                return;
            }
            // We determine the longest common shared prefix among all matching commands:
            const minProgNameLength = Math.min( ...matchingProgNames.map( ( progName ) => progName.length ) );
            let sharedPrefix = "";
            for ( let i = 0; i < minProgNameLength; i++ ) {
                const letter = matchingProgNames[ 0 ][ i ];
                if ( !matchingProgNames.every( ( progName ) => progName[ i ] === letter ) ) {
                    break;
                }
                sharedPrefix += letter;
            }
            this.value = sharedPrefix;
        }
    }

    /**
     * The main function to process commands.
     *
     * This is a switch-case to deal with the internal logic.
     *
     * @param {Event} e
     */
    function processNewCommand_( e ) {
        if ( e.keyCode === 13 && this.value && this.value.trim() ) {
            // Save shell history but avoids duplicates:
            if ( history_.length === 0 || history_[ history_.length - 1 ].trim() !== this.value.trim() ) {
                history_[ history_.length ] = this.value;
                histpos_ = history_.length;
                saveHistoryToLocalStorage();
            }
            // Duplicate current input and append to output section.
            const line = this.parentNode.parentNode.cloneNode( true );
            line.removeAttribute( "id" );
            line.classList.add( "line" );
            const input = line.querySelector( "input.cmdline" );
            input.autofocus = false;
            input.readOnly = true;
            output_.appendChild( line );

            // Parsing Terminal arguments as `args`
            let args = this.value.split( " " ).filter( ( val ) => val );
            const cmd = args[ 0 ].toLowerCase();
            args = args.splice( 1 ); // Remove cmd from arg list.

            /**
             * The kernel function is at src/softwares.js
             *
             * If need to know more about Promises, read the following:
             * https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call
             */
            try {
                kernel( cmd, args )
                    .then( ( result ) => {
                        output( result );
                    } )
                    .catch( ( error ) => {
                        if ( error instanceof FunctionalError ) { // eslint-disable-line no-undef
                            output( error.message );
                        } else { // untyped = unexpected error
                            console.exception( error );
                            output( `kernel failure - ${ error.constructor.name }: ${ error.message }` );
                        }
                    } );
            } catch ( error ) {
                // If the user enter a empty line, it will just ignore and output a new line
                if ( !cmd ) {
                    output();
                    return;
                }
                output( `${ cmd }: command not found` );
            }
        }
    }

    /**
     * Load the commands history from localStorage, or else from `initialHistory` if provided.
     * Sets the global variables `history_` & `histpos_`
     *
     * @param {Array} initialHistory optional initial list of comamnd strings
     */
    function loadHistoryFromLocalStorage( initialHistory ) {
        const historyStr = localStorage.getItem( `history_${ serverDatabase.serverAddress }_${ userDatabase.userId }`, history_.join( "\n" ) );
        if ( historyStr ) {
            history_ = historyStr.split( "\n" );
        } else if ( initialHistory ) {
            const userInitialHistory = initialHistory[ userDatabase.userId ];
            history_ = userInitialHistory || [];
        } else {
            history_ = [];
        }
        histpos_ = history_.length;
    }

    /**
     * Dump the current user commands history to localStorage.
     */
    function saveHistoryToLocalStorage() {
        localStorage.setItem( `history_${ serverDatabase.serverAddress }_${ userDatabase.userId }`, history_.join( "\n" ) );
    }

    /**
     * This will automatically output the header when the object initialize (constructor?).
     */
    return {
        addCmdLineListeners,
        removeCmdLineListeners,
        loadHistoryFromLocalStorage,
        output
    };
}

/**
 * The `Document.ready` function to initialize everything.
 */
$( () => {
    // Initializing Terminal Object
    kernel.init( "#input-line .cmdline", "#container output" )
        .then( () => {
            term = new Terminal();
        } );
} );
