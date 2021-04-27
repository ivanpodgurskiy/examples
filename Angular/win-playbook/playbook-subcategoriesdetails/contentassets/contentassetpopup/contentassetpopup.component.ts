import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { MalihuScrollbarService } from "ngx-malihu-scrollbar";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-contentassetpopup',
  templateUrl: './contentassetpopup.component.html',
  styleUrls: ['./contentassetpopup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContentassetpopupComponent implements OnInit {
  public _data = new BehaviorSubject([]);
  public assetInfo: any;
  public diaglogClass: string;
  public link: string;
  public themeOptions = { axis: 'y', theme: 'dark-3', scrollButtons: { enable: true } };

  @Input()
  set currentAsset(value) {
    // set the latest value for _data BehaviorSubject
    this._data.next(value);
  };

  get data() {
    // get the latest value from _data BehaviorSubject
    return this._data.getValue();
  }

  constructor(
    private mScrollbarService: MalihuScrollbarService,
    public bsModalRef: BsModalRef,
    private modalService: BsModalService
  ) { }
  
  /**
   * @method: ngOnInit
   * @desc: Get the details of content asset
   */
  ngOnInit() {
    this.assetInfo = this.modalService['config']['info'];
    this.getContentAssetDetails();
  }

  /**
   * @mehtod:getContentAssetDetails
   * @params:none
   * desc:get the details of clicked content Asset
   */
  getContentAssetDetails(){
    let urlPrefix, subString;
    if(this.assetInfo){
      if(this.assetInfo && this.assetInfo['heading']) {
        this.diaglogClass = this.assetInfo['heading'].replace(" ","");
        urlPrefix = 'http://';
        if(this.assetInfo['url']) subString = this.assetInfo['url'].substr(0, urlPrefix.length);
        if ( (this.assetInfo) && (this.assetInfo['url']) && ( (subString !== urlPrefix ) && (subString != "https:/" ) ) ) {
          this.link = urlPrefix + this.assetInfo['url'];
        } else {
          this.link = this.assetInfo['url'];
        }
      }
    } 
  }
}
