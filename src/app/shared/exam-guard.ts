import { Component, DestroyRef, inject, signal } from '@angular/core';

/**
 * Medidas restrictivas durante la prueba:
 *  - Bloquea copiar, cortar y pegar (teclado, menú contextual y arrastrar/soltar), excepto dentro del editor Monaco.
 *  - Oculta el contenido si la ventana pierde el foco o se cambia de pestaña.
 */
@Component({
  selector: 'app-exam-guard',
  template: `
    @if (toast()) { <div class="toast" role="alert">{{ toast() }}</div> }
    @if (hidden()) {
      <div class="cover" role="alertdialog">
        <div>
          <h2>Contenido oculto</h2>
          <p>Por seguridad, la prueba se oculta cuando sales de la ventana.</p>
          <p class="muted">Vuelve a esta ventana para continuar. El tiempo sigue corriendo.</p>
        </div>
      </div>
    }
  `,
  styles: `
    .toast { position: fixed; bottom: 1.25rem; left: 50%; transform: translateX(-50%); z-index: 3000; background: #991b1b; color: #fff;
      padding: .6rem 1.1rem; border-radius: 8px; box-shadow: 0 6px 20px rgb(0 0 0 / .3); }
    .cover { position: fixed; inset: 0; z-index: 2000; background: #0f172a; color: #fff; display: grid; place-items: center; text-align: center; padding: 1rem; }
    .muted { color: #94a3b8; }
  `,
})
export class ExamGuard {
  protected hidden = signal(false);
  protected toast = signal('');
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    const blockedEvents: [string, string][] = [
      ['copy', 'Copiar no está permitido durante la prueba'],
      ['cut', 'Cortar no está permitido durante la prueba'],
      ['paste', 'Pegar no está permitido durante la prueba'],
      ['contextmenu', 'El menú contextual está deshabilitado'],
      ['dragstart', 'Arrastrar contenido no está permitido'],
      ['drop', 'Soltar contenido no está permitido'],
    ];
    const inEditor = (e: Event) => !!(e.target as Element | null)?.closest?.('.monaco-editor');
    const block = (message: string) => (e: Event) => {
      if (inEditor(e)) return;
      e.preventDefault(); e.stopPropagation(); this.warn(message);
    };
    const listeners = blockedEvents.map(([type, msg]) => [type, block(msg)] as const);
    for (const [type, fn] of listeners) document.addEventListener(type, fn, true);

    const onKeyDown = (e: KeyboardEvent) => {
      const clipboardShortcut = (e.ctrlKey || e.metaKey) && ['c', 'x', 'v'].includes(e.key.toLowerCase());
      const insertShortcut = e.key === 'Insert' && (e.ctrlKey || e.shiftKey);
      if ((clipboardShortcut || insertShortcut) && !inEditor(e)) {
        e.preventDefault(); e.stopPropagation();
        this.warn('Copiar y pegar no están permitidos durante la prueba');
      }
    };
    const onBlur = () => this.hidden.set(true);
    const onFocus = () => this.hidden.set(false);
    const onVisibility = () => this.hidden.set(document.hidden);

    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    document.body.classList.add('exam-guarded');

    inject(DestroyRef).onDestroy(() => {
      for (const [type, fn] of listeners) document.removeEventListener(type, fn, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.classList.remove('exam-guarded');
      clearTimeout(this.toastTimer);
    });
  }

  private warn(message: string) {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2500);
  }
}
