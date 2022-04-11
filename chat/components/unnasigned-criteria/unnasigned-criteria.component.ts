import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AppUtils, IGuidListItem, toGuidListItem } from '@core/entities';
import { ConfigService } from '@core/config';
import { FormBuilder, FormGroup } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { IUnnasignedCriteria } from '../../entities/unnasigned-criteria.interface';
import { chatUIState } from '../../state/ui.reducer';
import { chatPageActions } from '../../state/chat-page.actions';

enum unnasignedOptions {
    Both = 'both',
    Replied = 'replied',
    NotReplied = 'notReplied',
}

@Component({
    selector: 'app-unnasigned-criteria',
    templateUrl: './unnasigned-criteria.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class UnnasignedCriteriaComponent implements OnInit, OnDestroy {
    public unnasignedForm: FormGroup;

    public unnasignedPageOptions: IGuidListItem[] = [
        toGuidListItem(`All`, unnasignedOptions.Both),
        toGuidListItem(`Replied`, unnasignedOptions.Replied),
        toGuidListItem(`Not Replied`, unnasignedOptions.NotReplied)
    ];

    private _subs: Subscription[] = [];

    constructor(private _formBuilder: FormBuilder,
        private _configService: ConfigService,
        private _store: Store<any>) {
    }

    public ngOnInit() {
        this.unnasignedForm = this._formBuilder.group({
            unassignedChatStatus: [unnasignedOptions.NotReplied],
            unassignedChatSearch: [null]
        });

        // TODO it would be better recreate this component instead of sync with state
        this._subs[AppUtils.guid()] = this._store.pipe(select(chatUIState.unnasignedCriteria)).pipe(
            distinctUntilChanged(AppUtils.equals)
        ).subscribe(
            (data: IUnnasignedCriteria) => this.unnasignedForm.patchValue(data, {
                emitEvent: false
            })
        );

        this._subs[AppUtils.guid()] = this.unnasignedForm.valueChanges.pipe(
            debounceTime(this._configService.debounceTime),
            distinctUntilChanged()
        ).subscribe((value: IUnnasignedCriteria) => this.updateUnnasignedCriteria(value));
    }

    public ngOnDestroy() {
        AppUtils.unsubscribeAll(this._subs);
    }

    public updateUnnasignedCriteria(criteria: IUnnasignedCriteria) {
        this._store.dispatch(chatPageActions.updateUnnasignedCriteria({criteria}));
    }
}
