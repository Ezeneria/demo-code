import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { IThread } from '../../entities/thread.interface';
import { chatPageState } from '../../state/chat-page.reducer';
import { chatPageActions } from '../../state/chat-page.actions';

@Component({
    selector: 'app-threads',
    templateUrl: './threads.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadsComponent implements OnInit {
    @Input() public selected: IThread;

    @Input() public threads: IThread[];

    @Input() public selectedChatIds: number[];

    @Output() public threadLoaded: EventEmitter<void> = new EventEmitter<void>();

    public loading$: Observable<boolean>;

    public noItems$: Observable<boolean>;

    public completed$: Observable<boolean>;

    constructor(private _store: Store<any>) {
    }

    public ngOnInit(): void {
        this.loading$ = this._store.pipe(select(chatPageState.threads.loading));
        this.noItems$ = this._store.pipe(select(chatPageState.threads.noItems));
        this.completed$ = this._store.pipe(select(chatPageState.threads.completed));
    }

    public trackByFn(index: number, thread: IThread): number {
        return thread.chatId || index;
    }

    public select(isSelect: boolean, chatId: number) {
        this._store.dispatch(chatPageActions.updateSelectedChatIds({isSelect, chatId}));
    }
}
