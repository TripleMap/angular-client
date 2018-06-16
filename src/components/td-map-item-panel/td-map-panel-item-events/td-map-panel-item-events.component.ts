import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { LayersLinks } from "../../../services/OverLaysService";
import { MatDialog } from '@angular/material';
import { ConfirmDialogDialog } from '../../confirm-dialog/confirm-dialog.component';
import { FormBuilder, FormControl } from '@angular/forms';
import { MessageService } from '../../../services/MessageService';

interface Event {
  id: string | undefined;
  event: string;
  event_description: string;
  feature_id: string;
}

@Component({
  selector: 'td-map-panel-item-events',
  templateUrl: './td-map-panel-item-events.component.html',
  styleUrls: ['./td-map-panel-item-events.component.css'],
  host: {
    style: 'height:100%;'
  }
})
export class TdMapPanelItemEventsComponent implements OnInit, OnChanges {
  @Input('feature') feature;
  @Input('layerId') layerId;
  public featureEvents: any[] = [];
  public newEvent: any;
  public eventEditForm: any;
  constructor(
    public http: HttpClient,
    public MatDialog: MatDialog,
    public MessageService: MessageService,
    public formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.eventEditForm = this.formBuilder.group({});
  }
  ngOnChanges(simpleChange) {
    if (simpleChange.feature)
      simpleChange.feature.currentValue ? this.getEvents(simpleChange.feature.currentValue.id) : this.clearEvents();
  }

  getEvents(featureId) {
    if (this.layerId) {
      this.http.get(LayersLinks.events.getAll(this.layerId, featureId))
        .subscribe((data: Event[]) => {
          this.featureEvents = data.reverse();
        }, error => {
          this.MessageService.errorMessage('Не удалось получить список событий.')
        })
      this.newEvent = this.generateNewEvent();
    }
  }

  eventCanEditOrRemove(event) {
    event.canEdit = true;
    event.canRemove = true;
  }
  eventCanNOTEditOrRemove(event) {
    event.canEdit = false;
    event.canRemove = false;
  }


  createEvent() {
    if (this.newEvent.event && this.newEvent.event.length > 0) {
      let pushEvent: any = {};
      for (const key in this.newEvent) {
        pushEvent[key] = this.newEvent[key];
      }
      pushEvent.added = true;
      this.featureEvents.push((pushEvent));
      this.newEvent = this.generateNewEvent();
    } else {
      this.MessageService.warnMessage('Не задано название события.');
      return;
    }
  }

  editEvent(event) {
    event.editMode = event.editMode ? false : true;
    for (let control in this.eventEditForm.controls) {
      this.eventEditForm.removeControl(control)
    }
    if (event.editMode) {
      this.eventEditForm.addControl(this.generateEventFormControlName(event.id, 'event'), new FormControl(event.event));
      this.eventEditForm.addControl(this.generateEventFormControlName(event.id, 'event_description'), new FormControl(event.event_description));
    }
  }


  removeEvent(event) {
    this.MatDialog.open(ConfirmDialogDialog, {
      width: '250px',
      data: {
        message: 'Удалить событие?'
      }
    }).afterClosed()
      .subscribe(confirm => {
        if (!confirm) return;
        if (event.added) {
          for (let index = 0; index < this.featureEvents.length; index++) {
            const element = this.featureEvents[index];
            if (element.id === event.id) this.featureEvents.splice(index, 1);
          }
        } else {
          this.http.delete(LayersLinks.events.deleteById(this.layerId, event.id))
            .subscribe(
              data => {
                for (let index = 0; index < this.featureEvents.length; index++) {
                  const element = this.featureEvents[index];
                  if (element.id === event.id) this.featureEvents.splice(index, 1);
                }
                this.MessageService.succesMessage('Событие удалено.')
              }, error => {
                this.MessageService.errorMessage('Не удалось удалить событие.');
              })

        }
      });
  }

  generateNewEvent() {
    const guid = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) + '-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return {
      id: guid(),
      event: ``,
      event_description: ``,
      feature_id: this.feature.id,
      created_at: new Date()
    }
  }

  saveEvent(event) {
    if (event.editMode && !event.added) {
      let patchEvent: { event: string; event_description: string } = { event: null, event_description: null };
      patchEvent.event = this.eventEditForm.get(`${event.id}_event`).value;
      patchEvent.event_description = this.eventEditForm.get(`${event.id}_event_description`).value;

      this.http.patch(LayersLinks.events.updateById(this.layerId, event.id), patchEvent)
        .subscribe(
          (data: any) => {
            event.editMode = false;
            this.MessageService.succesMessage('Событие обновлено.');
            event.event = patchEvent.event;
            event.event_description = patchEvent.event_description;
          },
          error => {
            this.MessageService.errorMessage('Не удалось обновить событие.')
            console.log(error);
          }
        )
    } else {
      event.added = false;
      this.http.post(LayersLinks.events.create(this.layerId, this.feature.id), event)
        .subscribe(
          (data: any) => {
            this.MessageService.succesMessage('Событие создано.')
          },
          error => {
            event.added = true;
            this.MessageService.errorMessage('Не удалось сохранить событие.')
            console.log(error);
          }
        )
    }

  }

  generateEventFormControlName = (id, subName) => `${id}_${subName}`;
  clearEvents() { this.featureEvents = []; }
}
