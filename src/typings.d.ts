/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}


interface Window {
  TDMapManager: any;
  TDMap: any;
  ymaps: any;
  google: any;
}

declare var L: any;
declare var TDMap: any;
declare var TDMapManager: any;
declare var $: any;
declare var d3: any;
//http://peter.grman.at/how-to-write-typescript-definition-files/