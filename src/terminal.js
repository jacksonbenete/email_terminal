/**
 * Internal logic of terminal.
 *
 * Base code created by @AndrewBarfield, further development by @jacksonbenete.
 * This should contain all the basic code for the terminal behavior.
 *
 * @param {Container} cmdLineContainer  The div where the user will write into
 * @param {Container} outputContainer   The div where the terminal will return information at
 */
function Terminal() {
    window.URL = window.URL || window.webkitURL;
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    let history_ = [];
    let histpos_ = 0;
    let histtemp_ = 0;
    loadHistoryFromLocalStorage();

    // Recover focus on terminal
    window.addEventListener( "click", () => {
        cmdLine_.focus();
    }, false );

    cmdLine_.addEventListener( "keydown", historyHandler_, false );
    cmdLine_.addEventListener( "keydown", processNewCommand_, false );
    cmdLine_.addEventListener( "keydown", tabSuggestionHandler_, false );

    /**
     * A function for a `history` function implementation.
     *
     * You can navigate by pressing the up and down arrow for see or repeat previous commands.
     *
     * @todo I don't get why the "Up arrow" aren't setting the cursor to end of input
     *
     * @param {Event} e
     */
    function historyHandler_( e ) {
        if ( history_.length ) {
            if ( e.keyCode === 38 || e.keyCode === 40 ) {
                if ( history_[ histpos_ ] ) {
                    history_[ histpos_ ] = this.value;
                } else {
                    histtemp_ = this.value;
                }
            }

            if ( e.keyCode === 38 ) { // Up arrow
                histpos_--;
                if ( histpos_ < 0 ) {
                    histpos_ = 0;
                }
            } else if ( e.keyCode === 40 ) { // Down arrow
                histpos_++;

                // This avoid to repeat the history from the beggining
                if ( histpos_ > history_.length ) {
                    histpos_ = history_.length;
                }
            }

            if ( e.keyCode === 38 || e.keyCode === 40 ) {
                this.value = history_[ histpos_ ] ? history_[ histpos_ ] : histtemp_;
            }
        }
    }

    /**
     * Prevents the `tab` key to lose/change focus.
     *
     * @todo Implement tab suggestion
     *
     * @param {Event} e
     */
    function tabSuggestionHandler_( e ) {
        if ( e.keyCode === 9 ) {
            e.preventDefault();
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
                        output( error.message );
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
        init() {
            setHeader();
        },
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
            term.init();
        } );
} );
