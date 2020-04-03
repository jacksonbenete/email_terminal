/**
 * This is only used in the formatColums function, that have never been implemented.
 * 
 * @todo Marked to be removed.
 */
var util = util || {};
util.toArray = function(list) {
  return Array.prototype.slice.call(list || [], 0);
};


// Global scope variables
date = new Date()
var serverName;
var database;
var database_mail;
var iconName;
var terminalID;
var prompt_text;
var header;
let logged = false

/**
 * Internal logic of terminal.
 * 
 * Base code created by @AndrewBarfield, further development by @jacksonbenete. 
 * This should contain all the basic code for the terminal behavior.
 * 
 * @param {Container} cmdLineContainer  The div where the user will write into
 * @param {Container} outputContainer   The div where the terminal will return information at
 */
var Terminal = Terminal || function(cmdLineContainer, outputContainer) {
  window.URL = window.URL || window.webkitURL;
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

  var cmdLine_ = document.querySelector(cmdLineContainer);
  var output_ = document.querySelector(outputContainer);

  // A list of terminal implemented functions (to show in help)
  const CMDS_ = [
    'clear', 'date', 'echo', 'help', 'mail', 'read'
  ];
  
  var fs_ = null;
  var cwd_ = null;
  var history_ = [];
  var histpos_ = 0;
  var histtemp_ = 0;

  // Recover focus on terminal
  window.addEventListener('click', function(e) {
    cmdLine_.focus();
  }, false);

  cmdLine_.addEventListener('keydown', historyHandler_, false);
  cmdLine_.addEventListener('keydown', processNewCommand_, false);
  
  /**
   * @todo I don't think this is necessary, marked to be removed
   */
  cmdLine_.addEventListener('click', inputTextClick_, false);
  function inputTextClick_(e) {
    this.value = this.value;
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
          history_[histpos_] = this.value;
        } else {
          histtemp_ = this.value;
        }
      }

      // Up arrow
      if (e.keyCode == 38) {
        histpos_--;
        if (histpos_ < 0) {
          histpos_ = 0;
        }
      }

      // Down arrow
      else if (e.keyCode == 40) {
        histpos_++;

        // This avoid to repeat the history from the beggining
        if (histpos_ > history_.length) {
          histpos_ = history_.length;
        }
      }

      if (e.keyCode == 38 || e.keyCode == 40) {
        this.value = history_[histpos_] ? history_[histpos_] : histtemp_;
        this.value = this.value; // Sets cursor to end of input.
      }
    }
  }

  /**
   * The main function to process commands.
   * 
   * This is a switch-case to deal with the internal logic.
   * 
   * @todo This should be modulated to accept external .js files commands.
   * 
   * @param {Event} e 
   */
  function processNewCommand_(e) {

    if (e.keyCode == 9) { // tab
      e.preventDefault();
      // Implement tab suggest.
    } else if (e.keyCode == 13) { // enter
      // Save shell history.
      if (this.value) {
        history_[history_.length] = this.value;
        histpos_ = history_.length;
      }

      // Duplicate current input and append to output section.
      var line = this.parentNode.parentNode.cloneNode(true);
      line.removeAttribute('id')
      line.classList.add('line');
      var input = line.querySelector('input.cmdline');
      input.autofocus = false;
      input.readOnly = true;
      output_.appendChild(line);

      if (this.value && this.value.trim()) {
        var args = this.value.split(' ').filter(function(val, i) {
          return val;
        });
        var cmd = args[0].toLowerCase();
        args = args.splice(1); // Remove cmd from arg list.
      }

      switch (cmd) {
        case 'clear':
          output_.innerHTML = '';
          this.value = '';
          return;
        case 'date':
          output( date );
          break;
        case 'echo':
          output( args.join(' ') );
          break;
        case 'help':
          output('<div class="ls-files">' + CMDS_.join('<br>') + '</div>');
          break;
        case 'exit':
        case 'logout':
            logged = false
            window.close()
          break;

          case 'login':
            $.ajax({
                url:"config/database.db",
                dataType:"text",
                success:function(data)
                {
                    database = JSON.parse(data)
                    regexp = /^[0-9a-fA-F]+$/;
                    try {
                        args = args[0].split('@')
                        $.each(database, function(index, value){
                            if (args[0] == value.id && args[1] == value.password){
                                logged = value.id;
                                database = value;
                                database_mail = value.mail;
                                output_.innerHTML = '';
                                output(header)
                                output('Login successful')
                                prompt_text = '[' + value.user + '@' + terminalID + '] > '
                                $('.prompt').html(prompt_text);
                            }
                        })
                    } catch (error) {
                        // output(`This isn't a valid ID.`);
                        // output(`Try: login id@pass`);
                    }
                    finally{
                        if(!logged){
                            output(`This isn't a valid ID.`);
                            output(`Try: login id@pass`);
                        }
                    }
                }
            });
          break;
        
          case 'mail':
            if (!logged){
                output(`You need to login`)
                break;
            }

            $.each(database_mail, function(index, mail){
                output(`[` + index + `] ` + mail.title)
            })

            break;

          case 'read':
            if (!logged){
                output(`You need to login`)
                break;
            }
            readOption = false
            $.each(database_mail, function(index, mail){
                if (args[0] == index) {
                    readOption = true
                    output(`---------------------------------------------`)
                    output(`From: ` + mail.from)
                    output(`To: ` + database.id + `@` + terminalID)
                    output(`---------------------------------------------`)
                    
                    $.each(mail.body.split("  "), function(i, b){
                        output(b)
                    })
                }
                
            })

            if (!readOption) {
              output(`Invalid message key`)
            }
            break;
        default:
          if (cmd) {
            output(cmd + ': command not found');
          }
      };

      window.scrollTo(0, getDocHeight_());
      this.value = ''; // Clear/setup line for next input.
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
    var maxName = entries[0].name;
    util.toArray(entries).forEach(function(entry, i) {
      if (entry.name.length > maxName.length) {
        maxName = entry.name;
      }
    });

    var height = entries.length <= 3 ?
        'height: ' + (entries.length * 15) + 'px;' : '';

    // 12px monospace font yields ~7px screen width.
    var colWidth = maxName.length * 7;

    return ['<div class="ls-files" style="-webkit-column-width:',
            colWidth, 'px;', height, '">'];
  }

  /**
   * A function to padronize every output/return as a terminal print/echo function
   * 
   * @param {String} html The string to be returned as a print in terminal
   */
  function output(html) {
    output_.insertAdjacentHTML('beforeEnd', '<p>' + html + '</p>');
  }

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

  /**
   * This will automatically output the hearder when the object initialize (constructor?).
   */
  return {
    init: function() {
      output(header);
    },
    output: output
  }
};

/**
 * The `Document.ready` function to initialize everything.
 */
$(function() {

  $.ajax({
    url:"config/conf.json",
    dataType:"text",
    success:function(data)
    {
      // Data recovery
      conf = JSON.parse(data)
      newYear = conf.year
      terminalID = conf.terminalID
      iconName = conf.iconName
      serverName = conf.serverName
      defaultUser = conf.defaultUser
      
      date_final = date.getDay() + '/' + date.getMonth() + '/' + newYear
      var prompt_text;

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
      <p>Logged in: ` + date.setFullYear(newYear) + ` ( ` + date_final + ` ) </p>
      <p>Enter "help" for more information.</p>
      `
      $('.prompt').html(prompt_text);
      
      // Initializing Terminal Object
      var term = new Terminal('#input-line .cmdline', '#container output');
      term.init();

    }
  });
});


