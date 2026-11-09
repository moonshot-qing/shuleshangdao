"use strict";

// All artwork is authored on integer grids. The same source serves the network,
// portraits, card illustrations and campus scenes; no image downloads or fonts.
const ART_COLORS={
  ink:'#30323b',paper:'#fffaf0',skin:'#f0c9a5',skinShade:'#cc9677',
  hair:'#544743',hairLight:'#796052',blue:'#5b8fa4',blueLight:'#9bc1ca',
  red:'#d95c66',redLight:'#ef9b94',green:'#34846b',greenLight:'#9bc4a3',
  gold:'#dca94a',goldLight:'#f1cf7b',stone:'#c3b49b',muted:'#e8dfcd'
};
const spriteCache=new Map();
function getSprite(type,state,pose) {
  const key=type+state+pose;
  if(spriteCache.has(key))return spriteCache.get(key);
  const cv=document.createElement('canvas');cv.width=36;cv.height=48;
  const c=cv.getContext('2d');c.scale(2,2);
  const p=ART_COLORS,r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const highlights={crowd:p.blueLight,mkt:'#ccb4df',bot:'#b5d1b4',mid:'#a7cfca',leader:'#e7b2c6',troll:'#e2b780',counselor:'#b2c3df',bigv:p.goldLight};
  const coat=TYPES[type].color,light=highlights[type],broad=type==='bigv';
  // Grounded stance, a common shoulder height, and light from the upper left.
  r(5,18,7,4,p.ink);r(6,18,2,3,'#67717a');r(10,18,2,3,'#67717a');
  r(4,21,4,2,p.ink);r(10,21,4,2,p.ink);
  r(4,21,2,1,p.paper);r(10,21,2,1,p.paper);
  r(broad?2:3,12,broad?13:11,6,p.ink);r(4,11,9,8,p.ink);
  r(5,12,7,6,coat);r(4,13,1,3,coat);r(12,13,1,3,coat);
  r(5,12,3,1,light);r(5,13,1,4,light);r(6,18,5,1,coat);
  r(8,12,1,6,p.ink);r(9,14,1,1,p.paper);
  r(3,17,2,2,p.skin);r(12,17,2,2,p.skin);r(7,10,3,2,p.skinShade);
  if(type==='bot'){
    r(8,1,1,3,p.ink);r(7,1,3,1,p.red);r(4,4,9,8,p.ink);
    r(5,5,7,6,'#b5d1b4');r(3,6,1,4,p.ink);r(13,6,1,4,p.ink);
    r(5,5,7,1,p.paper);r(6,7,2,2,p.ink);r(10,7,2,2,p.ink);
    r(6,7,1,1,p.gold);r(10,7,1,1,p.gold);r(7,10,3,1,p.ink);
    r(6,13,5,3,p.ink);r(7,14,1,1,p.red);r(9,14,1,1,p.greenLight);
    r(2,17,3,2,p.ink);r(12,17,3,2,p.ink);
  }else{
    // Hair surrounds the face rather than replacing its silhouette with a state color.
    r(5,3,7,2,p.ink);r(4,5,9,5,p.ink);r(5,4,7,6,p.hair);
    r(5,6,7,4,p.skin);r(6,10,5,1,p.skinShade);
    r(4,7,1,2,p.skinShade);r(12,7,1,2,p.skinShade);
    r(5,4,6,1,p.hairLight);r(5,5,3,1,p.hair);
    r(6,7,1,2,p.ink);r(10,7,1,2,p.ink);r(8,10,2,1,p.hair);
    switch(type){
      case 'crowd':
        r(1,12,3,7,p.ink);r(1,13,2,5,'#b78855');r(2,14,1,2,p.goldLight);
        r(5,12,1,6,'#d7ad72');r(11,12,1,6,'#d7ad72');r(9,16,2,2,p.paper);
        break;
      case 'mkt':
        r(4,3,9,2,p.ink);r(5,2,6,2,coat);r(6,2,3,1,light);
        r(3,5,10,1,p.ink);r(6,5,7,1,coat);
        r(6,12,1,3,p.ink);r(10,12,1,3,p.ink);
        r(6,14,7,4,p.ink);r(7,14,2,1,p.gold);r(9,15,2,2,p.blueLight);r(9,15,1,1,p.paper);
        break;
      case 'mid':
        r(5,7,3,3,p.ink);r(9,7,3,3,p.ink);r(8,8,1,1,p.ink);
        r(6,8,1,1,p.paper);r(10,8,1,1,p.paper);
        r(11,14,5,6,p.ink);r(12,14,3,5,p.paper);r(12,15,1,4,p.gold);
        r(13,16,2,1,p.stone);r(13,18,2,1,p.stone);
        break;
      case 'leader':
        r(3,5,2,8,p.ink);r(12,5,2,8,p.ink);r(3,6,1,6,p.hair);
        r(13,6,1,6,p.hair);r(13,5,2,2,p.gold);
        r(6,12,1,2,p.paper);r(10,12,1,2,p.paper);r(7,14,3,4,p.ink);
        r(8,15,1,2,p.paper);r(12,15,4,5,p.ink);r(13,16,2,3,p.paper);
        break;
      case 'troll':
        r(4,3,2,3,p.ink);r(7,2,2,3,p.ink);r(11,3,2,3,p.ink);
        r(7,3,1,2,p.hairLight);r(6,7,2,1,p.ink);r(10,6,2,1,p.ink);
        r(12,13,3,3,p.ink);r(14,9,2,6,p.ink);r(14,8,1,3,p.skin);
        r(14,12,1,2,light);r(6,13,5,2,light);r(7,14,3,1,p.ink);
        break;
      case 'counselor':
        r(4,4,9,2,p.ink);r(5,4,2,1,'#a0a097');
        r(6,12,2,2,p.paper);r(9,12,2,2,p.paper);r(8,13,1,4,p.gold);
        r(11,15,5,6,p.ink);r(12,15,3,5,'#c5a56c');r(12,16,3,1,p.goldLight);
        r(13,18,2,1,p.paper);
        break;
      case 'bigv':
        r(3,5,2,5,p.ink);r(12,5,2,5,p.ink);
        r(2,13,2,4,coat);r(13,13,2,4,coat);r(6,12,1,6,p.paper);r(10,12,1,6,p.paper);
        r(11,13,1,3,p.gold);r(10,14,3,1,p.gold);
        r(2,14,3,5,p.ink);r(3,15,1,2,p.blueLight);
        break;
    }
  }
  if(pose===1){
    // One short speaking/receiving pose; feet, head and costume remain anchored.
    r(13,11,3,5,p.ink);r(14,12,1,3,state===1?p.redLight:p.paper);
    r(12,15,2,2,p.skin);r(14,12,1,1,p.paper);
  }
  if(state!==0){
    r(13,0,5,5,p.ink);r(14,1,3,3,state===1?p.red:p.green);
    if(state===1){r(15,1,1,2,p.paper);r(15,4,1,1,p.paper);}
    else{r(14,2,1,1,p.paper);r(15,3,1,1,p.paper);r(16,1,1,2,p.paper);}
  }
  spriteCache.set(key,cv);return cv;
}

