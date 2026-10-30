export type CameraStatus = 'online' | 'offline';
export type SightingType = 'vehicle' | 'person';
export type CaseDecision = 'pending' | 'confirmed' | 'rejected';
export type CaseStatus = 'Open' | 'Closed';
export type CameraReliabilityGrade = 'Good' | 'Fair' | 'Poor';
export interface Camera { id:string; name:string; location:string; lat:number; lng:number; status:CameraStatus; reliability:{grade:CameraReliabilityGrade;reason:string}; detectionCount?:number }
export interface Sighting { id:string; cameraId:string; time:string; type:SightingType; plateNumber?:string; rawPlateRead?:string; normalizedPlate?:string; plateReadConfidence?:number; isOcrUncertain?:boolean; personDescription?:string; confidence:number; reason:string; whyMatched:string[]; confidenceBreakdown:{readOrAppearance:number;timePlausibility:number;cameraQuality:number}; evidenceUrl:string|null; evidenceSha256:string|null; sampleImageUrl:string|null; detectionBox:{x:number;y:number;w:number;h:number;label:string}|null; isAiGenerated:boolean; decision:CaseDecision; decisionBy?:string; decisionTime?:string; notes?:string }
export interface Case {caseId:string;title:string;type:SightingType;status:CaseStatus;searchCriteria:string;linkedSightingIds:string[];notes:string;personName?:string;lastSeenPlace?:string;lastSeenTime?:string}
export interface WatchlistItem {id:string;type:SightingType;target:string;description:string;priority:'High'|'Medium';addedBy:string;addedAt:string}
export interface AlertItem {id:string;sightingId:string;target:string;type:SightingType;time:string;cameraId:string;cameraName:string;location:string;confidence:number;status:'active'|'acknowledged'}
export interface ActivityLogItem {id:string;timestamp:string;user:string;role:'Admin'|'Investigator';action:string;details:string}
export interface UserSession {username:string;role:'Admin'|'Investigator'}
export const normalizePlate=(s:string='')=>s.toUpperCase().replace(/[^A-Z0-9]/g,'');
export const formatPlateWithSpaces=(s:string='')=>{const n=normalizePlate(s);return n.startsWith('MH')&&n.length>=10?`${n.slice(0,2)} ${n.slice(2,4)} ${n.slice(4,6)} ${n.slice(6)}`:s};
export const formatIST=(time:string)=>{const d=new Date(time);return `${d.toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour12:false})} IST · ${Math.max(0,Math.floor((Date.now()-d.getTime())/60000))} min ago`};
export const computeLegMetrics=(a:Sighting,b:Sighting,cameras:Camera[])=>{const ca=cameras.find(c=>c.id===a.cameraId),cb=cameras.find(c=>c.id===b.cameraId);if(!ca||!cb)return {distance:0,minutes:0,speed:0,label:'Check timestamps'};const rad=(v:number)=>v*Math.PI/180;const dLat=rad(cb.lat-ca.lat),dLon=rad(cb.lng-ca.lng);const h=Math.sin(dLat/2)**2+Math.cos(rad(ca.lat))*Math.cos(rad(cb.lat))*Math.sin(dLon/2)**2;const distance=6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))*1.25;const minutes=Math.max(0.1,(new Date(b.time).getTime()-new Date(a.time).getTime())/60000);const speed=distance/(minutes/60);const ok=a.type==='person'?speed>=3&&speed<=6:speed>=25&&speed<=50;return {distance:Number(distance.toFixed(2)),minutes:Number(minutes.toFixed(1)),speed:Number(speed.toFixed(1)),label:ok?(a.type==='person'?'Plausible walking pace':'Plausible city speed'):(a.type==='person'?'Implausible – check timestamps':speed>50?'Too fast – check timestamps':'Slow – traffic or stop')}};
export const INITIAL_CAMERAS:Camera[]=[
 {id:'CAM-PU-01',name:'Swargate Chowk, Pune–Satara Road',location:'Swargate, Pune',lat:18.5018,lng:73.8636,status:'online',reliability:{grade:'Good',reason:'Clear fixed view; regularly calibrated'}},
 {id:'CAM-PU-02',name:'FC Road, Fergusson College Gate',location:'FC Road, Pune',lat:18.5236,lng:73.8412,status:'online',reliability:{grade:'Good',reason:'Elevated intersection camera'}},
 {id:'CAM-PU-03',name:'Shivajinagar Bus Stand',location:'Shivajinagar, Pune',lat:18.5314,lng:73.8446,status:'online',reliability:{grade:'Fair',reason:'Busy pedestrian area'}},
 {id:'CAM-PU-04',name:'University Circle, Ganeshkhind Road',location:'Ganeshkhind Road, Pune',lat:18.5524,lng:73.8255,status:'online',reliability:{grade:'Good',reason:'Clear fixed view'}},
 {id:'CAM-PU-05',name:'Pune Railway Station, Sassoon Road',location:'Sassoon Road, Pune',lat:18.5289,lng:73.8744,status:'online',reliability:{grade:'Fair',reason:'High pedestrian volume'}},
 {id:'CAM-PU-06',name:'Katraj Chowk',location:'Katraj, Pune',lat:18.4575,lng:73.8677,status:'offline',reliability:{grade:'Poor',reason:'Cable fault; coverage gap'}}
];
const now=Date.now(); const ago=(m:number)=>new Date(now-m*60000).toISOString();
const SAMPLE_IMAGE_BY_SIGHTING:Record<string,string>={
 'SGT-01':'vehicle-grey-sedan.jpg',
 'SGT-02':'pune-traffic.jpg',
 'SGT-03':'traffic-pune.jpg',
 'SGT-04':'pune-busy-traffic.jpg',
 'SGT-05':'pune-two-wheelers.jpg',
 'SGT-06':'pune-swargate.jpg',
 'SGT-07':'person-red-jacket.jpg',
 'SGT-08':'person-red-backpack.jpg',
 'SGT-09':'person-red-hoodie-backpack.jpg',
 'SGT-10':'person-yellow-vest.jpg'
};
const sampleImageFor=(id:string)=>SAMPLE_IMAGE_BY_SIGHTING[id]?`/assets/evidence/${SAMPLE_IMAGE_BY_SIGHTING[id]}`:null;
const make=(id:string,cam:string,mins:number,type:'vehicle'|'person',plate:string|undefined,desc:string|undefined,conf:number,decision:'pending'|'confirmed'|'rejected'='pending',uncertain=false):Sighting=>({id,cameraId:cam,time:ago(mins),type,plateNumber:plate,rawPlateRead:plate,normalizedPlate:plate?normalizePlate(plate):undefined,plateReadConfidence:uncertain?68.3:conf,isOcrUncertain:uncertain,personDescription:desc,confidence:conf,reason:uncertain?'OCR uncertain – review':type==='vehicle'?'Plate and vehicle profile match watchlist target.':'Clothing description matches missing person report.',whyMatched:uncertain?['Possible B/8 OCR confusion','Vehicle profile consistent; human review required']:type==='vehicle'?['Normalized Maharashtra plate match','Vehicle appearance is consistent']:['Red hooded jacket','Dark trousers and black backpack'],confidenceBreakdown:{readOrAppearance:conf,timePlausibility:90,cameraQuality:88},evidenceUrl:null,evidenceSha256:null,sampleImageUrl:sampleImageFor(id),detectionBox:null,isAiGenerated:false,decision,notes:''});
export const INITIAL_SIGHTINGS:Sighting[]=[
 make('SGT-01','CAM-PU-01',70,'vehicle','MH 12 AB 1234',undefined,98,'confirmed'),make('SGT-02','CAM-PU-02',63,'vehicle','MH 12 AB 1234',undefined,95,'confirmed'),make('SGT-03','CAM-PU-03',60.6,'vehicle','MH 12 AB 1234',undefined,93,'confirmed'),make('SGT-04','CAM-PU-04',54,'vehicle','MH 12 AB 1234',undefined,96,'confirmed'),make('SGT-05','CAM-PU-05',52,'vehicle','MH 12 A8 1234',undefined,68,'pending',true),make('SGT-06','CAM-PU-02',50,'vehicle','MH 14 CD 5678',undefined,92),
 make('SGT-07','CAM-PU-01',105,'person',undefined,'Adult wearing red hooded jacket, dark trousers and black backpack',94,'confirmed'),make('SGT-08','CAM-PU-02',55,'person',undefined,'Adult wearing red hooded jacket, dark trousers and black backpack',89,'confirmed'),make('SGT-09','CAM-PU-03',41,'person',undefined,'Adult wearing red hooded jacket, dark trousers and black backpack',92,'confirmed'),make('SGT-10','CAM-PU-03',42,'person',undefined,'Pedestrian in a yellow utility vest',84,'rejected')
];
export const createFreshSightings=()=>{const ages=[70,63,60.6,54,52,50,105,55,41,42];return INITIAL_SIGHTINGS.map((s,i)=>({...s,time:new Date(Date.now()-ages[i]*60000).toISOString(),evidenceUrl:null,evidenceSha256:null,detectionBox:null,isAiGenerated:false}))};
export const INITIAL_CASES:Case[]=[{caseId:'CASE-2026-001',title:'Stolen vehicle – MH 12 AB 1234',type:'vehicle',status:'Open',searchCriteria:'MH 12 AB 1234',linkedSightingIds:['SGT-01','SGT-02','SGT-03','SGT-04','SGT-05'],notes:'Dark grey sedan. MH-12 is Pune RTO.'},{caseId:'CASE-2026-002',title:'Missing person – red jacket',type:'person',status:'Open',searchCriteria:'red jacket',linkedSightingIds:['SGT-07','SGT-08','SGT-09'],personName:'Missing person',lastSeenPlace:'Swargate, Pune',lastSeenTime:INITIAL_SIGHTINGS[6].time,notes:'Adult wearing red hooded jacket, dark trousers and black backpack.'}];
export const INITIAL_WATCHLIST:WatchlistItem[]=[{id:'WCH-01',type:'vehicle',target:'MH 12 AB 1234',description:'Stolen vehicle – flagged for review',priority:'High',addedBy:'Admin',addedAt:ago(120)},{id:'WCH-02',type:'person',target:'red jacket',description:'Missing person alert',priority:'High',addedBy:'Admin',addedAt:ago(120)}];
export const INITIAL_ALERTS:AlertItem[]=[];
export const INITIAL_ACTIVITY_LOG:ActivityLogItem[]=[];


