import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {AppComponent} from './app.component';
import {PlatformService} from './services/platform.service';
import {ResponsiveModule} from 'ng2-responsive';
import {StacksToolbarComponent} from './components/stacks-toolbar/stacks-toolbar.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MdButtonModule, MdCardModule, MdMenuModule, MdSnackBarModule, MdToolbarModule} from '@angular/material';
import {FileDropComponent} from './components/file-drop/file-drop.component';
import {FileUploadModule} from 'ng2-file-upload';
import {StacksService} from './services/stacks.service';
import {StackComponent} from './components/stack/stack.component';
import {StacksComponent} from './components/stacks/stacks.component';
import {AppRoutingModule} from './app-routing.module';
import {CardsComponent} from './components/cards/cards.component';
import {CardComponent} from './components/card/card.component';
import {CardsResolver} from './resolver/cards.resolver';
import {SnackbarService} from './services/snackbar.service';
import {CardsToolbarComponent} from './components/cards-toolbar/cards-toolbar.component';
import {SideComponent} from './components/side/side.component';

@NgModule({
  declarations: [
    AppComponent,
    FileDropComponent,
    StackComponent,
    StacksComponent,
    StacksToolbarComponent,
    CardComponent,
    CardsComponent,
    CardsToolbarComponent,
    SideComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FileUploadModule,
    FormsModule,
    HttpModule,
    ResponsiveModule,
    MdButtonModule,
    MdToolbarModule,
    MdSnackBarModule,
    MdCardModule,
    MdMenuModule
  ],
  providers: [PlatformService, StacksService, SnackbarService, CardsResolver],
  bootstrap: [AppComponent]
})

export class AppModule {
}
