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
    const iterationsBeforeReveal = options.iterationsBeforeReveal ? Number( options.iterationsBeforeReveal ) : 20;
    const initialText = paragraph.innerHTML;
    let globalCount = 0;
    let count = 0;
    paragraph.innerHTML = makeRandText( initialText, alphabet, options.preserveSpaces );
    const interv = setInterval( () => {
        paragraph.innerHTML = makeRandText( initialText, alphabet, options.preserveSpaces, count );
        if ( globalCount >= iterationsBeforeReveal ) {
            count++;
        }
        if ( count > initialText.length || !document.body.contains( paragraph ) ) {
            clearInterval( interv );
        }
        globalCount++;
    }, 50 );
}

function getRandLetter( alphabet ) {
    return alphabet[ Math.floor( Math.random() * alphabet.length ) ];
}

function makeRandText( text, alphabet, preserveSpaces, count ) {
    let finalWord = "";
    for ( let i = 0; i < text.length; i++ ) {
        if ( i < count ) {
            finalWord += text[ i ];
        } else {
            finalWord += ( preserveSpaces && text[ i ] === " " ) ? " " : getRandLetter( alphabet );
        }
    }
    return finalWord;
}
