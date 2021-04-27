import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
// Shared Services
import { HelperService } from '@shared-services';
import { ActivatedRoute } from '@angular/router'

//External Modules/ Services
import { MalihuScrollbarService } from "ngx-malihu-scrollbar";

//Constants
import { VIDEO_CONSTANTS } from './videoasset.constants';


@Component({
  selector: 'app-videoasset',
  templateUrl: './videoasset.component.html',
  styleUrls: ['./videoasset.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VideoassetComponent implements OnInit {

  public details: any;
  public currentVideo: object;
  public playBookSubcatVidThumb: string;
  public playBookSubcatVidDesc: string;
  public currentVideoLink: string;
  public defaultthumbnail = VIDEO_CONSTANTS.DEFAULT_IMAGE;
  public themeOptions = { axis: 'y', theme: 'dark-3', scrollButtons: { enable: true } };
  public _data = new BehaviorSubject([]);
  public filterVideoId: any;
  @Input() activeCategory:any;

  /**
   * @method:subCategoryObject
   * @param:value
   * @desc: to set the data which is sent by playbook component
   */
  @Input()
  set subCategoryObject(value) {
    this._data.next(value);
  };

  get data() {
    return this._data.getValue();
  }

  constructor(
    private HelperService: HelperService,
    private mScrollbarService: MalihuScrollbarService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      this.filterVideoId = params['video'];
      this.setActiveVideo(this.filterVideoId);
    });
   }

  ngOnInit() {
    this.setDataForVideoPage();
  }

  /**
   * @method: setDataForVideoPage
   * @desc: to set the data listen from the playbook page to display on video page
   */
  setDataForVideoPage(){
    this._data.subscribe(result => {
        if(this.data){
          this.details = this.data;
          if(this.details && this.details.videos && this.details.videos.length > 0) {
            (this.details.videos[0].video_thumb) ? this.playBookSubcatVidThumb = this.details.videos[0].video_thumb : this.playBookSubcatVidThumb = this.defaultthumbnail;
            this.playBookSubcatVidDesc = this.details.videos[0].description;
            this.currentVideoLink = this.details.videos[0].url;
            this.currentVideo =  this.details.videos[0];
            this.setActiveVideo(this.filterVideoId);
          }
        }
    });
  }

  /**
   * @method: activeVideo
   * @param: video
   * @desc: to set the video thumbnail, description anf video link
   */
  activeVideo(video){
    ((video.video_thumb) && (video.video_thumb != "")) ? this.playBookSubcatVidThumb = video.video_thumb : this.playBookSubcatVidThumb = this.defaultthumbnail;
    this.playBookSubcatVidDesc = video.description;
    this.currentVideoLink = video.url;
    this.currentVideo = video;
  }

  /**
   * @method:playVideo
   * @desc: to play the video in new tab
   */
  playVideo(){
    window.open(this.currentVideoLink);
  }

  /**
   * @method: setActiveVideo
   * @desc: get the video from the list, matching with filtered video.
   * @param id 
   */
  setActiveVideo(id: any) {
    let video, videoDiv, position, scrollArea;
    scrollArea = document.getElementsByClassName('vid-links')[0];
    if(id && this.details && this.details.videos) {
      video = this.details.videos.filter(x => x.id == id);
      if(video && video.length > 0) {
        this.currentVideo = video[0];
        // videoDiv = document.getElementById("video-"+id);
        // if(videoDiv) position = videoDiv.offsetTop;
        // this.mScrollbarService.scrollTo(scrollArea, position, null);
        ((this.currentVideo['video_thumb']) && (this.currentVideo['video_thumb'] != "")) ? this.playBookSubcatVidThumb = this.currentVideo['video_thumb'] : this.playBookSubcatVidThumb = this.defaultthumbnail;
        this.playBookSubcatVidDesc = this.currentVideo['description'];
      }
    }
  }

}
