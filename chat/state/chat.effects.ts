import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { OverlayService } from '@core/modal';
import { MarkdownLib } from '@core/markdown';
import { ConfigService } from '@core/config';
import { TruncatePipe } from '@core/shared';
import { AddNotification, NoteGroup } from '@core/note';
import {
    ChatNotificationType,
    coreChatActions,
    coreChatState,
    IChatItemResponse,
    IChatNotificationResponse
} from '@core/chat';
import { catchError, filter, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ChatClientService } from '../providers/chat-client.service';
import { IThread } from '../entities/thread.interface';
import { ChatService } from '../providers/chat.service';
import { chatPageActions } from './chat-page.actions';
import { chatPageState } from './chat-page.reducer';

@Injectable()
export class ChatEffects {
    public translate$ = createEffect(() => this._actions$.pipe(
        ofType(chatPageActions.translate),
        withLatestFrom(
            this._store.select(coreChatState.messages)
        ),
        tap(([data, messages]) => {
            let message = messages.find((m) => m.uuid === data.uuid);
            if (!message) {
                return;
            }

            this._store.dispatch(coreChatActions.updateMessage({
                uuid: message.uuid,
                value: {
                    foreignMessage: message.message,
                    message: data.message
                }
            }));

            this._store.dispatch(chatPageActions.updateThreads({
                message: {
                    ...message,
                    foreignMessage: message.message,
                    message: data.message
                }
            }));
        })
    ), {dispatch: false});

