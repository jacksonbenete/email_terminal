// Global scope variables
date = new Date()
let logged = false


/**
 * This is only used in the formatColums function, that have never been implemented.
 * 
 * @todo Marked to be removed.
 */
var util = util || {}
util.toArray = function(list) {
	return Array.prototype.slice.call(list || [], 0)
}

/**
 * Internal logic of terminal.
 * 
 * Base code created by @AndrewBarfield, further development by @jacksonbenete. 
 * This should contain all the basic code for the terminal behavior.
 * 
 * @param {Container} cmdLineContainer  The div where the user will write into
 * @param {Container} outputContainer   The div where the terminal will return information at
 */
var Terminal = Terminal || function() {
	window.URL = window.URL || window.webkitURL
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem

	var fs_ = null
	var cwd_ = null
	var history_ = []
	var histpos_ = 0
	var histtemp_ = 0

	// Recover focus on terminal
	window.addEventListener('click', function(e) {
		cmdLine_.focus()
	}, false)

	cmdLine_.addEventListener('keydown', historyHandler_, false)
	cmdLine_.addEventListener('keydown', processNewCommand_, false)
	cmdLine_.addEventListener('keydown', tabSuggestionHandler_, false)

	/**
	 * @todo I don't think this is necessary, marked to be removed
	 */
	cmdLine_.addEventListener('click', inputTextClick_, false)

	function inputTextClick_(e) {
		this.value = this.value
	}

	/**
	 * A function for a `history` function implementation.
	 * 
	 * You can navigate by pressing the up and down arrow for see or repeat previous commands.
	 * 
	 * @todo I don't get why the "Up arrow" aren't setting the cursor to end of input
	 * 
	 * @param {Event} e 
	 */
	function historyHandler_(e) {
		if (history_.length) {
			if (e.keyCode == 38 || e.keyCode == 40) {
				if (history_[histpos_]) {
					history_[histpos_] = this.value
				} else {
					histtemp_ = this.value
				}
			}

			// Up arrow
			if (e.keyCode == 38) {
				histpos_--
				if (histpos_ < 0) {
					histpos_ = 0
				}
			}

			// Down arrow
			else if (e.keyCode == 40) {
				histpos_++

				// This avoid to repeat the history from the beggining
				if (histpos_ > history_.length) {
					histpos_ = history_.length
				}
			}

			if (e.keyCode == 38 || e.keyCode == 40) {
				this.value = history_[histpos_] ? history_[histpos_] : histtemp_
				this.value = this.value // Sets cursor to end of input.
			}
		}
	}

	/**
	 * Prevents the `tab` key to lose/change focus.
	 * 
	 * @todo Implement tab suggestion
	 * 
	 * @param {Event} e keyCode 9 == Tab
	 */
	function tabSuggestionHandler_(e) {
		if (e.keyCode == 9)
			e.preventDefault()
	}

	/**
	 * The main function to process commands.
	 * 
	 * This is a switch-case to deal with the internal logic.
	 * 
	 * @param {Event} e keyCode 13 == Enter
	 */
	function processNewCommand_(e) {

		if (e.keyCode == 13) {
			// Save shell history.
			if (this.value) {
				history_[history_.length] = this.value
				histpos_ = history_.length
			}

			// Duplicate current input and append to output section.
			var line = this.parentNode.parentNode.cloneNode(true)
			line.removeAttribute('id')
			line.classList.add('line')
			var input = line.querySelector('input.cmdline')
			input.autofocus = false
			input.readOnly = true
			output_.appendChild(line)

			// Parsing Terminal arguments as `args`
			if (this.value && this.value.trim()) {
				var args = this.value.split(' ').filter(function(val, i) {
					return val
				})
				var cmd = args[0].toLowerCase()
				args = args.splice(1) // Remove cmd from arg list.
			}

			/**
			 * The kernel function is at src/softwares.js
			 * 
			 * If need to know more about Promises, read the following:
			 * https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call
			 */
			try {
				kernel(cmd, args)
					.then(function(result) {

						output(result)

					})
					.catch(function(e) {
						output(e.message)
					})
			} catch (error) {
				// If the user enter a empty line, it will just ignore and output a new line
				if (cmd == undefined)
					return output()
				output(cmd + ': command not found')
			}

		}
	}

	/**
	 * This function isn't used in the code and I don't know what the original author would want to use it for.
	 * Maybe, it's for a never implemented `ls` function to list directory files and details.
	 * 
	 * @todo Marked to be removed
	 * 
	 * @param {?} entries 
	 */
	function formatColumns_(entries) {
		var maxName = entries[0].name
		util.toArray(entries).forEach(function(entry, i) {
			if (entry.name.length > maxName.length)
				maxName = entry.name
		})

		var height = entries.length <= 3 ?
			'height: ' + (entries.length * 15) + 'px;' : ''

		// 12px monospace font yields ~7px screen width.
		var colWidth = maxName.length * 7

		return ['<div class="ls-files" style="-webkit-column-width:',
			colWidth, 'px;', height, '">'
		]
	}

	/**
	 * This will automatically output the hearder when the object initialize (constructor?).
	 */
	return {
		init: function() {
			setHeader()
		},
		output: output
	}
}

/**
 * The `Document.ready` function to initialize everything.
 */
$(function() {
	// Initializing Terminal Object
	kernel.init('#input-line .cmdline', '#container output')
		.then(function() {
			var term = new Terminal()
			term.init()
		})
})