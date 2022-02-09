// Recipe from: https://codepen.io/tksiiii/pen/xdQgJX
// License: MIT

/**
 * Applies a glitch rendering effect to an <img>.
 *
 * @param {HTMLImageElement} imgElem a reference to an <img>
 *
 * @return {Promise} A Promise resolving to the HTMLCanvasElement inserted
 */
function glitchImage( imgElem ) { /* eslint-disable-line no-unused-vars */
    return new Promise( ( resolve ) => {
        new p5( ( sketch ) => {
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
                imgElem.remove();
                const glitch = new Glitch( loadedImg, sketch );
                sketch.draw = () => {
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

class Glitch {
    constructor( img, p5sketch ) {
        this.p5 = p5sketch;
        this.imgOrigin = img;
        this.imgOrigin.loadPixels();
        this.copyData = new Uint8ClampedArray( this.imgOrigin.pixels );
        this.flowLineImgs = [];
        this.shiftLineImgs = [];
        this.shiftRGBs = [];
        this.scatImgs = [];
        this.throughFlag = true;

        // flow line
        for ( let i = 0; i < 1; i++ ) {
            this.flowLineImgs.push( {
                pixels: null,
                t1: this.p5.floor( this.p5.random( 0, 1000 ) ),
                speed: this.p5.floor( this.p5.random( 4, 24 ) ),
                randX: this.p5.floor( this.p5.random( 24, 80 ) )
            } );
        }

        // shift line
        for ( let i = 0; i < 6; i++ ) {
            this.shiftLineImgs.push( null );
        }

        // shift RGB
        for ( let i = 0; i < 1; i++ ) {
            this.shiftRGBs.push( null );
        }

        // scat imgs
        for ( let i = 0; i < 3; i++ ) {
            this.scatImgs.push( {
                img: null,
                x: 0,
                y: 0
            } );
        }
    }

    replaceData( destImg, srcPixels ) { /* eslint-disable-line class-methods-use-this */
        // Note (Lucas - 2022/02/09): This method is the current app bottleneck, based on Firefox profiling tab

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

        //   Note (Lucas - 2022/02/09): could be faster but does not behave the same as the lines above :(
        // destImg.pixels = new Uint8ClampedArray( srcPixels );
        //   Seems to me that the best improvement forward, performance-wise, is to use a p5.Image or p5.Graphics instead of a Uint8ClampedArray in this.copyData,
        //   in order to benefit from its (potentially more efficent) copyData method.

        destImg.updatePixels();
    }

    flowLine( srcImg, obj ) {
        const destPixels = new Uint8ClampedArray( srcImg.pixels );
        obj.t1 %= srcImg.height;
        obj.t1 += obj.speed;
        // const tempY = this.p5.floor(noise(obj.t1) * srcImg.height);
        const tempY = this.p5.floor( obj.t1 );
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
        const destPixels = new Uint8ClampedArray( srcImg.pixels );
        const rangeH = srcImg.height;
        const rangeMin = this.p5.floor( this.p5.random( 0, rangeH ) );
        const rangeMax = rangeMin + this.p5.floor( this.p5.random( 1, rangeH - rangeMin ) );
        const offsetX = CHANNEL_LEN * this.p5.floor( this.p5.random( -40, 40 ) );

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
        const range = 16;
        const destPixels = new Uint8ClampedArray( srcImg.pixels );
        const randR = ( this.p5.floor( this.p5.random( -range, range ) ) * srcImg.width + this.p5.floor( this.p5.random( -range, range ) ) ) * CHANNEL_LEN;
        const randG = ( this.p5.floor( this.p5.random( -range, range ) ) * srcImg.width + this.p5.floor( this.p5.random( -range, range ) ) ) * CHANNEL_LEN;
        const randB = ( this.p5.floor( this.p5.random( -range, range ) ) * srcImg.width + this.p5.floor( this.p5.random( -range, range ) ) ) * CHANNEL_LEN;

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
        const startX = this.p5.floor( this.p5.random( 0, srcImg.width - 30 ) );
        const startY = this.p5.floor( this.p5.random( 0, srcImg.height - 50 ) );
        const rectW = this.p5.floor( this.p5.random( 30, srcImg.width - startX ) );
        const rectH = this.p5.floor( this.p5.random( 1, 50 ) );
        const destImg = srcImg.get( startX, startY, rectW, rectH );
        destImg.loadPixels();
        return destImg;
    }

    show() {
        const showStartTime = window.performance.now();
        const sketch = this.p5;
        const width = this.imgOrigin.width;
        const height = this.imgOrigin.height;

        // restore the original state
        this.replaceData( this.imgOrigin, this.copyData );

        // sometimes pass without effect processing
        const n = this.p5.floor( this.p5.random( 100 ) );
        if ( n > 75 && this.throughFlag ) {
            this.throughFlag = false;
            setTimeout( () => {
                this.throughFlag = true;
            }, this.p5.floor( this.p5.random( 40, 400 ) ) );
        }

        if ( !this.throughFlag ) {
            sketch.push();
            sketch.translate( ( width - this.imgOrigin.width ) / 2, ( height - this.imgOrigin.height ) / 2 );
            sketch.image( this.imgOrigin, 0, 0 );
            sketch.pop();
            return;
        }

        // flow line
        this.flowLineImgs.forEach( ( v, i, arr ) => {
            arr[ i ].pixels = this.flowLine( this.imgOrigin, v );
            if ( arr[ i ].pixels ) {
                this.replaceData( this.imgOrigin, arr[ i ].pixels );
            }
        } );

        // shift line
        this.shiftLineImgs.forEach( ( _, i, arr ) => {
            if ( this.p5.floor( this.p5.random( 100 ) ) > 50 ) {
                arr[ i ] = this.shiftLine( this.imgOrigin );
                this.replaceData( this.imgOrigin, arr[ i ] );
            } else if ( arr[ i ] ) {
                this.replaceData( this.imgOrigin, arr[ i ] );
            }
        } );

        // shift rgb
        this.shiftRGBs.forEach( ( _, i, arr ) => {
            if ( this.p5.floor( this.p5.random( 100 ) ) > 65 ) {
                arr[ i ] = this.shiftRGB( this.imgOrigin );
                this.replaceData( this.imgOrigin, arr[ i ] );
            }
        } );

        sketch.push();
        sketch.translate( ( width - this.imgOrigin.width ) / 2, ( height - this.imgOrigin.height ) / 2 );
        sketch.image( this.imgOrigin, 0, 0 );
        sketch.pop();

        // scat image
        this.scatImgs.forEach( ( obj ) => {
            sketch.push();
            sketch.translate( ( width - this.imgOrigin.width ) / 2, ( height - this.imgOrigin.height ) / 2 );
            if ( this.p5.floor( this.p5.random( 100 ) ) > 80 ) {
                obj.x = this.p5.floor( this.p5.random( -this.imgOrigin.width * 0.3, this.imgOrigin.width * 0.7 ) );
                obj.y = this.p5.floor( this.p5.random( -this.imgOrigin.height * 0.1, this.imgOrigin.height ) );
                obj.img = this.getRandomRectImg( this.imgOrigin );
            }
            if ( obj.img ) {
                sketch.image( obj.img, obj.x, obj.y );
            }
            sketch.pop();
        } );

        const showDuration = window.performance.now() - showStartTime;
        console.debug( `Glitch.show() duration=${ showDuration }ms FPS: ${ sketch.frameRate().toFixed( 2 ) }` );
    }
}
