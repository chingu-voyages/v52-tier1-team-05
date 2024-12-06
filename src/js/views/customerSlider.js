class CustomerSlider {
  constructor() {
    this.slides = document.querySelectorAll('.slide');
    this.sliderBtnLeft = document.querySelector('.slider-btn-left');
    this.sliderBtnRight = document.querySelector('.slider-btn-right');
    this.dots = document.querySelector('.dots');

    this.currSlide = 0;
    this.maxSlide = this.slides.length - 1;
    this.minSlide = 0;

    this.init();
  }

  init() {
    this._setSlideTransforms();
    this._createDots();
    this._activateDot(this.currSlide);
    this._addEventListeners();
  }

  // Set initial slide transforms
  _setSlideTransforms() {
    this.slides.forEach((s, i) => {
      s.style.transform = `translateX(${i * 100}%)`;
    });
  }

  // Go to a specific slide
  _goToSlide(goTo) {
    this.currSlide = goTo;
    this.slides.forEach(
      (s, i) => (s.style.transform = `translateX(${(i - goTo) * 100}%)`)
    );
  }

  // Show next slide
  _nextSlide() {
    if (this.currSlide === this.maxSlide) this._goToSlide(0);
    else {
      this.currSlide++;
      this._goToSlide(this.currSlide);
    }
    this._activateDot(this.currSlide);
  }

  // Show previous slide
  _prevSlide() {
    if (this.currSlide === 0) this._goToSlide(this.maxSlide);
    else {
      this.currSlide--;
      this._goToSlide(this.currSlide);
    }
    this._activateDot(this.currSlide);
  }

  // Create dots for slider navigation
  _createDots() {
    this.slides.forEach((_, i) => {
      const html = `<button class="dot" data-slide="${i}"></button>`;
      this.dots.insertAdjacentHTML('beforeend', html);
    });
  }

  // Activate a specific dot
  _activateDot(slide) {
    document.querySelectorAll('.dot').forEach(dot => {
      dot.classList.remove('dot-active');
    });

    document
      .querySelector(`.dot[data-slide="${slide}"]`)
      .classList.add('dot-active');
  }

  // Add event listeners
  _addEventListeners() {
    // Event listener for dot click
    this.dots.addEventListener('click', e => {
      e.preventDefault();
      const clickedDot = e.target.closest('.dot');
      if (!clickedDot) return;
      const dotNumber = clickedDot.dataset.slide;
      this._goToSlide(dotNumber);
      this._activateDot(dotNumber);
    });

    // Event listeners for slider buttons
    this.sliderBtnRight.addEventListener('click', () => this._nextSlide());
    this.sliderBtnLeft.addEventListener('click', () => this._prevSlide());

    // Event listeners for keyboard arrows
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.key === 'ArrowRight') this._nextSlide();
        if (e.key === 'ArrowLeft') this._prevSlide();
        this._activateDot(this.currSlide);
      }
    });
  }
}

// Instantiate and initialize the slider
const slider = new CustomerSlider();
