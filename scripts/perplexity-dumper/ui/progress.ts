import type { DumpStatus } from '../types';

export class ProgressModal {
  private modal: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private statusList: HTMLDivElement;
  private cancelButton: HTMLButtonElement;
  private statusItems: Map<string, HTMLDivElement> = new Map();

  constructor() {
    this.modal = this.createModal();
    this.progressBar = this.modal.querySelector('.progress-bar') as HTMLDivElement;
    this.statusList = this.modal.querySelector('.status-list') as HTMLDivElement;
    this.cancelButton = this.modal.querySelector('.cancel-btn') as HTMLButtonElement;
    document.body.appendChild(this.modal);
  }

  private createModal(): HTMLDivElement {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div class="modal-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
      ">
        <div class="modal-content" style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 400px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        ">
          <h2 style="
            margin: 0 0 16px 0;
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
          ">🔄 Dumping Perplexity State...</h2>
          
          <div class="progress-container" style="
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 16px;
          ">
            <div class="progress-bar" style="
              height: 100%;
              background: linear-gradient(90deg, #2563eb, #3b82f6);
              transition: width 0.3s;
              width: 0%;
            "></div>
          </div>
          
          <div class="status-list" style="
            margin-bottom: 16px;
            font-size: 14px;
            color: #4b5563;
          "></div>
          
          <button class="cancel-btn" style="
            width: 100%;
            padding: 10px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
          ">Cancel</button>
        </div>
      </div>
    `;
    
    modal.style.display = 'none';
    return modal;
  }

  show() {
    this.modal.style.display = 'flex';
    this.statusItems.clear();
    this.statusList.innerHTML = '';
    this.setProgress(0);
  }

  hide() {
    this.modal.style.display = 'none';
  }

  setProgress(percent: number) {
    this.progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  setStatus(label: string, status: DumpStatus) {
    let item = this.statusItems.get(label);
    
    if (!item) {
      item = document.createElement('div');
      item.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';
      this.statusList.appendChild(item);
      this.statusItems.set(label, item);
    }

    const icons: Record<DumpStatus, string> = {
      pending: '⏸️',
      loading: '⏳',
      complete: '✅',
      error: '❌',
    };

    item.innerHTML = `
      <span>${icons[status]}</span>
      <span>${label}</span>
    `;
  }

  setComplete(message: string) {
    const h2 = this.modal.querySelector('h2');
    if (h2) h2.textContent = message;
    this.cancelButton.style.display = 'none';
  }

  setError(message: string) {
    const h2 = this.modal.querySelector('h2');
    if (h2) h2.textContent = message;
    this.cancelButton.textContent = 'Close';
  }

  onCancel(handler: () => void) {
    this.cancelButton.onclick = handler;
  }
}
