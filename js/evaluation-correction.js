import { staffCall, staffError } from './staff-api.js';
import { EVALUATION_FORMS } from './academy-record.js';
export function evaluationParticipationControl(root,seminarId,emailKey,evaluation,reload) {
 const form=document.createElement('form');form.className='staff-row';
 const label=document.createElement('label');label.textContent='Evaluation participation correction';
 const select=document.createElement('select');
 for(const [value,text] of [['','Opted out'],...Object.entries(EVALUATION_FORMS)]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
 select.value=evaluation.request?.form || '';label.append(select);
 const button=document.createElement('button');button.textContent='Save participation';
 const status=document.createElement('span');status.setAttribute('role','status');form.append(label,button,status);
 form.onsubmit=async event=>{event.preventDefault();button.disabled=true;try {await staffCall('staffSetEvaluationRequest',{seminarId,emailKey,optIn:!!select.value,form:select.value});await reload();}catch(error){status.textContent=staffError(error);}finally{button.disabled=false;}};
 root.append(form);
}