    // TODO only when threads ready
    public notification$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.note),
        map(({note}) => note),
        filter((note: IChatNotificationResponse) => !!note.data),
        withLatestFrom(
            this._store.pipe(select(chatPageState.ui.resolved)),
            this._store.pipe(select(chatPageState.threads.threads)),
            this._store.pipe(select(chatPageState.ui.currentOwnerId)),
        ),
        tap(([note, resolved, threads, ownerId]) => {
            if (!resolved) {
                return; // notifications only for chat pages
            }

            let chatId = note.data.chatId;
            switch (note.type) {
                case ChatNotificationType.TranslateMemberChatMessage:
                    this._store.dispatch(chatPageActions.translate(note.data));
                    break;
                case ChatNotificationType.DeassignFromChat:
                    this._deassignFromChat(threads, chatId);
                    break;
                case ChatNotificationType.AssignToChat:
                    this._assignToChat(threads, chatId, ownerId);
                    break;
                case ChatNotificationType.ChatUnavailable:
                    this._chatUnavailable(chatId);
                    break;
                case ChatNotificationType.NotAllowedSendMessages:
                    this._notAllowedMessage(note);
                    break;
                default:
                    console.warn('Unknown type of chat notification', note);
            }
        })
    ), {dispatch: false});

    public open$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.open),
        tap(({chatId}) => this._router.navigate(
            ['/live/chat/active'],
            {
                queryParams: {
                    chatId
                }
            }
        ).then(() => this._overlayService.close()))
    ), {dispatch: false});

    public close$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.close),
        tap(({navigate}) => navigate && this._router.navigate([], {
            queryParams: null
        }))
    ), {dispatch: false});

    public load$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.load),
        switchMap(({chatId}) => {
            return this._chatService.details(chatId).pipe(
                map((thread: IThread) => coreChatActions.loadSuccess({thread})),
                catchError((err: Error) => of(coreChatActions.loadFail({err})))
            );
        })
    ));

    public loadSuccess$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.loadSuccess),
        mergeMap(() => [
            coreChatActions.loadMessages(),
            chatPageActions.extended()
        ])
    ));

    public loadThreadFail$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.loadFail),
        map(() => coreChatActions.close({navigate: true}))
    ));

    public loadMessages$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.loadMessages),
        withLatestFrom(
            this._store.pipe(select(coreChatState.chatId)),
            this._store.pipe(select(coreChatState.fromUuid)),
            this._store.pipe(select(chatPageState.ui.readonly)),
        ),
        switchMap(([action, chatId, fromUuid, readonly]) => {
            const chatMessagesPerPage: number = this._configService.chatMessagesPerPage;

            return this._chatService.messages(chatId, fromUuid, chatMessagesPerPage).pipe(
                mergeMap((messages: IChatItemResponse[]) => {
                    let actions: any[] = [
                        coreChatActions.loadMessagesSuccess({
                            messages,
                            addBefore: true,
                            completed: messages.length < chatMessagesPerPage
                        })
                    ];

                    if (!readonly) {
                        actions = [
                            ...actions,
                            coreChatActions.tryMarkAsRead({messages})
                        ];
                    }

                    return actions;
                }),
                catchError((err: Error) => of(coreChatActions.loadMessagesFail({err})))
            );
        })
    ));

    public tryMarkAsRead$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.tryMarkAsRead),
        withLatestFrom(
            this._store.pipe(select(coreChatState.thread))
        ),
        tap(([{messages}, thread]: [any, IThread]) => {
            if (!thread) {
                return;
            }

            let uuids = messages
                .filter((msg: IChatItemResponse) => msg.uuid && !msg.isRead && msg.userId !== thread.angel.id)
                .map((msg: IChatItemResponse) => msg.uuid);

            if (uuids.length > 0) {
                this._chatService.markAsRead(thread.chatId, uuids).subscribe();
                this._store.dispatch(coreChatActions.markAsRead({uuids}));
            }
        })
    ), {dispatch: false});

    // TODO split to success fail
    public send$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.send),
        withLatestFrom(
            this._store.pipe(select(coreChatState.isReady)),
            this._store.pipe(select(coreChatState.chatId)),
        ),
        tap(([{message, foreignText, messageType, chatId, ownerToken}, isReady, currentChatId]) => {
            if (!isReady) {
                this._store.dispatch(chatPageActions.fail(null));
            }

            this._chatClientService.send(
                currentChatId || chatId,
                message,
                foreignText,
                messageType,
                ownerToken
            );
        })
    ), {dispatch: false});

    public incoming$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.incoming),
        map(({message}) => message),
        // eslint-disable-next-line no-restricted-syntax
        tap((msg: IChatItemResponse) => console.info('incoming', msg)),
        withLatestFrom(
            this._store.pipe(select(coreChatState.thread)),
            this._store.pipe(select(chatPageState.ui.resolved))
        ),
        tap(([msg, thread, threadResolved]: [IChatItemResponse, IThread, boolean]) => {
            if (!thread) {
                return;
            }

            let isNotMyMessage = msg.userId !== thread.angel.id;
            if (isNotMyMessage) {
                let isActiveChat = thread && thread.chatId === msg.chatId;
                if (isActiveChat) {
                    this._store.dispatch(coreChatActions.tryMarkAsRead({messages: [msg]}));
                } else {
                    this._store.dispatch(new AddNotification({
                        body: new TruncatePipe().transform(MarkdownLib.mdToMessage(msg.message), 100),
                        group: NoteGroup.Success
                    }));
                }
            }

            if (threadResolved) {
                this._store.dispatch(chatPageActions.updateThreads({message: msg}));
            }
        })
    ), {dispatch: false});

    public connect$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.connect),
        tap(() => this._chatClientService.init())
    ), {dispatch: false});

    public disconnect$ = createEffect(() => this._actions$.pipe(
        ofType(coreChatActions.disconnect.type),
        tap(() => this._chatClientService.disconnect())
    ), {dispatch: false});

    constructor(private _actions$: Actions,
        private _overlayService: OverlayService,
        private _store: Store<any>,
        private _router: Router,
        private _configService: ConfigService,
        private _chatService: ChatService,
        private _chatClientService: ChatClientService) {
    }

    private _deassignFromChat(threads: IThread[], chatId: number) {
        let thread = threads.find((t) => t.chatId === chatId);
        if (thread) {
            this._store.dispatch(new AddNotification({
                body: `Chat between ${thread.angel.userName} and ${thread.member.userName} was deassigned`,
                group: NoteGroup.Success
            }));
        }

        // TODO check for unnasigned / archive pages
        this._store.dispatch(chatPageActions.removeThread({chatId}));
    }

    private _assignToChat(threads: IThread[], chatId: number, ownerId: number) {
        this._chatService.details(chatId).subscribe(
            (newThread: IThread) => {
                if (newThread.admin && newThread.admin.id === ownerId) {
                    let exist = threads.find((c) => c.chatId === chatId);
                    if (exist) {
                        console.warn('Chat thread already exist, C4-1779', exist);
                        return;
                    }

                    this._store.dispatch(chatPageActions.updateThreadsSuccess({
                        threads: [
                            ...threads,
                            newThread
                        ]
                    }));
                }
            }
        );

        this._store.dispatch(chatPageActions.updateCounters());
    }

    private _chatUnavailable(chatId: number) {
        // console.info(action.payload.type, action.payload.data);
        this._store.dispatch(new AddNotification({
            body: `Chat #${chatId} not available more`,
            group: NoteGroup.Success
        }));
        this._store.dispatch(chatPageActions.removeThread({chatId}));
    }

    private _notAllowedMessage(note) {
        this._store.dispatch(new AddNotification({
            body: note.data.message,
            group: NoteGroup.Error
        }));
    }
}
