import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'inicial',
    loadComponent: () =>
      import('./paginas/inicial/inicial.page').then((m) => m.InicialPage),
  },
  {
    path: 'celeiro',
    loadComponent: () =>
      import('./paginas/celeiro/celeiro.page').then((m) => m.CeleiroPage),
  },
  { path: '', redirectTo: 'inicial', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicial' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
