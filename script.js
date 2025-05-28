// meltdown.js
//////////////////////////////////////////////////////////////
// Full JavaScript code for "contain" approach in resizeImages
// Step-based (snap) wheel scrolling AND a more intense displacement
//////////////////////////////////////////////////////////////

class MeltingPics {
  constructor(canvas, images, displacement) {
    this.canvas = canvas;
    this.imagesList = images;         // Array of loaded <img> from CreateJS
    this.displacementImage = displacement; // Displacement <img>
    
    // Bind methods
    this.resizeCanvas = this.resizeCanvas.bind(this);
    window.addEventListener('resize', this.resizeCanvas);

    // Create Pixi app
    this.createPixi();
    // Initial sizing
    this.resizeCanvas();
    // Add images to Pixi
    this.createImages();
    // Resize to "contain" each image fully
    this.resizeImages();
    // Reposition them in a vertical stack
    this.repositeContainers();

    // Render once
    this.app.render();

    // Fade in the canvas, then start rendering
    TweenMax.fromTo(
      this.canvas,
      1,
      { opacity: 0 },
      { opacity: 1, delay: 1, onComplete: this.app.start, onCompleteScope: this.app }
    );

    // Set up displacement filter
    this.dispText = PIXI.Texture.from(this.displacementImage);
    this.dispSprite = new PIXI.Sprite(this.dispText);
    this.dispFilter = new PIXI.filters.DisplacementFilter(this.dispSprite);
    this.dispFilter.autoFit = true;
    this.dispFilter.scale.set(0);
    
    // Enable "repeat" mode so it can tile if scaled
    this.dispSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

    // Add the displacement filter to the container
    this.container.filters = [this.dispFilter];
  }

  //////////////////////////////////////////
  // Pixi creation
  //////////////////////////////////////////
  createPixi() {
    // Some basic Pixi application options
    PIXI.utils.skipHello();
    const options = {
      width: this.WIDTH,
      height: this.HEIGHT,
      view: this.canvas,
      transparent: false,
      antialias: true,
      resolution: window.devicePixelRatio,
      backgroundColor: 0xffffff,
      forceFXAA: true
    };
    this.app = new PIXI.Application(options);
    // We'll handle resizing manually
    this.app.renderer.autoResize = false;
  }

  //////////////////////////////////////////
  // Create images in Pixi
  //////////////////////////////////////////
  createImages() {
    this.images = [];
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // For each loaded <img>, create a Pixi Sprite
    for (let i = 0; i < this.imagesList.length; i++) {
      const data = this.imagesList[i];
      const texture = PIXI.Texture.from(data);
      const imageSprite = new PIXI.Sprite(texture);

      // Use a container per image so we can position them easily
      const imageContainer = new PIXI.Container();
      imageContainer.addChild(imageSprite);
      this.container.addChild(imageContainer);

      // Save natural dimensions for custom scaling
      imageSprite.iniWidth = texture.width;
      imageSprite.iniHeight = texture.height;
      imageSprite.iniScale = texture.width / texture.height;

      // Keep a reference in the array
      this.images.push(imageContainer);
    }
  }

  resizeImages() {
    console.log("Resize images with 'contain' approach");
    for (let i = 0; i < this.images.length; i++) {
      let image = this.images[i].children[0];

      // Get the natural dimensions (saved above)
      let iniW = image.iniWidth;
      let iniH = image.iniHeight;
      
      // Compare aspect ratios
      let imageAspect = iniW / iniH;     
      let screenAspect = this.ASPECT;    

      // "Contain" approach: entire image must fit on screen
      if (imageAspect > screenAspect) {
        image.width = this.WIDTH;
        image.height = this.WIDTH / imageAspect;
      } else {
        image.height = this.HEIGHT;
        image.width = this.HEIGHT * imageAspect;
      }

      // Center the image
      image.position.x = (this.WIDTH - image.width) / 2;
      image.position.y = (this.HEIGHT - image.height) / 2;
    }
  }

  //////////////////////////////////////////
  // Position each image container vertically
  //////////////////////////////////////////
  repositeContainers() {
    for (let i = 0; i < this.images.length; i++) {
      this.images[i].position.y = this.HEIGHT * i;
    }
  }
  

  //////////////////////////////////////////
  // Handle meltdown (immediate approach)
  // Called on each frame of our wheel tween
  //////////////////////////////////////////
  updateDisplacementImmediate(coef) {
    // Where should the container be?
    const finy = -coef * this.HEIGHT * (this.images.length - 1);
    // How far is it from current pos?
    const dif = Math.abs(finy - this.container.position.y);

    // Move container directly
    this.container.position.y = finy;

    // Increase multipliers to make distortion more intense
    const scaleMultiplierY = 120;  // bigger => stronger vertical distortion
    const scaleMultiplierX = 20;   // bigger => stronger horizontal distortion

    // We'll keep the aspect logic but crank up the factor
    this.dispFilter.scale.y = dif * scaleMultiplierY * (this.WIDTH / this.HEIGHT / 3);
    this.dispFilter.scale.x = -dif / scaleMultiplierX;
  }

