export class DumpButton {
  private button: HTMLButtonElement;

  constructor() {
    this.button = this.createButton();
    document.body.appendChild(this.button);
  }

  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '📦 Dump';
    button.title = 'Dump app state (Ctrl+Shift+D)';
    
    Object.assign(button.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '999999',
      padding: '12px 20px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
      transition: 'all 0.2s',
    });

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
    });

    return button;
  }

  onClick(handler: () => void) {
    this.button.addEventListener('click', handler);
  }

  remove() {
    this.button.remove();
  }
}
