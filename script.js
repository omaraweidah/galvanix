let scene, camera, renderer, controls;
let garageDoor,
  doorPanels = [];
let scrollPercent = 0;
let isLoaded = false;

// Old gallery data removed since product specs section was removed

// Craftsmanship gallery data
const craftsmanshipData = {
  "100mm": [
    {
      src: "images/100mm/Screenshot_2025-08-27_at_8_18_46_PM.png",
      title: "Precision Manufacturing",
      description:
        "Each 100mm slat is precision-engineered with foam-filled cores for maximum insulation.",
    },
    {
      src: "images/100mm/Screenshot_2025-08-27_at_8_19_39_PM.png",
      title: "Interlocking Design",
      description:
        "Our patented zigzag interlock system ensures superior security and weather sealing.",
    },
    {
      src: "images/100mm/Screenshot_2025-08-27_at_8_20_12_PM.png",
      title: "Quality Assurance",
      description:
        "Every component undergoes rigorous quality control to meet our exacting standards.",
    },
  ],
  "80mm": [
    {
      src: "images/80mm/Screenshot_2025-08-27_at_8_28_34_PM.png",
      title: "Contoured Excellence",
      description:
        "Our 80mm slats feature advanced contoured design for strength and aesthetic appeal.",
    },
    {
      src: "images/80mm/Screenshot_2025-08-27_at_8_28_52_PM.png",
      title: "Galvanized Protection",
      description:
        "Premium galvanized steel construction with 120 zinc coating for ultimate durability.",
    },
  ],
  "guide-rails": [
    {
      src: "images/guide-rails/Screenshot_2025-08-27_at_8_26_53_PM.png",
      title: "Precision Engineering",
      description:
        "Custom-engineered guide rails ensure smooth operation and perfect alignment.",
    },
    {
      src: "images/guide-rails/Screenshot_2025-08-27_at_8_27_56_PM.png",
      title: "Structural Integrity",
      description:
        "Heavy-duty construction designed to withstand years of reliable operation.",
    },
    {
      src: "images/guide-rails/Screenshot_2025-08-27_at_8_28_04_PM.png",
      title: "Installation Excellence",
      description:
        "Precision-fitted components for seamless installation and optimal performance.",
    },
  ],
  "end-caps": [
    {
      src: "images/end-caps/Screenshot_2025-08-27_at_8_24_58_PM.png",
      title: "Precision Molding",
      description:
        "Engineered end caps provide structural integrity and complete weather sealing.",
    },
    {
      src: "images/end-caps/Screenshot_2025-08-27_at_8_25_25_PM.png",
      title: "Quality Materials",
      description:
        "Premium materials ensure long-lasting performance in all weather conditions.",
    },
    {
      src: "images/end-caps/Screenshot_2025-08-27_at_8_25_39_PM.png",
      title: "Perfect Fit",
      description:
        "Precision-engineered for exact fit and optimal sealing performance.",
    },
  ],
  "bottom-seal": [
    {
      src: "images/bottom-seal/Screenshot_2025-08-27_at_8_25_52_PM.png",
      title: "Weather Protection",
      description:
        "Advanced sealing technology ensures complete protection from the elements.",
    },
    {
      src: "images/bottom-seal/Screenshot_2025-08-27_at_8_26_11_PM.png",
      title: "Energy Efficiency",
      description:
        "Superior sealing reduces energy loss and maintains optimal indoor climate.",
    },
  ],
  misc: [
    {
      src: "images/misc/Screenshot_2025-08-27_at_8_24_05_PM.png",
      title: "State-of-the-Art Facility",
      description:
        "Our modern manufacturing facilities utilize cutting-edge technology and processes.",
    },
    {
      src: "images/misc/Screenshot_2025-08-27_at_8_24_38_PM.png",
      title: "Quality Control",
      description:
        "Rigorous testing and inspection ensures every component meets our standards.",
    },
    {
      src: "images/misc/Screenshot_2025-08-27_at_8_29_09_PM.png",
      title: "Advanced Machinery",
      description:
        "Precision manufacturing equipment delivers consistent, high-quality results.",
    },
    {
      src: "images/misc/Screenshot_2025-08-27_at_8_29_35_PM.png",
      title: "Material Excellence",
      description:
        "Only the finest raw materials are selected for Galvanix products.",
    },
    {
      src: "images/misc/Screenshot_2025-08-27_at_8_29_45_PM.png",
      title: "Process Innovation",
      description:
        "Continuous improvement in manufacturing processes ensures superior quality.",
    },
    {
      src: "images/misc/Screenshot_2025-08-27_at_8_30_07_PM.png",
      title: "Finishing Excellence",
      description:
        "Precision finishing processes deliver the perfect surface quality.",
    },
    {
      src: "images/misc/Screenshot_2025-08-27_at_8_30_21_PM.png",
      title: "Final Inspection",
      description:
        "Every product undergoes final quality inspection before shipment.",
    },
  ],
};

