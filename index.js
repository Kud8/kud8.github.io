function randomInteger(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
}
function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

let camera, scene, renderer, mesh, texture;
let image, pixelsLength;
let canvas, gl;

const width = 512;
const height = 512;

const lambda = 1;
const L = 50;
const eps = 0.02;
const i_0 = Math.round(L / 2);
const j_0 = Math.round(L / 2);
let i = i_0;
let j = j_0;

const getPenalty = (i, j) => {
    return lambda * L * (Math.pow((i - i_0) / i_0, 2) + Math.pow((j - j_0) / j_0, 2))
};

const getDefaultH = () => {
    const res = [];
    for (let i = 0; i < L; ++i) {
        const row = [];
        for (let i = 0; i < L; ++i) {
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
    for (let i = 0; i < L; ++i) {
        for (let j = 0; j < L; ++j) {
            if (i === newI && j === newJ) {
                h[i][j] += 1;
            } else {
                h[i][j] *= (1 - eps);
            }
        }
    }
};

let isImageUploaded = false;

const init = () => {
    const imageOld = document.createElement('img');
    imageOld.src = 'https://res.cloudinary.com/dzxpcldgh/image/upload/v1633621974/mipt2_fdhq5w.jpg';
    document.body.appendChild(imageOld);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    canvas = renderer.domElement;
    document.body.appendChild(canvas);
    gl = canvas.getContext("webgl");

    pixelsLength = width * height * 4;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(30, 1, 1, 1000);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 150;

    let controls = new THREE.OrbitControls(camera);
    controls.minDistance = 75;
    controls.maxDistance = 200;

    image = document.createElement('img');

    texture = new THREE.Texture(image);
    image.addEventListener('load', function () {
        texture.needsUpdate = true;
        isImageUploaded = true;
    });

    var uniforms = {
        "texture": {type: "t", value: texture}
    };

    var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById('vertex_shader').textContent,
        fragmentShader: document.getElementById('fragment_shader').textContent
    });

    mesh = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 24, 0, Math.PI), material);
    mesh.needsUpdate = true;
    scene.add(mesh);
};

let frameNumber = 0;
let animate = () => {
    requestAnimationFrame(animate);
    render();

    // if (frameNumber === 1) {
    //     frameNumber = 0
    // } else {
    //     ++frameNumber;
    // }
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
    let controls = new THREE.OrbitControls(camera);
    controls.minDistance = 75;
    controls.maxDistance = 200;
};

let count = 1;
let oldPixels;

const arePixelsDifferent = (r0, g0, b0, r1, g1, b1) => {
    const diff = 5;

    return Math.abs(r0 - r1) > 3 * diff
        && Math.abs(g0 - g1) > 5 * diff
        && Math.abs(b0 - b1) > 1 * diff;
};


const updateImagePixeles = () => {
    const pixels = new Uint8Array(pixelsLength);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    if (oldPixels) {
        const newPixels = new Uint8Array(pixels);

        for (let i = 3; i < pixelsLength; i += 4) {
            if (arePixelsDifferent(
                pixels[i - 3], pixels[i - 2], pixels[i - 1],
                oldPixels[i - 3], oldPixels[i - 2], oldPixels[i - 1]
            )) {
                newPixels[i - 3] = pixels[i - 3];
                newPixels[i - 2] = pixels[i - 2];
                newPixels[i - 1] = pixels[i - 1];
                newPixels[i] = pixels[i];
            } else {
                newPixels[i - 3] = 0;
                newPixels[i - 2] = 0;
                newPixels[i - 1] = 0;
                newPixels[i] = 0;
            }
        }

        // gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, newPixels);
        // if (isPowerOf2(width) && isPowerOf2(height)) {
        //     gl.generateMipmap(gl.TEXTURE_2D);
        // } else {
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // }

        oldPixels = pixels;
    } else {
        oldPixels = pixels;
    }
    // console.log(pixels.filter((v) => v !== 0 && v !== 255));
};


function render() {
    if (count < 100) {
        try {
            const {newI, newJ, id} = getDirection(i, j);
            i = newI;
            j = newJ;

            updateH(i, j);
            updateCameraPosition(id);
        } catch (e) {
        }

        if (isImageUploaded) {
            updateImagePixeles();
        }
        ++count;
    } else {
        h = getDefaultH();
        i = i_0;
        j = j_0;
        count = 0;
    }

    renderer.render(scene, camera);
}

init();
animate();

image.crossOrigin = "anonymous";
image.src = 'https://res.cloudinary.com/dzxpcldgh/image/upload/v1633621982/canvas_wbydqh.png';
