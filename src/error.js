class CommandNotFoundError extends Error {
    constructor(message) {
        super(message)
        this.name = 'CommandNotFoundError'
        this.message = (message + ': command not found')
    }
}

class AddressNotFoundError extends Error {
    constructor(message) {
        super(message)
        this.message = (`Error : address ` + message + ` can't be reached`)
    }
}

class AddressIsEmptyError extends Error {
    constructor(message) {
        super(message)
        this.message = (`Error: You need to specify an address`)
    }
}

// module.exports = {
//     CommandNotFoundError,
//     AddressNotFoundError,
//     AddressIsEmptyError
// }