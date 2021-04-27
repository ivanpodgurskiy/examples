import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ActivatedRoute } from '@angular/router'

// Shared Services
import { CoreService, HelperService } from '@shared-services';

//Constants
import { CONTENTASSETS_CONSTANTS } from './contentassets.constants';
import { APP_CONSTANT } from '../../../../app.constants';

//External Modules/ Services
import { ToastrManager } from 'ng6-toastr-notifications';

// Modal
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ContentassetpopupComponent } from './contentassetpopup//contentassetpopup.component';
//Constants
import { PLAYBOOK_CONSTANTS } from '../../../../shared/constants/playbook.contants';
import { _ } from 'underscore';

@Component({
  selector: 'app-contentassets',
  templateUrl: './contentassets.component.html',
  styleUrls: ['./contentassets.component.scss']
})
export class ContentassetsComponent implements OnInit {

  public assetInfo: object = {};
  public markets: any;
  public currentCategoryData: any;
  public successCases: any;
  public assetsCases: any = [];
  public contentAssets: any = [];
  public selectedMarketIds: any[];
  public selectedsuccessCasesIds: any[];
  public segmentsIds: any[] = [];
  public spacesIds: any[] = [];
  public assetsIds: any[] = [];
  public activePreviousButton: boolean = false;
  public activeNextButton: boolean = true;
  public hideSolutions: boolean = false;
  public hideSortByButton: boolean = false;
  public hidePaginationButton: boolean = false;
  public categoryType: number;
  public pageNumber: number = 1;
  public totalPages: number;
  public companyPK: number;
  public sortBy: string = "title";
  public sortOrder: string = "asc";
  public prefixForSolution: string;
  public postfixForSolution: string;
  public prefixForSegment: string;
  public postfixForSegment: string;
  public assetHeading: string;
  public reviewExampleTitle: string;
  public sortCase: string;
  public searchedCA: string;
  public _data = new BehaviorSubject([]);
  public selectedItems: any = [];
  public selectedItemsForSegments: any = [];
  public filter: boolean = false;
  modalRef: BsModalRef;
  subCategoryId: any;

  actCat: any;
  
  @Input() companyPk:any;
  @Input() activeCategory:any;

  /**
   * @method: subCategoryObject
   * @desc: to set the data which is sent by playbook component
   */
  @Input()
    set subCategoryObject(value) {
    // set the latest value for _data BehaviorSubject
    this._data.next(value);
  };

  get data() {
    // get the latest value from _data BehaviorSubject
    return this._data.getValue();
  }

  constructor(
    private CoreService:CoreService,
    private HelperService: HelperService,
    private ToastrManager: ToastrManager,
    private route: ActivatedRoute,
    private modalService: BsModalService
  ) {
    this.route.queryParams.subscribe(params => {
      this.searchedCA = params['contentAssets'];
      this.filter = true;
      if(this.searchedCA) {
        this.filter = true;
        // this.getContentAssets();
      } else {
        this.filter = false;
      }
    });

    this.route.parent.params.subscribe((params) =>{
      this.subCategoryId = params['id'];
    });
  }
  
  ngOnInit() {
    this.getCompanyDetails();
    this.setDataForVideoPage();
  }

