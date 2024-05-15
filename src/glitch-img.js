// Recipe from: https://codepen.io/tksiiii/pen/xdQgJX
// License: MIT

/**
 * Applies a glitch rendering effect to an <img>, by transforming it into a <canvas>.
 *
 * @param {HTMLImageElement} imgElem a reference to an <img>
 *
 * @return {Promise} A Promise resolving to the HTMLCanvasElement inserted
 */
function glitchImage( imgElem ) { /* eslint-disable-line no-unused-vars */
    return new Promise( ( resolve ) => {
        new p5( ( sketch ) => {
            sketch.pixelDensity( 1 ); // no need for more, it would impact perfs negatively
            // First ensure <img> is loaded, in order to have access to its .width & .height:
            sketch.loadImage( imgElem.src, ( loadedImg ) => {
                const canvas = sketch.createCanvas( loadedImg.width, loadedImg.height );
                canvas.parent( imgElem.parentNode ); // Positioning canvas
                // Copy CSS classes from <img>:
                canvas.elt.classList.add( ...imgElem.classList );
                // Copy CSS style from <img>:
                canvas.elt.style = "";
                Object.values( imgElem.style ).forEach( ( prop ) => {
                    canvas.elt.style[ prop ] = imgElem.style[ prop ];
                } );
                if ( imgElem.height ) {
                    canvas.elt.style.height = `${ imgElem.height }px`;
                }
                if ( imgElem.width ) {
                    canvas.elt.style.width = `${ imgElem.width }px`;
                }
                const glitch = new Glitch( loadedImg, sketch );
                imgElem.remove();
                sketch.draw = () => {
                    if ( !document.body.contains( canvas.elt ) ) {
                        sketch.remove();
                        return;
                    }
                    sketch.clear();
                    sketch.background( 0 ); // fill canvas in black
                    glitch.show();
                };
                resolve( canvas.elt );
            } );
        } );
    } );
}

const CHANNEL_LEN = 4; // Constant from the doc: https://p5js.org/reference/#/p5.Image
const FLOW_LINES_COUNT = 1;
const SHIFT_LINES_COUNT = 6;
const SHIFT_RGB_COUNT = 1;
const SCAT_IMGS_COUNT = 3;

class Glitch {
    constructor( img, p5sketch ) {
        this.p5sketch = p5sketch;
        this.originalImg = new p5.Image( img.width, img.height );
        this.originalImg.copy( img, 0, 0, img.width, img.height, 0, 0, img.width, img.height );
        this.img = img;
        this.img.loadPixels();
        this.flowLineImgs = [];
        this.shiftLineImgs = [];
        this.shiftRGBs = [];
        this.scatImgs = [];
        this.throughFlag = true;

        // flow line
        for ( let i = 0; i < FLOW_LINES_COUNT; i++ ) {
            this.flowLineImgs.push( {
                pixels: null,
                t1: p5sketch.floor( p5sketch.random( 0, 1000 ) ),
                speed: p5sketch.floor( p5sketch.random( 4, 24 ) ),
                randX: p5sketch.floor( p5sketch.random( 24, 80 ) )
            } );
        }

        // shift line
        for ( let i = 0; i < SHIFT_LINES_COUNT; i++ ) {
            this.shiftLineImgs.push( null );
        }

        // shift RGB
        for ( let i = 0; i < SHIFT_RGB_COUNT; i++ ) {
            this.shiftRGBs.push( null );
        }

        // scat imgs
        for ( let i = 0; i < SCAT_IMGS_COUNT; i++ ) {
            this.scatImgs.push( {
                img: null,
                x: 0,
                y: 0
            } );
        }
    }

    replaceData( destImg, srcPixels ) { /* eslint-disable-line class-methods-use-this */
        for ( let y = 0; y < destImg.height; y++ ) {
            for ( let x = 0; x < destImg.width; x++ ) {
                const index = ( y * destImg.width + x ) * CHANNEL_LEN;
                const r = index;
                const g = index + 1;
                const b = index + 2;
                const a = index + 3;
                destImg.pixels[ r ] = srcPixels[ r ];
                destImg.pixels[ g ] = srcPixels[ g ];
                destImg.pixels[ b ] = srcPixels[ b ];
                destImg.pixels[ a ] = srcPixels[ a ];
            }
        }
        // Note (Lucas - 2022/02/09): theorically faster but does not behave the same as the lines above :(
        // destImg.pixels = new Uint8ClampedArray( srcPixels );
    }

    flowLine( srcImg, obj ) {
        const destPixels = new Uint8ClampedArray( srcImg.pixels );
        obj.t1 %= srcImg.height;
        obj.t1 += obj.speed;
        // const tempY = this.p5sketch.floor(noise(obj.t1) * srcImg.height);
        const tempY = this.p5sketch.floor( obj.t1 );
        for ( let y = 0; y < srcImg.height; y++ ) {
            if ( tempY === y ) {
                for ( let x = 0; x < srcImg.width; x++ ) {
                    const index = ( y * srcImg.width + x ) * CHANNEL_LEN;
                    const r = index;
                    const g = index + 1;
                    const b = index + 2;
                    const a = index + 3;
                    destPixels[ r ] = srcImg.pixels[ r ] + obj.randX;
                    destPixels[ g ] = srcImg.pixels[ g ] + obj.randX;
                    destPixels[ b ] = srcImg.pixels[ b ] + obj.randX;
                    destPixels[ a ] = srcImg.pixels[ a ];
                }
            }
        }
        return destPixels;
    }

