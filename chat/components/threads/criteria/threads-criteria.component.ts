import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppUtils, IGuidListItem, toGuidListItem } from '@core/entities';
import { FormComponent } from '@core/forms';
import { IDomain } from 'c4-admin-app/modules/shared/entities/domain/domain.interface';
import { DomainSelectComponent } from 'c4-admin-app/modules/common/components/domain-select/domain-select.component';
import { IThreadCriteria } from '../../../entities/thread-criteria.interface';
import { chatPageActions } from '../../../state/chat-page.actions';

const NEWEST = 'newest';
const OLDEST = 'oldest';

@Component({
    selector: 'app-threads-criteria',
    templateUrl: './threads-criteria.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadsCriteriaComponent extends FormComponent implements OnInit {
    @ViewChild(DomainSelectComponent, {static: false}) public domainSelectComp: DomainSelectComponent;

    @Input() public domains: IDomain[];

    public typeaheadControl = new FormControl(null);

    public options: IGuidListItem[] = [
        toGuidListItem('Newest', NEWEST),
        toGuidListItem('Oldest', OLDEST),
    ];

    private _last: IThreadCriteria = {
        siteId: null,
        sort: true,
    };

    public get FormControl(): typeof FormControl {
        return FormControl;
    }

    constructor(private _store: Store<any>,
        private _formBuilder: FormBuilder) {
        super();
    }

    public ngOnInit() {
        super.ngOnInit();

        this.subs[AppUtils.guid()] = this.typeaheadControl.valueChanges.subscribe(
            () => this.send()
        );
    }

    public send() {
        let domain = this.domainSelectComp.extract();

        const criteria = <IThreadCriteria> {
            siteId: domain.siteId,
            sort: this.form.value.sort === NEWEST
        };

        if (AppUtils.equals(this._last, criteria)) {
            return;
        }

        this._store.dispatch(chatPageActions.updateCriteria({criteria}));

        if (this._last.siteId !== criteria.siteId) {
            this._store.dispatch(chatPageActions.updateCounters());
            this._store.dispatch(chatPageActions.loadThreads({
                resetList: true
            }));
        }

        this._last = criteria;
    }

    protected initForm(): FormGroup {
        return this._formBuilder.group({
            sort: [NEWEST],
            siteId: [null]
        });
    }
}
