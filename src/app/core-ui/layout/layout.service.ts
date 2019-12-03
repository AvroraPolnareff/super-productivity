import {Injectable} from '@angular/core';
import {
  hideAddTaskBar,
  hideNotes,
  hideSideNav,
  showAddTaskBar,
  toggleAddTaskBar,
  toggleShowNotes,
  toggleSideNav
} from './store/layout.actions';
import {BehaviorSubject, EMPTY, merge, Observable, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {LayoutState, selectIsShowAddTaskBar, selectIsShowNotes, selectIsShowSideNav} from './store/layout.reducer';
import {filter, map, switchMap, withLatestFrom} from 'rxjs/operators';
import {BreakpointObserver} from '@angular/cdk/layout';
import {NoteService} from '../../features/note/note.service';
import {ActivatedRoute, NavigationStart, Router} from '@angular/router';
import {ProjectService} from '../../features/project/project.service';

const NAV_ALWAYS_VISIBLE = 1050;
const NAV_OVER_NOTES_NEXT = 900;
const BOTH_OVER = 780;

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  isShowAddTaskBar$: Observable<boolean> = this._store$.pipe(select(selectIsShowAddTaskBar));

  private _isShowSideNav$: Observable<boolean> = this._store$.pipe(select(selectIsShowSideNav));
  private _isShowNotes$: Observable<boolean> = this._store$.pipe(select(selectIsShowNotes));


  isNavAlwaysVisible$: Observable<boolean> = this._breakPointObserver.observe([
    `(min-width: ${NAV_ALWAYS_VISIBLE}px)`,
  ]).pipe(map(result => result.matches));
  isNotesNextNavOver$: Observable<boolean> = this._breakPointObserver.observe([
    `(min-width: ${NAV_OVER_NOTES_NEXT}px)`,
  ]).pipe(map(result => result.matches));
  isNotesOver$: Observable<boolean> = this._breakPointObserver.observe([
    `(min-width: ${BOTH_OVER}px)`,
  ]).pipe(map(result => !result.matches));

  isShowSideNav$: Observable<boolean> = this._isShowSideNav$.pipe(
    switchMap((isShow) => {
      return isShow
        ? of(isShow)
        : this.isNavAlwaysVisible$;
    }),
  );

  isNavOver$: Observable<boolean> = this.isNotesNextNavOver$.pipe(map(v => !v));


  // isShowNotes$: Observable<boolean> = this._isShowNotes$.pipe(
  //   switchMap((isShow) => {
  //     return isShow
  //       ? of(isShow)
  //       : this.isBothAlwaysVisible$;
  //   }),
  // );

  isScrolled$ = new BehaviorSubject<boolean>(false);

  constructor(
    private _store$: Store<LayoutState>,
    private _noteService: NoteService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _projectService: ProjectService,
    private _breakPointObserver: BreakpointObserver,
  ) {
    this.isNavOver$.pipe(
      switchMap((isNavOver) => isNavOver
        ? merge(
          this._router.events.pipe(
            filter((ev) => ev instanceof NavigationStart)
          ),
          this._projectService.onProjectChange$
        ).pipe(
          withLatestFrom(this._isShowSideNav$),
          filter(([, isShowSideNav]) => isShowSideNav),
        )
        : EMPTY
      )
    ).subscribe(() => {
      this.hideSideNav();
    });
  }

  showAddTaskBar() {
    this._store$.dispatch(showAddTaskBar());
  }

  hideAddTaskBar() {
    this._store$.dispatch(hideAddTaskBar());
  }

  toggleAddTaskBar() {
    this._store$.dispatch(toggleAddTaskBar());
  }

  toggleSideNav() {
    this._store$.dispatch(toggleSideNav());
  }

  hideSideNav() {
    this._store$.dispatch(hideSideNav());
  }

  public toggleNotes() {
    this._store$.dispatch(toggleShowNotes());
  }

  public hideNotes() {
    this._store$.dispatch(hideNotes());
  }

}
