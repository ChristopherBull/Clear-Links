/**
 * A stylised confirm dialog implementation.
 * Used when native confirm dialogs cannot be shown, such as in the Options page.
 * Based on: https://codepen.io/dcode-software/pen/LKywLG
 * @exports Confirm
 * @example
 * Confirm.open({
      title: 'Alert',
      message: 'Are you sure?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => { }, // Do something on OK button click
      oncancel: async () => { } // Do something on Cancel button click
    });
 */
export const Confirm = {
  /**
   * Opens the confirm dialog with the specified options.
   * @param {object} options - The options for the confirm dialog.
   * @param {string} options.title - The title of the confirm dialog.
   * @param {string} options.message - The message of the confirm dialog.
   * @param {string} [options.okText] - The text for the OK button.
   * @param {string} [options.cancelText] - The text for the Cancel button.
   * @param {Function} [options.onOk] - The callback function to be called when the OK button is clicked.
   * @param {Function} [options.onCancel] - The callback function to be called when the Cancel button is clicked.
   */
  open(options) {
    /**
     * @default
     */
    options = {
      title: '',
      message: '',
      okText: 'OK',
      cancelText: 'Cancel',
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
        options.oncancel?.();
        this.close(confirmEl);
      }
    });

    btnOk.addEventListener('click', () => {
      options.onOk?.();
      this.close(confirmEl);
    });

    [ btnCancel, btnClose ].forEach((el) => {
      el.addEventListener('click', () => {
        options.oncancel?.();
        this.close(confirmEl);
      });
    });

    document.body.appendChild(template.content);
  },

  /**
   * Closes the confirm dialog.
   * @param {HTMLElement} confirmEl - The confirm dialog element to be closed.
   */
  close(confirmEl) {
    confirmEl.classList.add('confirm-closing');

    confirmEl.addEventListener('animationend', () => {
      document.body.removeChild(confirmEl);
    });
  },
};
