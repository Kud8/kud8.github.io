// MatCap-style image rendered on a sphere

let camera, scene, renderer;
let image;

let width = 800;
let height = 800;
let center = {
    x: 400,
    y: 400
};
let R = 100;

let isAtCenter = (x, y) =>  (x-center.x)*(x-center.x) + (y-center.y)*(y-center.y) <= R*R;

let drowBlindSpot = (context) => {
    let blindSpotRadius = Math.min(height, width) / 22;
    let blindSpotCenter = {
        x: 7/8 * width,
        y: center.y - Math.tan(15 * Math.PI / 180) * (3/8)*width
    };
    context.beginPath();
    context.arc(blindSpotCenter.x, blindSpotCenter.y, blindSpotRadius, 0, 2 * Math.PI);
    context.fillStyle = 'black';
    context.fill();
    context.closePath();
};

let drowBinarizedImage = (result, imageData) => {
    for (let y = 0; y < height; ++y) {
        let pos = y * width * 4;
        for (let x = 0; x < width; ++x) {
            let r = imageData.data[pos++];
            let g = imageData.data[pos++];
            let b = imageData.data[pos++];
            let a = imageData.data[pos++];
            if (isAtCenter(x, y)) {
                result.data[pos - 4] = r;
                result.data[pos - 3] = g;
                result.data[pos - 2] = b;
                result.data[pos - 1] = a;
            } else {
                let gray = (0.299 * r + 0.587 * g + 0.114 * b);
                if (gray > 160) {
                    result.data[pos - 4] = 255;
                    result.data[pos - 3] = 255;
                    result.data[pos - 2] = 255;
                    result.data[pos - 1] = a;
                }
                else {
                    result.data[pos - 4] = 0;
                    result.data[pos - 3] = 0;
                    result.data[pos - 2] = 0;
                    result.data[pos - 1] = a;
                }
            }
        }
    }
};

let imageLoaded = (ev) => {
    let element = document.createElement("canvas");
    let context = element.getContext("2d");

    let im = ev.target;

    width = im.width;
    height = im.height;
    center = {
        x: width/2,
        y: height/2
    };
    R = Math.min(height, width) / 4;
    context.canvas.width = width;
    context.canvas.height = height;

    context.drawImage(im, 0, 0);
    let imageData = context.getImageData(0, 0, width, height);
    let result = context.getImageData(0, 0, width, height);
    //drowBinarizedImage(result, imageData);
    context.putImageData(result, 0, 0);
    //drowBlindSpot(context);

    let image_url = context.canvas.toDataURL();
    let data = image_url.replace(/^data:image\/\w+;base64,/, "");

    image.src = image_url;
};

let init = () => {

    let info = document.createElement( 'div' );
    info.style.position = 'absolute';
    info.style.top = '30px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.style.color = '#fff';
    info.style.fontWeight = 'bold';
    info.style.backgroundColor = 'transparent';
    info.style.zIndex = '1';
    info.style.fontFamily = 'Monospace';
    document.body.appendChild( info );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, 0, 150 );

    let controls = new THREE.OrbitControls( camera );
    controls.minDistance = 75;
    controls.maxDistance = 200;
    controls.enablePan = false;

    image = document.createElement( 'img' );
    let image_old = document.createElement( 'img' );
    image_old.src = 'mipt2.jpg';
    //image.onload = imageLoaded;
    document.body.appendChild( image_old );

    var texture = new THREE.Texture( image );
    image.addEventListener( 'load', function ( event ) { texture.needsUpdate = true; } );

    var uniforms = {
        "texture": { type: "t", value: texture }
    };

    var material = new THREE.ShaderMaterial( {
        uniforms		: uniforms,
        vertexShader	: document.getElementById( 'vertex_shader' ).textContent,
        fragmentShader	: document.getElementById( 'fragment_shader' ).textContent
    } );

    scene.add( new THREE.Mesh( new THREE.SphereGeometry( 30, 32, 24, 0, Math.PI ), material ) );
};

let animate = () => {
    requestAnimationFrame( animate );
    render();
};

let render = () => {
    renderer.render( scene, camera );
};

init();
animate();
image.src = 'canvas.png';