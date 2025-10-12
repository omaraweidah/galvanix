class GalvanixApp {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.garageDoor = null;
    this.doorPanels = [];
    this.scrollPercent = 0;
    this.isLoaded = false;
    this.craftsmanshipGalleries = {};
    this.autoScrollTimers = {};
    
    this.init();
  }

  init() {
    window.scrollTo(0, 0);
    this.setupScene();
    this.setupLights();
    this.loadGarageDoor();
    this.animate();
    this.initializeCraftsmanshipGalleries();
    this.setupScrollListener();
    this.setupMobileMenu();
    this.setupLetterHoverEffects();
    
    setTimeout(() => {
      document.getElementById("loading-screen").style.opacity = "0";
      setTimeout(() => {
        document.getElementById("loading-screen").style.display = "none";
      }, 500);
    }, 2000);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x008080);

    const isMobile = window.innerWidth <= 768;
    const cameraDistance = isMobile ? 40 : 25;
    const fov = isMobile ? 60 : 75;
    
    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, cameraDistance);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    const pixelRatio = isMobile
      ? Math.min(window.devicePixelRatio, 1.5)
      : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.shadowMap.enabled = !isMobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    document.getElementById("scene-container").appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.autoRotate = false;
    this.controls.enableRotate = false;

    window.addEventListener("resize", () => this.onWindowResize());
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

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
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x6366f1, 0.4, 12);
    pointLight.position.set(0, 3, 2);
    this.scene.add(pointLight);
  }

  loadGarageDoor() {
    const loader = new THREE.GLTFLoader();
    const modelPath = "assets/garage_door_01/scene.gltf";

    loader.load(
      modelPath,
      (gltf) => {
        this.garageDoor = gltf.scene;

        const isMobile = window.innerWidth <= 768;
        const scale = isMobile ? 15 : 25;
        this.garageDoor.scale.set(scale, scale, scale);

        if (isMobile) {
          this.garageDoor.position.set(0, -8, 6);
        } else {
          this.garageDoor.position.set(0, -20, 5);
        }

        this.garageDoor.traverse((child) => {
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
              this.doorPanels.push(child);
            }
          }
        });

        this.addGalvanixTextToDoor();
        this.scene.add(this.garageDoor);
        this.isLoaded = true;

        if (this.doorPanels.length === 0) {
          this.createFallbackAnimation();
        }
      },
      (progress) => {},
      (error) => {
        console.error("Error loading garage door model:", error);
      }
    );
  }

  addGalvanixTextToDoor() {
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

    this.garageDoor.add(textMesh);
    this.garageDoor.userData.galvanixText = textMesh;
  }

  createFallbackAnimation() {
    this.garageDoor.traverse((child) => {
      if (child.isMesh) {
        child.userData.originalY = child.position.y;
        child.userData.originalZ = child.position.z;
        child.userData.originalRotation = child.rotation.z;
        this.doorPanels.push(child);
      }
    });

    if (this.doorPanels.length === 0) {
      this.createFallbackGarageDoor();
    }
  }

  setupScrollListener() {
    window.addEventListener("scroll", () => {
      this.scrollPercent =
        window.scrollY / (document.body.scrollHeight - window.innerHeight);

      if (this.isLoaded && this.doorPanels.length > 0) {
        this.animateGarageDoor();
      }
      if (this.camera) {
        this.animateCamera();
      }

      const scrollIndicator = document.querySelector(".scroll-indicator");
      if (scrollIndicator) {
        if (this.scrollPercent > 0.1) {
          scrollIndicator.style.opacity = "0";
        } else {
          scrollIndicator.style.opacity = "0.7";
        }
      }
    });
  }

  animateGarageDoor() {
    if (!this.isLoaded || this.doorPanels.length === 0) return;

    this.doorPanels.forEach((panel, index) => {
      const originalY = panel.userData.originalY;
      const originalZ = panel.userData.originalZ;
      const originalRotation = panel.userData.originalRotation;

      const panelStartThreshold = index * 0.02;
      const panelProgress = Math.max(
        0,
        Math.min(1, (this.scrollPercent - panelStartThreshold) * 3)
      );

      if (panelProgress > 0) {
        const retractionDistance = 8;
        const retractionProgress = Math.min(1, panelProgress * 2.4);

        panel.position.y = originalY;
        panel.position.z = originalZ + retractionProgress * retractionDistance;
        panel.rotation.z = originalRotation;
      } else {
        panel.position.y = originalY;
        panel.position.z = originalZ;
        panel.rotation.z = originalRotation;
      }
    });
  }

  animateCamera() {
    const isMobile = window.innerWidth <= 768;
    const baseDistance = isMobile ? 35 : 25;

    const targetY = 0 + this.scrollPercent * 3;
    const targetZ = baseDistance + this.scrollPercent * 8;

    this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;

    const lookAtY = isMobile ? -5 : 0;
    this.camera.lookAt(0, lookAtY, 5);
  }

  onWindowResize() {
    const isMobile = window.innerWidth <= 768;

    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const cameraDistance = isMobile ? 35 : 25;
      const fov = isMobile ? 60 : 75;
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
      this.camera.position.z = cameraDistance;

      if (this.garageDoor && this.isLoaded) {
        const scale = isMobile ? 15 : 25;
        this.garageDoor.scale.set(scale, scale, scale);

        if (isMobile) {
          this.garageDoor.position.set(0, -8, 6);
        } else {
          this.garageDoor.position.set(0, -20, 5);
        }
      }
    }
  }

  setupMobileMenu() {
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const headerNav = document.getElementById("header-nav");

    if (mobileMenuToggle && headerNav) {
      mobileMenuToggle.addEventListener("click", () => {
        mobileMenuToggle.classList.toggle("active");
        headerNav.classList.toggle("active");

        if (headerNav.classList.contains("active")) {
          document.body.style.overflow = "hidden";
        } else {
          document.body.style.overflow = "";
        }
      });

      headerNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          mobileMenuToggle.classList.remove("active");
          headerNav.classList.remove("active");
          document.body.style.overflow = "";
        });
      });

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

      window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
          mobileMenuToggle.classList.remove("active");
          headerNav.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    }
  }

  setupLetterHoverEffects() {
    const letters = document.querySelectorAll('.company-logo .letter');
    const letterStates = {};
    const animationFrames = {};
    
    letters.forEach((letter, index) => {
      letterStates[index] = {
        isHovered: false,
        proximity: 0,
        targetY: 0,
        targetZ: 20,
        targetRotateX: 0,
        targetRotateY: 0,
        currentY: 0,
        currentZ: 20,
        currentRotateX: 0,
        currentRotateY: 0,
        element: letter
      };
    });
    
    function handleMouseMove(e) {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      letters.forEach((letter, index) => {
        const rect = letter.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2;
        const letterCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - letterCenterX, 2) + Math.pow(mouseY - letterCenterY, 2)
        );
        
        const maxDistance = 150;
        const proximity = Math.max(0, 1 - (distance / maxDistance));
        
        const relativeX = (mouseX - letterCenterX) / (rect.width / 2);
        const relativeY = (mouseY - letterCenterY) / (rect.height / 2);
        
        letterStates[index].proximity = proximity;
        letterStates[index].targetY = proximity * -15;
        letterStates[index].targetZ = 20 + proximity * 15;
        letterStates[index].targetRotateX = proximity * -12 * Math.max(-1, Math.min(1, relativeY));
        
        const rotateY = proximity * 5 * Math.max(-1, Math.min(1, relativeX));
        letterStates[index].targetRotateY = rotateY;
      });
    }
    
    function animateLetters() {
      let hasMovement = false;
      
      letters.forEach((letter, index) => {
        const state = letterStates[index];
        
        const easeFactor = 0.15;
        
        const prevY = state.currentY;
        const prevZ = state.currentZ;
        const prevRotateX = state.currentRotateX;
        const prevRotateY = state.currentRotateY;
        
        state.currentY += (state.targetY - state.currentY) * easeFactor;
        state.currentZ += (state.targetZ - state.currentZ) * easeFactor;
        state.currentRotateX += (state.targetRotateX - state.currentRotateX) * easeFactor;
        state.currentRotateY += (state.targetRotateY - state.currentRotateY) * easeFactor;
        
        if (Math.abs(state.currentY - prevY) > 0.01 || 
            Math.abs(state.currentZ - prevZ) > 0.01 ||
            Math.abs(state.currentRotateX - prevRotateX) > 0.01 ||
            Math.abs(state.currentRotateY - prevRotateY) > 0.01) {
          hasMovement = true;
        }
        
        letter.style.transform = `
          translateY(${state.currentY}px) 
          translateZ(${state.currentZ}px) 
          rotateX(${state.currentRotateX}deg)
          rotateY(${state.currentRotateY}deg)
        `;
        
        const shadowIntensity = 0.6 + state.proximity * 0.3;
        const shadowBlur = 8 + state.proximity * 12;
        const shadowSpread = 2 + state.proximity * 4;
        
        letter.style.textShadow = `
          0 ${shadowSpread}px ${shadowSpread * 2}px rgba(0, 0, 0, ${shadowIntensity}),
          0 ${shadowSpread * 1.5}px ${shadowSpread * 3}px rgba(0, 0, 0, ${shadowIntensity * 0.6})
        `;
      });
      
      animationFrames.current = requestAnimationFrame(animateLetters);
    }
    
    animateLetters();
    document.addEventListener('mousemove', handleMouseMove);
    
    window.addEventListener('beforeunload', () => {
      if (animationFrames.current) {
        cancelAnimationFrame(animationFrames.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
    });
  }

  initializeCraftsmanshipGalleries() {
    Object.keys(CraftsmanshipData).forEach((category) => {
      this.createCraftsmanshipGallery(category);
    });
  }

  createCraftsmanshipGallery(category) {
    const data = CraftsmanshipData[category];
    if (!data || data.length === 0) return;

    const track = document.getElementById(`track-${category}`);
    const dotsContainer = document.getElementById(`dots-${category}`);
    const gallery = document.querySelector(`[data-category="${category}"]`);

    if (!track || !dotsContainer) return;

    track.innerHTML = "";
    dotsContainer.innerHTML = "";

    data.forEach((item, index) => {
      const slide = document.createElement("div");
      slide.className = "gallery-slide";
      if (index === 0) slide.classList.add("active");

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.title;
      img.loading = "lazy";
      img.decoding = "async";

      img.onerror = function () {
        console.warn("Failed to load image:", this.src);
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

      const dot = document.createElement("div");
      dot.className = "nav-dot";
      if (index === 0) dot.classList.add("active");
      dot.addEventListener("click", () =>
        this.goToCraftsmanshipSlide(category, index)
      );
      dotsContainer.appendChild(dot);
    });

    this.craftsmanshipGalleries[category] = {
      currentIndex: 0,
      totalSlides: data.length,
      track: track,
      dots: dotsContainer.querySelectorAll(".nav-dot"),
    };

    if (gallery) {
      this.addTouchGestures(gallery, category);
    }

    this.startAutoScroll(category);
  }

  goToCraftsmanshipSlide(category, index) {
    const gallery = this.craftsmanshipGalleries[category];
    if (!gallery) return;

    gallery.currentIndex = index;
    this.updateCraftsmanshipGallery(category);

    clearTimeout(this.autoScrollTimers[category]);
    this.startAutoScroll(category);
  }

  updateCraftsmanshipGallery(category) {
    const gallery = this.craftsmanshipGalleries[category];
    if (!gallery) return;

    const { currentIndex, track, dots } = gallery;

    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  }

  startAutoScroll(category) {
    const gallery = this.craftsmanshipGalleries[category];
    if (!gallery) return;

    const isMobile = window.innerWidth <= 768;
    const scrollInterval = isMobile ? 3000 : 4000;

    this.autoScrollTimers[category] = setTimeout(() => {
      const nextIndex = (gallery.currentIndex + 1) % gallery.totalSlides;
      this.goToCraftsmanshipSlide(category, nextIndex);
    }, scrollInterval);
  }

  stopAutoScroll(category) {
    if (this.autoScrollTimers[category]) {
      clearTimeout(this.autoScrollTimers[category]);
    }
  }

  addTouchGestures(gallery, category) {
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

        const galleryData = this.craftsmanshipGalleries[category];
        if (galleryData) {
          initialTransform = -galleryData.currentIndex * 100;
        }

        this.stopAutoScroll(category);
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

        if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
          e.preventDefault();

          const galleryData = this.craftsmanshipGalleries[category];
          if (galleryData) {
            const track = galleryData.track;
            const slideWidth = 100;
            const newTransform =
              initialTransform + (deltaX / window.innerWidth) * 100;

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
        const threshold = 50;

        const galleryData = this.craftsmanshipGalleries[category];
        if (galleryData && Math.abs(deltaX) > threshold) {
          if (deltaX > 0 && galleryData.currentIndex > 0) {
            this.goToCraftsmanshipSlide(category, galleryData.currentIndex - 1);
          } else if (
            deltaX < 0 &&
            galleryData.currentIndex < galleryData.totalSlides - 1
          ) {
            this.goToCraftsmanshipSlide(category, galleryData.currentIndex + 1);
          } else {
            this.updateCraftsmanshipGallery(category);
          }
        } else {
          this.updateCraftsmanshipGallery(category);
        }

        setTimeout(() => {
          this.startAutoScroll(category);
        }, 2000);
      },
      { passive: true }
    );
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.controls && this.renderer && this.scene && this.camera) {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }
}

