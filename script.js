// Three.js Scene Setup
let scene, camera, renderer, controls;
let garageDoor,
  doorPanels = [];
let scrollPercent = 0;
let isLoaded = false;

// Initialize the application
function init() {
  setupScene();
  setupLights();
  loadSketchfabGarageDoor();
  setupScrollListener();
  animate();

  // Hide loading screen after everything is loaded
  setTimeout(() => {
    document.getElementById("loading-screen").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("loading-screen").style.display = "none";
    }, 500);
  }, 2000);
}

// Setup Three.js scene
function setupScene() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);

  // Camera
  const isMobile = window.innerWidth <= 768;
  const cameraDistance = isMobile ? 35 : 25; // Further back on mobile
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, cameraDistance);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for mobile performance
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;

  document.getElementById("scene-container").appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = false; // Disable auto-rotation for static door
  controls.enableRotate = false; // Disable manual rotation

  // Handle window resize
  window.addEventListener("resize", onWindowResize);
}

// Setup lighting
function setupLights() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);

  // Point light for dramatic effect
  const pointLight = new THREE.PointLight(0x6366f1, 0.4, 12);
  pointLight.position.set(0, 3, 2);
  scene.add(pointLight);
}

// Load the garage door model from garage_door_01 folder
function loadSketchfabGarageDoor() {
  const loader = new THREE.GLTFLoader();

  // Load the existing garage door model from garage_door_01 folder
  const modelPath = "garage_door_01/scene.gltf";

  loader.load(
    modelPath,
    (gltf) => {
      console.log("Garage door model loaded successfully:", gltf);

      garageDoor = gltf.scene;

      // Scale and position the model appropriately - closer to camera
      const isMobile = window.innerWidth <= 768;
      const scale = isMobile ? 15 : 25; // Much smaller scale on mobile to zoom out
      garageDoor.scale.set(scale, scale, scale);

      // Position model differently for mobile vs desktop
      if (isMobile) {
        garageDoor.position.set(0, -5, 10); // Further back and higher for mobile
      } else {
        garageDoor.position.set(0, -10, 5); // Original position for desktop
      }

      // Enable shadows for all meshes
      garageDoor.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          console.log("Found mesh:", child.name);

          // Store references to door panels for animation
          // Look for door-related meshes but exclude frame
          if (
            (child.name.includes("Door") ||
              child.name.includes("door") ||
              child.name.includes("panel") ||
              child.name.includes("slat") ||
              child.name.includes("rolling-gate")) &&
            !child.name.includes("Frame") &&
            !child.name.includes("frame")
          ) {
            child.userData.originalY = child.position.y;
            child.userData.originalZ = child.position.z;
            child.userData.originalRotation = child.rotation.z;
            doorPanels.push(child);
            console.log("Added door panel for animation:", child.name);
          }
        }
      });

      // Add GALVANIX text to the garage door
      addGalvanixTextToDoor();

      scene.add(garageDoor);
      isLoaded = true;

      console.log(
        "Garage door model loaded with",
        doorPanels.length,
        "door panels"
      );

      // If no panels found, create fallback animation with all meshes
      if (doorPanels.length === 0) {
        console.log(
          "No door panels found, creating fallback animation with all meshes..."
        );
        createFallbackAnimation();
      }
    },
    (progress) => {
      console.log(
        "Loading progress:",
        (progress.loaded / progress.total) * 100 + "%"
      );
    },
    (error) => {
      console.error("Error loading garage door model:", error);
      console.log("Creating fallback garage door...");
      createFallbackGarageDoor();
    }
  );
}

// Create fallback animation if no panels are found
function createFallbackAnimation() {
  // Try to find any meshes that could be animated
  garageDoor.traverse((child) => {
    if (child.isMesh) {
      child.userData.originalY = child.position.y;
      child.userData.originalZ = child.position.z;
      child.userData.originalRotation = child.rotation.z;
      doorPanels.push(child);
      console.log("Added mesh for fallback animation:", child.name);
    }
  });

  console.log("Fallback animation created with", doorPanels.length, "meshes");

  // If still no meshes found, create a simple garage door
  if (doorPanels.length === 0) {
    console.log("No meshes found in model, creating simple garage door...");
    createFallbackGarageDoor();
  }
}

// Add GALVANIX text to the garage door
function addGalvanixTextToDoor() {
  // Create a canvas for the text texture
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 128;

  // Set background to transparent
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Create gradient for text
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#6366f1");
  gradient.addColorStop(1, "#8b5cf6");

  // Set text properties
  context.font = "bold 48px Inter, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = gradient;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;

  // Add text with stroke for better visibility
  context.strokeText("GALVANIX", canvas.width / 2, canvas.height / 2);
  context.fillText("GALVANIX", canvas.width / 2, canvas.height / 2);

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // Create plane geometry for the text
  const textGeometry = new THREE.PlaneGeometry(8, 2);
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
  });

  const textMesh = new THREE.Mesh(textGeometry, textMaterial);

  // Position the text on the garage door (adjust these values as needed)
  textMesh.position.set(0, 2, 0.1); // Slightly in front of the door
  textMesh.rotation.x = -Math.PI / 2; // Rotate to face forward

  // Add the text to the garage door so it moves with it
  garageDoor.add(textMesh);

  // Store reference to text for potential animation
  garageDoor.userData.galvanixText = textMesh;

  console.log("GALVANIX text added to garage door");
}

