import { el } from './dom.js';

/** Ventana base (cabecera, botón cerrar, mostrar/ocultar). */
export class Panel {
  constructor(ui, cls, title) {
    this.ui = ui;
    this.state = ui.state;
    this.open = false;
    this.node = el('div', `panel ${cls}`);
    this.node.innerHTML = `<div class="panel-head"><span>${title}</span><button class="close">✕</button></div><div class="panel-body"></div>`;
    this.body = this.node.querySelector('.panel-body');
    this.node.querySelector('.close').onclick = () => this.close();
    ui.root.append(this.node);
  }
  toggle() { this.open ? this.close() : this.show(); }
  show() { this.open = true; this.node.classList.add('open'); this.render(); }
  close() { this.open = false; this.node.classList.remove('open'); this.ui.tooltip.hide(); }
  render() {}
}
