import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { HttpClient } from  "@angular/common/http";
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

// Shared Services
import { CoreService, HelperService } from '@shared-services';

//Constants
import { PLAYBOOK_CONSTANTS } from '../../../shared/constants/playbook.contants';

import { _ } from 'underscore';

@Component({
  selector: 'app-playbook-subcategories',
  templateUrl: './playbook-subcategories.component.html',
  styleUrls: ['./playbook-subcategories.component.scss']
})
export class PlaybookSubcategoriesComponent implements OnInit {
  public activeCategoryDetails: any = {};
  public companyPK: any;
  public categories:any;
  public id:any;
  public playBookSubcategories: Array<any>;
  public themeOptions =  { axis: 'y', theme: 'dark-3', scrollButtons: { enable: true } };
  public disableNoResultForCapabalities: boolean = true;
  public disableNoResultForObjections: boolean = true;
  public subcategoryBar: any;
  public sidebar: any;

  constructor(
    private HttpClient: HttpClient,
    private Router: Router,
    private ActivatedRoute: ActivatedRoute,
    private CoreService:CoreService,
    private HelperService: HelperService,
    private Title: Title
  ) { }

  ngOnInit() {
    this.getCompanyDetails();
    this.ActivatedRoute.params.subscribe((params) =>{
      this.hideSidebar();
      this.id = params.id;
      if(this.companyPK) {
        this.getActivePlaybookCategoryDetails();
        this.getActiveSubCategoryDetails();
      }
  	});
  }

  /**
   * @method: ngAfterViewInit
   * @desc: Function executed when template loaded completely
   */
  ngAfterViewInit() {
    this.sidebar = document.getElementsByClassName('side-bar')[0];
    this.subcategoryBar =  document.getElementsByClassName('content-link')[0];
  }

   /**
   * @method:getUserDetails
   * @desc:Method to get the User Details from the Local Storage
   */
  getCompanyDetails(){
    let companyDetails = localStorage.getItem("tokenAndCompanyDetails");
    if(companyDetails){
      companyDetails = JSON.parse(companyDetails);
      this.companyPK = companyDetails['companyId'];
    }
  }

  /**
  * @method: getActiveSubCategoryDetails
  * @param:id
  * @desc: Method to get the details of Active Sub category of Playbook category
  */
  getActiveSubCategoryDetails() {
    this.HelperService.showLoader(true);
    this.CoreService.get(PLAYBOOK_CONSTANTS.GET_SUBCATEGORY,{
      "company": this.companyPK,
      "company_category": this.id
   }).subscribe(result=>{
     this.success(result,"getActiveSubCategoryDetails");
    });
  }

  /**
   * @method: getActivePlaybookCategoryDetails
   * @desc: Get the playbook categories
   */
  getActivePlaybookCategoryDetails() {
    this.CoreService.get(PLAYBOOK_CONSTANTS.GET_CATEGORY,{
      "company" : this.companyPK
    }).subscribe(result=>{
      this.success(result,"getPlaybookCategories");
    });
  }

  /**
   * @method: success
   * @param res 
   * @param cb 
   * @desc: Verify the error from API as per the status code
   */
  success(res,cb){
    let status = res.body.status;
    // this.HelperService.showLoader(false);
    if(status == 200){
      switch(cb){
        case "getActiveSubCategoryDetails":
          this.handleGetActiveSubCategoryDetails(res.body.data);
          break;
        case "getPlaybookCategories":
          this.handleCategoryResponse(res.body.data);
          break;
      }
    } else {
      this.HelperService.showLoader(false);
    }
  }

  /**
   * @method: handleCategoryResponse
   * @desc: Handle categories response
   * @param results 
   */
  handleCategoryResponse(results: any) {
    let category = _.find(results, (res) => {
      return res.id ==  this.id;
    });
    if(category) {
      this.activeCategoryDetails = category;
      localStorage.setItem("activeCAtegory", JSON.stringify(category));
      this.Title.setTitle(PLAYBOOK_CONSTANTS.PAGE_TITLE+category.name);
    }
  }

  /**
   * @method: handleGetActiveSubCategoryDetails
   * @param results 
   * @desc: handle the response from API
   */
  handleGetActiveSubCategoryDetails(results){
    this.playBookSubcategories = results;
    if(this.playBookSubcategories.length == 0) {
      this.HelperService.showLoader(false);
      return false;
    }
    if(this.Router.url.split('/').length == 3) this.Router.navigate(['/playbook' ,this.id, this.playBookSubcategories[0]['id']]);
  }

   /**
   * @method: disableNoResultForCap
   * @desc: Disable no result message for capabilities
   */
  disableNoResultForCap(){
    this.disableNoResultForCapabalities = false;
  }

  /**
   * @method: disableNoResultForObj
   * @desc: Disable no result message for objections
   */
  disableNoResultForObj(){
    this.disableNoResultForObjections = false;
  }

  /**
   * @method: toggleSubCategoryBar
   * @desc: Toggle hide/ show sub category bar in mobile view
   */
  toggleSubCategoryBar(hide?){
    if(this.subcategoryBar) {
      this.subcategoryBar.classList.toggle('sidebar-show');
      if(this.subcategoryBar.classList.contains('sidebar-show')){
        this.addOverflowStyleOnBody();
      } else {
        this.removeOverflowStyleOnBody();
      }
    }
    if(hide && this.subcategoryBar) {
      this.subcategoryBar.classList.remove('sidebar-show');
      this.removeOverflowStyleOnBody();
    }
  }

  /**
   * @method: addOverflowStyleOnBody
   * @desc: add overflow property on body to disable scroller when sidebar is open
   */
  addOverflowStyleOnBody(){
    document.body.style.overflow = "hidden";
    document.body.classList.add("lock-position");
  }

   /**
   * @method: removeOverflowStyleOnBody
   * @desc: remove overflow property on body to disable scroller when sidebar is open
   */
  removeOverflowStyleOnBody(){
    document.body.style.removeProperty('overflow');
    document.body.classList.remove("lock-position");
  }

  /**
   * @method: hideSidebar
   * @desc: Hide sidebar
   */
  hideSidebar() {
    this.sidebar = document.getElementsByClassName('side-bar')[0];
    this.sidebar.classList.remove('menu-open');
    this.removeOverflowStyleOnBody();
  }
}
