let scene, camera, renderer, mixer, basicModel, currentHat, controls, clock;
let animationActions = [], activeAction;

init();
animate();

function init() {
    // Scene, Camera, Renderer setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x777777);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio); // Set pixel ratio for better performance
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2); // Reduced intensity for performance
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Reduced intensity for performance
    scene.add(ambientLight);

    // Load basic model
    const loader = new THREE.GLTFLoader();
    loader.load('static/models/dance4.glb', function (gltf) {
        basicModel = gltf.scene;  // Access the scene property of the loaded object
        basicModel.position.set(0, 0, 0); 
        
        // Modify materials to be less reflective
        basicModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                if (child.material) {
                    child.material.shininess = 0;
                    child.material.reflectivity = 0.1;
                    child.material.metalness = 0;
                    child.material.roughness = 1;
                    child.material.needsUpdate = true;
                    console.log(child.material); // Log material details for debugging
                }
            }
        });

        console.log(gltf);
        
        scene.add(basicModel);
        console.log('Basic model loaded successfully');

        // Initialize mixer and load animation
        mixer = new THREE.AnimationMixer(basicModel);
        loadAnimation();
    }, undefined, function (error) {
        console.error('Error loading basic model:', error);
    });

    // Clock for animation
    clock = new THREE.Clock();

    // OrbitControls setup
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // Event listeners
    document.getElementById('hat1Button').addEventListener('click', () => {
        loadAndApplyHat('static/models/box_profile_metal_sheet_4k.glb');
    });
    document.getElementById('hat2Button').addEventListener('click', () => {
        loadAndApplyHat('static/models/danceone.glb');
    });
    document.getElementById('animateButton').addEventListener('click', playAnimation);
    document.getElementById('backgroundUpload').addEventListener('change', handleBackgroundUpload);
    document.getElementById('saveButton').addEventListener('click', startRecording);

    // Set camera position
    camera.position.set(0, -5, 10);
    camera.lookAt(scene.position);

    window.addEventListener('resize', onWindowResize, false);
}

function loadAnimation() {
    const loader = new THREE.FBXLoader();
    loader.load('static/models/new.fbx', function(object) {
        object.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;
            animationActions.push(action);
        });

        if (animationActions.length > 0) {
            activeAction = animationActions[0];
            console.log('Animation loaded successfully');
        }
    }, undefined, function(error) {
        console.error('Error loading animation:', error);
    });
}

function playAnimation() {
    if (mixer && activeAction) {
        activeAction.reset().play();
        console.log('Animation started');
    } else {
        console.log('No animation available. Make sure the animation is loaded.');
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) {
        mixer.update(delta);
    }
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadAndApplyHat(hatPath) {
    const loader = new THREE.GLTFLoader();
    if (currentHat) {
        currentHat.parent.remove(currentHat);
        currentHat = null;
        console.log('Hat removed');
    }

    loader.load(hatPath, function (gltf) {
        currentHat = gltf.scene;
        currentHat.position.set(0, -5.1, -0.2);

        const headBone = basicModel.getObjectByName('mixamorigHead');
        if (headBone) {
            headBone.add(currentHat);
        } else {
            basicModel.add(currentHat);
        }

        console.log('Hat added:', hatPath);
    }, undefined, function (error) {
        console.error('Error loading hat model:', error);
    });
}

function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const texture = new THREE.TextureLoader().load(e.target.result);
            scene.background = texture;
        };
        reader.readAsDataURL(file);
    }
}

function startRecording() {
    const canvas = renderer.domElement;
    let recorder;

    if (!canvas.captureStream && !canvas.mozCaptureStream) {
        console.error('Canvas capture is not supported on this browser.');
        return;
    }

    // Adjust resolution
    renderer.setSize(360, 640);

    const stream = canvas.captureStream ? canvas.captureStream(30) : canvas.mozCaptureStream(30);
    recorder = new RecordRTC(stream, {
        type: 'video',
        mimeType: 'video/mp4',
        bitsPerSecond: 800000  // Adjusted bitrate
    });

    recorder.startRecording();
    console.log('Recording started');

    playAnimation();

    setTimeout(() => {
        recorder.stopRecording(async function () {
            let blob = recorder.getBlob();
            const file = new File([blob], 'animation.mp4', { type: 'video/mp4' });

            // Create download button
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'Download Video';
            downloadButton.onclick = () => {
                invokeSaveAsDialog(file);
            };
            document.body.appendChild(downloadButton);

            // Attempt to share the file
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file]
                    });
                    console.log('Video shared successfully!');
                } catch (error) {
                    console.error('Error sharing video:', error);
                }
            } else {
                console.log('Web Share API is not supported or file format is not supported for sharing.');
            }

            // Get comment and upload
            const comment = prompt("Enter your comment:");
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) {
                    throw new Error('Failed to upload video');
                }
                const data = await response.json();
                console.log('Recording uploaded, filename:', data.filename);
                
                const commentData = {
                    video_name: data.filename,
                    comment: comment,
                    datetime: new Date().toISOString()
                };
                const commentResponse = await fetch('/comment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(commentData)
                });
                if (!commentResponse.ok) {
                    throw new Error('Failed to upload comment');
                }
                console.log('Comment uploaded');
            } catch (error) {
                console.error('Error during upload:', error);
            }
        });

        console.log('Recording stopped');
    }, 5000);
}
