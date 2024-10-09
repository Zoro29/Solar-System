// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls to allow the user to rotate around the scene
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Add a light to simulate the Sun
const light = new THREE.PointLight(0xffffff, 2, 10000);
light.position.set(0, 0, 0);
scene.add(light);

// Load background texture and set it to the scene
const backgroundTextureURL = 'back.jpg'; // Replace with the actual path of your background image
const textureLoader = new THREE.TextureLoader();
textureLoader.load(backgroundTextureURL, (texture) => {
    scene.background = texture;
});

// Define Sun's radius and texture URL
const sunRadius = 15;
const sunTextureURL = '8k_sun.jpg'; // Replace with a valid texture URL for the Sun

// Load the texture for the Sun
const sunTexture = textureLoader.load(sunTextureURL, undefined, undefined, (err) => {
    console.error('Sun texture loading failed:', err);
});

// Create Sun's geometry and material with texture
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Rotate the entire scene slightly
scene.rotation.z = THREE.Math.degToRad(10);
scene.rotation.x = THREE.Math.degToRad(10);

// Rest of your code for planets, orbits, asteroid belt, and animations...


// Function to create a planet and its orbit with additional rotation and optional texture
function createPlanet(size, color, orbitDistance, inclination, eccentricity, period, rotationSpeed = 0.01, textureURL = null) {
    const adjustedOrbitDistance = orbitDistance + sunRadius;

    // Create the planet geometry
    const planetGeometry = new THREE.SphereGeometry(size, 32, 32);

    // Apply texture if provided
    let planetMaterial;
    if (textureURL) {
        const textureLoader = new THREE.TextureLoader();
        const planetTexture = textureLoader.load(textureURL);
        planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture });
    } else {
        planetMaterial = new THREE.MeshStandardMaterial({ color: color });
    }

    const planet = new THREE.Mesh(planetGeometry, planetMaterial);

    // Set orbit properties
    planet.orbitDistance = adjustedOrbitDistance;
    planet.orbitAngle = Math.random() * Math.PI * 2;

    // Orbit speed based on period
    const periodInSeconds = period * 60;
    planet.orbitSpeed = (2 * Math.PI) / periodInSeconds;
    planet.rotationSpeed = rotationSpeed;

    // Create an orbit container to apply inclination
    const orbitContainer = new THREE.Object3D();
    orbitContainer.rotation.x = THREE.Math.degToRad(inclination);

    // Calculate ellipse parameters
    const semiMajorAxis = adjustedOrbitDistance;
    const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - Math.pow(eccentricity, 2));

    // Create the elliptical orbit
    const ellipseCurve = new THREE.EllipseCurve(0, 0, semiMajorAxis, semiMinorAxis, 0, 2 * Math.PI, false, 0);
    const ellipsePoints = ellipseCurve.getPoints(128);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    orbitContainer.add(orbit);

    orbitContainer.add(planet);
    scene.add(orbitContainer);

    // Store eccentricity for updating position
    planet.eccentricity = eccentricity;

    return { planet, orbitContainer };
}

// Function to update the planet's position considering eccentricity and rotation
function updatePlanetPosition(planet) {
    const semiMajorAxis = planet.orbitDistance;
    const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - Math.pow(planet.eccentricity, 2));

    planet.position.x = semiMajorAxis * Math.cos(planet.orbitAngle);
    planet.position.z = semiMinorAxis * Math.sin(planet.orbitAngle);

    // Apply rotation
    planet.rotation.y += planet.rotationSpeed;
}

// Function to create an elliptical asteroid belt with dots as asteroids
function createAsteroidBelt(innerRadius, outerRadius, innerEccentricity, outerEccentricity, count, beltWidth, yWidth) {
    const positions = [];
    const colors = [];

    const semiMajorAxisInner = innerRadius;
    const semiMinorAxisInner = semiMajorAxisInner * Math.sqrt(1 - Math.pow(innerEccentricity, 2));
    const semiMajorAxisOuter = outerRadius;
    const semiMinorAxisOuter = semiMajorAxisOuter * Math.sqrt(1 - Math.pow(outerEccentricity, 2));

    for (let i = 0; i < count; i++) {
        const orbitDistance = Math.random() * (outerRadius - innerRadius - beltWidth) + innerRadius + beltWidth / 2;
        const angle = Math.random() * Math.PI * 2;

        const t = (orbitDistance - innerRadius) / (outerRadius - innerRadius);
        const semiMajorAxis = semiMajorAxisInner + t * (semiMajorAxisOuter - semiMajorAxisInner);
        const semiMinorAxis = semiMinorAxisInner + t * (semiMinorAxisOuter - semiMinorAxisInner);

        const x = semiMajorAxis * Math.cos(angle);
        const z = semiMinorAxis * Math.sin(angle);
        const y = (Math.random() - 0.5) * yWidth;

        positions.push(x, y, z);
        colors.push(0.36, 0.23, 0.07); // Dark brown color
    }

    // Create a buffer geometry for the points
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Create a points material for the dots
    const material = new THREE.PointsMaterial({ size: 0.2, vertexColors: true });

    // Create the points object
    const asteroidBelt = new THREE.Points(geometry, material);
    scene.add(asteroidBelt);
}

// Eccentricities of Mars and Jupiter
const marsEccentricity = 0.0934;
const jupiterEccentricity = 0.0489;

// Create planets with calculated rotation speeds based on 1 day = 1 minute
const planets = [];
planets.push(createPlanet(0.35, 0xaaaaaa, 3.9, 3.38, 0.20563, 88, 0.05, 'mercury.jpg')); // Mercury
planets.push(createPlanet(0.87, 0xffdd44, 7.2, 3.86, 0.006772, 272.76, 0.05, 'venus.jpg')); // Venus
const earth = createPlanet(0.91, 0x00aaff, 10.0, 7.155, 0.016708, 365.25638, 0.05, '8k_earth_daymap.jpg'); // Earth
planets.push(earth);
planets.push(createPlanet(0.48, 0xff4500, 15.2, 5.65, 0.0934, 686.971, 0.05, 'mars.jpg')); // Mars
planets.push(createPlanet(10, 0xffa500, 52.044, 6.09, 0.0489, 4332.59, 0.05, '8k_jupiter.jpg')); // Jupiter
const saturn = createPlanet(8.33, 0xffd700, 95.826, 5.51, 0.0565, 10759.22, 0.05, '8k_saturn.jpg'); // Saturn
planets.push(saturn);
planets.push(createPlanet(3.63, 0x00ffdd, 192.184, 6.48, 0.046381, 30688.5, 0.05, '2k_uranus.jpg')); // Uranus
planets.push(createPlanet(3.52, 0x0000ff, 301.10388, 6.43, 0.009456, 60182.0, 0.05, '2k_neptune.jpg')); // Neptune
planets.push(createPlanet(0.166, 0x0000ff, 394.8, 11.88, 0.2488, 90560.0, 0.05, 'pluto.jpg')); // Pluto




// Set the camera position to zoom in on the Sun and Jupiter's orbit
camera.position.set(0, 0, 70);


// Update the animate function to include moon position update
function animate() {
    requestAnimationFrame(animate);

    // Update the positions of the planets in their orbits
    planets.forEach(({ planet }) => {
        planet.orbitAngle += planet.orbitSpeed;
        updatePlanetPosition(planet);
    });

  

    controls.update();
    renderer.render(scene, camera);
}
animate();


// Function to animate the scene


// Adjust canvas size on window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