let craftsmanshipGalleries = {};
let autoScrollTimers = {};

function init() {
  // Ensure page starts at the top
  window.scrollTo(0, 0);

  // Initialize 3D scene for both desktop and mobile
  setupScene();
  setupLights();
  loadSketchfabGarageDoor();
  animate();

  initializeCraftsmanshipGalleries();
  setupScrollListener();
  setupMobileMenu();

  setTimeout(() => {
    document.getElementById("loading-screen").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("loading-screen").style.display = "none";
    }, 500);
  }, 2000);
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x008080);

  const isMobile = window.innerWidth <= 768;
  const cameraDistance = isMobile ? 40 : 25;
  const fov = isMobile ? 60 : 75; // Reduce FOV on mobile for better performance
  camera = new THREE.PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, cameraDistance);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Optimize pixel ratio for mobile
  const pixelRatio = isMobile
    ? Math.min(window.devicePixelRatio, 1.5)
    : Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = !isMobile; // Disable shadows on mobile for performance
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;

  document.getElementById("scene-container").appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.enableRotate = false;

  window.addEventListener("resize", onWindowResize);
}

function setupLights() {
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

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

  const pointLight = new THREE.PointLight(0x6366f1, 0.4, 12);
  pointLight.position.set(0, 3, 2);
  scene.add(pointLight);
}

function loadSketchfabGarageDoor() {
  const loader = new THREE.GLTFLoader();
  const modelPath = "garage_door_01/scene.gltf";

  loader.load(
    modelPath,
    (gltf) => {
      garageDoor = gltf.scene;

      const isMobile = window.innerWidth <= 768;
      const scale = isMobile ? 15 : 25; // Slightly larger scale for mobile
      garageDoor.scale.set(scale, scale, scale);

      if (isMobile) {
        garageDoor.position.set(0, -8, 6); // Better positioning for smaller hero section
      } else {
        garageDoor.position.set(0, -20, 5);
      }

      garageDoor.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

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
          }
        }
      });

      addGalvanixTextToDoor();
      scene.add(garageDoor);
      isLoaded = true;

      if (doorPanels.length === 0) {
        createFallbackAnimation();
      }
    },
    (progress) => {},
    (error) => {
      console.error("Error loading garage door model:", error);
    }
  );
}

function createFallbackAnimation() {
  garageDoor.traverse((child) => {
    if (child.isMesh) {
      child.userData.originalY = child.position.y;
      child.userData.originalZ = child.position.z;
      child.userData.originalRotation = child.rotation.z;
      doorPanels.push(child);
    }
  });

  if (doorPanels.length === 0) {
    createFallbackGarageDoor();
  }
}

