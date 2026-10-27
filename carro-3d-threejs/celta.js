import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// First-generation, two-door Celta. Coordinates: X width, Y height, +Z front.
export function createCelta() {
  const car = new THREE.Group();
  const body = new THREE.MeshPhysicalMaterial({color:'#b6bec4', metalness:.48, roughness:.29, clearcoat:.85, clearcoatRoughness:.2});
  const trim = new THREE.MeshStandardMaterial({color:'#24272a', roughness:.82});
  const glass = new THREE.MeshPhysicalMaterial({color:'#273d48', metalness:.2, roughness:.12, clearcoat:1, side:THREE.DoubleSide});
  const silver = new THREE.MeshStandardMaterial({color:'#bec3c7', metalness:.72, roughness:.35});
  const lamp = new THREE.MeshStandardMaterial({color:'#e4edf0', emissive:'#e2efff', emissiveIntensity:.35, roughness:.23});
  const red = new THREE.MeshStandardMaterial({color:'#a90b20', roughness:.28});
  const amber = new THREE.MeshStandardMaterial({color:'#de8725', roughness:.3});
  const black = new THREE.MeshStandardMaterial({color:'#0b0c0d', roughness:.95});
  const add = (geo, mat, pos=[0,0,0], rot=[0,0,0], parent=car) => {
    const m = new THREE.Mesh(geo,mat); m.position.set(...pos); m.rotation.set(...rot);
    m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  };
  function box(w,h,d,mat,pos,rot=[0,0,0],parent=car) {return add(new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.24),mat,pos,rot,parent);}
  function panel(points,mat) {
    const vertices=[];
    for(let i=1;i<points.length-1;i++) vertices.push(...points[0],...points[i],...points[i+1]);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();
    const m=add(g,mat); m.material.side=THREE.DoubleSide;return m;
  }
  function line(points,mat=trim,r=.008) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return add(new THREE.TubeGeometry(curve,Math.max(12,points.length*8),r,6,false),mat);
  }
  // Cross sections yield a crowned hood and rounded shoulders, rather than boxes.
  function skin(sections,mat,edgeDrop=.10) {
    const verts=[],indices=[];
    const profile=new THREE.CatmullRomCurve3(sections.map(([z,w,y])=>new THREE.Vector3(z,w,y)),false,'centripetal');
    const crowns=new THREE.CatmullRomCurve3(sections.map(([z,w,y,c])=>new THREE.Vector3(z,c,0)),false,'centripetal');
    const rows=96,cols=24;
    for(let j=0;j<=rows;j++){
      const p=profile.getPoint(j/rows),c=crowns.getPoint(j/rows).y;
      for(let i=0;i<=cols;i++){
        const t=i/cols*2-1;
        const y=p.z+c*(1-t*t)-edgeDrop*Math.pow(Math.abs(t),12);
        verts.push(t*p.y,y,p.x);
      }
    }
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return add(g,mat);
  }
  skin([[-1.86,.67,.96,.03],[-1.68,.78,1.02,.03],[-1.15,.81,1.04,.03],[0,.81,1.04,.03],[.91,.79,1.02,.04],[1.43,.77,.95,.055],[1.79,.70,.86,.04],[1.87,.65,.81,.025]],body);
  // Side panels have actual open wheel arches; tires never intersect a solid slab.
  for(const side of [-1,1]) {
    const v=[],indices=[],rows=128,cols=12;
    for(let j=0;j<=rows;j++){
      const z=-1.84+3.68*j/rows;
      let bottom=.49;
      for(const axle of [-1.17,1.14])if(Math.abs(z-axle)<.34)bottom=.49+Math.sqrt(.34*.34-(z-axle)**2);
      const top=1.04-.20*Math.pow(Math.max(0,(z-.85)/1.0),1.6)-.09*Math.pow(Math.max(0,(-z-1.35)/.49),1.5);
      for(let k=0;k<=cols;k++){
        const t=k/cols,y=THREE.MathUtils.lerp(bottom,top,t);
        const taper=.095*THREE.MathUtils.smoothstep(Math.abs(z),1.4,1.9);
        const bulge=.016*Math.sin(Math.PI*t);
        v.push(side*(.805-taper+bulge),y,z);
      }
    }
    for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(indices);geo.computeVertexNormals();
    body.side=THREE.DoubleSide;add(geo,body);
    for(const z of [-1.17,1.14]) {
      const pts=[];for(let i=0;i<=32;i++){const t=i*Math.PI/32;pts.push([side*.813,.49+.35*Math.sin(t),z+.35*Math.cos(t)]);}line(pts,body,.018);
    }
    box(.045,.055,1.66,body,[side*.79,.505,-.015]);
    // The long front door and fixed rear quarter window are characteristic of the 2-door.
    const sx=y=>side*(.806-(y-1.05)*.26);
    // Continuous cabin side fills the sills and pillars behind the inset glazing.
    panel([[1.04,.94],[1.52,.35],[1.58,.10],[1.58,-.92],[1.45,-1.32],[1.07,-1.69]].map(([y,z])=>[sx(y)-side*.005,y,z]),body);
    const window=(yz)=>panel(yz.map(([y,z])=>[sx(y)+side*.009,y,z]),glass);
    window([[1.10,.85],[1.48,.36],[1.55,.12],[1.56,-.48],[1.51,-.63],[1.11,-.61]]);
    window([[1.11,-.70],[1.52,-.72],[1.52,-1.03],[1.44,-1.25],[1.16,-1.55],[1.11,-1.48]]);
    line([[sx(1.11),1.11,.85],[sx(1.48),1.48,.36],[sx(1.56),1.56,.12],[sx(1.56),1.56,-.48],[sx(1.51),1.51,-.63],[sx(1.11),1.11,-.61],[sx(1.11),1.11,.85]],trim,.012);
    line([[side*.815,1.08,.86],[side*.819,.91,.91],[side*.819,.58,.82],[side*.819,.55,-.54],[side*.819,.67,-.66],[side*.819,1.09,-.66]],trim,.005);
    box(.025,.052,2.40,trim,[side*.823,.77,-.12]);
    box(.027,.043,.16,trim,[side*.83,.978,-.43]);
    box(.05,.09,.12,trim,[side*.81,1.13,.72]);
    const mirror=add(new THREE.SphereGeometry(1,20,12),trim,[side*.93,1.16,.73]);mirror.scale.set(.12,.075,.13);
    box(.008,.08,.13,silver,[side*1.032,1.17,.71]);
    // Tall rear clusters wrap around the hatch corners.
    panel([[side*.68,.88,-1.85],[side*.79,.94,-1.72],[side*.72,1.25,-1.59],[side*.62,1.30,-1.68]],red);
    panel([[side*.69,1.04,-1.81],[side*.76,1.07,-1.70],[side*.735,1.16,-1.65],[side*.65,1.16,-1.75]],amber);
    box(.09,.045,.025,lamp,[side*.685,.99,-1.83]);
    // Fuel filler on the right rear quarter.
    if(side===1) add(new THREE.CylinderGeometry(.068,.068,.008,24),body,[.819,1.00,-1.17],[0,0,Math.PI/2]);
  }
  // Cabin roof and pillars: high roof, steep hatch, sloping windshield.
  skin([[-1.69,.71,1.07,.025],[-1.37,.69,1.39,.045],[-1.07,.65,1.56,.055],[-.65,.65,1.59,.05],[.12,.65,1.58,.045],[.36,.67,1.49,.035],[.95,.77,1.035,.025]],body,.015);
  panel([[-.735,1.125,.96],[.735,1.125,.96],[.623,1.57,.36],[-.623,1.57,.36]],glass);
  panel([[-.65,1.17,-1.71],[-.60,1.53,-1.32],[.60,1.53,-1.32],[.65,1.17,-1.71]],glass);
  // Roof side edges connect the glazing to the roof, without a solid wall behind glass.
  for(const side of [-1,1]){
    line([[side*.78,1.06,.96],[side*.67,1.51,.34]],body,.014);
    line([[side*.765,1.08,-.66],[side*.657,1.565,-.66]],trim,.023);
  }
  line([[-.57,1.09,.94],[-.08,1.105,.93]],trim,.009);line([[.06,1.105,.93],[.56,1.09,.94]],trim,.009);
  line([[0,1.18,-1.69],[.40,1.31,-1.54]],trim,.012);
  line([[.26,1.63,-.94],[.26,1.93,-1.08]],trim,.009);
  // Rounded bumpers and the narrow pre-facelift grille.
  const bumper=(z)=>{
    add(new RoundedBoxGeometry(1.53,.29,.34,6,.105),body,[0,.645,z]);
    box(1.43,.055,.035,trim,[0,.73,z+Math.sign(z)*.175]);
  };
  bumper(1.77);bumper(-1.78);
  panel([[-.70,.55,1.84],[.70,.55,1.84],[.70,.80,1.84],[.65,.85,1.84],[-.65,.85,1.84],[-.70,.80,1.84]],body);
  box(.71,.103,.028,trim,[0,.845,1.867]);
  box(.63,.016,.035,silver,[0,.85,1.885]);
  box(.84,.075,.028,trim,[0,.56,1.916]);
  for(const side of [-1,1]) {
    const x=side*.56;
    panel([[x-side*.19,.80,1.869],[x+side*.17,.81,1.817],[x+side*.15,.94,1.755],[x-side*.17,.94,1.813]],lamp);
    panel([[x+side*.11,.82,1.835],[x+side*.17,.82,1.817],[x+side*.15,.925,1.763],[x+side*.095,.927,1.79]],amber);
    // All lens details use the same mirrored plane as the headlamp face.
    const reflector=add(new THREE.SphereGeometry(1,24,16),silver,[x,.863,1.813]);reflector.scale.set(.105,.047,.025);
    for(let i=0;i<5;i++){
      const u=-.12+i*.055;
      line([[x+side*u,.819,1.866-u*.16],[x+side*u,.925,1.820-u*.16]],lamp,.002);
    }
  }
  function badge(y,z,scale=1) {
    const pts=[[-.10,-.021],[-.035,-.021],[-.035,-.043],[.035,-.043],[.035,-.021],[.10,-.021],[.10,.021],[.035,.021],[.035,.043],[-.035,.043],[-.035,.021],[-.10,.021]];
    const shape=new THREE.Shape(pts.map(([x,h])=>new THREE.Vector2(x*scale,h*scale)));
    add(new THREE.ShapeGeometry(shape),silver,[0,y,z],z<0?[0,Math.PI,0]:[0,0,0]);
  }
  badge(.85,1.91,.65);badge(1.04,-1.89,.65);
  // Rear hatch with registration recess, handle and model script.
  panel([[-.63,.83,-1.865],[.63,.83,-1.865],[.62,1.13,-1.70],[-.62,1.13,-1.70]],body);
  box(.17,.035,.027,trim,[0,.92,-1.888]);
  function plate(z) {
    box(.42,.115,.018,trim,[0,.65,z]);
    const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');
    ctx.fillStyle='#e7e9e6';ctx.fillRect(0,0,512,128);ctx.fillStyle='#25282a';ctx.font='bold 72px sans-serif';ctx.textAlign='center';ctx.fillText('CELTA 05',256,91);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    add(new THREE.PlaneGeometry(.39,.095),new THREE.MeshStandardMaterial({map:texture,roughness:.7}),[0,.65,z+Math.sign(z)*.012],z<0?[0,Math.PI,0]:[0,0,0]);
  }
  plate(1.93);plate(-1.935);
  const label=document.createElement('canvas');label.width=256;label.height=64;
  const ctx=label.getContext('2d');ctx.fillStyle='#dfe3e6';ctx.font='italic bold 39px sans-serif';ctx.fillText('celta',8,46);
  const tex=new THREE.CanvasTexture(label);tex.colorSpace=THREE.SRGBColorSpace;
  add(new THREE.PlaneGeometry(.21,.053),new THREE.MeshStandardMaterial({map:tex,transparent:true}),[-.43,.96,-1.889],[0,Math.PI,0]);
  // Small wheels, deep tire sidewalls and simple factory-style wheel covers.
  for(const side of [-1,1])for(const z of [-1.17,1.14]) {
    const wheel=new THREE.Group();wheel.position.set(side*.75,.49,z);car.add(wheel);
    add(new THREE.CylinderGeometry(.295,.295,.17,48),black,[0,0,0],[0,0,Math.PI/2],wheel);
    add(new THREE.TorusGeometry(.245,.045,12,48),black,[side*.086,0,0],[0,Math.PI/2,0],wheel);
    add(new THREE.CylinderGeometry(.195,.195,.018,40),silver,[side*.096,0,0],[0,0,Math.PI/2],wheel);
    add(new THREE.TorusGeometry(.184,.009,8,48),silver,[side*.11,0,0],[0,Math.PI/2,0],wheel);
    add(new THREE.TorusGeometry(.263,.003,6,48),trim,[side*.113,0,0],[0,Math.PI/2,0],wheel);
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4;const slot=box(.012,.065,.031,trim,[side*.108,Math.cos(a)*.143,Math.sin(a)*.143],[a,0,0],wheel);
      slot.rotation.x=a;
    }
    add(new THREE.CylinderGeometry(.073,.073,.024,24),silver,[side*.11,0,0],[0,0,Math.PI/2],wheel);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;add(new THREE.SphereGeometry(.012,8,6),trim,[side*.126,Math.cos(a)*.045,Math.sin(a)*.045],[0,0,0],wheel);}
  }
  box(1.35,.055,2.8,black,[0,.46,0]);
  return {car,body,lamp};
}
