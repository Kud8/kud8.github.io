function randomInteger(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
}

let camera, scene, renderer;
let image;

const lambda = 1;
const L = 50;
const eps = 0.02;
const i_0 = Math.round(L / 2);
const j_0 = Math.round(L / 2);
let i = i_0;
let j = j_0;

const getPenalty = (i, j) => {
    return lambda * L * ( Math.pow((i - i_0) / i_0, 2) + Math.pow((j - j_0) / j_0, 2) )
};

const getDefaultH = () => {
    const res = [];
    for (let i = 0; i < L ; ++i) {
        const row = [];
        for (let i = 0; i < L ; ++i) {
            row.push(1);
        }
        res.push(row);
    }

    return res;
};

let h = getDefaultH();

const getObject = (newI, newJ, id) => ({
    newI, newJ, value: h[newI][newJ] + getPenalty(newI, newJ), id
});

const getDirection = (i, j) => {
    const variants = [
        getObject(i - 1, j, 'left'),
        getObject(i + 1, j, 'right'),
        getObject(i, j - 1, 'down'),
        getObject(i, j + 1, 'up'),
    ];

    const minValue = Math.min(...variants.map(v => v.value));
    const minimums = variants.filter((v) => v.value === minValue);
    const randIndex = randomInteger(0, minimums.length);

    return minimums[randIndex];
};

const updateH = (newI, newJ) => {
    for (let i = 0; i < L ; ++i) {
        for (let j = 0; j < L; ++j) {
            if (i === newI && j === newJ) {
                h[i][j] += 1;
            } else {
                h[i][j] *= (1 - eps);
            }
        }
    }
};

const init = () => {
    image = document.createElement( 'img' );
    const imageOld = document.createElement( 'img' );
    imageOld.src = 'img/mipt2.jpg';
    document.body.appendChild( imageOld );

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
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 150;

    let controls = new THREE.OrbitControls( camera );
    controls.minDistance = 75;
    controls.maxDistance = 200;

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

const CAMERA_STEP = 1;

const updateCameraPosition = (id) => {
    switch (id) {
        case 'up':
            camera.position.y += CAMERA_STEP;
            break;
        case 'down':
            camera.position.y -= CAMERA_STEP;
            break;
        case 'left':
            camera.position.x += CAMERA_STEP;
            break;
        case 'right':
            camera.position.x -= CAMERA_STEP;
            break;
        default:
            break;
    }
    let controls = new THREE.OrbitControls( camera );
    controls.minDistance = 75;
    controls.maxDistance = 200;
};

let count = 0;
function render(){
    if (count < 100) {
        try {
            const { newI, newJ, id } = getDirection(i, j);
            i = newI;
            j = newJ;

            updateH(i, j);
            updateCameraPosition(id);
        }
        catch (e) {}

        ++count;
    } else {
        h = getDefaultH();
        i = i_0;
        j = j_0;
        count = 0;
    }

    renderer.render( scene, camera );
}

init();
animate();
image.src = 'img/canvas.png';
