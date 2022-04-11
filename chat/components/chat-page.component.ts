import { AfterViewInit, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { AuthState } from '@core/auth';
import { ChatClientStatus, coreChatActions, coreChatState } from '@core/chat';
import { AppUtils, ScrollPosition, ScrollUtils } from '@core/entities';
import { ChatComponent } from './chat/chat.component';
import { ThreadType } from '../entities/thread-type';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { filter, first, map, skip, withLatestFrom } from 'rxjs/operators';
import { IThread } from '../entities/thread.interface';
import { IChatExtended } from '../entities/chat-extended.interface';
import { IAdminChat } from '../entities/admin-chat.interface';
import { chatPageActions } from '../state/chat-page.actions';
import { chatPageState } from '../state/chat-page.reducer';
import { BoxScrollComponent } from '@core/shared';

@Component({
    templateUrl: './chat-page.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ChatPageComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChildren(BoxScrollComponent) public scrolls: QueryList<BoxScrollComponent>;

    @ViewChild(ChatComponent, {static: false}) public chat: ChatComponent;

    public threads$: Observable<IThread[]>;
    public loading$: Observable<boolean>;
    public thread$: Observable<IThread>;
    public status$: Observable<ChatClientStatus>;
    public extended$: Observable<IChatExtended>;
    public members$: Observable<any>;
    public admins$: Observable<IAdminChat[]>;
    public readonly$: Observable<boolean>;
    public selectedChatIds$: Observable<number[]>;

    public pageType: ThreadType = null;

    public currentOwnerId: number = null;

    public isAdminChatsPage: boolean = false;

    public hasCriteria: boolean = false;

    public isSidebarRightVisible: boolean = false;

    private _subs: Subscription[] = [];

    constructor(private _store: Store<any>,
        private _route: ActivatedRoute,
        private _router: Router,
        private _authState: AuthState) {
    }

    public ngOnInit(): void {
        this._initState();
        this._initPageTypeListener();
        this._initChatIdListener();
        this._initAdminIdListener();
    }

    public ngAfterViewInit() {
        this._subs[AppUtils.guid()] = combineLatest([
            this._store.pipe(select(chatPageState.threads.preparedThreadsLength)),
            this._store.pipe(select(chatPageState.threads.completed)),
        ]).pipe(
            skip(1), // skip initial value
            withLatestFrom(
                this._route.queryParams,
                this.thread$
            )
        ).subscribe(
            ([, queryParams, current]: [any, Params, IThread]) => {
                let threadScroll = this._getThreadScroll();
                ScrollUtils.updatePosition(threadScroll, ScrollPosition.Update);

                // restore chat window after F5 / create new chat
                if (!current) {
                    this._loadThread(+queryParams.chatId);
                }
            }
        );
    }

    public ngOnDestroy(): void {
        this._store.dispatch(coreChatActions.close({navigate: false}));

        this._store.dispatch(chatPageActions.resetPage({
            pageType: null,
            ownerId: null
        }));

        AppUtils.unsubscribeAll(this._subs);
    }

    public loadThreads() {
        this._store.dispatch(chatPageActions.loadThreads({resetList: false}));
    }

    public updateExtendedScroll(toTop: boolean) {
        let scroll = this._getExtendedScroll();
        ScrollUtils.updatePosition(scroll, toTop && ScrollPosition.ToTop || ScrollPosition.Update);
    }

    public sidebarRightToggle() {
        this.isSidebarRightVisible = !this.isSidebarRightVisible;
    }

    private _initState() {
        this.loading$ = this._store.pipe(select(coreChatState.loading));

        this.thread$ = this._store.pipe(select(coreChatState.thread)) as Observable<IThread>;

        this.extended$ = this._store.pipe(select(chatPageState.ui.extended));
        this.members$ = this.extended$.pipe(
            map((extended: IChatExtended) => extended && extended.members)
        );

        this.admins$ = this._store.pipe(select(chatPageState.ui.admins));
        this.status$ = this._store.pipe(select(coreChatState.status));
        this.readonly$ = this._store.pipe(select(chatPageState.ui.readonly));
        this.threads$ = this._store.pipe(select(chatPageState.threads.preparedThreads));
        this.selectedChatIds$ = this._store.pipe(select(chatPageState.threads.selectedChatIds));
    }

    private _initAdminIdListener() {
        this._subs[AppUtils.guid()] = this.admins$.pipe(
            filter((admins) => admins.length > 0),
            first()
        ).subscribe(() => {
            this._subs[AppUtils.guid()] = this._route.queryParamMap.pipe(
                filter(() => this.pageType === ThreadType.AgentChats),
                map((queryParamMap: ParamMap) => queryParamMap.get('adminId'))
            ).subscribe(
                (paramAdminId: string) => this._onAdminIdChange(paramAdminId)
            );
        });
    }

    private _onAdminIdChange(paramAdminId: string) {
        if (paramAdminId !== null) {
            this._setAdminId(+paramAdminId);
        } else {
            this._clearAdminId();
        }
    }

    private _setAdminId(adminId: number) {
        if (this.currentOwnerId === adminId) {
            return;
        }

        this.currentOwnerId = adminId;

        this._store.dispatch(chatPageActions.resetPage({
            pageType: this.pageType,
            ownerId: this.currentOwnerId
        }));

        this.loadThreads();
    }

    private _clearAdminId() {
        this.currentOwnerId = null;

        this._store.dispatch(chatPageActions.resetPage({
            pageType: this.pageType,
            ownerId: this.currentOwnerId
        }));
    }

    private _initChatIdListener() {
        this._subs[AppUtils.guid()] = this._route.queryParamMap.pipe(
            map((queryParamMap: ParamMap) => queryParamMap.get('chatId')),
            withLatestFrom(
                this.thread$
            )
        ).subscribe(
            ([paramChatId, current]) => this._onChatIdChange(paramChatId, current)
        );
    }

    private _onChatIdChange(paramChatId: string, current: IThread) {
        if (paramChatId !== null) {
            this._loadThread(+paramChatId);
        } else {
            if (current) {
                this._store.dispatch(coreChatActions.close({navigate: false}));
            }
        }
    }

    private _initPageTypeListener() {
        this._subs[AppUtils.guid()] = this._route.paramMap.pipe(
            map((param: ParamMap) => param.get('type'))
        ).subscribe(
            (type: ThreadType) => {
                this.pageType = type;
                this.currentOwnerId = this.pageType === ThreadType.Active && this._authState.currentUserId || null;
                this.isAdminChatsPage = this.pageType === ThreadType.AgentChats;
                this.hasCriteria = this.pageType === ThreadType.Unassigned || this.pageType === ThreadType.Bank;

                this._store.dispatch(chatPageActions.resetPage({
                    pageType: this.pageType,
                    ownerId: this.currentOwnerId
                }));

                switch (this.pageType) {
                    case ThreadType.AgentChats:
                        this._store.dispatch(chatPageActions.adminList());
                        break;
                    case ThreadType.Active:
                    case ThreadType.Scheduled:
                    case ThreadType.Unassigned:
                    case ThreadType.Bank:
                    case ThreadType.Archived:
                    case ThreadType.Paused:
                        this.loadThreads();
                        break;
                    default:
                        this._router.navigate(['/404']);
                }
            },
        );
    }

    private _getThreadScroll(): BoxScrollComponent {
        if (!this.scrolls) {
            return null;
        }

        if (!this.isAdminChatsPage) {
            return this.scrolls.first || null;
        }

        return this.scrolls.find((item, index) => index === 1) || null;
    }

    private _getExtendedScroll(): BoxScrollComponent {
        return this.scrolls && this.scrolls.last || null;
    }

    private _loadThread(chatId: number) {
        if (!chatId) {
            return;
        }

        this.threads$.pipe(first()).subscribe(
            (threads: IThread[]) => {
                if (threads.find((t) => t.chatId === chatId)) {
                    this._store.dispatch(coreChatActions.load({chatId}));
                }
            }
        );
    }
}