    shiftLine( srcImg ) {
        const sketch = this.p5sketch;
        const destPixels = new Uint8ClampedArray( srcImg.pixels );
        const rangeH = srcImg.height;
        const rangeMin = sketch.floor( sketch.random( 0, rangeH ) );
        const rangeMax = rangeMin + sketch.floor( sketch.random( 1, rangeH - rangeMin ) );
        const offsetX = CHANNEL_LEN * sketch.floor( sketch.random( -40, 40 ) );

        for ( let y = 0; y < srcImg.height; y++ ) {
            if ( y > rangeMin && y < rangeMax ) {
                for ( let x = 0; x < srcImg.width; x++ ) {
                    const index = ( y * srcImg.width + x ) * CHANNEL_LEN;
                    const r = index;
                    const g = index + 1;
                    const b = index + 2;
                    const a = index + 3;
                    const r2 = r + offsetX;
                    const g2 = g + offsetX;
                    const b2 = b + offsetX;
                    destPixels[ r ] = srcImg.pixels[ r2 ];
                    destPixels[ g ] = srcImg.pixels[ g2 ];
                    destPixels[ b ] = srcImg.pixels[ b2 ];
                    destPixels[ a ] = srcImg.pixels[ a ];
                }
            }
        }
        return destPixels;
    }

    shiftRGB( srcImg ) {
        const sketch = this.p5sketch;
        const range = 16;
        const destPixels = new Uint8ClampedArray( srcImg.pixels );
        const randR = ( sketch.floor( sketch.random( -range, range ) ) * srcImg.width + sketch.floor( sketch.random( -range, range ) ) ) * CHANNEL_LEN;
        const randG = ( sketch.floor( sketch.random( -range, range ) ) * srcImg.width + sketch.floor( sketch.random( -range, range ) ) ) * CHANNEL_LEN;
        const randB = ( sketch.floor( sketch.random( -range, range ) ) * srcImg.width + sketch.floor( sketch.random( -range, range ) ) ) * CHANNEL_LEN;

        for ( let y = 0; y < srcImg.height; y++ ) {
            for ( let x = 0; x < srcImg.width; x++ ) {
                const index = ( y * srcImg.width + x ) * CHANNEL_LEN;
                const r = index;
                const g = index + 1;
                const b = index + 2;
                const a = index + 3;
                const r2 = ( r + randR ) % srcImg.pixels.length;
                const g2 = ( g + randG ) % srcImg.pixels.length;
                const b2 = ( b + randB ) % srcImg.pixels.length;
                destPixels[ r ] = srcImg.pixels[ r2 ];
                destPixels[ g ] = srcImg.pixels[ g2 ];
                destPixels[ b ] = srcImg.pixels[ b2 ];
                destPixels[ a ] = srcImg.pixels[ a ];
            }
        }

        return destPixels;
    }

    getRandomRectImg( srcImg ) {
        const sketch = this.p5sketch;
        const startX = sketch.floor( sketch.random( 0, srcImg.width - 30 ) );
        const startY = sketch.floor( sketch.random( 0, srcImg.height - 50 ) );
        const rectW = sketch.floor( sketch.random( 30, srcImg.width - startX ) );
        const rectH = sketch.floor( sketch.random( 1, 50 ) );
        const destImg = srcImg.get( startX, startY, rectW, rectH );
        destImg.loadPixels();
        return destImg;
    }

    show() {
        // const showStartTime = window.performance.now();
        const sketch = this.p5sketch;
        const width = this.img.width;
        const height = this.img.height;

        // restore the original state
        this.img.copy( this.originalImg, 0, 0, width, height, 0, 0, width, height );

        // sometimes pass without effect processing
        const n = sketch.floor( sketch.random( 100 ) );
        if ( n > 75 && this.throughFlag ) {
            this.throughFlag = false;
            setTimeout( () => {
                this.throughFlag = true;
            }, sketch.floor( sketch.random( 40, 400 ) ) );
        }

        if ( !this.throughFlag ) {
            this.img.updatePixels();
            sketch.image( this.img, 0, 0 );
            return;
        }

        // flow line
        this.flowLineImgs.forEach( ( v, i, arr ) => {
            arr[ i ].pixels = this.flowLine( this.img, v );
            if ( arr[ i ].pixels ) {
                this.replaceData( this.img, arr[ i ].pixels );
            }
        } );

        // shift line
        this.shiftLineImgs.forEach( ( _, i, arr ) => {
            if ( sketch.floor( sketch.random( 100 ) ) > 50 ) {
                arr[ i ] = this.shiftLine( this.img );
                this.replaceData( this.img, arr[ i ] );
            } else if ( arr[ i ] ) {
                this.replaceData( this.img, arr[ i ] );
            }
        } );

        // shift rgb
        this.shiftRGBs.forEach( ( _, i, arr ) => {
            if ( sketch.floor( sketch.random( 100 ) ) > 65 ) {
                arr[ i ] = this.shiftRGB( this.img );
                this.replaceData( this.img, arr[ i ] );
            }
        } );

        sketch.image( this.img, 0, 0 );

        // scat image
        this.scatImgs.forEach( ( obj ) => {
            if ( sketch.floor( sketch.random( 100 ) ) > 80 ) {
                obj.x = sketch.floor( sketch.random( -width * 0.3, width * 0.7 ) );
                obj.y = sketch.floor( sketch.random( -height * 0.1, height ) );
                obj.img = this.getRandomRectImg( this.img );
            }
            if ( obj.img ) {
                sketch.image( obj.img, obj.x, obj.y );
            }
        } );

        this.img.updatePixels();

        // const showDuration = window.performance.now() - showStartTime;
        // console.debug( `Glitch.show() duration=${ showDuration }ms FPS: ${ sketch.frameRate().toFixed( 2 ) }` );
    }
}
