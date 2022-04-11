import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslationService } from 'c4-admin-app/modules/translations';
import { AppUtils, IGuidListItem, toGuidListItem } from '@core/entities';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { ChatService } from 'c4-admin-app/modules/chat/providers/chat.service';
import { IThread } from 'c4-admin-app/modules/chat/entities/thread.interface';
import { Store } from '@ngrx/store';
import { coreChatActions } from '@core/chat';

@Component({
    selector: 'app-chat-change-translation',
    templateUrl: './chat-change-translation.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ChatChangeTranslationComponent implements OnInit, OnDestroy {
    @Input() public thread: IThread;

    public translation: FormControl = new FormControl(null);

    public translationsDictionary$: Observable<IGuidListItem[]>;

    private _subs: Subscription[] = [];

    constructor(
        private _translationService: TranslationService,
        private _chatService: ChatService,
        private _store: Store<any>
    ) {
    }

    public ngOnInit(): void {
        if (this.thread.translationLanguage) {
            this.translation.setValue(this.thread.translationLanguage.id);
        }

        this.translationsDictionary$ = this._translationService.allLanguages$.pipe(
            map((list) => list.map((t) => toGuidListItem(t.name, t.id)))
        );

        this._subs[AppUtils.guid()] = this.translation.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((languageId: number) => this._chatService.updateLanguage(this.thread.chatId, languageId)),
            tap(() => this._store.dispatch(coreChatActions.load({chatId: this.thread.chatId})))
        ).subscribe();
    }

    public ngOnDestroy(): void {
        AppUtils.unsubscribeAll(this._subs);
    }
}
