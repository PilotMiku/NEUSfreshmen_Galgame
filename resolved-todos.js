export const resolvedTasks=[
 {id:'meeting',name:'今晚心理班会',step:4,pending:'今晚 · 随便坐',done:'我来了'},
 {id:'math',name:'高数作业',step:1,done:'已找学委问'},
 {id:'group',name:'小组作业落单',step:2,done:'已和同学约好一起做'},
 {id:'feeling',name:'心里不得劲',step:3,done:'已跟生活委员说'},
 {id:'python',name:'Python课',step:Infinity,pending:'周三 · 记得带电脑'}
];
export function resolvedTodoState(scene){
 const step=scene.phone==='resolved'&&Number.isInteger(scene.resolvedCount)?scene.resolvedCount:0;
 return resolvedTasks.map(task=>({...task,checked:task.step<step,current:task.step===step}));
}

export class ResolvedTodos{
 constructor(cue=()=>{}){this.cue=cue;this.clear();}
 clear(){this.list=null;this.rows=new Map();this.current=null;this.completed=false;}
 set(container,scene,reduced=false){
  this.clear();this.reduced=reduced;
  const list=document.createElement('div');list.className='resolved-todos';list.classList.toggle('is-reduced',reduced);list.setAttribute('role','list');list.setAttribute('aria-label','待办事项');list.setAttribute('aria-live','polite');this.list=list;
  for(const task of resolvedTodoState(scene)){
   const row=document.createElement('div');row.className='phone-item resolved-todo';row.dataset.todo=task.id;row.setAttribute('role','listitem');
   const box=document.createElement('span');box.className='phone-checkbox';box.setAttribute('aria-hidden','true');
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 16 16');
   const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M3 8 6.5 11.5 13 4.5');path.setAttribute('pathLength','1');svg.append(path);box.append(svg);
   const copy=document.createElement('span'),name=document.createElement('span'),note=document.createElement('small');name.textContent=task.name;note.className='resolved-note';copy.append(name,note);row.append(box,copy);list.append(row);this.rows.set(task.id,{row,note,task});
   this.update(task.id,task.checked);if(task.current)this.current=task.id;
  }
  container.append(list);
 }
 update(id,checked){
  const {row,note,task}=this.rows.get(id);row.classList.toggle('checked',checked);note.textContent=(checked?task.done:task.pending)||'\u00a0';row.setAttribute('aria-label',task.name+'，'+(checked?'已完成，'+task.done:'待完成'));
 }
 complete(){
  if(!this.current||this.completed)return false;
  this.completed=true;this.update(this.current,true);
  if(!this.reduced)this.rows.get(this.current).row.classList.add('completing');
  this.cue('check');return true;
 }
 setReduced(value){this.reduced=value;this.list?.classList.toggle('is-reduced',value);}
 pause(value){this.list?.classList.toggle('is-paused',value);}
}