  //////////////////////////////////////////
  // Handle window resize
  //////////////////////////////////////////
  resizeCanvas() {
    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;
    this.ASPECT = this.WIDTH / this.HEIGHT;

    // Resize the Pixi renderer
    this.app.renderer.resize(this.WIDTH, this.HEIGHT);

    if (!this.images) return;
    // Re-flow images
    this.repositeContainers();
    this.resizeImages();
  }

  //////////////////////////////////////////
  // Destroy app
  //////////////////////////////////////////
  destroy() {
    window.removeEventListener("resize", this.resizeCanvas);
    this.app.destroy(true);
    this.app = null;
  }
}

// ------------------------------------- //
// CreateJS load queue + usage example
// ------------------------------------- //

// Prepare arrays for loading
var images = [];
var displacementImg;

// Create the LoadQueue
var queue = new createjs.LoadQueue(true);

// 1) Load displacement image from an external URL
queue.loadFile({
  src: 'https://res.cloudinary.com/dnafoaa32/image/upload/v1499361528/displacement_szahzk.jpg',
  id: 'displacement',
  type: createjs.AbstractLoader.IMAGE
});

// 2) Load your local images (make sure these files exist)
queue.loadFile({
  src: 'images/image-1.jpg',
  id: 'localImage1',
  type: createjs.AbstractLoader.IMAGE
}, false);

queue.loadFile({
  src: 'images/image-2.jpg',
  id: 'localImage2',
  type: createjs.AbstractLoader.IMAGE
}, false);

queue.loadFile({
  src: 'images/image-4.jpg',
  id: 'localImage3',
  type: createjs.AbstractLoader.IMAGE
}, false);

queue.loadFile({
  src: 'images/image-5.jpg',
  id: 'localImage3',
  type: createjs.AbstractLoader.IMAGE
}, false);

queue.loadFile({
  src: 'images/image-6.jpg',
  id: 'localImage3',
  type: createjs.AbstractLoader.IMAGE
}, false);

// 3) Listen to 'fileload' event
queue.on('fileload', (evt) => {
  if (evt.item.id === 'displacement') {
    displacementImg = evt.result;
  } else {
    images.push(evt.result);
  }
});

// 4) Once everything is loaded, initialize MeltingPics
queue.on('complete', () => {
  // Grab the <canvas> element
  const canvasElem = document.querySelector('canvas');

  // Instantiate MeltingPics
  const pics = new MeltingPics(canvasElem, images, displacementImg);

  // Optional: Set #fakescroll height
  const fakeScroll = document.getElementById('fakescroll');
  if (fakeScroll) {
    fakeScroll.style.height = (images.length * 100).toString() + "%";
  }

  // Optional: Reveal "scroll down" text
  const scrollDownElem = document.getElementById('scrolldown');
  if (scrollDownElem) {
    scrollDownElem.style.display = "block";
    TweenMax.from(scrollDownElem, 1, { opacity: 0 });
  }

  // ------------------------------------------------------------------
  // STEP-BASED WHEEL LOGIC (scroll snapping) WITH LONGER TWEEN
  // ------------------------------------------------------------------
  
  // Disable normal scrolling
  document.body.style.overflow = 'hidden';

  let currentIndex = 0;
  let isTweening = false;

  // This function moves from currentIndex to nextIndex with meltdown
  function scrollToIndex(index) {
    isTweening = true;
    const targetScrollY = index * window.innerHeight;

    // Extended duration: 2 seconds
    TweenMax.to({}, 1, {
      ease: Power2.easeOut,

      onUpdate: function() {
        // 'this.progress()' is 0..1
        const t = this.progress();
        const currentY = window.scrollY;
        const newY = currentY + (targetScrollY - currentY) * t;

        // Actually move the viewport
        window.scrollTo(0, newY);

        // meltdown factor
        const factor = newY / (window.innerHeight * images.length - window.innerHeight);

        // More intense distortion each frame
        pics.updateDisplacementImmediate(factor);
      },

      onComplete: function() {
        isTweening = false;
      }
    });
  }

  // Listen for wheel events to step images
  window.addEventListener('wheel', evt => {
    evt.preventDefault();
    if (isTweening) return;

    // Scrolling down
    if (evt.deltaY > 0) {
      if (currentIndex < images.length - 1) {
        currentIndex++;
        scrollToIndex(currentIndex);
      }
    } 
    // Scrolling up
    else if (evt.deltaY < 0) {
      if (currentIndex > 0) {
        currentIndex--;
        scrollToIndex(currentIndex);
      }
    }
  }, { passive: false });
});

// 5) Start loading all queued items
queue.load();
