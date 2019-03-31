let camera, scene, renderer;
let image;

let height = 800;
let center = {
    x: 400,
    y: 400
};

let init = () => {
    image = document.createElement( 'img' );
    let image_old = document.createElement( 'img' );
    image_old.src = 'img/mipt2.jpg';
    document.body.appendChild( image_old );

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

    var texture = new THREE.Texture( image );
    image.addEventListener( 'load', function() { texture.needsUpdate = true; } );

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
image.src = 'img/canvas.png';
