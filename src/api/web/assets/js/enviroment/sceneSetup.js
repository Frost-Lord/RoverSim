function setupScene(scene) {
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5).normalize();
    scene.add(directionalLight);

    const textureLoader = new THREE.TextureLoader();
    const albedo = textureLoader.load('/static/assets/texture/rocky-dunes1_albedo.png');
    const ao = textureLoader.load('/static/assets/texture/rocky-dunes1_ao.png');
    const height = textureLoader.load('/static/assets/texture/rocky-dunes1_height.png');
    const metallic = textureLoader.load('/static/assets/texture/rocky-dunes1_metallic.png');
    const normal = textureLoader.load('/static/assets/texture/rocky-dunes1_normal-ogl.png');
    const roughness = textureLoader.load('/static/assets/texture/rocky-dunes1_roughness.png');

    const repeatCount = 30;
    [albedo, ao, height, metallic, normal, roughness].forEach(texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatCount, repeatCount);
    });

    const groundMaterial = new THREE.MeshStandardMaterial({
        map: albedo,
        aoMap: ao,
        displacementMap: height,
        metalnessMap: metallic,
        normalMap: normal,
        roughnessMap: roughness,
        displacementScale: 0.1,
    });

    const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 256, 256);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    setupStars(scene);
}

function setupStars(scene) {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const starVertices = [];

    for (let i = 0; i < starCount; i++) {
        const x = THREE.Math.randFloatSpread(1000);
        const y = THREE.Math.randFloatSpread(1000);
        const z = THREE.Math.randFloatSpread(1000);
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function updateCameraPosition(camera, rover) {
    const offset = new THREE.Vector3(0, 5, -10);
    const relativeCameraOffset = offset.applyMatrix4(rover.matrixWorld);
    camera.position.copy(relativeCameraOffset);
    camera.lookAt(rover.position);
}
