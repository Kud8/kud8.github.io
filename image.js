let width = 800;
let height = 800;
let center = {
    x: 400,
    y: 400
};
let R = 100;

let atCenterConst = width * height * 100000;

let isAtCenter = (x, y) =>  {
    let x_diff = (x-center.x)*(x-center.x);
    let y_diff = (y-center.y)*(y-center.y);
    let tmp = Math.random() * atCenterConst / (x_diff*x_diff + y_diff*y_diff);
    return x_diff + y_diff <= R*R || tmp >= 150;
};

let drawBlindSpot = (context) => {
    let blindSpotRadius = Math.min(height, width) / 11;
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

let drawBinarizedImage = (result, imageData) => {
    for (let y = 0; y < height; ++y) {
        let pos = y * width * 4;
        for (let x = 0; x < width; ++x) {
            let r = imageData.data[pos++];
            let g = imageData.data[pos++];
            let b = imageData.data[pos++];
            let a = imageData.data[pos++];
            if (isAtCenter(x, y)) {
                result.data[pos - 4] = Math.min(r*1.3, 255);
                result.data[pos - 3] = Math.min(g*1.3, 255);
                result.data[pos - 2] = b;
                result.data[pos - 1] = a;
            } else {
                let gray = (0.299 * r + 0.587 * g + 0.114 * b);
                result.data[pos - 4] = gray;
                result.data[pos - 3] = gray;
                result.data[pos - 2] = gray;
                result.data[pos - 1] = a;
            }
        }
    }
};

let inFirstBound = (x, y) => {
    let R_square_up = height*height/4.5;
    let R_square_bottom = height*height/25;
    let x_diff = (x-center.x)*(x-center.x);
    let y_diff = (y-center.y)*(y-center.y);
    return (x_diff + y_diff >= R_square_bottom) && (x_diff + y_diff < R_square_up);
};

let inSecondBound = (x, y) => {
    let R_square = height*height/4.5;
    let x_diff = (x-center.x)*(x-center.x);
    let y_diff = (y-center.y)*(y-center.y);
    return x_diff + y_diff >= R_square;
};

let inZeroBound = (x, y) => {
    let R_square_up = height*height/25;
    let R_square_bottom = height*height/30;
    let x_diff = (x-center.x)*(x-center.x);
    let y_diff = (y-center.y)*(y-center.y);
    return (x_diff + y_diff >= R_square_bottom) && (x_diff + y_diff < R_square_up);
};

let drawUnfocusedBounds = (result, imageData) => {
    for (let y = 0; y < height; ++y) {
        let pos = y * width * 4;
        for (let x = 0; x < width; ++x) {
            let r = imageData.data[pos++];
            let g = imageData.data[pos++];
            let b = imageData.data[pos++];
            let a = imageData.data[pos++];
            let gray = (0.299 * r + 0.587 * g + 0.114 * b);
            let size0 = 2;
            let size1 = 3;
            let size2 = 4;
            if (x % size1 === (size1-1) && y % size1 === (size1-1) && inFirstBound(x, y)) {
                for (let k = 0; k < size1; ++k) {
                    for (let i = 0; i < size1; ++i) {
                        result.data[pos - k*width*4 - 4*i - 4] = gray;
                        result.data[pos - k*width*4 - 4*i - 3] = gray;
                        result.data[pos - k*width*4 - 4*i - 2] = gray;
                        result.data[pos - k*width*4 - 4*i - 1] = a;
                    }
                }
            } else if (x % size2 === (size2-1) && y % size2 === (size2-1) && inSecondBound(x, y)) {
                for (let k = 0; k < size2; ++k) {
                    for (let i = 0; i < size2; ++i) {
                        result.data[pos - k*width*4 - 4*i - 4] = gray;
                        result.data[pos - k*width*4 - 4*i - 3] = gray;
                        result.data[pos - k*width*4 - 4*i - 2] = gray;
                        result.data[pos - k*width*4 - 4*i - 1] = a;
                    }
                }
            } else if (x % size1 === (size1-1) && y % size1 === (size1-1) && inZeroBound(x, y)) {
                for (let k = 0; k < size0; ++k) {
                    for (let i = 0; i < size0; ++i) {
                        result.data[pos - k*width*4 - 4*i - 4] = gray;
                        result.data[pos - k*width*4 - 4*i - 3] = gray;
                        result.data[pos - k*width*4 - 4*i - 2] = gray;
                        result.data[pos - k*width*4 - 4*i - 1] = a;
                    }
                }
            }
        }
    }
};

let imageLoaded = (ev) => {
    let element = document.getElementById("cancan");
    let context = element.getContext("2d");

    let im = ev.target;

    width = im.width;
    height = im.height;
    center = {
        x: width/2,
        y: height/2
    };
    R = Math.min(height, width) / 10;
    atCenterConst = width * height * 100000;

    context.canvas.width = width;
    context.canvas.height = height;

    context.translate(width, height);
    context.rotate(Math.PI);

    context.drawImage(im, 0, 0);
    let imageData = context.getImageData(0, 0, width, height);
    let result = context.getImageData(0, 0, width, height);

    drawBinarizedImage(result, imageData);
    drawUnfocusedBounds(result, imageData);
    context.putImageData(result, 0, 0);
    drawBlindSpot(context);
};

im = new Image();
im.onload = imageLoaded;
im.src = 'img/mipt2.jpg';
