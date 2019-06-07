function randomInteger(min, max) {
    const rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

const WIDTH = 1024;
const HEIGHT = 1024;
const PIXELS_LENGTH = WIDTH * HEIGHT * 4;
const canvasDuplicates = 2;

const IMAGE_OLD = 'http://image.sendsay.ru/image/x_1480704971639731/test1/1024.jpg';
const IMAGE = 'http://image.sendsay.ru/image/x_1480704971639731/test1/canvas1024_2.png';

let renderers = [];
let scenes = [];
let cameras = [];
let gl = [];
let textures = [];
let materials = [];
let isImageUploaded = [false, false];

const filterTextureData = new Uint8Array(PIXELS_LENGTH);
const emptyTextureData = new Uint8Array(PIXELS_LENGTH);

let filterTexture = new THREE.DataTexture( filterTextureData, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.UnsignedByteType );
let emptyTexture = new THREE.DataTexture( emptyTextureData, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.UnsignedByteType );

filterTexture.needsUpdate = true;
emptyTexture.needsUpdate = true;

const LAMBDA = 1;
const L = 80;
const EPS = 0.02;
const CAMERA_STEP = 3;

const moveFunctions = {
    getDefaultH: () => {
        const res = [];
        for (let i = 0; i < L; ++i) {
            const row = new Array(L);
            row.fill(1);

            res.push(row);
        }

        return res;
    },
    updateH: (newI, newJ) => {
        for (let i = 0; i < L; ++i) {
            for (let j = 0; j < L; ++j) {
                if (i === newI && j === newJ) {
                    h[i][j] += 1;
                } else {
                    h[i][j] *= (1 - EPS);
                }
            }
        }
    },
    getPenalty: (i, j) => {
        return LAMBDA * L * (Math.pow((i - i_0) / i_0, 2) + Math.pow((j - j_0) / j_0, 2))
    },
    getObject: (newI, newJ, id) => ({
        newI, newJ, value: h[newI][newJ] + moveFunctions.getPenalty(newI, newJ), id
    }),
    getDirection: (i, j) => {
        const variants = [
            moveFunctions.getObject(i - 1, j, 'left'),
            moveFunctions.getObject(i + 1, j, 'right'),
            moveFunctions.getObject(i, j - 1, 'down'),
            moveFunctions.getObject(i, j + 1, 'up'),
        ];

        const minValue = Math.min(...variants.map(v => v.value));
        const minimums = variants.filter((v) => v.value === minValue);
        const randIndex = randomInteger(0, minimums.length);

        return minimums[randIndex];
    },
    updateCameraPosition: (id) => {
        const res = {x: 0, y: 0};
        switch (id) {
            case 'up':
                res.y = CAMERA_STEP;
                break;
            case 'down':
                res.y = -CAMERA_STEP;
                break;
            case 'left':
                res.x = CAMERA_STEP;
                break;
            case 'right':
                res.x = -CAMERA_STEP;
                break;
            default:
                break;
        }

        for (let i = 0; i < canvasDuplicates; ++i) {
            cameras[i].position.x += res.x;
            cameras[i].position.y += res.y;

            let controls = new THREE.OrbitControls(cameras[i]);
            controls.minDistance = 75;
            controls.maxDistance = 200;
        }
    }
};

const init = () => {
    const imageOld = document.createElement('img');
    imageOld.src = IMAGE_OLD;
    document.body.appendChild(imageOld);

    const vertexShader = document.getElementById('vertex_shader').textContent;
    const fragmentShader = document.getElementById('fragment_shader').textContent;

    for (let i = 0; i < canvasDuplicates; ++i) {
        renderers.push(new THREE.WebGLRenderer());
        renderers[i].setSize(WIDTH, HEIGHT);
        const canvas = renderers[i].domElement;
        document.body.appendChild(canvas);
        gl.push(canvas.getContext("webgl"));

        scenes.push(new THREE.Scene());
        cameras.push(new THREE.PerspectiveCamera(30, 1, 1, 1000));
        cameras[i].position.x = 0;
        cameras[i].position.y = 0;
        cameras[i].position.z = 150;

        const image = document.createElement('img');
        textures.push(new THREE.Texture(image));
        image.addEventListener('load', function () {
            textures[i].needsUpdate = true;
            isImageUploaded[i] = true;
        });
        image.crossOrigin = "anonymous";
        image.src = IMAGE;

        materials.push(new THREE.ShaderMaterial({
            uniforms: {
                "texture1": {type: "t", value: textures[i]},
                "texture2": {type: "t", value: i === 0 ? filterTexture : emptyTexture}
            },
            vertexShader,
            fragmentShader
        }));

        const mesh = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 24, 0, Math.PI), materials[i]);
        mesh.needsUpdate = true;
        scenes[i].add(mesh);
    }
};

let oldPixels;
const arePixelsDifferent = (r0, g0, b0, r1, g1, b1) => {

    return Math.abs(r0 - r1) > 0
        && Math.abs(g0 - g1) > 1
        && Math.abs(b0 - b1) > 0;
};
const updateImagePixeles = () => {
    const pixels = new Uint8Array(PIXELS_LENGTH);
    gl[1].readPixels(0, 0, WIDTH, HEIGHT, gl[1].RGBA, gl[1].UNSIGNED_BYTE, pixels);

    if (oldPixels) {
        let isBlack = true;
        for (let i = 3; i < PIXELS_LENGTH; i += 4) {
            if (arePixelsDifferent(
                pixels[i - 3], pixels[i - 2], pixels[i - 1],
                oldPixels[i - 3], oldPixels[i - 2], oldPixels[i - 1]
            )) {
                filterTexture.image.data[i] = 0;
                isBlack = false;
            } else {
                filterTexture.image.data[i] = 255;
            }
        }

        filterTexture.needsUpdate = !isBlack;

        oldPixels = pixels;
    } else {
        oldPixels = pixels;
    }
};

const i_0 = Math.round(L / 2);
const j_0 = Math.round(L / 2);
let h = moveFunctions.getDefaultH();
let i = i_0;
let j = j_0;

const render = () => {
    try {
        const {newI, newJ, id} = moveFunctions.getDirection(i, j);
        i = newI;
        j = newJ;

        moveFunctions.updateH(i, j);
        moveFunctions.updateCameraPosition(id);
    } catch (e) {
    }

    if (isImageUploaded[0] && isImageUploaded[1]) {
        updateImagePixeles();
    }

    for (let i = 0; i < canvasDuplicates; ++i) {
        renderers[i].render(scenes[i], cameras[i]);
    }
};

let animate = () => {
    requestAnimationFrame(animate);
    render();
};

init();
animate();
