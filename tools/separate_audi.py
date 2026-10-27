"""Split disconnected painted surfaces, preserving vertex attributes and textures."""
import json, struct
from collections import defaultdict
from pathlib import Path
root=Path(__file__).resolve().parents[1]
with (root/'audi_s3_limousine_8v.glb').open('rb') as f:
    f.read(12)
    n,_=struct.unpack('<II',f.read(8));data=json.loads(f.read(n))
    n,_=struct.unpack('<II',f.read(8));binary=bytearray(f.read(n))
def read(index):
    a=data['accessors'][index];v=data['bufferViews'][a['bufferView']]
    fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']]
    k={'VEC3':3,'VEC2':2,'SCALAR':1,'VEC4':4}[a['type']]
    size=struct.calcsize(fmt)*k;offset=v.get('byteOffset',0)+a.get('byteOffset',0)
    return [struct.unpack_from('<'+fmt*k,binary,offset+j*v.get('byteStride',size)) for j in range(a['count'])]
names={(5,1):'Audi_Hood',(6,1):'Audi_Trunk',(6,2):'Audi_RearDoor_Right_Skin',
       (6,4):'Audi_RearDoor_Left_Inner',(7,0):'Audi_FrontDoor_Right_Skin',
       (7,1):'Audi_FrontDoor_Left_Skin',(7,2):'Audi_RearDoor_Left_Skin'}
before=after=0
for mi in (5,6,7):
    primitive=data['meshes'][mi]['primitives'][0]
    positions=read(primitive['attributes']['POSITION']);indices=[x[0] for x in read(primitive['indices'])]
    parents=list(range(len(positions)))
    def find(i):
        while parents[i]!=i: parents[i]=parents[parents[i]];i=parents[i]
        return i
    def union(a,b): parents[find(a)]=find(b)
    welded={}
    for i,p in enumerate(positions):
        key=tuple(round(v,5) for v in p)
        if key in welded: union(i,welded[key])
        else: welded[key]=i
    for j in range(0,len(indices),3): union(indices[j],indices[j+1]);union(indices[j],indices[j+2])
    groups=defaultdict(list)
    for j in range(0,len(indices),3): groups[find(indices[j])].extend(indices[j:j+3])
    parent=next(n for n in data['nodes'] if n.get('mesh')==mi)
    del parent['mesh'];parent['children']=[];before+=len(indices)//3
    for ci,ids in enumerate(sorted(groups.values(),key=len,reverse=True)):
        name=names.get((mi,ci),f'Audi_Paint_{mi}_{ci}')
        while len(binary)%4: binary.append(0)
        offset=len(binary);binary.extend(struct.pack('<'+'I'*len(ids),*ids))
        vi=len(data['bufferViews']);data['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(ids)*4,'target':34963})
        ai=len(data['accessors']);data['accessors'].append({'bufferView':vi,'componentType':5125,'count':len(ids),'type':'SCALAR','min':[min(ids)],'max':[max(ids)]})
        part=dict(primitive);part['indices']=ai
        mesh_index=len(data['meshes']);data['meshes'].append({'name':name,'primitives':[part]})
        parent['children'].append(len(data['nodes']));data['nodes'].append({'name':name,'mesh':mesh_index})
        after+=len(ids)//3
        if (mi,ci) in names: print(name,len(ids)//3,'triangles')
assert before==after
data['buffers'][0]['byteLength']=len(binary)
encoded=json.dumps(data,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
binary.extend(b'\0'*((-len(binary))%4))
output=root/'audi_s3_limousine_8v_separated.glb'
with output.open('wb') as f:
    f.write(struct.pack('<III',0x46546c67,2,12+8+len(encoded)+8+len(binary)))
    f.write(struct.pack('<II',len(encoded),0x4e4f534a));f.write(encoded)
    f.write(struct.pack('<II',len(binary),0x004e4942));f.write(binary)
print('Saved',output.name,'with',after,'paint triangles preserved')
