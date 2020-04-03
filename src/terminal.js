var util = util || {};
util.toArray = function(list) {
  return Array.prototype.slice.call(list || [], 0);
};

date = new Date()


var serverName;
var database;
var database_mail;

var iconName;
var terminalID;
var prompt_text;
var header;
let logged = false

var Terminal = Terminal || function(cmdLineContainer, outputContainer) {
  window.URL = window.URL || window.webkitURL;
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

  var cmdLine_ = document.querySelector(cmdLineContainer);
  var output_ = document.querySelector(outputContainer);

  const CMDS_ = [
    'clear', 'date', 'echo', 'help', 'mail', 'read'
  ];
  
  var fs_ = null;
  var cwd_ = null;
  var history_ = [];
  var histpos_ = 0;
  var histtemp_ = 0;

  window.addEventListener('click', function(e) {
    cmdLine_.focus();
  }, false);

  cmdLine_.addEventListener('click', inputTextClick_, false);
  cmdLine_.addEventListener('keydown', historyHandler_, false);
  cmdLine_.addEventListener('keydown', processNewCommand_, false);

  //
  function inputTextClick_(e) {
    this.value = this.value;
  }

  //
  function historyHandler_(e) {
    if (history_.length) {
      if (e.keyCode == 38 || e.keyCode == 40) {
        if (history_[histpos_]) {
          history_[histpos_] = this.value;
        } else {
          histtemp_ = this.value;
        }
      }

      if (e.keyCode == 38) { // up
        histpos_--;
        if (histpos_ < 0) {
          histpos_ = 0;
        }
      } else if (e.keyCode == 40) { // down
        histpos_++;
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

  //
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

  //
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

  //
  function output(html) {
    output_.insertAdjacentHTML('beforeEnd', '<p>' + html + '</p>');
  }

  // Cross-browser impl to get document's height.
  function getDocHeight_() {
    var d = document;
    return Math.max(
        Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
        Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
        Math.max(d.body.clientHeight, d.documentElement.clientHeight)
    );
  }

  //

  return {
    init: function() {
      output(header);
    },
    output: output
  }
};

$(function() {
  
  
  $.ajax({
    url:"config/conf.json",
    dataType:"text",
    success:function(data)
    {
      conf = JSON.parse(data)
      newYear = conf.year
      terminalID = conf.terminalID
      iconName = conf.iconName
      serverName = conf.serverName
      defaultUser = conf.defaultUser
      
      date_final = date.getDay() + '/' + date.getMonth() + '/' + newYear
      var prompt_text;

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
      // Set the command-line prompt to include the user's IP Address
        $('.prompt').html(prompt_text);
      // Initialize a new terminal object
      var term = new Terminal('#input-line .cmdline', '#container output');
      term.init();
    }
  });
  
});


