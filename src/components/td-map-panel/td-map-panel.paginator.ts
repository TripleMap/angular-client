import { MatPaginatorIntl } from '@angular/material/paginator';

export class TDMApPanelMatPaginatorIntl extends MatPaginatorIntl {
    itemsPerPageLabel = 'Объектов на странице';
    nextPageLabel = 'следующая';
    previousPageLabel = 'предыдущая';

    getRangeLabel = function (page, pageSize, length) {
        if (length === 0 || pageSize === 0) {
            return '0 из ' + length;
        }
        length = Math.max(length, 0);
        const startIndex = page * pageSize;
        const endIndex = startIndex < length ?
            Math.min(startIndex + pageSize, length) :
            startIndex + pageSize;
        return startIndex + 1 + ' - ' + endIndex + ' / ' + length;
    };
}