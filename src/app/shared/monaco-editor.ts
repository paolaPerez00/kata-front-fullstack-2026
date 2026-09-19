import { Component, ElementRef, OnDestroy, effect, input, model, viewChild, afterNextRender } from '@angular/core';
import type * as Monaco from 'monaco-editor';

@Component({
  selector: 'app-monaco-editor',
  template: `<div #host class="host"></div>`,
  styles: `:host { display: block; height: 100%; min-height: 320px; } .host { height: 100%; }`,
})
export class MonacoEditor implements OnDestroy {
  readonly value = model('');
  readonly language = input('javascript');
  readonly readOnly = input(false);
  readonly restricted = input(false);

  private host = viewChild.required<ElementRef<HTMLElement>>('host');
  private monaco?: typeof Monaco;
  private editor?: Monaco.editor.IStandaloneCodeEditor;
  private silent = false;

  constructor() {
    afterNextRender(async () => {
      const monaco = await loadMonaco();
      this.monaco = monaco;
      this.editor = monaco.editor.create(this.host().nativeElement, {
        value: this.value(),
        language: this.language(),
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
        readOnly: this.readOnly(),
        contextmenu: !this.restricted(),
        dropIntoEditor: { enabled: !this.restricted() },
      });
      this.editor.onDidChangeModelContent(() => {
        if (!this.silent) this.value.set(this.editor!.getValue());
      });
    });

    effect(() => {
      const v = this.value();
      if (this.editor && this.editor.getValue() !== v) {
        this.silent = true;
        this.editor.setValue(v);
        this.silent = false;
      }
    });
    effect(() => {
      const lang = this.language();
      const model = this.editor?.getModel();
      if (model) this.monaco?.editor.setModelLanguage(model, lang);
    });
    effect(() => this.editor?.updateOptions({ readOnly: this.readOnly() }));
  }

  ngOnDestroy() { this.editor?.dispose(); }
}

let monacoPromise: Promise<typeof Monaco> | undefined;

function loadMonaco(): Promise<typeof Monaco> {
  monacoPromise ??= (async () => {
    (self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
      getWorker: () => new Worker(new URL('../../../node_modules/monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
    };
    await Promise.all([
      import('monaco-editor/languages/definitions/javascript/register.js'),
      import('monaco-editor/languages/definitions/typescript/register.js'),
      import('monaco-editor/languages/definitions/python/register.js'),
      import('monaco-editor/languages/definitions/java/register.js'),
    ]);
    return (await import('monaco-editor/editor/editor.api.js')) as unknown as typeof Monaco;
  })();
  return monacoPromise;
}