// 24px illustrations, with one-pixel contours, material highlights and solid shadows.
const ir=(x,y,w,h,color)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
const ip=(d,color)=>`<path d="${d}" fill="${color}"/>`;
const A=ART_COLORS;
const PIXEL_ICONS={
  hot:ir(4,4,10,18,A.ink)+ir(5,5,8,15,A.paper)+ir(7,6,4,1,A.stone)+ir(6,9,5,2,A.redLight)+ir(6,13,3,1,A.stone)+ir(8,21,2,1,A.gold)+ip('M15 20H12V16H13V12H15V7H17V10H19V13H21V16H22V20H20V22H15Z',A.ink)+ip('M15 20H14V16H15V13H17V11H18V15H20V19H19V21H15Z',A.red)+ir(16,17,2,4,A.goldLight),
  army:ir(2,3,20,6,A.ink)+ir(3,4,18,4,A.red)+ir(5,5,8,1,A.paper)+ir(18,5,2,1,A.goldLight)+ir(4,11,5,5,A.ink)+ir(5,12,3,3,A.skin)+ir(15,11,5,5,A.ink)+ir(16,12,3,3,A.skin)+ip('M2 17H11V22H2ZM13 17H22V22H13Z',A.ink)+ir(3,18,7,3,A.redLight)+ir(14,18,7,3,A.red)+ir(7,10,10,1,A.stone),
  control:ip('M2 4H20V6H22V17H14V21H10V17H2Z',A.ink)+ir(3,5,16,10,A.paper)+ir(5,7,10,1,A.stone)+ir(5,10,6,1,A.stone)+ir(5,13,8,1,A.stone)+ir(14,14,8,8,A.ink)+ir(15,15,6,6,A.red)+ip('M16 16H18V17H19V16H20V18H19V19H20V20H18V19H17V20H16V18H17V17H16Z',A.paper),
  weaktie:ir(4,5,4,4,A.ink)+ir(5,6,2,2,A.red)+ir(16,15,4,4,A.ink)+ir(17,16,2,2,A.blue)+ir(3,17,5,5,A.ink)+ir(4,18,3,3,A.goldLight)+ir(16,2,5,5,A.ink)+ir(17,3,3,3,A.goldLight)+ip('M8 7H10V9H12V11H14V13H16V15H14V14H12V12H10V10H8ZM7 15H9V13H11V11H13V9H15V7H17V9H16V11H14V13H12V15H10V17H7Z',A.stone),
  pr:ip('M5 2H7V4H10V2H12V4H15V2H17V8H5Z',A.ink)+ir(6,5,10,2,A.gold)+ir(7,9,8,7,A.ink)+ir(8,10,6,5,A.skin)+ir(8,10,6,1,A.hair)+ir(9,12,1,1,A.ink)+ir(12,12,1,1,A.ink)+ir(4,17,14,5,A.ink)+ir(5,18,12,3,A.blue)+ir(10,18,2,3,A.paper)+ir(18,10,4,7,A.ink)+ir(19,11,2,4,A.redLight),
  agenda:ir(3,4,18,15,A.ink)+ir(4,5,16,13,'#897b62')+ir(5,6,14,11,A.paper)+ir(6,7,12,3,A.red)+ir(7,8,5,1,A.paper)+ir(7,12,9,1,A.stone)+ir(7,15,6,1,A.stone)+ir(5,19,2,4,A.ink)+ir(17,19,2,4,A.ink)+ir(2,2,20,2,A.gold),
  lottery:ip('M3 9H21V22H3ZM2 6H22V10H2Z',A.ink)+ir(4,10,16,11,A.redLight)+ir(3,7,18,2,A.red)+ir(10,7,4,14,A.goldLight)+ip('M5 2H10V3H11V5H13V3H14V2H19V5H17V7H7V5H5Z',A.ink)+ir(6,3,3,2,A.goldLight)+ir(15,3,3,2,A.goldLight)+ir(5,12,4,1,A.paper)+ir(16,16,3,1,A.paper),
  script:ip('M5 2H16V5H19V21H5Z',A.ink)+ir(6,3,9,17,A.paper)+ir(15,6,3,14,A.paper)+ir(15,3,1,3,A.stone)+ir(7,5,6,2,A.redLight)+ir(7,9,8,1,A.stone)+ir(7,12,5,1,A.stone)+ip('M15 10H19V8H21V14H15V12H17V11H15ZM10 16H6V18H4V12H10V14H8V15H10Z',A.red)+ir(11,17,4,1,A.stone),
  debunk:ir(4,2,13,17,A.ink)+ir(5,3,11,15,A.paper)+ir(7,5,7,1,A.stone)+ir(7,8,5,1,A.stone)+ir(7,11,6,1,A.stone)+ip('M13 12H20V14H22V20H20V22H13V20H11V14H13Z',A.ink)+ir(13,14,7,6,A.green)+ip('M14 16H15V17H16V18H17V16H18V15H19V17H18V19H15V18H14Z',A.paper)+ir(3,20,8,1,A.stone),
  cold:ir(4,3,14,17,A.ink)+ir(5,4,12,15,A.paper)+ir(7,6,8,2,A.blueLight)+ir(7,10,5,1,A.stone)+ir(7,13,8,1,A.stone)+ir(7,16,4,1,A.stone)+ip('M17 10H19V14H22V16H19V20H17V16H13V14H17ZM14 11H16V13H14ZM20 11H22V13H20ZM14 17H16V19H14ZM20 17H22V19H20Z',A.blue)+ir(17,14,2,2,A.paper),
  vaxx:ip('M3 3H12V2H14V3H22V12H21V16H19V19H16V21H11V19H8V17H5V13H3Z',A.ink)+ip('M5 5H12V4H14V5H20V12H19V15H17V17H15V19H12V17H9V15H7V12H5Z',A.green)+ip('M6 6H12V5H14V6H18V7H7V12H6Z',A.greenLight)+ir(12,8,3,8,A.paper)+ir(9,11,9,2,A.paper),
  radio:ip('M4 8H20V10H22V22H2V10H4Z',A.ink)+ir(3,11,18,10,A.green)+ir(4,12,16,1,A.greenLight)+ir(5,15,6,4,A.ink)+ir(6,16,1,1,A.paper)+ir(9,18,1,1,A.paper)+ir(14,14,5,2,A.paper)+ir(14,18,2,2,A.gold)+ir(18,18,2,2,A.ink)+ip('M11 2H13V8H11ZM5 2H7V4H9V6H7V5H5ZM17 2H19V5H17V6H15V4H17Z',A.green),
  dig:ir(3,3,11,16,A.ink)+ir(4,4,9,14,A.paper)+ir(6,6,5,1,A.stone)+ir(6,9,3,1,A.stone)+ip('M11 9H17V10H19V12H20V17H18V19H13V18H11V16H10V12H11Z',A.ink)+ir(12,11,5,6,A.blueLight)+ir(13,11,3,1,A.paper)+ir(11,12,1,3,A.paper)+ip('M18 17H20V19H22V21H23V23H20V21H18Z',A.ink)+ir(19,19,1,1,A.gold),
  chot:ip('M2 10H7V8H11L19 3V21L11 16H7V14H2Z',A.ink)+ir(3,11,4,2,A.green)+ip('M8 9H11V15H8ZM12 8L18 5V19L12 16Z',A.paper)+ir(16,6,2,12,A.greenLight)+ip('M7 16H11V21H8Z',A.ink)+ir(21,8,2,2,A.gold)+ir(21,15,2,2,A.gold),
  farm:ir(2,7,20,15,A.ink)+ir(3,8,18,13,A.gold)+ir(4,9,16,1,A.goldLight)+ir(3,5,8,3,A.ink)+ir(4,6,6,2,A.gold)+ir(5,12,9,8,A.ink)+ir(6,13,7,6,A.paper)+ir(7,14,5,1,A.stone)+ir(7,17,3,1,A.stone)+ir(16,12,5,5,A.ink)+ir(17,13,3,3,A.goldLight)+ir(18,13,1,3,A.gold),
  scout:ip('M2 7H6V5H9V7H15V5H18V7H22V21H2Z',A.ink)+ir(3,8,18,12,A.paper)+ir(9,8,1,12,A.stone)+ir(15,8,1,12,A.stone)+ip('M4 15H6V13H8V11H12V13H14V15H17V13H20V15H19V17H14V16H12V14H9V13H8V15H6V17H4Z',A.green)+ir(5,9,2,2,A.gold)+ir(17,17,2,2,A.red)
};
function pixelIcon(id,size) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" shape-rendering="crispEdges">${PIXEL_ICONS[id]}</svg>`;
}

