import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { dynamicToken } from '@core/dynamic';
import { AppDate, getFirstValue, IGuidListItem } from '@core/entities';
import { ModalFormComponent } from '@core/forms';
import { IModalComponent } from '@core/overlay';
import { DictionaryService } from 'c4-admin-app/modules/shared/services/dictionary/dictionary.service';
import { EventService } from 'c4-admin-app/modules/shared/services/event/event.service';
import { finalize, switchMap } from 'rxjs/operators';
import { IUserEventEdit } from '../../entities/user-event-edit.interface';
import { IUserEvent } from '../../entities/user-event.interface';

@Component({
    templateUrl: './user-event.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class UserEventComponent extends ModalFormComponent implements OnInit {
    public timezones: IGuidListItem[] = [];

    constructor(
        @Inject(dynamicToken) public modal: IModalComponent<IUserEventEdit>,
        private _formBuilder: FormBuilder,
        private _dictionaryService: DictionaryService,
        private _eventService: EventService
    ) {
        super();
    }

    public ngOnInit(): void {
        super.ngOnInit();

        this._loadData();
    }

    public submit() {
        let fn = this.modal.data.eventId
            ? this._eventService.update(this.modal.data.eventId, this.modal.data.chatId, this.modal.data.type, this.form.value)
            : this._eventService.create(this.modal.data.chatId, this.modal.data.type, this.form.value);

        this.waitFor(fn.pipe(
            switchMap((data) => this._eventService.get(this.modal.data.eventId || data.id))
        )).subscribe(
            (event: IUserEvent) => {
                this.modal.data.afterSave(event);
                this.modal.close();
            }
        );
    }

    protected initForm() {
        return this._formBuilder.group({
            location: [null, Validators.required],
            from: [this._getCurrentDatePlusOneHour(), Validators.required],
            to: [this._getCurrentDatePlusTwoHours(), Validators.required],
            allDay: [true],
            timezone: [null, Validators.required],
            comment: [null, [
                Validators.required,
                Validators.maxLength(200)
            ]]
        });
    }

    private _getCurrentDatePlusOneHour(): Date {
        let from = AppDate.current();
        from.setHours(from.getHours() + 1);

        return from;
    }

    private _getCurrentDatePlusTwoHours(): Date {
        let to = AppDate.current();
        to.setHours(to.getHours() + 2);

        return to;
    }

    private _loadData() {
        this.loading = true;
        this._dictionaryService.timezones$.subscribe(
            (data: IGuidListItem[]) => {
                this.timezones = data;

                let control = this.form.get('timezone');
                control.patchValue(getFirstValue(this.timezones));
                control.markAsDirty();

                if (this.modal.data.isEditMode) {
                    this._loadEvent();
                } else {
                    this.loading = false;
                }
            },
            () => this.loading = false
        );
    }

    private _loadEvent() {
        this.loading = true;
        this._eventService.get(this.modal.data.eventId).pipe(
            finalize(() => this.loading = false)
        ).subscribe(
            (response) => {
                this.form.patchValue({
                    ...response,
                    from: AppDate.fromISO(response.from),
                    to: AppDate.fromISO(response.to),
                });
            }
        );
    }
}
