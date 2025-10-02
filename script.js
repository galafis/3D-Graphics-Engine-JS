document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("graphicsCanvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // Set canvas size
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Vertex shader program
    const vsSource = `
        attribute vec4 aVertexPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }
    `;

    // Fragment shader program
    const fsSource = `
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    `;

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
        },
    };

    function initBuffers(gl) {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        const positions = [
            0.0,  1.0,  0.0,
           -1.0, -1.0,  0.0,
            1.0, -1.0,  0.0,
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        return { position: positionBuffer };
    }

    const buffers = initBuffers(gl);

    let squareRotation = 0.0;
    let then = 0;

    function drawScene(now) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = 45 * Math.PI / 180;   // in radians
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();

        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, squareRotation, [0, 0, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            3,
            gl.FLOAT,
            false,
            0,
            0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.useProgram(programInfo.program);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        squareRotation += deltaTime;

        requestAnimationFrame(drawScene);
    }

    // Dummy mat4 functions for demonstration. In a real project, use a library like gl-matrix.
    const mat4 = {
        create: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
        perspective: (out, fovy, aspect, near, far) => {
            const f = 1.0 / Math.tan(fovy / 2);
            out[0] = f / aspect;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = f;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = (near + far) / (near - far);
            out[11] = -1;
            out[12] = 0;
            out[13] = 0;
            out[14] = (2 * far * near) / (near - far);
            out[15] = 0;
            return out;
        },
        translate: (out, a, v) => {
            let x = v[0], y = v[1], z = v[2];
            let a00, a01, a02, a03;
            let a10, a11, a12, a13;
            let a20, a21, a22, a23;
            if (a === out) {
                out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
                out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
                out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
                out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
            } else {
                a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
                a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
                a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

                out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
                out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
                out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

                out[12] = a00 * x + a10 * y + a20 * z + a[12];
                out[13] = a01 * x + a11 * y + a21 * z + a[13];
                out[14] = a02 * x + a12 * y + a22 * z + a[14];
                out[15] = a03 * x + a13 * y + a23 * z + a[15];
            }
            return out;
        },
        rotate: (out, a, rad, axis) => {
            let x = axis[0], y = axis[1], z = axis[2];
            let len = Math.sqrt(x * x + y * y + z * z);
            let s = Math.sin(rad);
            let c = Math.cos(rad);
            let t = 1 - c;
            let a00, a01, a02, a03;
            let a10, a11, a12, a13;
            let a20, a21, a22, a23;

            if (len < 0.000001) { return null; }

            len = 1 / len;
            x *= len;
            y *= len;
            z *= len;

            a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
            a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
            a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

            // Construct the elements of the rotation matrix
            let b00 = x * x * t + c,
                b01 = y * x * t + z * s,
                b02 = z * x * t - y * s;
            let b10 = x * y * t - z * s,
                b11 = y * y * t + c,
                b12 = z * y * t + x * s;
            let b20 = x * z * t + y * s,
                b21 = y * z * t - x * s,
                b22 = z * z * t + c;

            // Perform rotation-specific matrix multiplication
            out[0] = a00 * b00 + a10 * b01 + a20 * b02;
            out[1] = a01 * b00 + a11 * b01 + a21 * b02;
            out[2] = a02 * b00 + a12 * b01 + a22 * b02;
            out[3] = a03 * b00 + a13 * b01 + a23 * b02;
            out[4] = a00 * b10 + a10 * b11 + a20 * b12;
            out[5] = a01 * b10 + a11 * b11 + a21 * b12;
            out[6] = a02 * b10 + a12 * b11 + a22 * b12;
            out[7] = a03 * b10 + a13 * b11 + a23 * b12;
            out[8] = a00 * b20 + a10 * b21 + a20 * b22;
            out[9] = a01 * b20 + a11 * b21 + a21 * b22;
            out[10] = a02 * b20 + a12 * b21 + a22 * b22;
            out[11] = a03 * b20 + a13 * b21 + a23 * b22;

            if (a !== out) { // If the source and destination differ, copy the unchanged last row
                out[12] = a[12];
                out[13] = a[13];
                out[14] = a[14];
                out[15] = a[15];
            }
            return out;
        }
    };

    requestAnimationFrame(drawScene);
});