function addGalvanixTextToDoor() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 128;

  context.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#6366f1");
  gradient.addColorStop(1, "#8b5cf6");

  context.font = "bold 48px Inter, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = gradient;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;

  context.strokeText("GALVANIX", canvas.width / 2, canvas.height / 2);
  context.fillText("GALVANIX", canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const textGeometry = new THREE.PlaneGeometry(8, 2);
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
  });

  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(0, 2, 0.1);
  textMesh.rotation.x = -Math.PI / 2;

  garageDoor.add(textMesh);
  garageDoor.userData.galvanixText = textMesh;
}

function setupScrollListener() {
  window.addEventListener("scroll", () => {
    scrollPercent =
      window.scrollY / (document.body.scrollHeight - window.innerHeight);

    // Only animate 3D elements if they exist
    if (isLoaded && doorPanels.length > 0) {
      animateGarageDoor();
    }
    if (camera) {
      animateCamera();
    }

    const scrollIndicator = document.querySelector(".scroll-indicator");
    if (scrollIndicator) {
      if (scrollPercent > 0.1) {
        scrollIndicator.style.opacity = "0";
      } else {
        scrollIndicator.style.opacity = "0.7";
      }
    }
  });
}

function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const headerNav = document.getElementById("header-nav");

  if (mobileMenuToggle && headerNav) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenuToggle.classList.toggle("active");
      headerNav.classList.toggle("active");

      // Prevent body scroll when menu is open
      if (headerNav.classList.contains("active")) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });

    // Close menu when clicking on nav links
    headerNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenuToggle.classList.remove("active");
        headerNav.classList.remove("active");
        document.body.style.overflow = "";
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !mobileMenuToggle.contains(e.target) &&
        !headerNav.contains(e.target)
      ) {
        mobileMenuToggle.classList.remove("active");
        headerNav.classList.remove("active");
        document.body.style.overflow = "";
      }
    });

    // Close menu on window resize to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        mobileMenuToggle.classList.remove("active");
        headerNav.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }
}

function animateGarageDoor() {
  if (!isLoaded || doorPanels.length === 0) return;

  let totalDoorProgress = 0;

  doorPanels.forEach((panel, index) => {
    const originalY = panel.userData.originalY;
    const originalZ = panel.userData.originalZ;
    const originalRotation = panel.userData.originalRotation;

    const panelStartThreshold = index * 0.02;
    const panelProgress = Math.max(
      0,
      Math.min(1, (scrollPercent - panelStartThreshold) * 3)
    );

    if (panelProgress > 0) {
      const retractionDistance = 8;
      const retractionProgress = Math.min(1, panelProgress * 2.4);

      panel.position.y = originalY;
      panel.position.z = originalZ + retractionProgress * retractionDistance;
      panel.rotation.z = originalRotation;

      totalDoorProgress += retractionProgress;
    } else {
      panel.position.y = originalY;
      panel.position.z = originalZ;
      panel.rotation.z = originalRotation;
    }
  });
}

function animateCamera() {
  const isMobile = window.innerWidth <= 768;
  const baseDistance = isMobile ? 35 : 25;

  const targetY = 0 + scrollPercent * 3;
  const targetZ = baseDistance + scrollPercent * 8;

  camera.position.y += (targetY - camera.position.y) * 0.05;
  camera.position.z += (targetZ - camera.position.z) * 0.05;

  const lookAtY = isMobile ? -5 : 0; // Better look-at point for smaller mobile hero
  camera.lookAt(0, lookAtY, 5);
}

function onWindowResize() {
  const isMobile = window.innerWidth <= 768;

  // Update 3D elements if they exist
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const cameraDistance = isMobile ? 35 : 25;
    const fov = isMobile ? 60 : 75;
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.position.z = cameraDistance;

    if (garageDoor && isLoaded) {
      const scale = isMobile ? 15 : 25;
      garageDoor.scale.set(scale, scale, scale);

      if (isMobile) {
        garageDoor.position.set(0, -8, 6);
      } else {
        garageDoor.position.set(0, -20, 5);
      }
    }
  }

  // Update gallery sizes for mobile
  const galleries = document.querySelectorAll(".product-gallery");
  galleries.forEach((gallery) => {
    if (isMobile) {
      gallery.style.width = "280px";
    } else {
      gallery.style.width = "300px";
    }
  });
}

