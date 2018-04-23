import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[virtualScrollContainer]'
})
export class VirtualScrollContainer {
  constructor(public element: ElementRef) {
    let scrollElement = document.createElement('div');
    scrollElement.classList.add('table-sroll-wrapper');
    setTimeout(() => {
      // так как он в добавляется начало еще до появления строк таблицы, поэтому добавляем по таймауту
      element.nativeElement.appendChild(scrollElement);
    }, 10);
  }
}