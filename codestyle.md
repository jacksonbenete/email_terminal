## Javascript

- For single statement if's, avoid use of braces if the readability would improve

```javascript
if (foo)
    bar()
```

- When using braces (functions, multiple statements if's, etc), use it as follows

```javascript
if (foo) {
    test(foobar)
    return bar
}
```

- No semicolon if possible
- If necessary - like in lines starting with `(` and `[` - try to put the semicolon in the beginning

Example
---
```javascript
const a = 1
const b = 2
(a+b).toString()
```
This is bad and will be compiled as `const b = 2(a+b).toString();`. Will return an error.

Correction
---
```javascript
const a = 1
const b = 2
;(a+b).toString()
```

- If you need to handle an exception, try to create a new Error in error.js if any of the already Error functions works for you.

- I'm not good at Unit Tests (I'm working on it), but if you're ever contribute to my repositories, and you are good at it, then go for it!

## Commit Messages

```
<type>: <title>
//empty line
<body>
//empty line
Fix #n
```

Example
---
```
refactor: kernel function

The kernel should handle software calls in a more flexible way.

fix #3
```

### Types

- feat: (new feature for the user, not a new feature for build script)
- fix: (bug fix for the user, not a fix to a build script)
- docs: (changes to the documentation)
- style: (formatting, missing semi colons, etc; no production code change)
- refactor: (refactoring production code, eg. renaming a variable)
- test: (adding missing tests, refactoring tests; no production code change)
- chore: (updating grunt tasks etc; no production code change)
