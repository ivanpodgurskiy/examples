import { Component, OnInit } from '@angular/core';

// Shared Services
import { CoreService } from '@shared-services';

@Component({
  selector: 'app-playbook-categories',
  templateUrl: './playbook-categories.component.html',
  styleUrls: ['./playbook-categories.component.scss']
})
export class PlaybookCategoriesComponent implements OnInit {

  userDetails: any;
  companyPK: any;
  companyName: any;

  constructor(
    private CoreService: CoreService
  ) { }

  ngOnInit() {
    
  }
}
