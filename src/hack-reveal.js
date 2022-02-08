// Original recipe from: https://codepen.io/ivandaum/pen/WRxRwv
// License: MIT

const ALPHABETS = {
    ascii: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
    base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/",
    letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
};

/**
 * Applies a hack / reveal effect to a <p>.
 *
 * @param {HTMLParagraphElement} paragraph a reference to a <p>
 */
function hackRevealText( paragraph, options ) { /* eslint-disable-line no-unused-vars */
    const alphabet = ALPHABETS[ options.alphabet || "ascii" ];
    const iterationsBeforeReveal = options.iterationsBeforeReveal || 20;
    const initialText = paragraph.innerHTML;
    let canChange = false;
    let globalCount = 0;
    let count = 0;
    paragraph.innerHTML = makeRandText( initialText, alphabet, options.preserveSpaces );
    const interv = setInterval( () => {
        paragraph.innerHTML = makeRandText( initialText, alphabet, options.preserveSpaces, count, canChange );
        if ( canChange ) {
            count++;
        }
        if ( globalCount >= iterationsBeforeReveal ) {
            canChange = true;
        }
        if ( count >= initialText.length ) {
            clearInterval( interv );
            count = 0;
            canChange = false;
            globalCount = 0;
        }
        globalCount++;
    }, 50 );
}

function getRandLetter( alphabet ) {
    return alphabet[ Math.floor( Math.random() * alphabet.length ) ];
}

function makeRandText( text, alphabet, preserveSpaces, count, canChange ) {
    let finalWord = "";
    for ( let i = 0; i < text.length; i++ ) {
        if ( count && i <= count && canChange ) {
            finalWord += text[ i ];
        } else {
            finalWord += ( preserveSpaces && text[ i ] === " " ) ? " " : getRandLetter( alphabet );
        }
    }
    return finalWord;
}
