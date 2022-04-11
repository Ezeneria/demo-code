import { FormsModule } from 'c4-admin-app/modules/forms/forms.module';
import { NgModule } from '@angular/core';
import { CoreModule } from '@core/entry';
import { CommonModule } from 'c4-admin-app/modules/common/common.module';
import { components } from './components/index';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ChatEffects } from './state/chat.effects';
import { ChatPageEffects } from './state/chat-page.effects';
import { FEATURE_NAME, } from './state/token';
import { reducerFactory, reducerToken } from './state/chat-page.reducer';
import { PermissionModule } from 'c4-admin-app/modules/permissions';

@NgModule({
    imports: [
        CoreModule,
        CommonModule,
        FormsModule,
        StoreModule.forFeature(FEATURE_NAME, reducerToken),
        EffectsModule.forFeature([ChatEffects, ChatPageEffects]),
        PermissionModule
    ],
    declarations: [
        ...components
    ],
    exports: [
        ...components
    ],
    providers: [
        {
            provide: reducerToken,
            useFactory: reducerFactory
        }
    ]
})
export class ChatModule {
}