// Create a fallback garage door if the model fails to load
function createFallbackGarageDoor() {
  console.log("Creating fallback garage door...");

  // Create individual door panels that retract
  const panelCount = 8;
  const panelHeight = 3;
  const panelWidth = 20;
  const panelDepth = 0.1;

  for (let i = 0; i < panelCount; i++) {
    const panelGeometry = new THREE.BoxGeometry(
      panelWidth,
      panelHeight - 0.05,
      panelDepth
    );
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0x1e293b,
      shininess: 90,
      specular: 0x475569,
    });

    const panel = new THREE.Mesh(panelGeometry, panelMaterial);

    // Position panels from bottom to top
    const panelY =
      (panelCount * panelHeight) / 2 - i * panelHeight + panelHeight / 2;
    panel.position.set(0, panelY, 0);

    panel.userData = {
      originalY: panelY,
      originalZ: 0,
      originalRotation: 0,
      index: i,
    };

    panel.castShadow = true;
    panel.receiveShadow = true;

    doorPanels.push(panel);
    scene.add(panel);
  }

  // Add GALVANIX text to the fallback garage door
  addGalvanixTextToFallbackDoor();

  isLoaded = true;
  console.log("Fallback garage door created with", panelCount, "panels");
}

// Add GALVANIX text to the fallback garage door
function addGalvanixTextToFallbackDoor() {
  // Create a canvas for the text texture
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 128;

  // Set background to transparent
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Create gradient for text
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#6366f1");
  gradient.addColorStop(1, "#8b5cf6");

  // Set text properties
  context.font = "bold 48px Inter, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = gradient;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;

  // Add text with stroke for better visibility
  context.strokeText("GALVANIX", canvas.width / 2, canvas.height / 2);
  context.fillText("GALVANIX", canvas.width / 2, canvas.height / 2);

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // Create plane geometry for the text
  const textGeometry = new THREE.PlaneGeometry(16, 4);
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
  });

  const textMesh = new THREE.Mesh(textGeometry, textMaterial);

  // Position the text on the fallback garage door
  textMesh.position.set(0, 8, 0.1); // Position above the panels
  textMesh.rotation.x = -Math.PI / 2; // Rotate to face forward

  // Add the text to the scene
  scene.add(textMesh);

  console.log("GALVANIX text added to fallback garage door");
}

// Setup scroll listener for animations
function setupScrollListener() {
  window.addEventListener("scroll", () => {
    scrollPercent =
      window.scrollY / (document.body.scrollHeight - window.innerHeight);

    // Animate garage door opening based on scroll
    animateGarageDoor();

    // Animate camera position
    animateCamera();

    // Show/hide scroll indicator
    const scrollIndicator = document.querySelector(".scroll-indicator");
    if (scrollPercent > 0.1) {
      scrollIndicator.style.opacity = "0";
    } else {
      scrollIndicator.style.opacity = "0.7";
    }
  });
}

// Animate garage door opening with proper retraction (matching Sketchfab model)
function animateGarageDoor() {
  if (!isLoaded || doorPanels.length === 0) return;

  doorPanels.forEach((panel, index) => {
    const originalY = panel.userData.originalY;
    const originalZ = panel.userData.originalZ;
    const originalRotation = panel.userData.originalRotation;

    // Calculate retraction based on scroll
    // Each panel starts retracting when the previous one is mostly retracted
    const panelStartThreshold = index * 0.12; // Each panel starts 12% later (slower)
    const panelProgress = Math.max(
      0,
      Math.min(1, (scrollPercent - panelStartThreshold) * 1.5)
    ); // Slower animation

    if (panelProgress > 0) {
      // Move panel in Z direction only (toward/away from camera)
      const retractionDistance = 8; // Distance to move in Z direction
      const retractionProgress = Math.min(1, panelProgress * 1.2); // Slower retraction

      // Keep Y position exactly the same (no up/down movement)
      panel.position.y = originalY;

      // Move panel in Z direction (away from camera when opening - inverted)
      panel.position.z = originalZ + retractionProgress * retractionDistance;

      // Keep rotation the same (no rotation)
      panel.rotation.z = originalRotation;
    } else {
      // Reset panel to original position
      panel.position.y = originalY;
      panel.position.z = originalZ;
      panel.rotation.z = originalRotation;
    }
  });
}

// Animate camera position
function animateCamera() {
  const isMobile = window.innerWidth <= 768;
  const baseDistance = isMobile ? 35 : 25;

  // Camera moves back and slightly up as user scrolls
  const targetY = 0 + scrollPercent * 3;
  const targetZ = baseDistance + scrollPercent * 8;

  camera.position.y += (targetY - camera.position.y) * 0.05;
  camera.position.z += (targetZ - camera.position.z) * 0.05;

  // Look at the center of the garage door
  const lookAtY = isMobile ? -5 : 0;
  camera.lookAt(0, lookAtY, 5);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Adjust pixel ratio for mobile performance
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Adjust camera distance based on screen size
  const isMobile = window.innerWidth <= 768;
  const cameraDistance = isMobile ? 35 : 25;
  camera.position.z = cameraDistance;

  // Update model scale and position if it's loaded
  if (garageDoor && isLoaded) {
    const scale = isMobile ? 15 : 25;
    garageDoor.scale.set(scale, scale, scale);

    if (isMobile) {
      garageDoor.position.set(0, -5, 10);
    } else {
      garageDoor.position.set(0, -10, 5);
    }
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls
  controls.update();

  // Render scene
  renderer.render(scene, camera);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Add intersection observer for section animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe all sections
document.querySelectorAll(".section").forEach((section) => {
  observer.observe(section);
});