function campusThumbnail(scenario) {
  const base=ir(0,27,64,5,'#d9cfb9')+ir(1,28,62,1,A.paper);
  const scenes=[
    ir(5,5,54,3,A.ink)+ir(7,8,3,19,A.stone)+ir(54,8,3,19,A.stone)+ir(10,9,44,16,'#d99a88')+ir(13,10,7,14,A.red)+ir(44,10,7,14,A.red)+ir(23,11,18,11,'#fff2d7')+ir(28,15,8,2,A.gold)+ir(3,25,58,3,A.ink)+ir(21,25,22,2,A.gold),
    ir(8,5,48,22,A.stone)+ir(6,3,52,3,A.ink)+ir(11,8,42,16,'#efe6ce')+ir(29,12,6,15,A.ink)+ir(13,11,10,9,A.blue)+ir(41,11,10,9,A.blue)+ir(17,11,1,9,A.paper)+ir(45,11,1,9,A.paper)+ir(26,6,12,3,A.gold)+ir(30,13,4,14,'#95856e'),
    ir(9,7,46,20,A.stone)+ir(7,5,50,4,A.ink)+ir(9,9,46,5,A.paper)+[0,1,2,3,4,5].map(i=>ir(10+i*7,9,5,5,A.green)).join('')+ir(12,15,24,10,A.blue)+ir(39,15,12,12,A.ink)+ir(40,16,10,11,A.paper)+ir(15,18,5,4,A.goldLight)+ir(23,17,8,6,A.redLight)+ir(44,21,2,2,A.gold)
  ];
  return `<svg viewBox="0 0 64 32" width="128" height="64" aria-hidden="true" shape-rendering="crispEdges">${base}${scenes[scenario]}</svg>`;
}

