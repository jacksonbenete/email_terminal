// Recipe from: https://codepen.io/tksiiii/pen/xdQgJX

function glitchImage( imgElem ) { /* eslint-disable-line no-unused-vars */
    new p5( ( sketch ) => {
        // First ensure <img> is loaded, in order to have access to its .width & .height:
        sketch.loadImage( imgElem.src, ( loadedImg ) => {
            const canvas = sketch.createCanvas( loadedImg.width * 2, loadedImg.height * 2 );
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
        } );
    } );
}

class Glitch {
    constructor( img, p5sketch ) {
        this.p5 = p5sketch;
        this.channelLen = 4;
        this.imgOrigin = img;
        this.imgOrigin.loadPixels();
        this.copyData = [];
        this.flowLineImgs = [];
        this.shiftLineImgs = [];
        this.shiftRGBs = [];
        this.scatImgs = [];
        this.throughFlag = true;
        this.copyData = new Uint8ClampedArray( this.imgOrigin.pixels );

        // flow line
        for ( let i = 0; i < 1; i++ ) {
            const o = {
                pixels: null,
                t1: this.p5.floor( this.p5.random( 0, 1000 ) ),
                speed: this.p5.floor( this.p5.random( 4, 24 ) ),
                randX: this.p5.floor( this.p5.random( 24, 80 ) )
            };
            this.flowLineImgs.push( o );
        }

        // shift line
        for ( let i = 0; i < 6; i++ ) {
            const o = null;
            this.shiftLineImgs.push( o );
        }

        // shift RGB
        for ( let i = 0; i < 1; i++ ) {
            const o = null;
            this.shiftRGBs.push( o );
        }

        // scat imgs
        for ( let i = 0; i < 3; i++ ) {
            const scatImg = {
                img: null,
                x: 0,
                y: 0
            };
            this.scatImgs.push( scatImg );
        }
    }

    replaceData( destImg, srcPixels ) {
        for ( let y = 0; y < destImg.height; y++ ) {
            for ( let x = 0; x < destImg.width; x++ ) {
                const index = ( y * destImg.width + x ) * this.channelLen;
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
                    const index = ( y * srcImg.width + x ) * this.channelLen;
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
        const offsetX = this.channelLen * this.p5.floor( this.p5.random( -40, 40 ) );

        for ( let y = 0; y < srcImg.height; y++ ) {
            if ( y > rangeMin && y < rangeMax ) {
                for ( let x = 0; x < srcImg.width; x++ ) {
                    const index = ( y * srcImg.width + x ) * this.channelLen;
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
        const randR = ( this.p5.floor( this.p5.random( -range, range ) ) * srcImg.width + this.p5.floor( this.p5.random( -range, range ) ) ) * this.channelLen;
        const randG = ( this.p5.floor( this.p5.random( -range, range ) ) * srcImg.width + this.p5.floor( this.p5.random( -range, range ) ) ) * this.channelLen;
        const randB = ( this.p5.floor( this.p5.random( -range, range ) ) * srcImg.width + this.p5.floor( this.p5.random( -range, range ) ) ) * this.channelLen;

        for ( let y = 0; y < srcImg.height; y++ ) {
            for ( let x = 0; x < srcImg.width; x++ ) {
                const index = ( y * srcImg.width + x ) * this.channelLen;
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
        const sketch = this.p5;

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

        const width = this.imgOrigin.width;
        const height = this.imgOrigin.height;

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
    }
}