// Old gallery functions removed since product specs section was removed

// Craftsmanship Gallery Functions
function initializeCraftsmanshipGalleries() {
  Object.keys(craftsmanshipData).forEach((category) => {
    createCraftsmanshipGallery(category);
  });
}

function createCraftsmanshipGallery(category) {
  const data = craftsmanshipData[category];
  if (!data || data.length === 0) return;

  const track = document.getElementById(`track-${category}`);
  const dotsContainer = document.getElementById(`dots-${category}`);
  const gallery = document.querySelector(`[data-category="${category}"]`);

  if (!track || !dotsContainer) return;

  // Create slides
  track.innerHTML = "";
  dotsContainer.innerHTML = "";

  data.forEach((item, index) => {
    // Create slide
    const slide = document.createElement("div");
    slide.className = "gallery-slide";
    if (index === 0) slide.classList.add("active");

    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.title;
    img.loading = "lazy";
    img.decoding = "async"; // Improve image loading performance

    // Add error handling with fallback
    img.onerror = function () {
      console.warn("Failed to load image:", this.src);
      // Create a placeholder div instead
      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder";
      placeholder.innerHTML = `
        <div class="placeholder-content">
          <div class="placeholder-icon">📷</div>
          <div class="placeholder-text">${item.title}</div>
        </div>
      `;
      this.parentNode.replaceChild(placeholder, this);
    };

    const overlay = document.createElement("div");
    overlay.className = "slide-overlay";
    overlay.innerHTML = `
      <h4>${item.title}</h4>
      <p>${item.description}</p>
    `;

    slide.appendChild(img);
    slide.appendChild(overlay);

    track.appendChild(slide);

    // Create dot
    const dot = document.createElement("div");
    dot.className = "nav-dot";
    if (index === 0) dot.classList.add("active");
    dot.addEventListener("click", () =>
      goToCraftsmanshipSlide(category, index)
    );
    dotsContainer.appendChild(dot);
  });

  // Initialize gallery state
  craftsmanshipGalleries[category] = {
    currentIndex: 0,
    totalSlides: data.length,
    track: track,
    dots: dotsContainer.querySelectorAll(".nav-dot"),
    progressBar: document.getElementById(`progress-${category}`),
  };

  // Add touch gesture support
  if (gallery) {
    addTouchGestures(gallery, category);
  }

  // Start auto-scroll when gallery comes into view
  startAutoScroll(category);
}

function goToCraftsmanshipSlide(category, index) {
  const gallery = craftsmanshipGalleries[category];
  if (!gallery) return;

  gallery.currentIndex = index;
  updateCraftsmanshipGallery(category);

  // Reset auto-scroll timer
  clearTimeout(autoScrollTimers[category]);
  startAutoScroll(category);
}

function updateCraftsmanshipGallery(category) {
  const gallery = craftsmanshipGalleries[category];
  if (!gallery) return;

  const { currentIndex, totalSlides, track, dots, progressBar } = gallery;

  // Update track position
  track.style.transform = `translateX(-${currentIndex * 100}%)`;

  // Update dots
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentIndex);
  });

  // Update progress bar
  if (progressBar) {
    const progress = ((currentIndex + 1) / totalSlides) * 100;
    progressBar.style.width = `${progress}%`;
  }
}

function startAutoScroll(category) {
  const gallery = craftsmanshipGalleries[category];
  if (!gallery) return;

  // Faster auto-scroll on mobile for better user experience
  const isMobile = window.innerWidth <= 768;
  const scrollInterval = isMobile ? 3000 : 4000; // 3 seconds on mobile, 4 on desktop

  autoScrollTimers[category] = setTimeout(() => {
    const nextIndex = (gallery.currentIndex + 1) % gallery.totalSlides;
    goToCraftsmanshipSlide(category, nextIndex);
  }, scrollInterval);
}