function drawGroupSign(c,x,y,group) {
  c.save();c.translate(x,y);c.fillStyle='#827a67';
  if(group===0){c.fillRect(0,2,3,3);c.fillRect(13,2,3,3);c.fillRect(2,0,12,2);c.fillRect(7,2,2,10);c.fillRect(2,12,12,2);}
  else if(group===1){c.fillRect(0,2,7,11);c.fillRect(9,2,7,11);c.fillRect(7,4,2,10);c.fillStyle='#f2eee3';c.fillRect(2,4,3,6);c.fillRect(11,4,3,6);}
  else if(group===2){c.fillRect(2,4,12,10);c.fillRect(5,0,6,2);c.fillRect(4,2,2,4);c.fillRect(10,2,2,4);c.fillStyle='#f2eee3';c.fillRect(5,8,6,2);}
  else{c.fillRect(0,0,16,11);c.fillRect(2,11,2,3);c.fillRect(12,11,2,3);c.fillStyle='#f2eee3';c.fillRect(3,2,4,6);c.fillRect(9,3,4,4);}
  c.restore();
}
function drawCampus(canvas,time,staticFrame,scenario) {
  const c=canvas.getContext('2d'),scale=canvas.width/600,p=ART_COLORS;
  c.setTransform(scale,0,0,scale,0,0);c.imageSmoothingEnabled=false;
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  c.clearRect(0,0,600,190);
  r(0,0,600,190,'#f2ecde');r(0,115,600,37,'#e4ddca');
  // Quiet skyline: repeated masonry and windows sit behind the focal courtyard.
  r(12,40,121,110,'#c4b8a1');r(16,44,113,102,'#e0d5bf');
  r(9,36,127,7,'#8f8673');r(24,31,98,5,'#b9ac93');
  for(let y=57;y<135;y+=29)for(let x=24;x<120;x+=25){
    r(x,y,15,20,'#9eaaab');r(x+1,y+1,6,17,'#b7c3be');
    r(x,y+9,15,2,'#ded5bf');r(x+6,y,2,19,'#ded5bf');r(x-1,y+20,17,2,'#b6a78d');
  }
  r(36,45,74,7,'#e9dfc6');r(0,143,600,9,'#c2b49a');
  r(0,152,600,38,'#e6decc');r(0,154,600,2,'#f9f1df');
  for(let x=0;x<600;x+=30){r(x,176,20,1,'#cfc4ae');r(x+10,187,20,1,'#cfc4ae');}
  // A scene-specific focal building; each matches its scenario thumbnail.
  if(scenario===0){
    r(263,54,115,5,'#71675b');r(266,59,6,84,'#a7987e');r(369,59,6,84,'#a7987e');
    r(272,65,97,63,'#e6c8af');r(274,65,17,63,'#b96b65');r(350,65,17,63,'#b96b65');
    r(279,66,2,58,'#d79182');r(355,66,2,58,'#d79182');r(293,69,55,50,'#f6e9cb');
    r(304,80,34,4,'#c1a46d');r(313,88,16,2,'#c1a46d');r(271,128,99,8,'#93846d');
    r(261,136,119,7,'#6e675d');r(256,143,130,7,'#bca98c');
    r(272,57,3,5,p.gold);r(366,57,3,5,p.gold);
  }else if(scenario===1){
    r(264,57,113,86,'#b9ad93');r(260,52,121,7,'#7b7667');
    r(269,63,103,76,'#e5dcc5');r(277,71,25,42,'#708e8a');r(339,71,25,42,'#708e8a');
    for(let y=76;y<111;y+=10){r(279,y,21,2,'#b5aa87');r(341,y,21,2,'#b5aa87');}
    r(311,79,19,64,'#7e7766');r(313,81,15,60,'#baa98a');r(320,81,2,60,'#e7d8b9');
    r(305,64,32,9,'#a99976');r(263,143,115,6,'#a79a80');
  }else{
    r(265,64,112,80,'#c5b49a');r(260,58,122,8,'#776f5e');r(271,67,100,15,'#eee2bd');
    r(267,84,108,13,p.paper);for(let x=268;x<375;x+=16)r(x,84,9,13,'#6e9b7b');
    r(272,100,59,40,'#78958e');r(276,104,51,32,'#b0c5ae');
    r(279,119,15,15,'#e4bb6f');r(297,114,12,20,'#c78773');r(312,124,12,10,'#d1bd83');
    r(339,100,29,44,'#7e7766');r(342,103,23,41,'#e1d8bd');r(360,121,2,4,p.gold);
  }
  // Noticeboard, bench, tiled planter, bicycle and a clipped canopy tree.
  r(445,106,25,32,'#8b7d63');r(447,109,21,23,'#9caa8a');r(450,111,8,15,p.paper);r(460,114,6,10,p.goldLight);
  r(447,138,3,14,'#8b7d63');r(465,138,3,14,'#8b7d63');
  r(491,87,8,65,'#a29373');r(474,43,43,45,'#92a482');r(465,56,61,24,'#92a482');
  r(481,33,29,59,'#92a482');r(476,47,27,13,'#afbb93');r(468,62,17,8,'#afbb93');
  r(476,145,41,7,'#b7aa91');r(479,150,35,7,'#c9bda4');
  r(527,124,53,4,'#a38f70');r(530,114,47,4,'#b59c77');r(530,119,47,3,'#b59c77');r(534,128,3,15,'#817b6c');r(571,128,3,15,'#817b6c');
  r(551,52,3,60,'#939485');r(540,51,15,3,'#939485');r(537,54,8,9,'#ead49d');
  c.strokeStyle='#8c9489';c.lineWidth=2;
  for(const x of [45,75]){c.beginPath();c.arc(x,151,10,0,Math.PI*2);c.stroke();}
  c.beginPath();c.moveTo(45,151);c.lineTo(55,135);c.lineTo(65,151);c.lineTo(45,151);c.moveTo(55,135);c.lineTo(71,135);c.lineTo(75,151);c.moveTo(68,130);c.lineTo(73,130);c.lineTo(71,135);c.stroke();
  r(51,132,8,2,'#766c5b');
  const people=[{x:155,y:106,t:'mkt',s:1},{x:221,y:120,t:'crowd',s:0},{x:386,y:117,t:'leader',s:1},{x:423,y:100,t:'counselor',s:2}];
  const t=staticFrame?1.7:time/1000;
  for(let j=0;j<3;j++){
    const a=people[j],b=people[j+1],dir=j===2?-1:1;
    c.strokeStyle=j===2?'#71ab91':'#c9918a';c.setLineDash([3,5]);c.lineWidth=1;c.beginPath();c.moveTo(a.x+18,a.y+18);c.lineTo(b.x+18,b.y+18);c.stroke();c.setLineDash([]);
    const f=staticFrame?.55:((t*.38*dir+j*.24)%1+1)%1;
    r(Math.round(a.x+18+(b.x-a.x)*f),Math.round(a.y+18+(b.y-a.y)*f),4,4,j===2?p.green:p.red);
  }
  people.forEach((v,i)=>{r(v.x+4,v.y+45,29,3,'#bdb29b');c.drawImage(getSprite(v.t,v.s,Math.floor(t*1.4+i)%2),v.x,v.y);});
  r(146,62,87,28,p.ink);r(148,64,83,24,p.paper);r(167,90,6,5,p.ink);r(169,88,2,5,p.paper);
  c.fillStyle='#a94f51';c.font='bold 11px Microsoft YaHei';c.fillText('听说了吗？',158,81);
  c.fillStyle=scenario===1?'#f6ecd7':'#826d49';c.font='bold 9px Microsoft YaHei';c.textAlign='center';
  c.fillText(['校园舞台','图 书 馆','校园超市'][scenario],scenario===0?321:scenario===1?321:322,scenario===0?109:scenario===1?71:78);c.textAlign='left';
}

function drawResult(canvas,role,won) {
  const c=canvas.getContext('2d'),p=ART_COLORS;c.setTransform(2,0,0,2,0,0);c.imageSmoothingEnabled=false;c.clearRect(0,0,64,48);
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  r(1,41,62,3,'#d7cbb4');r(7,7,30,29,p.ink);r(8,8,28,27,'#a89471');r(10,10,24,23,'#ded1af');
  r(10,36,3,6,p.ink);r(31,36,3,6,p.ink);r(13,13,17,15,p.paper);
  r(15,16,13,2,role==='rumor'?p.red:p.green);r(15,21,10,1,p.stone);r(15,24,7,1,p.stone);
  // A seal only marks a reached goal; the lost state shows an unfinished sheet.
  if(won){r(26,24,7,7,p.ink);r(27,25,5,5,p.gold);r(28,27,3,1,p.paper);}
  c.drawImage(getSprite(role==='rumor'?'mkt':'counselor',role==='rumor'?1:2,won?1:0),36,18,18,24);
  r(4,5,34,2,p.gold);r(54,35,5,6,p.green);r(53,38,7,3,p.green);r(54,41,5,2,'#ac9171');
}
