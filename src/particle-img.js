// Recipe from: https://codepen.io/franksLaboratory/pen/ZEprPKx
// License: MIT

const DETAIL = 1;

/**
 * Applies a particle rendering effect to an <img>, by transforming it into a <canvas>.
 *
 * @param {HTMLImageElement} imgElem a reference to an <img>
 *
 * @return {Promise} A Promise resolving to the HTMLCanvasElement inserted
 */
function particleImage( imgElem ) { /* eslint-disable-line no-unused-vars */
    const particulesCount = imgElem.dataset.particules ? Number( imgElem.dataset.particules ) : 5000;
    return new Promise( ( resolve ) => {
        imgElem.addEventListener( "load", () => {
            const canvas = document.createElement( "canvas" );
            imgElem.parentNode.appendChild( canvas );
            canvas.width = imgElem.width;
            canvas.height = imgElem.height;
            // Copy CSS classes from <img>:
            canvas.classList.add( ...imgElem.classList );
            // Copy CSS style from <img>:
            canvas.style = "";
            Object.values( imgElem.style ).forEach( ( prop ) => {
                canvas.style[ prop ] = imgElem.style[ prop ];
            } );
            const ctx = canvas.getContext( "2d" );
            ctx.drawImage( imgElem, 0, 0, canvas.width, canvas.height );
            imgElem.remove();

            const pixels = ctx.getImageData( 0, 0, canvas.width, canvas.height );
            ctx.clearRect( 0, 0, canvas.width, canvas.height );

            const grid = [];
            for ( let y = 0; y < canvas.height; y += DETAIL ) {
                const row = [];
                for ( let x = 0; x < canvas.width; x += DETAIL ) {
                    const red = pixels.data[ ( y * 4 * pixels.width ) + ( x * 4 ) ];
                    const green = pixels.data[ ( y * 4 * pixels.width ) + ( x * 4 + 1 ) ];
                    const blue = pixels.data[ ( y * 4 * pixels.width ) + ( x * 4 + 2 ) ];
                    const color = `rgb(${ red },${ green },${ blue })`;
                    const brightness = calculateBrightness( red, green, blue ) / 100;
                    const cell = [ color, brightness ];
                    row.push( cell );
                }
                grid.push( row );
            }
            const particlesArray = [];
            for ( let i = 0; i < particulesCount; i++ ) {
                particlesArray.push( new Particle( canvas.width, canvas.height ) );
            }

            function animate() {
                if ( !document.body.contains( canvas ) ) {
                    return;
                }
                ctx.globalAlpha = 0.05;
                ctx.fillStyle = "rgb(0, 0, 0)";
                ctx.fillRect( 0, 0, canvas.width, canvas.height );
                ctx.globalAlpha = 0.2;
                for ( let i = 0; i < particlesArray.length; i++ ) {
                    particlesArray[ i ].update( grid );
                    ctx.globalAlpha = particlesArray[ i ].speed * 0.3;
                    particlesArray[ i ].draw( grid, ctx );
                }
                requestAnimationFrame( animate );
            }
            animate();

            resolve( canvas );
        } );
    } );
}

class Particle {
    constructor( width, height ) {
        this.x = Math.random() * width;
        this.y = height;
        this.width = width;
        this.height = height;
        this.speed = 0;
        this.velocity = Math.random() * 0.4;
        this.size = Math.random() * 2 + 0.5;
        this.position1 = Math.floor( this.y / DETAIL );
        this.position2 = Math.floor( this.x / DETAIL );
        this.angle = 0;
    }
    update( grid ) {
        this.position1 = Math.floor( this.y / DETAIL );
        this.position2 = Math.floor( this.x / DETAIL );
        if ( grid[ this.position1 ] ) {
            if ( grid[ this.position1 ][ this.position2 ] ) {
                this.speed = grid[ this.position1 ][ this.position2 ][ 1 ];
            }
        }
        this.angle += this.speed / 20;
        const movement = ( 2.5 - this.speed ) + this.velocity;
        this.y -= movement + Math.cos( this.angle ) * 2;
        this.x += Math.cos( this.angle ) * 2;
        if ( this.y <= 0 ) {
            this.y = this.height;
            this.x = Math.random() * this.width;
        }
    }
    draw( grid, ctx ) {
        ctx.beginPath();
        ctx.fillStyle = "black";
        if ( this.y > this.height - this.size * 6 ) {
            ctx.globalAlpha = 0;
        }
        if ( grid[ this.position1 ] ) {
            if ( grid[ this.position1 ][ this.position2 ] ) {
                ctx.fillStyle = grid[ this.position1 ][ this.position2 ][ 0 ];
            }
        } else {
            ctx.fillStyle = "white";
        }
        ctx.arc( this.x, this.y, this.size, 0, 2 * Math.PI );
        ctx.fill();
    }
}

function calculateBrightness( red, green, blue ) {
    return Math.sqrt(
        ( red * red ) * 0.299 +
        ( green * green ) * 0.587 +
        ( blue * blue ) * 0.114
    );
}
