import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { IAdminChat } from '../../entities/admin-chat.interface';

@Component({
    selector: 'app-admin-list',
    templateUrl: './admin-list.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminListComponent {
    @Input() public admins: IAdminChat[];

    @Input() public ownerId: number;
}