function stopAutoScroll(category) {
  if (autoScrollTimers[category]) {
    clearTimeout(autoScrollTimers[category]);
  }
}

function addTouchGestures(gallery, category) {
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let currentX = 0;
  let initialTransform = 0;

  gallery.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;

      const galleryData = craftsmanshipGalleries[category];
      if (galleryData) {
        initialTransform = -galleryData.currentIndex * 100;
      }

      // Stop auto-scroll when user interacts
      stopAutoScroll(category);
    },
    { passive: true }
  );

  gallery.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging) return;

      currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;
      const deltaY = Math.abs(e.touches[0].clientY - startY);

      // Only handle horizontal swipes
      if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
        e.preventDefault();

        const galleryData = craftsmanshipGalleries[category];
        if (galleryData) {
          const track = galleryData.track;
          const slideWidth = 100; // Percentage
          const newTransform =
            initialTransform + (deltaX / window.innerWidth) * 100;

          // Constrain the transform
          const maxTransform = -(galleryData.totalSlides - 1) * slideWidth;
          const constrainedTransform = Math.max(
            maxTransform,
            Math.min(0, newTransform)
          );

          track.style.transition = "none";
          track.style.transform = `translateX(${constrainedTransform}%)`;
        }
      }
    },
    { passive: false }
  );

  gallery.addEventListener(
    "touchend",
    (e) => {
      if (!isDragging) return;

      isDragging = false;
      const deltaX = currentX - startX;
      const threshold = 50; // Minimum swipe distance

      const galleryData = craftsmanshipGalleries[category];
      if (galleryData && Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && galleryData.currentIndex > 0) {
          // Swipe right - go to previous slide
          goToCraftsmanshipSlide(category, galleryData.currentIndex - 1);
        } else if (
          deltaX < 0 &&
          galleryData.currentIndex < galleryData.totalSlides - 1
        ) {
          // Swipe left - go to next slide
          goToCraftsmanshipSlide(category, galleryData.currentIndex + 1);
        } else {
          // Snap back to current slide
          updateCraftsmanshipGallery(category);
        }
      } else {
        // Snap back to current slide
        updateCraftsmanshipGallery(category);
      }

      // Restart auto-scroll after a delay
      setTimeout(() => {
        startAutoScroll(category);
      }, 2000);
    },
    { passive: true }
  );
}

// Intersection Observer for auto-scroll management
const craftsmanshipObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const category = entry.target
        .querySelector(".immersive-gallery")
        ?.getAttribute("data-category");
      if (category) {
        if (entry.isIntersecting) {
          startAutoScroll(category);
        } else {
          stopAutoScroll(category);
        }
      }
    });
  },
  { threshold: 0.3 }
);

// Observe all craft categories when DOM is ready
setTimeout(() => {
  document.querySelectorAll(".craft-category").forEach((category) => {
    craftsmanshipObserver.observe(category);
  });
}, 1000);

// Remove old product specs keyboard navigation since section was removed

function animate() {
  requestAnimationFrame(animate);
  if (controls && renderer && scene && camera) {
    controls.update();
    renderer.render(scene, camera);
  }
}

// Disable automatic scroll restoration
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Ensure page starts at top immediately when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Force scroll to top before initialization
  window.scrollTo(0, 0);
  init();
});

// Also handle page refresh/reload cases
window.addEventListener("beforeunload", () => {
  window.scrollTo(0, 0);
});

// Handle browser back/forward navigation
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // Page was loaded from cache, ensure we start at top
    window.scrollTo(0, 0);
  }
});

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

document.querySelectorAll(".section").forEach((section) => {
  observer.observe(section);
});