const CraftsmanshipData = {
  "100mm": [
    {
      src: "assets/images/100mm/Screenshot_2025-08-27_at_8_18_46_PM.png",
      title: "Precision Manufacturing",
      description: "Each 100mm slat is precision-engineered with foam-filled cores for maximum insulation.",
    },
    {
      src: "assets/images/100mm/Screenshot_2025-08-27_at_8_19_39_PM.png",
      title: "Interlocking Design",
      description: "Our patented zigzag interlock system ensures superior security and weather sealing.",
    },
    {
      src: "assets/images/100mm/Screenshot_2025-08-27_at_8_20_12_PM.png",
      title: "Quality Assurance",
      description: "Every component undergoes rigorous quality control to meet our exacting standards.",
    },
  ],
  "80mm": [
    {
      src: "assets/images/80mm/Screenshot_2025-08-27_at_8_28_34_PM.png",
      title: "Contoured Excellence",
      description: "Our 80mm slats feature advanced contoured design for strength and aesthetic appeal.",
    },
    {
      src: "assets/images/80mm/Screenshot_2025-08-27_at_8_28_52_PM.png",
      title: "Galvanized Protection",
      description: "Premium galvanized steel construction with 120 zinc coating for ultimate durability.",
    },
  ],
  "guide-rails": [
    {
      src: "assets/images/guide-rails/Screenshot_2025-08-27_at_8_26_53_PM.png",
      title: "Precision Engineering",
      description: "Custom-engineered guide rails ensure smooth operation and perfect alignment.",
    },
    {
      src: "assets/images/guide-rails/Screenshot_2025-08-27_at_8_27_56_PM.png",
      title: "Structural Integrity",
      description: "Heavy-duty construction designed to withstand years of reliable operation.",
    },
    {
      src: "assets/images/guide-rails/Screenshot_2025-08-27_at_8_28_04_PM.png",
      title: "Installation Excellence",
      description: "Precision-fitted components for seamless installation and optimal performance.",
    },
  ],
  "end-caps": [
    {
      src: "assets/images/end-caps/Screenshot_2025-08-27_at_8_24_58_PM.png",
      title: "Precision Molding",
      description: "Engineered end caps provide structural integrity and complete weather sealing.",
    },
    {
      src: "assets/images/end-caps/Screenshot_2025-08-27_at_8_25_25_PM.png",
      title: "Quality Materials",
      description: "Premium materials ensure long-lasting performance in all weather conditions.",
    },
    {
      src: "assets/images/end-caps/Screenshot_2025-08-27_at_8_25_39_PM.png",
      title: "Perfect Fit",
      description: "Precision-engineered for exact fit and optimal sealing performance.",
    },
  ],
  "bottom-seal": [
    {
      src: "assets/images/bottom-seal/Screenshot_2025-08-27_at_8_25_52_PM.png",
      title: "Weather Protection",
      description: "Advanced sealing technology ensures complete protection from the elements.",
    },
    {
      src: "assets/images/bottom-seal/Screenshot_2025-08-27_at_8_26_11_PM.png",
      title: "Energy Efficiency",
      description: "Superior sealing reduces energy loss and maintains optimal indoor climate.",
    },
  ],
  misc: [
    {
      src: "assets/images/misc/Screenshot_2025-08-27_at_8_24_05_PM.png",
      title: "State-of-the-Art Facility",
      description: "Our modern manufacturing facilities utilize cutting-edge technology and processes.",
    },
    {
      src: "assets/images/misc/Screenshot_2025-08-27_at_8_24_38_PM.png",
      title: "Quality Control",
      description: "Rigorous testing and inspection ensures every component meets our standards.",
    },
    {
      src: "assets/images/misc/Screenshot_2025-08-27_at_8_29_09_PM.png",
      title: "Advanced Machinery",
      description: "Precision manufacturing equipment delivers consistent, high-quality results.",
    },
    {
      src: "assets/images/misc/Screenshot_2025-08-27_at_8_29_35_PM.png",
      title: "Material Excellence",
      description: "Only the finest raw materials are selected for Galvanix products.",
    },
    {
      src: "assets/images/misc/Screenshot_2025-08-27_at_8_29_45_PM.png",
      title: "Process Innovation",
      description: "Continuous improvement in manufacturing processes ensures superior quality.",
    },
    {
      src: "assets/images/misc/Screenshot_2025-08-27_at_8_30_07_PM.png",
      title: "Finishing Excellence",
      description: "Precision finishing processes deliver the perfect surface quality.",
    },
    {
      src: "assets/images/misc/Screenshot_2025-08-27_at_8_30_21_PM.png",
      title: "Final Inspection",
      description: "Every product undergoes final quality inspection before shipment.",
    },
  ],
};

const craftsmanshipObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const category = entry.target
        .querySelector(".immersive-gallery")
        ?.getAttribute("data-category");
      if (category) {
        if (entry.isIntersecting) {
          app.startAutoScroll(category);
        } else {
          app.stopAutoScroll(category);
        }
      }
    });
  },
  { threshold: 0.3 }
);

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

document.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);
  window.app = new GalvanixApp();
});

window.addEventListener("beforeunload", () => {
  window.scrollTo(0, 0);
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
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

setTimeout(() => {
  document.querySelectorAll(".craft-category").forEach((category) => {
    craftsmanshipObserver.observe(category);
  });
}, 1000);
