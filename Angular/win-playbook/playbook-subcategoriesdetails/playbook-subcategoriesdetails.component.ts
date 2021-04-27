import { Component, OnInit } from '@angular/core';
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
  selector: 'app-playbook-subcategoriesdetails',
  templateUrl: './playbook-subcategoriesdetails.component.html',
  styleUrls: ['./playbook-subcategoriesdetails.component.scss']
})
export class PlaybookSubcategoriesdetailsComponent implements OnInit {

  public playBookSubcategoryDetails: Array<any>;
  public companyPK: any;
  public categoryId: any;
  public subCategoryId: any;
  public activeCategoryDetails: any;
  public categoryOrSubcategoryNotFound: boolean = false;

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
    this.ActivatedRoute.parent.params.subscribe((params) =>{
      this.categoryId = params.id;
      if(this.companyPK) this.CategoryDetails();
    });
    
    this.ActivatedRoute.params.subscribe((params) =>{
      this.subCategoryId = params['sub-id'];
      if(this.companyPK) this.getActiveSubCategoryDetails();
      this.hideSidebar();
    });
  }

  CategoryDetails() {
    this.CoreService.get(PLAYBOOK_CONSTANTS.GET_CATEGORY,{
      "company" : this.companyPK
    }).subscribe(result=>{
      this.success(result,"getPlaybookCategories");
    });
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
    this.CoreService.get(PLAYBOOK_CONSTANTS.GET_SUBCATEGORY_DETAILS,{
      "company": this.companyPK,
      "company_category": this.categoryId,
      "sub_category": this.subCategoryId
    }).subscribe(result=>{
      this.success(result,"getPlaybookSubCategoryDetailsData");
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
    this.categoryOrSubcategoryNotFound = false;
    if(status == 200){
      switch(cb){
        case "getPlaybookSubCategoryDetailsData":
          this.hideLoader();
          this.handleGetPlaybookSubCategoryDetailsData(res.body.data);
          break;
        case "getPlaybookCategories":
          this.handleCategoryResponse(res.body.data);
          break;
      }
    } else if(status == 400) {
      this.HelperService.showLoader(false);
      this.categoryOrSubcategoryNotFound = true;
    } else {
      this.HelperService.showLoader(false);
    }
  }

  /**
   * @method: hideLoader
   * @desc: Hide loader
   */
  hideLoader() {
    if(this.activeCategoryDetails && this.activeCategoryDetails.company_category_type == 3) {
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
      return res.id ==  Number(this.categoryId);
    });
    if(category) {
      this.activeCategoryDetails = category;
      localStorage.setItem("activeCAtegory", JSON.stringify(category));
      this.Title.setTitle(PLAYBOOK_CONSTANTS.PAGE_TITLE+category.name);
      this.hideLoader();
    }
  }

   /**
   * @method: handleGetPlaybookSubCategoryDetailsData
   * @param results 
   * @desc: handle the response from API
   */
  handleGetPlaybookSubCategoryDetailsData(results){
    this.playBookSubcategoryDetails = results;
  }

   /**
   * @method: hideSidebar
   * @desc: Hide sidebar
   */
  hideSidebar() {
    let sidebar = document.getElementsByClassName('content-link')[0];
    if(sidebar) sidebar.classList.remove('sidebar-show');
    this.removeOverflowStyleOnBody();
  }

   /**
   * @method: removeOverflowStyleOnBody
   * @desc: remove overflow property on body to disable scroller when sidebar is open
   */
  removeOverflowStyleOnBody(){
    document.body.style.removeProperty('overflow');
    document.body.classList.remove("lock-position");
  }

}
