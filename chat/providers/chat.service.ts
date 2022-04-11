import { Injectable } from '@angular/core';
import { ICriterion } from '@core/criteria';
import { AppUtils, toListItem } from '@core/entities';
import { restMap, RestService } from '@core/rest';
import { BaseChatService, IChatItemResponse, toChatItemResponse } from '@core/chat';
import { Observable } from 'rxjs';
import { IThread, toThread } from '../entities/thread.interface';
import { IChatSession, toChatSession } from '../entities/chat-session.interface';
import { IChatExtended, toChatExtended } from '../entities/chat-extended.interface';
import { IAdminChat, toAdminChat } from '../entities/admin-chat.interface';
import { IThreadTotals } from '../entities/thread-totals.interface';

@Injectable({
    providedIn: 'root'
})
export class ChatService extends BaseChatService {
    constructor(restService: RestService) {
        super(restService);
    }

    // POST chats/update-translation-language
    public updateLanguage(chatId: number, languageId: number) {
        const endpoint: string = `${this.api}update-translation-language`;

        const body = {
            chatId,
            languageId
        };

        return this.restService.restPOST(endpoint, body);
    }

    // GET /chats/admins
    public admins(): Observable<IAdminChat[]> {
        let endpoint = `${this.api}admins`;
        return this.restService.restGET(endpoint).pipe(
            restMap((data) => AppUtils.mapArray(data, toAdminChat))
        );
    }

    // POST /chats/create
    public create(fromUserId: number, toUserId: number, siteId: number, translationLanguageId): Observable<number> {
        let endpoint = `${this.api}create`;

        let body = {
            fromUserId,
            toUserId,
            siteId,
            translationLanguageId
        };

        return this.restService.restPOST(endpoint, body, false);
    }

    // POST /chats/update-is-pinned
    public togglePin(chatId: number, uuid: string, isPinned: boolean): Observable<any[]> {
        let endpoint = `${this.api}update-is-pinned`;

        let body = {
            chatId,
            uuid,
            isPinned
        };

        return this.restService.restPOST(endpoint, body);
    }

    // POST /chats/chat-thread
    public byAdmin(adminId: number, criteria: ICriterion[], take: number): Observable<IThread[]> {
        let endpoint = `${this.api}chat-thread`;

        let body = {
            adminId,
            criteria,
            take
        };

        return this.restService.restPOST(endpoint, body).pipe(
            restMap((data) => AppUtils.mapArray(data, toThread))
        );
    }

    // POST /chats/load-chats
    public list(criteria: ICriterion[], take: number): Observable<IThread[]> {
        let endpoint = `${this.api}load-chats`;

        let body = {
            criteria,
            take
        };

        return this.restService.restPOST(endpoint, body).pipe(
            restMap((data) => AppUtils.mapArray(data, toThread))
        );
    }

    // GET /chats/load-chat/{chatId}
    public details(chatId: number): Observable<IThread> {
        let endpoint = `${this.api}load-chat/${chatId}`;

        return this.restService.restGET(endpoint).pipe(
            restMap((data) => toThread(data))
        );
    }

    // GET /chats/messages-by-chat/{chatId}
    public messages(chatId: number, fromUuid: string, take: number): Observable<IChatItemResponse[]> {
        let endpoint = `${this.api}messages-by-chat/${chatId}`;

        let params = [
            toListItem('take', take),
            fromUuid ? toListItem('fromUuid', fromUuid) : null
        ];

        return this.restService.restGET(endpoint, params).pipe(
            restMap((data) => AppUtils.mapArray(data, toChatItemResponse))
        );
    }

    // GET/chats/session/{sessionId}
    public session(sessionId: number): Observable<IChatSession> {
        let endpoint = `${this.api}session/${sessionId}`;

        return this.restService.restGET(endpoint).pipe(
            restMap((data) => toChatSession(data))
        );
    }

    // POST /chats/total-by-admin/{adminId}
    public totals(siteId: number): Observable<IThreadTotals> {
        let endpoint = `${this.api}total-by-admin`;

        let body = siteId && {siteId} || null;

        return this.restService.restPOST(endpoint, body);
    }

    // GET /chats/extended/{chatId}
    public extended(chatId: number): Observable<IChatExtended> {
        let endpoint = `${this.api}extended/${chatId}`;
        return this.restService.restGET(endpoint).pipe(
            restMap((data) => toChatExtended(data))
        );
    }

    // POST /chats/assign-admin
    public assignChats(chatIds: number[], adminId: number) {
        let endpoint = `${this.api}assign-admin`;

        let body = {
            chatIds,
            adminId
        };

        return this.restService.restPOST(endpoint, body);
    }

    // POST /chats/deassign-admin
    public deassignChats(chatIds: number[]) {
        let endpoint = `${this.api}deassign-admin`;

        let body = {
            chatIds
        };

        return this.restService.restPOST(endpoint, body);
    }

    // POST /chats/archive-chats
    public unpauseChats(chatIds: number[]) {
        let endpoint = `${this.api}unpause-chats`;

        let body = {
            chatIds
        };

        return this.restService.restPOST(endpoint, body);
    }

    // POST /chats/archive-chats
    public archiveChats(chatIds: number[]) {
        let endpoint = `${this.api}archive-chats`;

        let body = {
            chatIds
        };

        return this.restService.restPOST(endpoint, body);
    }

    // POST /chats/unarchive-chats
    public unarchiveChats(chatIds: number[]) {
        let endpoint = `${this.api}unarchive-chats`;

        let body = {
            chatIds
        };

        return this.restService.restPOST(endpoint, body);
    }
}
