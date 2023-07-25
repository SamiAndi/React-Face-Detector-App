import { useState, useRef, useEffect } from "react";
import '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import Webcam from 'react-webcam';
import mergeImages from 'merge-images';
import './app.css';
let states = {};

function App() {
    const [color, setColor] = useState('#24DB24');
    const [cam, setCam] = useState(false);
    const [stop, setStop] = useState(false);
    const [mirror, setMirror] = useState(true);
    const [delay, setDelay] = useState(500);
    const [zoom, setZoom] = useState(100);

    states = { color, cam, stop, mirror, delay, zoom };
    const webcamRef = useRef();
    const canvasRef = useRef();

    useEffect(() => {
        createDetector();
    }, []);

    async function createDetector() {
        const model = faceLandmarksDetection.SupportedPackages.mediapipeFacemesh;
        const detector = await faceLandmarksDetection.load(model);
        console.log('detector model created');
        detect(detector);
    }

    async function detect(detector) {
        if (
            !states.stop &&
            typeof webcamRef.current !== 'undefined' &&
            webcamRef.current !== null &&
            webcamRef.current.video.readyState == 4
        ) {
            const video = webcamRef.current.video;
            const videoSize = [video.videoWidth, video.videoHeight];
            const videoOffset = fitSize(video.offsetWidth, video.offsetHeight, ...videoSize);
            [canvasRef.current.width, canvasRef.current.height] = videoOffset;

            const faces = await detector.estimateFaces({ input: video });
            const ctx = canvasRef.current.getContext('2d');
            for (let i = 0; i < faces.length; i++) {
                const face = faces[i].scaledMesh;
                for (let j = 0; j < face.length; j++) {
                    const point = face[j];
                    const x = videoOffset[0] / videoSize[0] * point[0];
                    const y = videoOffset[1] / videoSize[1] * point[1];
                    ctx.beginPath();
                    ctx.arc(x, y, 1.1, 0, 3 * Math.PI);
                    ctx.fillStyle = states.color;
                    ctx.fill();
                }
            }
            console.log('stop', states.stop, 'delay', states.delay);
        }
        setTimeout(() => detect(detector), states.delay);
    }

    function fitSize(containerWidth, containerHeight, width, height, contains = true) {
        let doRatio = width / height;
        let cRatio = containerWidth / containerHeight;
        let targetWidth = 0;
        let targetHeight = 0;
        let test = contains ? (doRatio > cRatio) : (doRatio < cRatio);
        if (test) {
            targetWidth = containerWidth;
            targetHeight = targetWidth / doRatio;
        } else {
            targetHeight = containerHeight;
            targetWidth = targetHeight * doRatio;
        }
        return [targetWidth, targetHeight];
    }

    function handleDownload() {
        mergeImages([webcamRef.current.getScreenshot(), canvasRef.current.toDataURL()])
            .then(b64 => {
                let link = document.createElement('a');
                link.href = b64;
                link.download = 'face.jpg';
                link.click();
            });
    }

    function handleColor(e) {
        const input = e.target.value;
        setColor(input);
    }

    function handleCam() {
        setCam(prev => !prev);
    }

    function handleStop() {
        setStop(prev => !prev);
        !stop && console.log('stopped');
    }

    function handleMirror() {
        setMirror(prev => !prev);
    }

    function handleDelay(e) {
        const input = e.target.value;
        setDelay(Number(input));
    }

    function handleZoom(e) {
        const input = e.target.value;
        setZoom(Number(input));
    }

    return (
        <>
            <div style={{ zoom: zoom / 100 }} className={mirror ? 'mirror' : ''}>
                <Webcam ref={webcamRef} className={!cam ? 'deactive' : ''} />
                <canvas ref={canvasRef}></canvas>
            </div>
            <div className="panel">
                <p>
                    <button onClick={handleDownload}>Take Picture</button>
                    <span>| Color : </span>
                    <input type='color' value={color} onChange={handleColor} />
                </p>
                <p>
                    <button onClick={handleCam}>{cam ? 'Hide Cam' : 'Show Cam'}</button>
                    <button onClick={handleStop}>{stop ? 'Start' : 'Stop'}</button>
                    <button onClick={handleMirror}>Mirror</button>
                </p>
                <p>
                    <span>Delay : </span>
                    <input type='range' min={50} max={1000} value={delay} onChange={handleDelay} />
                    {' ' + delay}
                </p>
                <p>
                    <span>Zoom : </span>
                    <input type='range' min={50} max={200} value={zoom} onChange={handleZoom} />
                    {' ' + zoom}
                </p>
            </div>
        </>
    );
}

export default App;