  ngOnDestroy() {
    console.log();
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
   * @method: setConstants
   * @desc: to set constants content
   */
  setConstants(){
    this.companyPK = this.companyPk;
    if( (this.actCat) && (this.actCat.company_category_type == 2) ) {
      this.reviewExampleTitle = CONTENTASSETS_CONSTANTS.CONTENT_ASSET_HEADING;
      this.categoryType = this.actCat.company_category_type;
      this.hideSolutions = false;
      this.assetHeading = CONTENTASSETS_CONSTANTS.REVIEW_EXAMPLES_HEADING;
      this.prefixForSolution = CONTENTASSETS_CONSTANTS.IM_SELLING;
      this.postfixForSolution = "";
      this.prefixForSegment = CONTENTASSETS_CONSTANTS.IN_THE;
      this.postfixForSegment = CONTENTASSETS_CONSTANTS.SPACE;
    } else if((this.actCat) && (this.actCat.company_category_type == 1)) {
      this.reviewExampleTitle = CONTENTASSETS_CONSTANTS.SUCCESS_CASES_HEADING;
      this.prefixForSegment = CONTENTASSETS_CONSTANTS.IM_SELLING_IN_THE;
      this.postfixForSegment = CONTENTASSETS_CONSTANTS.MARKETS;
      this.assetHeading = CONTENTASSETS_CONSTANTS.SOCIAL_PROOF;
      this.hideSolutions = true;
      this.categoryType = this.actCat.company_category_type;
    } else if(this.actCat) {
      this.reviewExampleTitle = CONTENTASSETS_CONSTANTS.SUCCESS_CASES_HEADING;
      this.categoryType = this.actCat.company_category_type;
    }
  }

  /**
   * @method:setDataForVideoPage
   * @desc: to set the data listen from the playbook page to display on video page
   */
  setDataForVideoPage(){
    this._data.subscribe(result => {
      if(this.data){
        this.currentCategoryData = this.data;
        this.CategoryDetails();
      }
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
   * @method: resetDataToDefault
   * @desc: Function to reset the globalvariables
   */
  resetDataToDefault(){
    this.segmentsIds = [];
    this.spacesIds = [];
    this.assetsIds = [];
    this.pageNumber = 1;
    this.sortBy = "title";
    this.sortOrder = "asc";
    this.contentAssets = null;
    this.activeNextButton = false;
    this.activePreviousButton = false;
    this.selectedItems = [];
    this.selectedItemsForSegments = [];
  }

  /**
   * @method: getContentAssets
   * @desc: To get the content Assets/ Success Cases of sub Category
   */
  getContentAssets(){
    let segments, solutions, assets, url;
    (this.segmentsIds.length == 0) ? segments = "all" : segments = this.segmentsIds;
    (this.spacesIds.length == 0) ? solutions = "all" : solutions = this.spacesIds;
    // (this.assetsIds.length == 0) ? assets = "all" : assets = this.assetsIds;

    this.selectedItems = [];
    this.selectedItemsForSegments = [];

    if(this.searchedCA) {
      url = CONTENTASSETS_CONSTANTS.GET_FILTERED_CONTENT_ASSETS+this.searchedCA+"/";
      this.CoreService.get(url).subscribe(result=>{
        this.success(result,"getFilteredContentAssets");
      });
    } else {
      url = CONTENTASSETS_CONSTANTS.GET_CONTENT_ASSETS+"?page="+this.pageNumber+"&pageSize=4";
      this.CoreService.post(url,{
        "segments": segments || "all",	
        "solutions": solutions || "all",
        // "assets": assets || "all",
        "sub_category": this.currentCategoryData.id,
        "company": this.companyPk,
        "company_category_type": this.categoryType,
        "sort_by": this.sortBy,
        "sort_order": this.sortOrder
      }).subscribe(result=>{
        this.success(result,"getContentAssets");
      });
    }
  }

  /**
   * @method: getSellingDomainDetails
   * @desc: To get the details of Segment/ Markets of sub Category
   */
  getSellingDomainDetails(){
    this.HelperService.showLoader(true);
    this.CoreService.get(CONTENTASSETS_CONSTANTS.GET_SEGMENTS,{
        "company": this.companyPk
    }).subscribe(result=>{
      let results = result.body.data;
      this.markets = results;
      this.selectedMarketIds = results;
      this.getContentAssets();
    });

    this.CoreService.get(CONTENTASSETS_CONSTANTS.GET_SOLUTIONS,{
      "company": this.companyPk
    }).subscribe(result=>{
      let results = result.body.data;
      this.successCases = results;
      this.selectedsuccessCasesIds = results;
    });
  }

  /**
   * @method: displayOptionsForSegment
   * @param options: options returned by the component of multiselect
   * @desc: sort the content assets as per the segments selected.
   */
  displayOptionsForSegment(options) {
    let segments:boolean = true;
    this.sortContentAssets(options,"segments");
  } 

   /**
   * @method: displayOptionsForCases
   * @param options: options returned by the component of multiselect
   * @desc: sort the content assets as per the success cases selected.
   */
  displayOptionsForCases(options) {
    this.sortContentAssets(options, "solutions");
  }

  /**
   * @method: displayOptionsForAssets
   * @param options: options returned by the component of multiselect
   * @desc: 
   */
  displayOptionsForAssets(options) {
    // let segments:boolean = true;
    // this.sortContentAssets(options, "assets");
  }

  /**
   * @method: sortContentAssets
   * @param options: All the selected options from the multiselect
   * @desc: Sort the content assets as per the selection of segments
   */
  sortContentAssets(options,segments){
    if(segments === "segments"){
      this.segmentsIds = [];
      for(let seg = 0;seg<options.length;seg++) {
        this.segmentsIds.push(options[seg].id);
      }
    } else if(segments === "solutions") {
      this.spacesIds = [];
      for(let sp = 0;sp<options.length;sp++) {
        this.spacesIds.push(options[sp].id);
      }
    } else if(segments === "assets") {
      this.assetsIds = [];
      for(let seg = 0;seg<options.length;seg++) {
        this.assetsIds.push(options[seg].id);
      }
    }
    this.pageNumber = 1;
    this.getContentAssets();
  }

  /**
   * @method: gotoPrevious
   * @desc: Pagination for Content Assets/ Success Cases
   */
  gotoPrevious(){
    if(this.pageNumber > 1) this.pageNumber = this.pageNumber-1;
    if(this.pageNumber == 1) this.activePreviousButton = false;
    this.activeNextButton = true;
    this.getContentAssets();
  }

  /**
   * @method: gotoNext
   * @desc: Pagination for Content Assets/ Success Cases
   */
  gotoNext(){
    if(this.pageNumber < this.totalPages) {
      this.pageNumber = this.pageNumber+1;
      this.activePreviousButton = true;
      if(this.pageNumber == this.totalPages) this.activeNextButton = false;
    }
    this.getContentAssets();
  }

  /**
   * @method: getAssetsInfo
   * @param: asset
   * @desc: Pagination for Content Assets/ Success Cases
   */
  getAssetsInfo(asset){
    this.addOverflowStyleOnBody();
  }
  /**
   * @method: sortCases
   * @desc: sort the success cases/ content assets
   */
  sortCases(by, order){
    this.sortBy = by;
    this.sortOrder = order;
    this.pageNumber = 1;
    this.getContentAssets();
  }

  /**
   * @method: success
   * @param res 
   * @param cb 
   * @desc: Verify the error from API as per the status code
   */
  success(res,cb){
    let status = res.body.status;
    this.HelperService.showLoader(false);
    if(status == 200){
      switch(cb){
        case "getContentAssets":
          this.handleGetContentAssets(res.body);
          break;
        case "getFilteredContentAssets":
          this.handleFilterContentAssets(res.body);
          break;
        case "getPlaybookCategories":
          this.handleCategoryResponse(res.body.data);
          break;
      }
    } else {
      this.ToastrManager.errorToastr(res.body.message, 'Error',{toastTimeout:APP_CONSTANT.TOASTER_TIME});
    }
  }

  /**
   * @method: handleCategoryResponse
   * @desc: Handle categories response
   * @param results 
   */
  handleCategoryResponse(results: any) {
    let category = _.find(results, (res) => {
      return res.id ==  Number(this.subCategoryId);
    });
    if(category) {
      this.actCat = category;
      if(this.actCat && this.actCat.company_category_type == 3) return false;
      this.resetDataToDefault();
      this.setConstants();
      this.getSellingDomainDetails();
    }
  }

  /**
   * @method: handleGetContentAssets
   * @param data 
   * @desc: handle the response of content assets API
   */
  handleGetContentAssets(data){
    this.selectedItems = [];
    this.selectedItemsForSegments =[];
    this.contentAssets = data.data;
    let additionalInfo = data.additional_info;
    this.hidePaginationButton = false;
    (additionalInfo && additionalInfo.total_records <= 2) ? this.hideSortByButton = true : this.hideSortByButton = false;
    if(additionalInfo && additionalInfo.total_pages) {
      this.totalPages = Math.ceil(additionalInfo.total_pages);
      this.activePreviousButton = true;
      this.activeNextButton = true;
      if(additionalInfo.total_pages > 1){
        if(this.totalPages == this.pageNumber){
          this.activeNextButton = false;
        }
        if(this.pageNumber != 1) {
          this.activePreviousButton = true;
        } else {
          this.activePreviousButton = false;
        }
      } else if(additionalInfo.total_pages <= 1){
        this.activePreviousButton = false;
        this.activeNextButton = false;
        this.hidePaginationButton = true;
      }
    }
  }

  handleFilterContentAssets(data) {
    this.contentAssets = null;
    this.contentAssets = data.data;
    this.searchedCA = null;
    if(this.contentAssets && this.contentAssets.length > 0) {
      this.selectedItemsForSegments= this.contentAssets[0]['category_detail']['segment'];
      this.selectedItems = this.contentAssets[0]['category_detail']['solution'];
      setTimeout( () => {
        this.openDetailsPopup(this.contentAssets[0]);
      });
    }
    
    // this.selectedItems
    // this.selectedItemsForSegments
  }

  /**
   * @method: addOverflowStyleOnBody
   * @desc: add overflow property on body to disable scroller when sidebar is open
   */
  addOverflowStyleOnBody(){
    setTimeout(function(){
      if(navigator.userAgent.indexOf("iPhone") !== -1){
        document.body.classList.add("lock-position");
      }
      document.body.style.overflow = "hidden";
    },500);
  }

  /**
   * @method : stripText
   * @param html 
   * @desc: Get the plain text from the HTML
   */
  stripText(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    if(tmp.innerHTML) tmp.innerHTML = tmp.innerHTML.replace(/&nbsp;/g, "");
    if(tmp.innerText) {
      tmp.innerText = tmp.innerText.toString();
      tmp.innerText = tmp.innerText.substring(0, 255);
    }
    return tmp.innerText || "";
  }

  /**
   * @method: openDetailsPopup
   * @desc: Open modal
   * @param info 
   */
  openDetailsPopup(info: any): void {
    info.heading = this.reviewExampleTitle;
    this.modalRef = this.modalService.show(ContentassetpopupComponent, Object.assign({}, {
      info: info,
      ignoreBackdropClick: false
    }, {
      class: 'assetInfo modal-dialog modal-dialog-centered modal-lg'
    }));
  }

}
