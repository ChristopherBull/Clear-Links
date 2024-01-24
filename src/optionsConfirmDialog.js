/*
 * A stylised confirm dialog with implementation.
 * Used when native confirm dialogs cannot be shown, such as in the Options page.
 * Based on: https://codepen.io/dcode-software/pen/LKywLG
 */

export const Confirm = {
  open(options) {
    options = {
      // Default options
      title: '',
      message: '',
      okText: 'OK',
      cancelText: 'Cancel',
      onOk() {},
      oncancel() {},
      // Override the default options with passed options
      ...options,
    };

    const html = `
        <div class="confirm">
            <div class="confirm-window">
                <div class="confirm-titlebar">
                    <span class="confirm-title">${options.title}</span>
                    <button class="confirm-close">&times;</button>
                </div>
                <div class="confirm-content">${options.message}</div>
                <div class="confirm-buttons">
                    <button class="confirm-button confirm-button-ok confirm-button-fill">${options.okText}</button>
                    <button class="confirm-button confirm-button-cancel">${options.cancelText}</button>
                </div>
            </div>
        </div>
    `;

    const template = document.createElement('template');
    template.innerHTML = html;

    // Elements
    const confirmEl = template.content.querySelector('.confirm');
    const btnClose = template.content.querySelector('.confirm-close');
    const btnOk = template.content.querySelector('.confirm-button-ok');
    const btnCancel = template.content.querySelector('.confirm-button-cancel');

    confirmEl.addEventListener('click', (e) => {
      if (e.target === confirmEl) {
        options.oncancel();
        this.close(confirmEl);
      }
    });

    btnOk.addEventListener('click', () => {
      options.onOk();
      this.close(confirmEl);
    });

    [btnCancel, btnClose].forEach((el) => {
      el.addEventListener('click', () => {
        options.oncancel();
        this.close(confirmEl);
      });
    });

    document.body.appendChild(template.content);
  },

  close(confirmEl) {
    confirmEl.classList.add('confirm-closing');

    confirmEl.addEventListener('animationend', () => {
      document.body.removeChild(confirmEl);
    });
  },
};
