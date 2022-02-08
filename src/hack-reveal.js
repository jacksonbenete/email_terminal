// Original recipe from: https://codepen.io/ivandaum/pen/WRxRwv
// License: MIT

/**
 * Applies a hack / reveal effect to a <p>.
 *
 * @param {HTMLParagraphElement} paragraph a reference to a <p>
 */
function hackRevealText( paragraph ) { /* eslint-disable-line no-unused-vars */
    const INITIAL_WORD = paragraph.innerHTML;
    let canChange = false;
    let globalCount = 0;
    let count = 0;
    paragraph.innerHTML = getRandomWord( paragraph );
    const interv = setInterval( () => {
        let finalWord = "";
        for ( let x = 0; x < INITIAL_WORD.length; x++ ) {
            if ( x <= count && canChange ) {
                finalWord += INITIAL_WORD[ x ];
            } else {
                finalWord += getRandomLetter();
            }
        }
        paragraph.innerHTML = finalWord;
        if ( canChange ) {
            count++;
        }
        if ( globalCount >= 20 ) {
            canChange = true;
        }
        if ( count >= INITIAL_WORD.length ) {
            clearInterval( interv );
            count = 0;
            canChange = false;
            globalCount = 0;
        }
        globalCount++;
    }, 50 );
}

function getRandomLetter() {
    return String.fromCharCode( 97 + Math.floor( Math.random() * 26 ) );
}

function getRandomWord( word ) {
    const text = word.innerHTML;
    let finalWord = "";
    for ( let i = 0; i < text.length; i++ ) {
        finalWord += text[ i ] === " " ? " " : getRandomLetter();
    }
    return finalWord;
}
