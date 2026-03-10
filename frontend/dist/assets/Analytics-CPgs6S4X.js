import{c as H,r as A,j as e,a as Y,C as L,d as q,A as G}from"./index-CSIAs8Dw.js";import{D as K,A as X}from"./download-C6dxDT9d.js";import{F as Z}from"./file-text-4DbB0V8J.js";import{S as P}from"./shield-alert-B4Q8bpH5.js";/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=[["path",{d:"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",key:"mvr1a0"}],["path",{d:"M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27",key:"auskq0"}]],F=H("heart-pulse",J);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["path",{d:"M6 18h8",key:"1borvv"}],["path",{d:"M3 22h18",key:"8prr45"}],["path",{d:"M14 22a7 7 0 1 0 0-14h-1",key:"1jwaiy"}],["path",{d:"M9 14h2",key:"197e7h"}],["path",{d:"M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z",key:"1bmzmy"}],["path",{d:"M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3",key:"1drr47"}]],O=H("microscope",Q);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=[["line",{x1:"10",x2:"14",y1:"2",y2:"2",key:"14vaq8"}],["line",{x1:"12",x2:"15",y1:"14",y2:"11",key:"17fdiu"}],["circle",{cx:"12",cy:"14",r:"8",key:"1e1u0o"}]],te=H("timer",ee),ie=[{id:"overview",label:"Aloe Overview",icon:L},{id:"health",label:"Aloe Health",icon:F},{id:"conditions",label:"Aloe Conditions",icon:O},{id:"activity",label:"Aloe Activity",icon:X}],T=({value:u,max:m,label:s,color:b})=>{const v=u/m*100,x=2*Math.PI*45,z=x-v/100*x;return e.jsxs("div",{style:{textAlign:"center",flex:"1",minWidth:"120px"},children:[e.jsxs("svg",{width:"120",height:"120",style:{marginBottom:"8px"},children:[e.jsx("circle",{cx:"60",cy:"60",r:"45",fill:"none",stroke:"#e4efe7",strokeWidth:"8"}),e.jsx("circle",{cx:"60",cy:"60",r:"45",fill:"none",stroke:b,strokeWidth:"8",strokeDasharray:x,strokeDashoffset:z,strokeLinecap:"round",style:{transition:"stroke-dashoffset 0.5s ease",transform:"rotate(-90deg)",transformOrigin:"60px 60px"}}),e.jsxs("text",{x:"60",y:"70",textAnchor:"middle",fontSize:"20",fontWeight:"700",fill:b,children:[v.toFixed(0),"%"]})]}),e.jsx("p",{style:{margin:"0",fontSize:"12px",color:"#5b7865",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700},children:s})]})},w=({label:u,value:m,color:s,image:b,icon:v})=>e.jsxs("article",{style:{background:"#ffffff",border:"1px solid #dceadf",borderRadius:"14px",boxShadow:"0 10px 22px rgba(17, 43, 28, 0.08)",overflow:"hidden",transition:"transform 0.2s ease, box-shadow 0.2s ease"},onMouseEnter:x=>{x.currentTarget.style.transform="translateY(-2px)",x.currentTarget.style.boxShadow="0 14px 28px rgba(17, 43, 28, 0.12)"},onMouseLeave:x=>{x.currentTarget.style.transform="translateY(0)",x.currentTarget.style.boxShadow="0 10px 22px rgba(17, 43, 28, 0.08)"},children:[e.jsx("div",{style:{width:"100%",height:"156px",borderBottom:"1px solid #e6f0e7",background:"#f7fbf8",overflow:"hidden"},children:e.jsx("img",{src:b,alt:u,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}})}),e.jsxs("div",{style:{padding:"14px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"},children:[e.jsx("p",{style:{margin:0,fontSize:"12px",color:"#62806c",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700},children:u}),e.jsx("span",{style:{color:s},children:v})]}),e.jsx("p",{style:{margin:0,fontSize:"30px",lineHeight:1.1,letterSpacing:"-0.02em",fontWeight:700,color:s},children:typeof m=="number"?m.toFixed(2):m})]})]});function le(){const[u,m]=A.useState(null),[s,b]=A.useState("all"),[v,x]=A.useState(!0),[z,R]=A.useState(null),[k,B]=A.useState("overview"),I=async()=>{var i,a,r;try{x(!0);const c=s==="all"?"/analytics/user":`/analytics/user?period=${s}`,h=await q.get(c);m((i=h.data)==null?void 0:i.data),R(null)}catch(c){c.response?R(((r=(a=c.response)==null?void 0:a.data)==null?void 0:r.error)||c.message):R(`Cannot reach backend at ${G}. Is the backend running?`)}finally{x(!1)}};if(A.useEffect(()=>{I()},[s]),v)return e.jsx("div",{style:{minHeight:"calc(100vh - 76px)",display:"grid",placeItems:"center",background:"linear-gradient(180deg, #edf6ec 0%, #f6fbf5 100%)"},children:e.jsxs("div",{style:{textAlign:"center",color:"#2f5e43"},children:[e.jsx(Y,{size:38,style:{marginBottom:"10px"}}),e.jsx("p",{style:{margin:0,fontSize:"17px",fontWeight:600},children:"Loading analytics..."})]})});if(z)return e.jsx("div",{style:{minHeight:"calc(100vh - 76px)",display:"grid",placeItems:"center",padding:"20px",background:"linear-gradient(180deg, #edf6ec 0%, #f6fbf5 100%)"},children:e.jsxs("div",{style:{background:"#fff",border:"1px solid #f1cfcf",padding:"22px",borderRadius:"12px",maxWidth:"560px",textAlign:"center",boxShadow:"0 12px 24px rgba(0,0,0,0.06)"},children:[e.jsx("p",{style:{color:"#b91c1c",fontSize:"15px",marginBottom:"16px"},children:z}),e.jsx("button",{onClick:I,style:{padding:"10px 20px",background:"#1f7a46",color:"#fff",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700},children:"Retry"})]})});if(!u)return e.jsx("div",{style:{minHeight:"calc(100vh - 76px)",display:"grid",placeItems:"center",background:"linear-gradient(180deg, #edf6ec 0%, #f6fbf5 100%)"},children:e.jsx("p",{style:{fontSize:"18px",color:"#365a45",margin:0},children:"No analytics data available"})});const d=u.analytics||{},N=i=>{const a=Number(i);return Number.isFinite(a)?a<=1?Math.max(0,Math.min(100,a*100)):a<=10?Math.max(0,Math.min(100,a/10*100)):Math.max(0,Math.min(100,a)):0},t={total_plants:d.total_plants||0,total_scans:d.total_scans||0,healthy_scans_count:d.healthy_scans_count||0,diseased_scans_count:d.diseased_scans_count||0,healthy_plants_count:d.healthy_plants_count||0,diseased_plants_count:d.diseased_plants_count||0,harvest_rate:parseFloat(d.harvest_rate)||0,disease_rate:parseFloat(d.disease_rate)||0,average_health_score:d.average_health_score!==void 0?parseFloat(d.average_health_score):0,average_confidence_score:d.average_confidence_score!==void 0?parseFloat(d.average_confidence_score):0,condition_distribution:d.condition_distribution||{},pest_distribution:d.pest_distribution||{},recent_scan_activity:d.recent_scan_activity||[]},_=N(t.average_confidence_score),E=new Set(["rust"]),C=Object.entries(t.condition_distribution||{}).filter(([i])=>!E.has(String(i||"").toLowerCase())),j={totalScans:"/images/total%20scans.png",healthyPlants:"/images/healthy%20plants%20.png",diseasedPlants:"/images/disease%20rate.png",diseaseRate:"/images/disease%20rate.png",avgHealth:"/images/Avg%20Health%20Score.png",avgConfidence:"/images/Avg%20Confidence.png"},D=i=>{const a=i.analysis_result||{},r=(n="")=>String(n).toLowerCase().trim().replace(/[-\s]+/g,"_"),c=new Set(["","healthy","none","normal","no_disease","no_issue","clear"]),h=(n="")=>c.has(r(n)),g=(Array.isArray(a.detected_conditions)?a.detected_conditions:[]).filter(n=>!h(n));if(g.length>0)return g.join(", ");const o=a.disease_name;return o&&!h(o)?o:a.disease_detected===!0||a.disease_severity&&a.disease_severity!=="none"?"Diseased":"Healthy"},V=()=>{const i=[],a=(o,l,n,p="",y="")=>i.push({section:o,item:l,value:n,extra1:p,extra2:y});a("Overview","Period",s),a("Overview","Total Plants",t.total_plants),a("Overview","Total Scans",t.total_scans),a("Overview","Healthy Scans",t.healthy_scans_count),a("Overview","Diseased Scans",t.diseased_scans_count),a("Overview","Harvest Rate",`${t.harvest_rate.toFixed(2)}%`),a("Overview","Disease Rate",`${t.disease_rate.toFixed(2)}%`),a("Overview","Average Health Score",t.average_health_score.toFixed(2)),a("Overview","Average Confidence Score",`${_.toFixed(2)}%`),C.forEach(([o,l])=>{a("Condition Distribution",o.replace(/_/g," "),l)}),Object.entries(t.pest_distribution||{}).forEach(([o,l])=>{a("Pest Distribution",o.replace(/_/g," "),l)}),(t.recent_scan_activity||[]).forEach(o=>{var n,p,y;const l=parseFloat(((n=o.analysis_result)==null?void 0:n.health_score)??((p=o.analysis_result)==null?void 0:p.plant_health_score)??0).toFixed(2);a("Recent Scan Activity",((y=o.plant_id)==null?void 0:y.plant_id)||"N/A",l,D(o),new Date(o.createdAt).toLocaleDateString())});const r=["section","item","value","extra1","extra2"],c=[r.join(","),...i.map(o=>r.map(l=>`"${String(o[l]??"").replace(/"/g,'""')}"`).join(","))].join(`
`),h=new Blob([c],{type:"text/csv;charset=utf-8;"}),f=URL.createObjectURL(h),g=document.createElement("a");g.href=f,g.download=`analytics_${s}_${new Date().toISOString().slice(0,10)}.csv`,g.click(),URL.revokeObjectURL(f)},U=()=>{const i=[["Period",s],["Total Aloe Plants",t.total_plants],["Total Aloe Scans",t.total_scans],["Healthy Aloe Scans",t.healthy_scans_count],["Diseased Aloe Scans",t.diseased_scans_count],["Aloe Harvest Rate",`${t.harvest_rate.toFixed(2)}%`],["Aloe Disease Rate",`${t.disease_rate.toFixed(2)}%`],["Average Aloe Health Score",t.average_health_score.toFixed(2)],["Average Aloe Confidence Score",`${_.toFixed(2)}%`]],a=C,r=Object.entries(t.pest_distribution||{}),c=(t.recent_scan_activity||[]).map(n=>{var W,S,$,M;const p=(W=n.plant_id)!=null&&W.location?n.plant_id.location.farm_name||n.plant_id.location.plot_number||"Home":"N/A",y=parseFloat(((S=n.analysis_result)==null?void 0:S.health_score)??(($=n.analysis_result)==null?void 0:$.plant_health_score)??0).toFixed(2);return[((M=n.plant_id)==null?void 0:M.plant_id)||"N/A",p,y,D(n),new Date(n.createdAt).toLocaleDateString()]}),h=[`Aloe scan status: ${t.healthy_scans_count} healthy scans and ${t.diseased_scans_count} diseased scans were recorded for the selected period.`,`Aloe disease pressure: Disease rate is ${t.disease_rate.toFixed(2)}%, while harvest rate is ${t.harvest_rate.toFixed(2)}%.`,`Aloe quality confidence: Average health score is ${t.average_health_score.toFixed(2)} / 100 and average confidence score is ${_.toFixed(2)}%.`,`Aloe operational activity: ${t.total_scans} total aloe scans were recorded for the selected period (${s}).`],f=(n,p)=>{const y=`<tr>${n.map(S=>`<th>${S}</th>`).join("")}</tr>`,W=p.length?p.map(S=>`<tr>${S.map($=>`<td>${String($)}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${n.length}">No data available</td></tr>`;return`<table>${y}${W}</table>`},o=`
      <html>
        <head>
          <title>Analytics Report</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #eef5f0;
              color: #13281d;
              padding: 28px;
            }
            .report {
              max-width: 980px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #d8e6dc;
              border-radius: 14px;
              overflow: hidden;
              box-shadow: 0 10px 24px rgba(17, 43, 28, 0.08);
            }
            .report-head {
              background: linear-gradient(135deg, #1f7a46 0%, #2f7250 100%);
              color: #ffffff;
              padding: 18px 22px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 14px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand img {
              width: 42px;
              height: 42px;
              border-radius: 10px;
              object-fit: cover;
              border: 2px solid rgba(255, 255, 255, 0.35);
            }
            .brand h1 {
              margin: 0;
              font-size: 22px;
              line-height: 1.15;
              letter-spacing: -0.01em;
            }
            .brand p {
              margin: 3px 0 0 0;
              font-size: 12px;
              color: #d6eadf;
            }
            .meta {
              text-align: right;
              font-size: 12px;
              color: #d6eadf;
              line-height: 1.5;
            }
            .body {
              padding: 18px 22px 24px;
            }
            h2 {
              margin: 20px 0 8px;
              font-size: 16px;
              color: #1f3e2f;
              letter-spacing: 0.01em;
            }
            h2:first-child {
              margin-top: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              border: 1px solid #d9e7dd;
              border-radius: 8px;
              overflow: hidden;
            }
            th, td {
              border: 1px solid #d9e7dd;
              padding: 8px 10px;
              font-size: 12px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #e8f2eb;
              color: #1f3e2f;
              font-weight: 700;
            }
            tr:nth-child(even) td {
              background: #f7fbf8;
            }
            .foot {
              margin-top: 14px;
              font-size: 11px;
              color: #67816f;
              text-align: right;
            }
            .interpretation {
              margin-top: 18px;
              border: 1px solid #d8e6dc;
              background: #f5faf6;
              border-radius: 10px;
              padding: 12px 14px;
            }
            .interpretation h3 {
              margin: 0 0 8px 0;
              font-size: 14px;
              color: #1f3e2f;
            }
            .interpretation ul {
              margin: 0;
              padding-left: 18px;
            }
            .interpretation li {
              margin: 5px 0;
              font-size: 12px;
              color: #365645;
              line-height: 1.45;
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="report-head">
              <div class="brand">
                <img src="${`${window.location.origin}/images/system-logo.png`}" alt="Vera System Logo" />
                <div>
                  <h1>Aloe Vera Analytics Report</h1>
                  <p>Vera Aloe Vera System</p>
                </div>
              </div>
              <div class="meta">
                <div>Period: ${s}</div>
                <div>Generated: ${new Date().toLocaleString()}</div>
              </div>
            </div>
            <div class="body">
              <h2>Aloe Overview</h2>
              ${f(["Metric","Value"],i)}
              <h2>Aloe Condition Distribution</h2>
              ${f(["Aloe Condition","Count"],a.map(([n,p])=>[n.replace(/_/g," "),p]))}
              <h2>Aloe Pest Distribution</h2>
              ${f(["Aloe Pest","Count"],r.map(([n,p])=>[n.replace(/_/g," "),p]))}
              <h2>Recent Aloe Scan Activity</h2>
              ${f(["Aloe Plant ID","Location","Aloe Health Score","Aloe Conditions","Date"],c)}
              <div class="interpretation">
                <h3>Aloe Interpretation</h3>
                <ul>
                  ${h.map(n=>`<li>${n}</li>`).join("")}
                </ul>
              </div>
              <div class="foot">Generated by Vera Aloe Vera System Analytics</div>
            </div>
          </div>
        </body>
      </html>
    `,l=window.open("","_blank");l&&(l.document.write(o),l.document.close(),l.focus(),l.print())};return e.jsxs("div",{style:{minHeight:"calc(100vh - 76px)",background:"linear-gradient(180deg, #edf6ec 0%, #f6fbf5 100%)",padding:"20px 16px 28px"},children:[e.jsx("div",{style:{maxWidth:"1420px",margin:"0 auto"},children:e.jsxs("section",{style:{borderRadius:"16px",border:"1px solid #d7e7da",background:"#fff",boxShadow:"0 16px 28px rgba(17, 43, 28, 0.09)",padding:"18px"},children:[e.jsx("header",{style:{marginBottom:"16px"},children:e.jsxs("div",{style:{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:"12px"},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{margin:"0 0 4px 0",color:"#1f3e2f",fontSize:"31px",lineHeight:1.1,letterSpacing:"-0.02em",fontWeight:700},children:"Analytics Dashboard"}),e.jsx("p",{style:{margin:0,color:"#5f7f69",fontSize:"13px",fontWeight:600},children:"Monitor plant health, conditions, and scan performance across periods."})]}),e.jsxs("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:[e.jsxs("button",{onClick:V,style:{padding:"10px 14px",background:"#e7f2ea",color:"#2a6549",border:"1px solid #cfe0d4",borderRadius:"8px",cursor:"pointer",fontWeight:700,display:"inline-flex",alignItems:"center",gap:"8px"},children:[e.jsx(K,{size:15}),"Export CSV"]}),e.jsxs("button",{onClick:U,style:{padding:"10px 14px",background:"#1f7a46",color:"#fff",border:"1px solid #1f7a46",borderRadius:"8px",cursor:"pointer",fontWeight:700,display:"inline-flex",alignItems:"center",gap:"8px"},children:[e.jsx(Z,{size:15}),"Export PDF"]})]})]})}),e.jsx("div",{style:{marginBottom:"14px",borderRadius:"12px",background:"linear-gradient(150deg, #1a4c35 0%, #2f7250 100%)",border:"1px solid rgba(173, 206, 186, 0.35)",padding:"12px"},children:e.jsxs("div",{style:{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap",justifyContent:"space-between"},children:[e.jsx("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:["all","daily","weekly","monthly"].map(i=>e.jsx("button",{onClick:()=>b(i),style:{padding:"9px 15px",background:s===i?"#e4efe7":"rgba(190, 222, 201, 0.16)",color:s===i?"#2a6549":"#f0f8f2",border:s===i?"1px solid #b9d8c3":"1px solid rgba(173, 206, 186, 0.34)",borderRadius:"8px",cursor:"pointer",fontWeight:700,textTransform:"capitalize"},children:i},i))}),e.jsxs("div",{style:{color:"#cde3d3",fontSize:"12px",fontWeight:700,display:"inline-flex",alignItems:"center",gap:"6px"},children:[e.jsx(te,{size:14}),"Current period: ",s]})]})}),e.jsx("div",{style:{display:"flex",gap:"8px",marginBottom:"18px",borderBottom:"1px solid #e2eee5",paddingBottom:"2px",flexWrap:"wrap"},children:ie.map(i=>{const a=i.icon,r=k===i.id;return e.jsxs("button",{onClick:()=>B(i.id),style:{padding:"11px 14px",background:r?"#e4efe7":"transparent",color:r?"#2a6549":"#5c7864",border:"none",borderBottom:r?"2px solid #2f7250":"2px solid transparent",borderRadius:"8px 8px 0 0",cursor:"pointer",fontWeight:700,fontSize:"14px",display:"inline-flex",alignItems:"center",gap:"7px"},children:[e.jsx(a,{size:15}),i.label]},i.id)})}),k==="overview"&&e.jsxs("div",{style:{animation:"fadeIn 0.28s ease"},children:[e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(248px, 1fr))",gap:"14px",marginBottom:"16px"},children:[e.jsx(w,{label:"Total Aloe Scans",value:t.total_scans,color:"#2a6549",image:j.totalScans,icon:e.jsx(L,{size:16})}),e.jsx(w,{label:"Healthy Aloe Scans",value:t.healthy_scans_count,color:"#1f7a46",image:j.healthyPlants,icon:e.jsx(F,{size:16})}),e.jsx(w,{label:"Diseased Aloe Scans",value:t.diseased_scans_count,color:"#b45309",image:j.diseasedPlants,icon:e.jsx(P,{size:16})})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(248px, 1fr))",gap:"14px"},children:[e.jsx(w,{label:"Aloe Disease Rate",value:`${t.disease_rate.toFixed(1)}%`,color:"#9a3412",image:j.diseaseRate,icon:e.jsx(P,{size:16})}),e.jsx(w,{label:"Avg Aloe Health Score",value:t.average_health_score.toFixed(2),color:"#1f7a46",image:j.avgHealth,icon:e.jsx(F,{size:16})}),e.jsx(w,{label:"Avg Aloe Confidence",value:`${_.toFixed(1)}%`,color:"#2a6549",image:j.avgConfidence,icon:e.jsx(O,{size:16})})]})]}),k==="health"&&e.jsxs("div",{style:{animation:"fadeIn 0.28s ease",borderRadius:"12px",border:"1px solid #dceadf",background:"#f9fcf8",padding:"18px"},children:[e.jsx("h2",{style:{margin:"0 0 20px 0",color:"#1f3e2f",fontSize:"23px",fontWeight:700},children:"Aloe Vera Health Metrics"}),e.jsxs("div",{style:{display:"flex",gap:"26px",flexWrap:"wrap",justifyContent:"center",alignItems:"center"},children:[e.jsx(T,{value:t.healthy_plants_count,max:t.total_plants||1,label:"Healthy Aloe",color:"#1f7a46"}),e.jsx(T,{value:t.diseased_plants_count,max:t.total_plants||1,label:"Diseased Aloe",color:"#b45309"}),e.jsxs("div",{style:{flex:1,minWidth:"250px"},children:[e.jsx("h3",{style:{color:"#2b4b39",margin:"0 0 12px 0",fontSize:"16px",fontWeight:700},children:"Health Overview"}),e.jsxs("div",{style:{marginBottom:"14px"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"6px"},children:[e.jsx("span",{style:{color:"#587564",fontSize:"13px",fontWeight:600},children:"Average Health Score"}),e.jsxs("span",{style:{fontWeight:700,color:"#1f7a46"},children:[t.average_health_score.toFixed(2),"/100"]})]}),e.jsx("div",{style:{background:"#e3eee6",height:"8px",borderRadius:"4px",overflow:"hidden"},children:e.jsx("div",{style:{background:"linear-gradient(90deg, #1f7a46 0%, #2f7250 100%)",height:"100%",width:`${Math.min(t.average_health_score/100*100,100)}%`,transition:"width 0.5s ease"}})})]}),e.jsxs("div",{children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"6px"},children:[e.jsx("span",{style:{color:"#587564",fontSize:"13px",fontWeight:600},children:"Average Confidence Score"}),e.jsxs("span",{style:{fontWeight:700,color:"#2a6549"},children:[_.toFixed(1),"%"]})]}),e.jsx("div",{style:{background:"#e3eee6",height:"8px",borderRadius:"4px",overflow:"hidden"},children:e.jsx("div",{style:{background:"linear-gradient(90deg, #2a6549 0%, #1f7a46 100%)",height:"100%",width:`${_}%`,transition:"width 0.5s ease"}})})]})]})]})]}),k==="conditions"&&e.jsxs("div",{style:{animation:"fadeIn 0.28s ease",borderRadius:"12px",border:"1px solid #dceadf",background:"#f9fcf8",padding:"18px"},children:[e.jsx("h2",{style:{margin:"0 0 16px 0",color:"#1f3e2f",fontSize:"23px",fontWeight:700},children:"Aloe Conditions & Pests"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:"20px"},children:[e.jsxs("div",{children:[e.jsx("h3",{style:{marginBottom:"12px",color:"#2b4b39",fontSize:"16px",fontWeight:700},children:"Condition Distribution"}),C.length>0?e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"10px"},children:C.map(([i,a])=>e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 12px",background:"#fff",border:"1px solid #dceadf",borderRadius:"8px"},children:[e.jsx("span",{style:{color:"#466552",textTransform:"capitalize",fontSize:"14px",fontWeight:600},children:i.replace(/_/g," ")}),e.jsx("span",{style:{fontWeight:700,color:"#1f7a46",fontSize:"16px"},children:a})]},i))}):e.jsx("p",{style:{color:"#6a8573",textAlign:"center"},children:"No condition data available"})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{marginBottom:"12px",color:"#2b4b39",fontSize:"16px",fontWeight:700},children:"Pest Distribution"}),Object.entries(t.pest_distribution||{}).length>0?e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"10px"},children:Object.entries(t.pest_distribution).map(([i,a])=>e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 12px",background:"#fff",border:"1px solid #dceadf",borderRadius:"8px"},children:[e.jsx("span",{style:{color:"#466552",textTransform:"capitalize",fontSize:"14px",fontWeight:600},children:i.replace(/_/g," ")}),e.jsx("span",{style:{fontWeight:700,color:"#1f7a46",fontSize:"16px"},children:a})]},i))}):e.jsx("p",{style:{color:"#6a8573",textAlign:"center"},children:"No pest data available"})]})]})]}),k==="activity"&&e.jsx("div",{style:{animation:"fadeIn 0.28s ease"},children:t.recent_scan_activity&&t.recent_scan_activity.length>0?e.jsxs("div",{style:{borderRadius:"12px",border:"1px solid #dceadf",background:"#f9fcf8",padding:"18px",overflowX:"auto"},children:[e.jsx("h2",{style:{margin:"0 0 16px 0",color:"#1f3e2f",fontSize:"23px",fontWeight:700},children:"Recent Aloe Scan Activity"}),e.jsxs("table",{style:{width:"100%",borderCollapse:"separate",borderSpacing:0},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{background:"linear-gradient(135deg, #1f7a46 0%, #185f38 100%)",color:"#fff"},children:[e.jsx("th",{style:{padding:"14px",textAlign:"left",fontWeight:700,fontSize:"13px"},children:"Plant ID"}),e.jsx("th",{style:{padding:"14px",textAlign:"left",fontWeight:700,fontSize:"13px"},children:"Location"}),e.jsx("th",{style:{padding:"14px",textAlign:"left",fontWeight:700,fontSize:"13px"},children:"Health Score"}),e.jsx("th",{style:{padding:"14px",textAlign:"left",fontWeight:700,fontSize:"13px"},children:"Conditions"}),e.jsx("th",{style:{padding:"14px",textAlign:"left",fontWeight:700,fontSize:"13px"},children:"Date"})]})}),e.jsx("tbody",{children:t.recent_scan_activity.map((i,a)=>{var r,c,h,f;return e.jsxs("tr",{style:{borderBottom:"1px solid #e2eee5",background:a%2===0?"#fff":"#f7fbf6"},onMouseEnter:g=>{g.currentTarget.style.background="#eef6ef"},onMouseLeave:g=>{g.currentTarget.style.background=a%2===0?"#fff":"#f7fbf6"},children:[e.jsx("td",{style:{padding:"13px",fontSize:"13px",color:"#2f4f3d",fontWeight:600},children:((r=i.plant_id)==null?void 0:r.plant_id)||"N/A"}),e.jsx("td",{style:{padding:"13px",fontSize:"13px",color:"#2f4f3d"},children:(c=i.plant_id)!=null&&c.location?i.plant_id.location.farm_name||i.plant_id.location.plot_number||"Home":"N/A"}),e.jsx("td",{style:{padding:"13px"},children:e.jsx("span",{style:{display:"inline-block",padding:"5px 10px",borderRadius:"999px",background:"#e7f2ea",color:"#2a6549",fontWeight:700,fontSize:"12px",border:"1px solid #cfe0d4"},children:parseFloat(((h=i.analysis_result)==null?void 0:h.health_score)??((f=i.analysis_result)==null?void 0:f.plant_health_score)??0).toFixed(2)})}),e.jsx("td",{style:{padding:"13px",fontSize:"13px",color:"#45624f"},children:D(i)}),e.jsx("td",{style:{padding:"13px",fontSize:"13px",color:"#567261"},children:new Date(i.createdAt).toLocaleDateString()})]},a)})})]})]}):e.jsx("div",{style:{borderRadius:"12px",border:"1px solid #dceadf",background:"#f9fcf8",padding:"34px",textAlign:"center"},children:e.jsx("p",{style:{color:"#6a8573",margin:0,fontSize:"16px"},children:"No recent scan activity"})})})]})}),e.jsx("style",{children:`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `})]})}export{le as default};
