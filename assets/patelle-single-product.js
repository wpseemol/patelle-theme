if (!customElements.get('pt-single-gallery')) {
  customElements.define(
    'pt-single-gallery',
    class PtSingleGallery extends HTMLElement {
      connectedCallback() {
        this.mainImage = this.querySelector('[data-main-image]');
        this.thumbs = Array.from(this.querySelectorAll('[data-thumb]'));
        this.thumbs.forEach((thumb) => {
          thumb.addEventListener('click', () => this.select(thumb));
        });
      }

      select(thumb) {
        if (!this.mainImage) return;

        this.mainImage.src = thumb.dataset.src;
        this.mainImage.srcset = thumb.dataset.srcset;
        this.mainImage.alt = thumb.dataset.alt || '';

        this.thumbs.forEach((item) => {
          item.setAttribute('aria-current', item === thumb ? 'true' : 'false');
        });
      }
    }
  );
}
