/* eslint no-unused-vars: 0 */

class CommandNotFoundError extends Error {
    constructor( command ) {
        super();
        this.message = `${ command }: command not found`;
    }
}

class InvalidCommandParameter extends Error {
    constructor( command ) {
        super();
        this.message = `Invalid parameters pased to command ${ command }`;
    }
}

class AddressNotFoundError extends Error {
    constructor( address ) {
        super();
        this.message = `Error : address ${ address } can't be reached`;
    }
}

class AddressIsEmptyError extends Error {
    constructor() {
        super();
        this.message = "Error: You need to specify an address";
    }
}

class UsernameIsEmptyError extends Error {
    constructor() {
        super();
        this.message = "Empty user name provided";
    }
}

class InvalidCredsSyntaxError extends Error {
    constructor() {
        super();
        this.message = "Invalid syntax for credentials provided: either provide just a username, or username:password";
    }
}

class InvalidPasswordError extends Error {
    constructor( userName ) {
        super();
        this.message = `Invalid password provided for ${ userName }`;
    }
}

class MailServerIsEmptyError extends Error {
    constructor() {
        super();
        this.message = "There is no new mail registered.";
    }
}

class InvalidMessageKeyError extends Error {
    constructor() {
        super();
        this.message = "Invalid message key.";
    }
}

class AlreadyOnServerError extends Error {
    constructor( serverAddress ) {
        super();
        this.message = `You already are at ${ serverAddress }`;
    }
}

class UnknownUserError extends Error {
    constructor( userName ) {
        super();
        this.message = `Unknown user ${ userName }`;
    }
}

class ServerRequireUsernameError extends Error {
    constructor( serverAddress ) {
        super();
        this.message = `Server require a username to be accessed: ssh username@${ serverAddress }`;
    }
}

class JsonFetchParseError extends Error {
    constructor( message ) {
        super();
        this.message = message;
    }
}
