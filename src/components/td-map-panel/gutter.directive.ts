import { Directive, ViewContainerRef, Renderer2, ElementRef, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[gutter]'
})
export class GutterDirective {
  @Output()
  changeColumnSize: EventEmitter<number> = new EventEmitter<number>();

  constructor(private container: ViewContainerRef, private renderer: Renderer2, private el: ElementRef) {

  }

  ngOnInit() {
    const div = this.renderer.createElement('div');
    div.classList.add('gutter-header')
    this.renderer.appendChild(this.el.nativeElement, div);
    const stopSortOnResize = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    div.addEventListener('click', stopSortOnResize);
    let isResizing = false;

    div.addEventListener('mousedown', mouseDownEvent => {
      isResizing = true;
      const elementWidth = this.el.nativeElement.offsetWidth;

      const onMouseMove = mouseMoveEvent => {
        if (!isResizing) return;
        if (elementWidth - (mouseDownEvent.clientX - mouseMoveEvent.x + 16) < 140) return;
        this.changeColumnSize.emit(elementWidth - (mouseDownEvent.clientX - mouseMoveEvent.x + 16));
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', e => document.removeEventListener('mousemove', onMouseMove));
    });
  }
}
