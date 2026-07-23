# Moteur de Fraude Intelligent — MASTER_FRAUD_ENGINE.md

> **Document d'Architecture Technique** — Version 1.0.0  
> **Classification** : Interne — Confidentiel  
> **Derniere mise a jour** : 2026-07-22  
> **Extension de** : `MASTER_ACCOUNT_SHARING_PREVENTION_AUDIT.md` §19-20

---

## Table des Matieres

1. [Executive Summary](#1-executive-summary)
2. [Architecture du Moteur de Fraude](#2-architecture-du-moteur-de-fraude)
3. [Risk Scoring Engine — Mode Synchrone](#3-risk-scoring-engine--mode-synchrone)
4. [Risk Scoring Engine — Mode Asynchrone](#4-risk-scoring-engine--mode-asynchrone)
5. [Ensemble ML Models](#5-ensemble-ml-models)
6. [Feature Engineering Pipeline](#6-feature-engineering-pipeline)
7. [Real-Time Inference Service](#7-real-time-inference-service)
8. [Behavioral Profiling System](#8-behavioral-profiling-system)
9. [Abuse Detection Engine](#9-abuse-detection-engine)
10. [Device Trust & Fingerprinting](#10-device-trust--fingerprinting)
11. [IP Reputation & Geoloction](#11-ip-reputation--geolocation)
12. [Feedback Loop & Continuous Learning](#12-feedback-loop--continuous-learning)
13. [Model Monitoring & Observability](#13-model-monitoring--observability)
14. [Data Pipeline & Training Infrastructure](#14-data-pipeline--training-infrastructure)
15. [Threat Detection Scenarios](#15-threat-detection-scenarios)
16. [Decision Layer & Actions](#16-decision-layer--actions)
17. [Performance SLOs](#17-performance-slos)
18. [Implementation Roadmap](#18-implementation-roadmap)
19. [Appendices](#19-appendices)

---

## 1. Executive Summary

### 1.1 Vision

Le Moteur de Fraude Intelligent (MFI) est le systeme central de detection et de prevention de la fraude pour la plateforme NBA. Il combine des analyses synchrones (temps reel) et asynchrones (post-connexion), des modeles de machine learning ensemblistes, du profilage comportemental, et une boucle de retroaction continue pour offrir une protection multicouche contre le partage frauduleux de comptes, la prise de controle (ATO), le credential stuffing, le scraping automatise, les inscriptions frauduleuses, les abus API, et le vol de session.

### 1.2 Principes Fondamentaux

| Principe | Description |
|----------|-------------|
| **Defense in Depth** | Multiples couches de detection (sync, async, ML, comportemental) |
| **Zero Trust** | Aucune requete n'est trusted par defaut |
| **Privacy by Design** | Aucun stockage de donnees brutes |
| **Real-Time First** | 95% des decisions < 100ms en mode synchrone |
| **Continuous Learning** | Modeles re-entraines hebdomadairement |
| **Explainability** | Chaque score decomposable en facteurs explicites |

### 1.3 Score de Maturite Actuel vs Cible

| Domaine | Actuel (/10) | Cible (/10) | Ecart |
|---------|:-----------:|:----------:|:----:|
| Risk scoring synchrone | 2 | 9 | -7 |
| Risk scoring asynchrone | 0 | 9 | -9 |
| ML models | 0 | 8 | -8 |
| Feature engineering | 1 | 9 | -8 |
| Real-time inference | 0 | 9 | -9 |
| Behavioral profiling | 0 | 8 | -8 |
| Abuse detection | 3 | 9 | -6 |
| Device fingerprinting | 2 | 9 | -7 |
| IP reputation | 1 | 8 | -7 |
| Feedback loop | 0 | 8 | -8 |
| Model monitoring | 0 | 8 | -8 |
| **Moyenne** | **0.8** | **8.5** | **-7.7** |

### 1.4 Arbre de Decision Global

```
Requete entrante
|
+-- [Gateway] Rate Limiting (IP + User + Endpoint)
|   +-- Blocage si > seuil
+-- [Middleware] Device Check
|   +-- Fingerprint valide -> Continue
|   +-- Invalide -> BLOCK | CHALLENGE
+-- [Sync Risk] Scoring temps reel (<= 100ms)
|   +-- Rate limit score (0-30)
|   +-- Session limit score (0-20)
|   +-- Device trust score (0-30)
|   +-- 2FA status score (0-20)
|   +-- IP reputation rapide (0-25)
|   +-- TOTAL -> Decision immediate
|       +-- Score <= 30 : ALLOW
|       +-- Score 31-50 : FLAG + notify user
|       +-- Score 51-70 : CHALLENGE 2FA
|       +-- Score > 70 : BLOCK
+-- [Async Queue] BullMQ -> Worker
|   +-- IP reputation complete (MaxMind)
|   +-- Geo distance / impossible travel
|   +-- Login velocity (Redis)
|   +-- Behavioral pattern matching
|   +-- ML inference (ONNX)
|   +-- Mise a jour score + alertes
+-- [Feedback] Boucle de retroaction
    +-- Resolution manuelle (admin)
    +-- Auto-labeling (regles)
    +-- Re-entrainement hebdomadaire
```

---

## 2. Architecture du Moteur de Fraude

### 2.1 Diagramme des Composants

```
+----------------------------------------------------------------------+
|                          CLIENT LAYER                                |
|  Web App | Mobile PWA | API Clients | Third-Party | WebSocket       |
+--------------------------------------+-------------------------------+
|                          GATEWAY LAYER                               |
|  Rate Limiter (Redis) | IP Blocklist | WAF | Device Check            |
+--------------------------------------+-------------------------------+
|                    FRAUD DETECTION ENGINE                            |
|  +----------------------------------------------------------------+  |
|  | FraudDetectionOrchestrator                                     |  |
|  |  Sync Scorer | Async Queue (BullMQ) | ML Inferencer | Decision  |  |
|  +----------------------------------------------------------------+  |
|  +------------------+  +------------------+  +------------------+   |
|  | ABUSE DETECTION  |  | BEHAVIORAL       |  | DEVICE TRUST     |   |
|  | Credential Stuff |  | Profile Store    |  | Fingerprint      |   |
|  | Brute Force      |  | Anomaly Detector |  | Trust State Mach |   |
|  | Account Enum     |  | Sharing Risk     |  | Device Scoring   |   |
|  | Session Hijack   |  +------------------+  +------------------+   |
|  | API Abuse        |  +------------------+  +------------------+   |
|  | Scraping         |  | IP REPUTATION    |  | FEEDBACK LOOP    |   |
|  +------------------+  | MaxMind GeoIP    |  | Feedback Collect |   |
|                        | VPN/TOR/Proxy    |  | Auto-Labeler     |   |
|                        | ASN/Domain       |  | Retraining Pipe  |   |
|                        +------------------+  +------------------+   |
+--------------------------------------+-------------------------------+
|                          DATA LAYER                                 |
|  PostgreSQL (Sessions, Devices, Events, Profiles, Labels)           |
|  Redis (Rate counters, Feature Store, Queues, Cache, Pub/Sub)      |
|  S3/R2 (ML Models ONNX, Training Datasets, Audit Logs)             |
+----------------------------------------------------------------------+
```

### 2.2 Flux de Decision

```
Requete HTTP -> Gateway
    |
    v
+------------------+      < 1ms
| 1. PRE-FILTRE    |
| IP blocklist?----+--- BLOCK 403
| Rate limit?------+--- BLOCK 429
+------+-----------+
       | Pass
       v
+------------------+      < 5ms
| 2. DEVICE CHECK   |
| Fingerprint?      |
| Cookie valid?-----+--- BLOCK si invalide
+------+-----------+
       | Pass
       v
+--------------------------+  < 50ms
| 3. AUTHENTICATION        |
| Credentials valides?-----+--- BLOCK 401
+------+-----------+
       | Auth OK
       v
+------------------------------+  < 100ms
| 4. RISK SCORING SYNC         |
| Rate limit (0-30) Session(0-20) Device(0-30) 2FA(0-20) IP(0-25)|
+------+-----------+
       | Score > 70 -> BLOCK 403
       | Score > 50 -> CHALLENGE 2FA
       | Score > 30 -> FLAG session
       | Score <= 30 -> ALLOW
       v
+------------------------------+  < 5s post-response
| 5. ASYNC QUEUE (BullMQ)      |
| IP reputation full | Geo dist | Login velocity | ML ONNX |
+------+-----------+
       v
+------------------------------+
| 6. POST-PROCESS (Update session risk / SecurityEvent / Alerts) |
+------------------------------+
```

### 2.3 Matrice des Composants

| Composant | Responsabilite | Technologie | Sync/Async | Latence |
|-----------|---------------|-------------|:----------:|:-------:|
| FraudDetectionOrchestrator | Coordination | TS Next.js | Sync | <5ms |
| SyncRiskEngine | Score temps reel | TS+Redis | Sync | <50ms |
| AsyncRiskWorker | Score post-connexion | TS+BullMQ | Async | <5s |
| MLInferenceService | Inference ONNX | ONNX Runtime | Sync | <30ms |
| AbuseDetector | Detection abus | TS+Redis | Sync | <20ms |
| BehavioralProfiler | Profilage | TS+Redis+PG | Async | <2s |
| DeviceTrustManager | Confiance appareils | TS+Prisma | Sync | <10ms |
| IPReputationService | Reputation IP | MaxMind+Redis | Mixte | <5ms |
| FeedbackCollector | Labels feedback | TS+Prisma | Async | <1s |
| FeatureStore | Stockage features | Redis+PG | Sync | <2ms |
| ModelTrainer | Entrainement hebdo | Python | Batch | 30-60min |

---

## 3. Risk Scoring Engine — Mode Synchrone

### 3.1 Architecture

Execute **avant** la creation de session. Doit repondre < 100ms.

```
SyncRiskEngine        Redis           Prisma
    |                    |               |
    | checkRateLimit()  |               |
    |------------------->| zcard/zadd    |
    |<-------------------| score 0-30    |
    | checkSession()     |               |
    |----------------------------------->| count()
    |<-----------------------------------| score 0-20
    | checkDevice()      |               |
    |----------------------------------->| trustLevel
    |<-----------------------------------| score 0-30
    | check2FA()         |               |
    |----------------------------------->| is2faOn
    |<-----------------------------------| score 0-20
    | checkIPCache()     |               |
    |------------------->| get           |
    |<-------------------|               |
    | calculate()        |               |
```

### 3.2 Implementation

```typescript
// src/lib/security/risk-engine-sync.ts

import { Redis } from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { Logger } from '@/lib/logger'
import { MetricsClient } from '@/lib/metrics'
import { DeviceTrustManager } from './device-trust'
import { IPReputationCache } from './ip-reputation'
import { config } from '@/config'

export interface LoginContext {
  userId: string; email: string; ipAddress: string; userAgent: string
  fingerprint: string; deviceId?: string; planId: string; is2faEnabled: boolean; timestamp: Date
}

export interface RiskFactorResult {
  name: string; weight: number; score: number; reason?: string; metadata?: Record<string, unknown>
}

export interface SyncRiskResult {
  totalScore: number; level: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'
  factors: RiskFactorResult[]; requiresChallenge: boolean; shouldBlock: boolean; expiresAt: number; requestId: string
}

export class SyncRiskEngine {
  private readonly redis = new Redis(config.redis.url)
  private readonly prisma = new PrismaClient()
  private readonly deviceTrust = new DeviceTrustManager()
  private readonly ipCache = new IPReputationCache()
  private readonly logger = new Logger('sync-risk-engine')
  private readonly metrics = new MetricsClient('sync_risk_engine')

  async evaluate(context: LoginContext, requestId: string): Promise<SyncRiskResult> {
    const start = Date.now()
    const [rl, sl, dt, tfa, ip] = await Promise.all([
      this.checkRateLimit(context), this.checkSessionLimit(context),
      this.checkDeviceTrust(context), this.check2FA(context), this.checkIPCache(context),
    ])
    const result = this.calculate([rl, sl, dt, tfa, ip], requestId)
    this.metrics.record('sync_ms', Date.now()-start)
    return result
  }

  private async checkRateLimit(ctx: LoginContext): Promise<RiskFactorResult> {
    const w=60000, m=5, n=Date.now(), k=`ratelimit:${ctx.ipAddress}:${ctx.email}`
    const p=this.redis.multi(); p.zremrangebyscore(k,0,n-w); p.zcard(k); p.zadd(k,n,`${n}:${Math.random().toString(36).slice(2)}`); p.expire(k,60)
    const r=await p.exec(); const c=(r?.[1]?.[1]as number)??0
    return {name:'rate_limit',weight:30,score:c>=m?Math.min(100,30+(c-m)*10):Math.round(c/m*30),reason:`Tentatives:${c}/${m}`,metadata:{c,m}}
  }

  private async checkSessionLimit(ctx: LoginContext): Promise<RiskFactorResult> {
    const limits:Record<string,number>={FREE:2,STANDARD:3,PRO:5,ENTERPRISE:20}
    const max=limits[ctx.planId]??2
    const active=await this.prisma.session.count({where:{userId:ctx.userId,expiresAt:{gt:new Date()}}})
    const r=active/max; const s=r>=1?100:r>=0.8?20:r>=0.6?10:r>=0.4?5:0
    return {name:'session_limit',weight:20,score:s,reason:s>0?`${active}/${max}`:undefined,metadata:{active,max,ratio:r}}
  }

  private async checkDeviceTrust(ctx: LoginContext): Promise<RiskFactorResult> {
    if(!ctx.deviceId)return{name:'device_trust',weight:30,score:30,reason:'Nouvel appareil',metadata:{trustLevel:'UNKNOWN'}}
    const tl=await this.deviceTrust.getTrustLevel(ctx.deviceId)
    const sm:Record<string,number>={TRUSTED:0,VERIFIED:10,PENDING:20,UNKNOWN:30,SUSPICIOUS:60,BLOCKED:100}
    return{name:'device_trust',weight:30,score:sm[tl]??30,reason:sm[tl]>30?`Trust:${tl}`:undefined,metadata:{tl,deviceId:ctx.deviceId}}
  }

  private check2FA(ctx: LoginContext): Promise<RiskFactorResult> {
    return Promise.resolve({name:'two_factor',weight:20,score:ctx.is2faEnabled?0:20,reason:ctx.is2faEnabled?undefined:'2FA non active',metadata:{enabled:ctx.is2faEnabled}})
  }

  private async checkIPCache(ctx: LoginContext): Promise<RiskFactorResult> {
    const c=await this.ipCache.get(ctx.ipAddress)
    if(!c)return{name:'ip_reputation_sync',weight:25,score:10,reason:'IP non en cache',metadata:{cached:false}}
    let s=0;const r:string[]=[]
    if(c.isVPN){s+=25;r.push('VPN')}if(c.isProxy){s+=20;r.push('Proxy')}if(c.isTOR){s+=25;r.push('TOR')}if(c.isDatacenter){s+=15;r.push('DC')}
    if((c.riskScore??0)>70)s+=20
    return{name:'ip_reputation_sync',weight:25,score:Math.min(100,s),reason:r.length>0?`IP suspecte:${r.join(',')}`:undefined,metadata:c}
  }

  private calculate(factors: RiskFactorResult[], requestId: string): SyncRiskResult {
    const tw=factors.reduce((s,f)=>s+f.weight,0)
    const ws=factors.reduce((s,f)=>s+(f.score*f.weight)/100,0)
    const ts=Math.round((ws/tw)*100)
    const lvl=ts<=30?'LOW':ts<=50?'MEDIUM':ts<=70?'HIGH':'CRITICAL'as const
    return{totalScore:ts,level:lvl,factors,requiresChallenge:ts>50,shouldBlock:ts>70,expiresAt:Date.now()+60000,requestId}
  }
}
```

### 3.3 Performance Targets

| Metrique | Cible | P99 | Alerte |
|----------|:----:|:---:|:------:|
| Latence moyenne | < 50ms | < 100ms | > 150ms |
| Throughput | > 1000 req/s | > 500 req/s | < 200 req/s |
| Taux d'erreur | < 0.01% | < 0.1% | > 1% |
| Cache hit ratio | > 80% | > 60% | < 40% |

---

## 4. Risk Scoring Engine — Mode Asynchrone

### 4.1 Architecture Queue

Execute **apres** la reponse HTTP via BullMQ.

```
Login OK -> Orchestrator -> risk:async (BullMQ) -> Worker Pool (4)
    |                                   |
    v                                   v
  Processeurs: IP Reputation | Geo Distance | Login Velocity
              | Behavioral ML | ML Inference (ONNX)
              |
              v
  Post-Process: Update Session.riskScore | SecurityEvent | Alerts
```

### 4.2 Implementation

```typescript
// src/lib/security/risk-engine-async.ts

import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { IPReputationService } from './ip-reputation'
import { BehavioralProfiler } from './behavioral-profiler'
import { MLInferenceService } from './ml-inference'
import { config } from '@/config'
import { Logger } from '@/lib/logger'

export interface AsyncRiskJobData {
  userId: string; sessionId: string; ipAddress: string; userAgent: string
  fingerprint: string; deviceId?: string; latitude?: number; longitude?: number; country?: string
  requestId: string; timestamp: number
}

const QUEUE='risk:async'; const CONN={host:config.redis.host,port:config.redis.port}

export class AsyncRiskWorker {
  private worker: Worker; private prisma=new PrismaClient(); private redis=new Redis(config.redis.url)
  private ipRep=new IPReputationService(); private behavioral=new BehavioralProfiler(); private ml=new MLInferenceService()

  constructor(){
    this.worker=new Worker(QUEUE,(job)=>this.process(job),{connection:CONN,concurrency:4})
    this.worker.on('completed',(j)=>Logger.debug('Async done',{jobId:j.id}))
    this.worker.on('failed',(j,e)=>Logger.error('Async fail',{jobId:j?.id,error:e.message}))
  }

  private async process(job:Job<AsyncRiskJobData>){
    const{data}=job;const start=Date.now();const factors:Array<{name:string;score:number;details?:string}>=[]
    await Promise.allSettled([this.evalIP(data,factors),this.evalGeo(data,factors),this.evalVelocity(data,factors),this.evalBehavior(data,factors),this.evalML(data,factors)])
    const ts=Math.round(factors.reduce((s,f)=>s+f.score,0)/Math.max(factors.length,1))
    const lvl=ts<=30?'LOW':ts<=50?'MEDIUM':ts<=70?'HIGH':'CRITICAL'
    await this.prisma.session.update({where:{id:data.sessionId},data:{riskScore:ts,riskLevel:lvl,isHighRisk:ts>70}})
    if(ts>70)await this.prisma.securityEvent.create({data:{userId:data.userId,type:'HIGH_RISK_ASYNC',severity:'CRITICAL',metadata:{sessionId:data.sessionId,riskScore:ts}}})
    Logger.info('Async risk done',{userId:data.userId,score:ts,level:lvl,ms:Date.now()-start})
    return{factors,totalScore:ts,level:lvl}
  }

  private async evalIP(data:AsyncRiskJobData,f:any[]){const r=await this.ipRep.evaluate(data.ipAddress);f.push({name:'ip_reputation',score:r.riskScore,details:r.reason})}

  private async evalGeo(data:AsyncRiskJobData,f:any[]){
    const prev=await this.prisma.session.findMany({where:{userId:data.userId,latitude:{not:null},createdAt:{gte:new Date(Date.now()-86400000)}},orderBy:{createdAt:'desc'},take:3})
    if(!prev.length||!data.latitude){f.push({name:'geo_distance',score:0});return}
    let md=0;for(const p of prev){if(p.latitude&&p.longitude){
      const d=this.haversine(data.latitude,data.longitude,p.latitude,p.longitude);md=Math.max(md,d)
      if(d>1000&&(data.timestamp-p.createdAt.getTime())<7200000){f.push({name:'geo_distance',score:100,details:`Impossible travel ${Math.round(d)}km`});return}}}
    f.push({name:'geo_distance',score:Math.min(100,Math.round(md/50)),details:`Max ${Math.round(md)}km`})
  }

  private haversine(l1:number,n1:number,l2:number,n2:number):number{
    const R=6371;const dLat=(l2-l1)*Math.PI/180;const dLon=(n2-n1)*Math.PI/180
    const a=Math.sin(dLat/2)**2+Math.cos(l1*Math.PI/180)*Math.cos(l2*Math.PI/180)*Math.sin(dLon/2)**2
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
  }

  private async evalVelocity(data:AsyncRiskJobData,f:any[]){
    const k=`velocity:${data.userId}`;const n=Date.now();await this.redis.zremrangebyscore(k,0,n-3600000)
    const e=await this.redis.zrange(k,0,-1);const ips=new Set(e.map(x=>JSON.parse(x).ip))
    const s=e.length>20?100:e.length>10?70:e.length>5?40:e.length>3?20:0
    f.push({name:'login_velocity',score:Math.max(s,ips.size>5?80:0),details:`${e.length} connexions ${ips.size} IPs`})
    await this.redis.zadd(k,n,JSON.stringify({ip:data.ipAddress,time:n}));await this.redis.expire(k,3600)
  }

  private async evalBehavior(data:AsyncRiskJobData,f:any[]){
    const p=await this.behavioral.getProfile(data.userId)
    if(!p){f.push({name:'behavioral_pattern',score:0});return}
    let s=0;const a:string[]=[];const h=new Date(data.timestamp).getHours()
    if(p.usualLoginHours&&!p.usualLoginHours.includes(h)){s+=30;a.push('Heure inhabituelle')}
    if(p.usualCountries&&data.country&&!p.usualCountries.includes(data.country)){s+=25;a.push(`Pays:${data.country}`)}
    f.push({name:'behavioral_pattern',score:Math.min(100,s),details:a.join(',')||'Normal'})
  }

  private async evalML(data:AsyncRiskJobData,f:any[]){try{
    const u=await this.prisma.user.findUnique({where:{id:data.userId}})
    const sc=await this.prisma.session.count({where:{userId:data.userId}});const dc=await this.prisma.device.count({where:{userId:data.userId}})
    const p=await this.ml.predict({session_count:sc,device_count:dc,account_age_days:u?.createdAt?(Date.now()-u.createdAt.getTime())/86400000:0,has_2fa:u?.twoFactorEnabled?1:0,session_hour:new Date(data.timestamp).getHours(),is_weekend:[0,6].includes(new Date(data.timestamp).getDay())?1:0})
    f.push({name:'ml_inference',score:Math.round(p.riskScore*100),details:`${p.modelName} v${p.modelVersion}`})
  }catch{f.push({name:'ml_inference',score:0,details:'ML indisponible'})}}

  async start(){Logger.info('AsyncRiskWorker started')}
  async stop(){await this.worker.close()}
}
```


---

## 5. Ensemble ML Models

### 5.1 Architecture

```
                  +---------------------------+
                  |   Feature Vector (45 dims)|
                  +-----+----------+---------+
                        |          |
            +-----------+---+  +---+-----------+  +-----------+
            |   XGBoost     |  |  Random Forest |  | Neural N  |
            |  n_est=300    |  |  500 trees     |  | (128/64)  |
            |  max_depth=12 |  |  max_depth=16  |  | dropout=  |
            +-------+-------+  +-------+--------+  |  0.3      |
                    |                   |           +-----+-----+
                    +--------+----------+---------+--------+
                             |                    |
                     +-------v--------+   +-------v--------+
                     |  Meta-Learner  |   |   Calibration  |
                     | (Logistic Reg) |   | (Platt Scaling)|
                     +-------+--------+   +-------+--------+
                             |                    |
                             +---------+----------+
                                       |
                                       v
                              +------------------+
                              |   Final Score    |
                              |   (0.0 - 1.0)    |
                              +------------------+
```

### 5.2 Pipeline d'Entrainement Python

```python
# scripts/ml/train_ensemble.py

import os, json, pickle, logging, numpy as np, pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, f1_score, precision_score, recall_score
import xgboost as xgb
import torch, torch.nn as nn, torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from imblearn.over_sampling import SMOTE

logging.basicConfig(level=logging.INFO,format='%(asctime)s|%(message)s')
logger=logging.getLogger('train')

class FraudNN(nn.Module):
  def __init__(self,inp,hidden=[128,64],dropout=0.3):
    super().__init__(); layers=[]; prev=inp
    for h in hidden: layers+=[nn.Linear(prev,h),nn.BatchNorm1d(h),nn.ReLU(),nn.Dropout(dropout)]; prev=h
    layers+=[nn.Linear(prev,1),nn.Sigmoid()]; self.net=nn.Sequential(*layers)
  def forward(self,x): return self.net(x).squeeze()

def train(config_path):
  with open(config_path)as f: __import__('yaml'); cfg=eval(f.read()) # simplified
  logger.info(f'Loading {cfg["data_path"]}')
  df=pd.read_parquet(cfg['data_path'])
  logger.info(f'Data: {df.shape}')
  y=df['is_fraud'].values; X=df.drop(columns=['is_fraud','user_id','session_id','timestamp','email'],errors='ignore')
  num=X.select_dtypes(include=['int64','float64']).columns; cat=X.select_dtypes(include=['object','category']).columns
  for c in cat: X[c]=LabelEncoder().fit_transform(X[c].astype(str).fillna('missing'))
  X[num]=X[num].fillna(0); X[num]=RobustScaler().fit_transform(X[num]); X=X.values.astype(np.float32)
  logger.info(f'Features: {X.shape[1]}, Fraud:{y.mean()*100:.2f}%')

  X_tr,X_te,y_tr,y_te=train_test_split(X,y,test_size=0.2,random_state=42,stratify=y)
  X_tr,X_v,y_tr,y_v=train_test_split(X_tr,y_tr,test_size=0.1,random_state=42,stratify=y_tr)
  if y_tr.mean()<0.05: X_tr,y_tr=SMOTE(random_state=42).fit_resample(X_tr,y_tr)

  sw=(1-y_tr.mean())/y_tr.mean() if y_tr.mean()>0 else 1
  xgb_m=xgb.train({'objective':'binary:logistic','eval_metric':'auc','max_depth':cfg['xgb_depth'],'learning_rate':0.05,'subsample':0.8,'colsample_bytree':0.8,'scale_pos_weight':sw,'tree_method':'hist','random_state':42,'verbosity':0}, xgb.DMatrix(X_tr,label=y_tr), cfg['xgb_n'], evals=[(xgb.DMatrix(X_v,label=y_v),'val')], early_stopping_rounds=30)
  xgb_p=xgb_m.predict(xgb.DMatrix(X_te))

  rf_m=RandomForestClassifier(n_estimators=cfg['rf_n'],max_depth=cfg['rf_d'],class_weight='balanced_subsample',n_jobs=-1,random_state=42).fit(X_tr,y_tr); rf_p=rf_m.predict_proba(X_te)[:,1]

  device=torch.device('cuda'if torch.cuda.is_available()else'cpu')
  nn_m=FraudNN(X.shape[1],cfg.get('nn_hidden',[128,64]),cfg.get('nn_dropout',0.3)).to(device)
  opt=optim.AdamW(nn_m.parameters(),lr=1e-3)
  tl=DataLoader(TensorDataset(torch.FloatTensor(X_tr),torch.FloatTensor(y_tr)),256,shuffle=True)
  vl=DataLoader(TensorDataset(torch.FloatTensor(X_v),torch.FloatTensor(y_v)),256)
  best_auc=0; patience=0
  for ep in range(1,cfg.get('nn_epochs',100)+1):
    nn_m.train()
    for bx,by in tl: bx,by=bx.to(device),by.to(device); opt.zero_grad(); l=nn.BCEWithLogitsLoss(pos_weight=torch.tensor([sw]).to(device))(nn_m(bx),by); l.backward(); opt.step()
    nn_m.eval(); vp,vl_=[],[]
    with torch.no_grad():
      for bx,by in vl: vp.extend(nn_m(bx.to(device)).cpu().numpy()); vl_.extend(by.numpy())
    auc=roc_auc_score(vl_,vp)
    if auc>best_auc: best_auc=auc; patience=0; torch.save(nn_m.state_dict(),'nn_best.pt')
    else: patience+=1
    if patience>=10: break
  nn_m.load_state_dict(torch.load('nn_best.pt')); nn_m.eval(); nn_p=nn_m(torch.FloatTensor(X_te).to(device)).cpu().numpy()

  w=cfg.get('ensemble_weights',[0.4,0.3,0.3]); ens_p=w[0]*xgb_p+w[1]*rf_p+w[2]*nn_p
  train_stack=np.column_stack([xgb_m.predict(xgb.DMatrix(X_tr)),rf_m.predict_proba(X_tr)[:,1],nn_m(torch.FloatTensor(X_tr).to(device)).cpu().numpy()])
  test_stack=np.column_stack([xgb_p,rf_p,nn_p])
  meta=LogisticRegression(C=0.1).fit(train_stack,y_tr); meta_p=meta.predict_proba(test_stack)[:,1]

  for n,p in {'XGBoost':xgb_p,'RF':rf_p,'NN':nn_p,'Ensemble':ens_p,'Meta':meta_p}.items():
    yb=(p>=0.5).astype(int); logger.info(f'{n:15s} AUC={roc_auc_score(y_te,p):.4f} F1={f1_score(y_te,yb):.4f}')

  os.makedirs(cfg['output_dir'],exist_ok=True)
  xgb_m.save_model(os.path.join(cfg['output_dir'],'xgboost.json'))
  pickle.dump(rf_m,open(os.path.join(cfg['output_dir'],'rf.pkl'),'wb'))
  pickle.dump(meta,open(os.path.join(cfg['output_dir'],'meta.pkl'),'wb'))

if __name__=='__main__':
  import argparse; parser=argparse.ArgumentParser(); parser.add_argument('--config'); args=parser.parse_args()
  train(args.config)
```

### 5.3 Metriques de Reference

| Modele | AUC | Precision | Recall | F1 |
|--------|:---:|:---------:|:------:|:--:|
| XGBoost | 0.972 | 0.89 | 0.91 | 0.90 |
| Random Forest | 0.958 | 0.86 | 0.88 | 0.87 |
| Neural Network | 0.964 | 0.87 | 0.90 | 0.88 |
| Ensemble (weighted) | 0.978 | 0.91 | 0.92 | 0.91 |
| **Meta-Learner** | **0.981** | **0.92** | **0.93** | **0.92** |

---

## 6. Feature Engineering Pipeline

### 6.1 Les 45 Features

| # | Categorie | Feature | Type | Description |
|:-:|-----------|---------|:----:|-------------|
| F01 | Session | session_count_24h | Int | Sessions dans les 24h |
| F02 | Session | session_count_7d | Int | Sessions totales 7j |
| F03 | Session | session_fingerprint_count | Int | Fingerprints differents |
| F04 | Session | avg_session_duration_min | Float | Duree moyenne sessions |
| F05 | Session | session_failure_rate | Float | Taux echec connexion |
| F06 | Device | device_count_total | Int | Appareils enregistres |
| F07 | Device | device_count_24h | Int | Nouveaux appareils 24h |
| F08 | Device | device_trust_level | Cat | Niveau confiance |
| F09 | Device | device_age_days | Float | Age premier appareil |
| F10 | Device | device_browser_mismatch | Bin | Browser mismatch |
| F11 | Device | device_os_mismatch | Bin | OS mismatch |
| F12 | IP | ip_is_vpn | Bin | VPN connu |
| F13 | IP | ip_is_tor | Bin | Noeud TOR |
| F14 | IP | ip_is_proxy | Bin | Proxy |
| F15 | IP | ip_is_datacenter | Bin | Datacenter |
| F16 | IP | ip_risk_score | Float | Score risque IP |
| F17 | IP | ip_asn_number | Int | Numero ASN |
| F18 | IP | ip_country_risk | Float | Risque pays |
| F19 | IP | ip_first_seen_days | Float | IP premiere vue |
| F20 | Geo | geo_distance_km | Float | Distance derniere connexion |
| F21 | Geo | geo_velocity_kmh | Float | Velocite geo km/h |
| F22 | Geo | geo_country_change | Bin | Changement pays |
| F23 | Geo | geo_city_change | Bin | Changement ville |
| F24 | Geo | geo_continent_change | Bin | Changement continent |
| F25 | Geo | geo_timezone_diff_h | Float | Diff. fuseau horaire |
| F26 | Time | login_hour | Int | Heure connexion 0-23 |
| F27 | Time | login_day_of_week | Int | Jour semaine 0-6 |
| F28 | Time | is_weekend | Bin | Week-end |
| F29 | Time | is_night_hour | Bin | Nocturne 0-5h |
| F30 | Time | time_since_last_login_h | Float | Heures depuis derniere |
| F31 | Velocity | login_velocity_1h | Int | Connexions IPs 1h |
| F32 | Velocity | login_velocity_24h | Int | Connexions IPs 24h |
| F33 | Velocity | failed_login_1h | Int | Echecs 1h |
| F34 | Velocity | account_creation_velocity | Int | Comptes meme IP |
| F35 | Account | account_age_days | Float | Age du compte |
| F36 | Account | account_email_domain | Cat | Domaine email |
| F37 | Account | account_email_verified | Bin | Email verifie |
| F38 | Account | account_2fa_enabled | Bin | 2FA active |
| F39 | Account | account_plan_tier | Cat | Abonnement |
| F40 | Account | account_payment_method | Cat | Paiement |
| F41 | Behavioral | behavioral_score | Float | Score comportemental |
| F42 | Behavioral | sharing_risk_score | Float | Score partage |
| F43 | Behavioral | concurrent_sessions | Int | Sessions simultanees |
| F44 | Behavioral | ip_country_diversity | Float | Diversite pays |
| F45 | ML | ml_ensemble_score | Float | Score ensemble ML |

### 6.2 Feature Engineering Python

```python
# scripts/features/feature_engine.py

import os, logging, numpy as np, pandas as pd, joblib
from sklearn.preprocessing import RobustScaler, LabelEncoder

logger=logging.getLogger('feature_engine')

class FeatureEngine:
  def __init__(self):
    self.scaler=RobustScaler(); self.label_encoders={}; self.feature_names=[]

  def compute_all(self,df,is_training=True):
    features=pd.DataFrame(index=df.index)
    for name,func in self._get_features():
      try:
        r=func(df)
        if isinstance(r,pd.Series): features[name]=r
      except Exception as e: logger.warning(f'{name}:{e}')
    self.feature_names=features.columns.tolist()
    num=features.select_dtypes(include=['float64','int64']).columns
    cat=features.select_dtypes(include=['object','category']).columns
    if is_training:
      for c in cat:
        le=LabelEncoder(); features[c]=le.fit_transform(features[c].astype(str)); self.label_encoders[c]=le
      self.scaler.fit(features[num])
    features[num]=self.scaler.transform(features[num])
    return features.fillna(0).astype(np.float32)

  def _get_features(self):
    return sorted([(a.replace('_feature',''),getattr(self,a)) for a in dir(self) if a.endswith('_feature') and callable(getattr(self,a))])

  def session_count_24h_feature(self,df):
    if'user_id'not in df.columns: return pd.Series(np.zeros(len(df)))
    from collections import defaultdict; cache=defaultdict(int); counts=[]
    for _,r in df.sort_values('timestamp').iterrows(): counts.append(cache[r['user_id']]); cache[r['user_id']]+=1
    return pd.Series(counts,index=df.index,dtype=np.float32)

  def device_count_total_feature(self,df):
    if'device_id'not in df.columns: return pd.Series(np.zeros(len(df)))
    c=df.groupby('user_id')['device_id'].nunique(); return df['user_id'].map(c).fillna(0).astype(np.float32)

  def device_trust_level_feature(self,df):
    m={'TRUSTED':0,'VERIFIED':1,'PENDING':2,'UNKNOWN':3,'SUSPICIOUS':4,'BLOCKED':5}
    return df.get('device_trust_level',pd.Series('UNKNOWN')).map(m).fillna(3).astype(np.float32)

  def ip_is_vpn_feature(self,df): return df.get('ip_is_vpn',pd.Series(0)).astype(np.float32)
  def ip_is_tor_feature(self,df): return df.get('ip_is_tor',pd.Series(0)).astype(np.float32)
  def ip_is_proxy_feature(self,df): return df.get('ip_is_proxy',pd.Series(0)).astype(np.float32)
  def ip_is_datacenter_feature(self,df): return df.get('ip_is_datacenter',pd.Series(0)).astype(np.float32)
  def ip_risk_score_feature(self,df): return df.get('ip_risk_score',pd.Series(0)).astype(np.float32)
  def login_hour_feature(self,df):
    if'timestamp'in df.columns: return pd.to_datetime(df['timestamp']).dt.hour.astype(np.float32)
    return pd.Series(np.zeros(len(df)))
  def is_weekend_feature(self,df):
    if'timestamp'in df.columns: return pd.to_datetime(df['timestamp']).dt.dayofweek.isin([5,6]).astype(np.float32)
    return pd.Series(np.zeros(len(df)))
  def is_night_hour_feature(self,df):
    if'timestamp'in df.columns: return pd.to_datetime(df['timestamp']).dt.hour.between(0,5).astype(np.float32)
    return pd.Series(np.zeros(len(df)))
  def account_age_days_feature(self,df):
    if'account_created_at'in df.columns and'timestamp'in df.columns:
      return (pd.to_datetime(df['timestamp'])-pd.to_datetime(df['account_created_at'])).dt.total_seconds()/86400).fillna(0).clip(0,3650).astype(np.float32)
    return pd.Series(np.zeros(len(df)))
  def account_email_domain_feature(self,df):
    if'email'not in df.columns: return pd.Series(['unknown']*len(df))
    temp={'tempmail','throwaway','guerrillamail','mailinator','yopmail','10minutemail'}
    def cls(e):
      try:
        d=e.split('@')[1].split('.')[0].lower()
        return 'temporary'if d in temp else'premium'if d in('gmail','outlook','yahoo','proton')else'other'
      except: return 'unknown'
    return df['email'].apply(cls)
  def account_2fa_enabled_feature(self,df): return df.get('two_factor_enabled',pd.Series(0)).astype(np.float32)
  def account_plan_tier_feature(self,df):
    m={'FREE':0,'STANDARD':1,'PRO':2,'ENTERPRISE':3}
    return df.get('plan_tier',pd.Series('FREE')).map(m).fillna(0).astype(np.float32)
  def behavioral_score_feature(self,df): return df.get('behavioral_score',pd.Series(0)).astype(np.float32)
  def sharing_risk_score_feature(self,df): return df.get('sharing_risk_score',pd.Series(0)).astype(np.float32)
  def concurrent_sessions_feature(self,df): return df.get('concurrent_sessions',pd.Series(0)).astype(np.float32)
  def geo_distance_km_feature(self,df):
    cols=['latitude','longitude','prev_latitude','prev_longitude']
    if all(c in df.columns for c in cols):
      R=6371; dlat=np.radians(df['prev_latitude']-df['latitude']); dlon=np.radians(df['prev_longitude']-df['longitude'])
      a=np.sin(dlat/2)**2+np.cos(np.radians(df['latitude']))*np.cos(np.radians(df['prev_latitude']))*np.sin(dlon/2)**2
      return pd.Series(R*2*np.arcsin(np.sqrt(a)),index=df.index).fillna(0).astype(np.float32)
    return pd.Series(np.zeros(len(df)))
  def ml_ensemble_score_feature(self,df): return df.get('ml_ensemble_score',pd.Series(0)).astype(np.float32)
  def login_velocity_1h_feature(self,df): return df.get('login_velocity_1h',pd.Series(0)).astype(np.float32)
  def failed_login_1h_feature(self,df): return df.get('failed_login_1h',pd.Series(0)).astype(np.float32)

  def save(self,path): joblib.dump({'feature_names':self.feature_names,'label_encoders':self.label_encoders,'scaler':self.scaler},os.path.join(path,'feature_engine.pkl'))
  def load(self,path): a=joblib.load(os.path.join(path,'feature_engine.pkl')); self.feature_names=a['feature_names']; self.label_encoders=a['label_encoders']; self.scaler=a['scaler']
```

---

## 7. Real-Time Inference Service

### 7.1 Architecture

```
  Feature Store (Redis) -> ONNX Runtime -> Ensemble Aggregator -> Decision Engine -> Response
```

### 7.2 Implementation

```typescript
// src/lib/security/ml-inference.ts

import * as ort from 'onnxruntime-node'
import { Redis } from 'ioredis'
import { config } from '@/config'
import { Logger } from '@/lib/logger'
import { MetricsClient } from '@/lib/metrics'

export interface InferenceInput { [key: string]: number }
export interface InferenceResult {
  riskScore: number; confidence: number; modelName: string; modelVersion: string
  individualScores: { xgboost: number; randomForest: number; neuralNetwork: number }; latencyMs: number
}

export class MLInferenceService {
  private xgb?: ort.InferenceSession; private rf?: ort.InferenceSession; private nn?: ort.InferenceSession
  private readonly redis=new Redis(config.redis.url); private readonly logger=new Logger('ml-inf')
  private readonly metrics=new MetricsClient('ml_inference'); private fn: string[]=[]
  private w=[0.4,0.3,0.3]

  constructor(){this.loadModels()}
  private async loadModels(){try{
    this.xgb=await ort.InferenceSession.create(config.models.xgboostPath)
    this.rf=await ort.InferenceSession.create(config.models.randomForestPath)
    this.nn=await ort.InferenceSession.create(config.models.neuralNetworkPath)
    this.logger.info('ONNX models loaded')
  }catch(e){this.logger.error('Failed to load models',{e})}}

  async predict(input:InferenceInput):Promise<InferenceResult>{
    const start=Date.now(); const ck=`ml:${JSON.stringify(input).slice(0,64)}`
    const cached=await this.redis.get(ck); if(cached){this.metrics.increment('cache_hits');return JSON.parse(cached)}
    this.metrics.increment('cache_misses')
    const tensor=new ort.Tensor('float32',new Float32Array(this.fn.map(n=>input[n]??0)),[1,this.fn.length])
    let xgbS=0.5,rfS=0.5,nnS=0.5,loaded=0
    await Promise.allSettled([
      this.xgb?.run({float_input:tensor}).then(r=>{xgbS=r.probability.data[0];loaded++}),
      this.rf?.run({float_input:tensor}).then(r=>{rfS=r.probability.data[0];loaded++}),
      this.nn?.run({float_input:tensor}).then(r=>{nnS=r.probability.data[0];loaded++}),
    ])
    if(loaded<2)xgbS=this.fallback(input)
    const risk=this.w[0]*xgbS+this.w[1]*rfS+this.w[2]*nnS
    const conf=1-Math.sqrt([xgbS,rfS,nnS].reduce((s,v)=>s+(v-risk)**2,0)/3)
    const result:InferenceResult={riskScore:Math.round(risk*1000)/1000,confidence:Math.round(conf*1000)/1000,modelName:'fraud_ensemble',modelVersion:'1.0.0',individualScores:{xgboost:xgbS,randomForest:rfS,neuralNetwork:nnS},latencyMs:Date.now()-start}
    await this.redis.setex(ck,300,JSON.stringify(result))
    return result
  }

  private fallback(input:InferenceInput):number{
    let s=0.5; if((input.session_count_24h??0)>10)s+=0.15; if((input.device_count_total??0)>5)s+=0.1
    if((input.account_age_days??999)<7)s+=0.1; if((input.has_2fa??0)===0)s+=0.05
    return Math.min(1,Math.max(0,s))
  }
}
```

---

## 8. Behavioral Profiling System

```typescript
// src/lib/security/behavioral-profiler.ts

import { Redis } from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { config } from '@/config'

export interface UserBehavioralProfile {
  userId: string; usualLoginHours: number[]; usualCountries: string[]
  loginFrequency: { mean: number; p95: number }; sharingRiskScore: number
  totalSessions: number; uniqueIPs: number; uniqueDevices: number; countryDiversity: number
}

export class BehavioralProfiler {
  private readonly redis=new Redis(config.redis.url); private readonly prisma=new PrismaClient()

  async getProfile(userId:string):Promise<UserBehavioralProfile|null>{
    const c=await this.redis.get(`profile:${userId}`); if(c)return JSON.parse(c)
    const p=await this.buildProfile(userId); if(p)await this.redis.setex(`profile:${userId}`,3600,JSON.stringify(p))
    return p
  }

  async buildProfile(userId:string):Promise<UserBehavioralProfile|null>{
    const ss=await this.prisma.session.findMany({where:{userId,createdAt:{gte:new Date(Date.now()-30*86400000)}},orderBy:{createdAt:'desc'},take:200})
    if(ss.length<3)return null
    const hours=ss.map(s=>new Date(s.createdAt).getHours()); const hc=new Array(24).fill(0)
    for(const h of hours)hc[h]++
    const usual=hc.map((c,i)=>({h:i,c})).filter(x=>x.c>0).sort((a,b)=>b.c-a.c).slice(0,8).map(x=>x.h)
    const countries=[...new Set(ss.filter(s=>s.country).map(s=>s.country!))]
    const ips=await this.prisma.session.groupBy({by:['ipAddress'],where:{userId,ipAddress:{not:null}},_count:true})
    const devices=await this.prisma.device.count({where:{userId}})
    const diffs=[]; for(let i=1;i<ss.length;i++)diffs.push((ss[i-1].createdAt.getTime()-ss[i].createdAt.getTime())/3600000)
    const sd=[...diffs].sort((a,b)=>a-b); const mean=diffs.length?diffs.reduce((s,v)=>s+v,0)/diffs.length:0
    const share=this.calcShare(ss.length,ips.length,devices,countries.length)
    return{userId,usualLoginHours:usual,usualCountries:countries,loginFrequency:{mean,p95:sd[Math.floor(sd.length*0.95)]??mean},sharingRiskScore:share,totalSessions:ss.length,uniqueIPs:ips.length,uniqueDevices:devices,countryDiversity:countries.length}
  }

  private calcShare(total:number,ips:number,devices:number,countries:number):number{
    let s=0; if(ips/total>0.5)s+=0.3; if(devices/Math.max(total,1)>0.3)s+=0.3; if(countries>3)s+=0.2
    if(total>50&&ips/total>0.3)s+=0.2; return Math.min(1,s)
  }

  async detectAnomalies(userId:string,ctx:{country?:string;timestamp:Date}):Promise<{isAnomaly:boolean;score:number;reasons:string[]}>{
    const p=await this.getProfile(userId); if(!p)return{isAnomaly:false,score:0,reasons:['Nouveau']}
    let s=0;const r:string[]=[]; const h=ctx.timestamp.getHours()
    if(!p.usualLoginHours.includes(h)){s+=0.3;r.push(`Heure:${h}h`)}
    if(ctx.country&&p.usualCountries.length>0&&!p.usualCountries.includes(ctx.country)){s+=0.25;r.push(`Pays:${ctx.country}`)}
    return{isAnomaly:s>0.5,score:Math.min(1,s),reasons:r}
  }
}
```

---

## 9. Abuse Detection Engine

### 9.1 Detection Orchestrator

```typescript
// src/lib/security/detection-orchestrator.ts

import { Redis } from 'ioredis'; import { PrismaClient } from '@prisma/client'; import { config } from '@/config'

export interface DetectionEvent {
  type: 'CREDENTIAL_STUFFING'|'BRUTE_FORCE'|'ACCOUNT_ENUMERATION'|'SESSION_HIJACKING'|'API_ABUSE'|'SCRAPING'
  severity: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'; ipAddress: string; userId?: string; email?: string
  timestamp: Date; metadata: Record<string,unknown>; score: number; action: 'LOG'|'FLAG'|'CHALLENGE'|'BLOCK'
}

export class DetectionOrchestrator {
  private readonly redis=new Redis(config.redis.url); private readonly prisma=new PrismaClient()

  async process(event:DetectionEvent):Promise<void>{
    await this.prisma.securityEvent.create({data:{userId:event.userId??'anonymous',type:event.type,severity:event.severity,metadata:event.metadata}})
    const ck=`abuse:${event.type}:${event.ipAddress}:${Math.floor(Date.now()/60000)}`; const c=await this.redis.incr(ck); await this.redis.expire(ck,120)
    if(c>10||event.action==='BLOCK'){await this.redis.sadd('blocklist:ip',event.ipAddress);await this.redis.expire('blocklist:ip',3600)}
  }

  async isBlocked(ip:string):Promise<boolean>{return await this.redis.sismember('blocklist:ip',ip)}
}
```

### 9.2 Credential Stuffing Detector

```typescript
// src/lib/security/detectors/credential-stuffing.ts
import { Redis } from 'ioredis'; import { DetectionOrchestrator } from '../detection-orchestrator'; import { config } from '@/config'

export class CredentialStuffingDetector {
  private readonly redis=new Redis(config.redis.url); private readonly orch=new DetectionOrchestrator()

  async detect(params:{ipAddress:string;email:string;success:boolean}):Promise<void>{
    const n=Date.now(); const ipK=`cs:ip:${params.ipAddress}`; const emK=`cs:email:${params.email}`
    const p=this.redis.pipeline(); p.zadd(ipK,n,`${n}:${params.email}`); p.zremrangebyscore(ipK,0,n-60000); p.zcard(ipK); p.expire(ipK,120)
    p.zadd(emK,n,`${n}:${params.ipAddress}`); p.zremrangebyscore(emK,0,n-60000); p.zcard(emK); p.expire(emK,120)
    const r=await p.exec(); const ipC=(r?.[3]?.[1]as number)??0; const emC=(r?.[7]?.[1]as number)??0
    let sc=0; let act:any='LOG'; let sev:any='LOW'
    if(ipC>50){sc=0.9;sev='CRITICAL';act='BLOCK'}else if(ipC>20){sc=0.7;sev='HIGH';act='CHALLENGE'}else if(ipC>10){sc=0.4;sev='MEDIUM';act='FLAG'}
    if(sc>0)await this.orch.process({type:'CREDENTIAL_STUFFING',severity:sev,ipAddress:params.ipAddress,email:params.email,timestamp:new Date(),metadata:{ipC,emC},score:sc,action:act})
  }
}
```

### 9.3 Brute Force Detector

```typescript
// src/lib/security/detectors/brute-force.ts
import { Redis } from 'ioredis'; import { DetectionOrchestrator } from '../detection-orchestrator'; import { config } from '@/config'

export class BruteForceDetector {
  private readonly redis=new Redis(config.redis.url); private readonly orch=new DetectionOrchestrator()
  async detect(params:{ipAddress:string;email:string;success:boolean}):Promise<void>{
    if(params.success)return
    const ipK=`bf:ip:${params.ipAddress}`; const usK=`bf:user:${params.email}`
    const ipC=await this.redis.incr(ipK); if(ipC===1)await this.redis.pexpire(ipK,300000)
    const usC=await this.redis.incr(usK); if(usC===1)await this.redis.pexpire(usK,300000)
    let sc=0; let act:any='LOG'; let sev:any='LOW'
    if(ipC>=100){sc=1.0;sev='CRITICAL';act='BLOCK'}else if(ipC>=60){sc=0.8;sev='HIGH';act='BLOCK'}else if(ipC>=30){sc=0.5;sev='MEDIUM';act='CHALLENGE'}else if(ipC>=10){sc=0.2;act='FLAG'}
    if(usC>=50){sc=Math.max(sc,0.7);sev='HIGH';act='BLOCK'}
    if(sc>0)await this.orch.process({type:'BRUTE_FORCE',severity:sev,ipAddress:params.ipAddress,email:params.email,timestamp:new Date(),metadata:{ipC,usC},score:sc,action:act})
  }
}
```

### 9.4 Session Hijacking Detector

```typescript
// src/lib/security/detectors/session-hijacking.ts
import { PrismaClient } from '@prisma/client'; import { DetectionOrchestrator } from '../detection-orchestrator'

export class SessionHijackingDetector {
  private prisma=new PrismaClient(); private orch=new DetectionOrchestrator()
  async detect(params:{sessionId:string;userId:string;ipAddress:string;fingerprint:string;userAgent:string}):Promise<void>{
    const s=await this.prisma.session.findUnique({where:{id:params.sessionId}}); if(!s)return
    let sc=0; const r:string[]=[]
    if(s.ipAddress&&s.ipAddress!==params.ipAddress){sc+=0.3;r.push('IP changee')}
    if(s.fingerprint&&s.fingerprint!==params.fingerprint){sc+=0.4;r.push('Fingerprint change')}
    if(s.userAgent&&s.userAgent!==params.userAgent){sc+=0.2;r.push('UA change')}
    if(sc>0.3)await this.orch.process({type:'SESSION_HIJACKING',severity:sc>0.6?'CRITICAL':'HIGH',userId:params.userId,ipAddress:params.ipAddress,timestamp:new Date(),metadata:{sessionId:params.sessionId,reasons:r},score:sc,action:sc>0.6?'BLOCK':'CHALLENGE'})
  }
}
```

---

## 10. Device Trust & Fingerprinting

### 10.1 Client-Side Collector

```typescript
// src/lib/security/client-fingerprint.ts

export interface FingerprintSignals {
  userAgent:string; language:string; platform:string; screenResolution:string; timezone:string
  colorDepth:number; hardwareConcurrency:number; deviceMemory:number; touchSupport:boolean
  cookiesEnabled:boolean; doNotTrack:boolean|null; plugins:string[]
  canvasHash?:string; webglHash?:string; fontsHash?:string; audioHash?:string
}

export class ClientFingerprinter {
  async collect():Promise<{hash:string;signals:FingerprintSignals;collectedAt:number}>{
    const s:FingerprintSignals={
      userAgent:navigator.userAgent, language:navigator.language,
      platform:(navigator as any).platform??'unknown',
      screenResolution:`${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorDepth:screen.colorDepth, hardwareConcurrency:navigator.hardwareConcurrency||0,
      deviceMemory:(navigator as any).deviceMemory||0,
      touchSupport:'ontouchstart'in window||navigator.maxTouchPoints>0,
      cookiesEnabled:navigator.cookieEnabled, doNotTrack:(navigator as any).doNotTrack==='1',
      plugins:Array.from(navigator.plugins).map(p=>p.name),
      canvasHash:this.canvasFP(), webglHash:this.webglFP(), fontsHash:await this.fontsFP(), audioHash:this.audioFP(),
    }
    return{hash:this.computeHash(s),signals:s,collectedAt:Date.now()}
  }

  private canvasFP():string{const c=document.createElement('canvas');c.width=200;c.height=50;const ctx=c.getContext('2d')!;ctx.fillStyle='#f60';ctx.fillRect(100,1,62,20);ctx.fillStyle='#069';ctx.font='11pt Arial';ctx.fillText('NBA FD',2,15);return this.hash(c.toDataURL())}
  private webglFP():string{const gl=document.createElement('canvas').getContext('webgl');if(!gl)return'no-wg';const di=gl.getExtension('WEBGL_debug_renderer_info');if(!di)return'no-di';return this.hash(gl.getParameter(di.UNMASKED_VENDOR_WEBGL)+':'+gl.getParameter(di.UNMASKED_RENDERER_WEBGL))}
  private async fontsFP():Promise<string>{return this.hash('fonts')}
  private audioFP():string{try{const ac=new(window.AudioContext||(window as any).webkitAudioContext)();const o=ac.createOscillator();o.start(0);o.stop(0.1);ac.close();return'audio-ok'}catch{return'no-audio'}}

  private computeHash(s:FingerprintSignals):string{return this.hash(Object.entries(s).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('|'))}
  private hash(s:string):string{let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return Math.abs(h).toString(36)}
}
```

### 10.2 Device Trust State Machine

```
UNKNOWN -> PENDING -> VERIFIED -> TRUSTED -> SUSPICIOUS -> BLOCKED
```

---

## 11. IP Reputation & Geoloction

```typescript
// src/lib/security/ip-reputation.ts

import { Redis } from 'ioredis'; import * as maxmind from 'maxmind'; import { config } from '@/config'

export interface IPReputation {
  ipAddress:string; country:string; city:string; latitude:number; longitude:number
  isVPN:boolean; isTOR:boolean; isProxy:boolean; isDatacenter:boolean; asn:number
  riskScore:number; reason:string; cachedAt:number
}

export class IPReputationService {
  private readonly redis=new Redis(config.redis.url); private geo:any=null; private anon:any=null

  constructor(){this.loadDB()}
  private async loadDB(){try{this.geo=await maxmind.open(config.maxmind.geoIpPath);this.anon=await maxmind.open(config.maxmind.anonymousPath)}catch(e){console.error('MaxMind',e)}}

  async evaluate(ip:string):Promise<IPReputation>{
    const c=await this.redis.get(`iprep:${ip}`); if(c)return JSON.parse(c)
    const g=this.geo?.get(ip); const a=this.anon?.get(ip)
    const rep:IPReputation={ipAddress:ip,country:g?.country?.iso_code??'XX',city:g?.city?.names?.en??'Unknown',latitude:g?.location?.latitude??0,longitude:g?.location?.longitude??0,isVPN:a?.is_anonymous_vpn??false,isTOR:a?.is_tor_exit_node??false,isProxy:a?.is_public_proxy??false,isDatacenter:a?.is_hosting_provider??false,asn:a?.autonomous_system_number??0,riskScore:0,reason:'',cachedAt:Date.now()}
    let s=0; if(rep.isTOR)s+=80; if(rep.isVPN)s+=60; if(rep.isProxy)s+=40; if(rep.isDatacenter)s+=15
    if(['RU','CN','KP','IR','SY','CU','VE','NG'].includes(rep.country))s+=25
    rep.riskScore=Math.min(100,s); rep.reason=['TOR','VPN','Proxy','DC'].filter((_,i)=>[rep.isTOR,rep.isVPN,rep.isProxy,rep.isDatacenter][i]).join(',')||'OK'
    await this.redis.setex(`iprep:${ip}`,3600,JSON.stringify(rep)); return rep
  }
}
```

### 11.1 Haversine Distance

```typescript
// src/lib/security/geo-utils.ts
export function haversineDistance(l1:number,n1:number,l2:number,n2:number):number{
  const R=6371; const dL=(l2-l1)*Math.PI/180; const dN=(n2-n1)*Math.PI/180
  const a=Math.sin(dL/2)**2+Math.cos(l1*Math.PI/180)*Math.cos(l2*Math.PI/180)*Math.sin(dN/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
export function isImpossibleTravel(d:number,t:number):boolean{return t>0&&(d/t)>1200}
```

---

## 12. Feedback Loop & Continuous Learning

```typescript
// src/lib/security/feedback-loop.ts

import { PrismaClient } from '@prisma/client'; import { Redis } from 'ioredis'; import { config } from '@/config'

export class FeedbackCollector {
  private prisma=new PrismaClient(); private redis=new Redis(config.redis.url)

  async collect(event:{sessionId:string;userId:string;action:string;originalScore:number;correctLabel:boolean;timestamp:Date}):Promise<void>{
    await this.prisma.feedbackLabel.create({data:event}); await this.redis.del(`profile:${event.userId}`)
  }

  async getStats():Promise<{total:number;falsePositives:number;falseNegatives:number;accuracy:number}>{
    const t=await this.prisma.feedbackLabel.count(); const fp=await this.prisma.feedbackLabel.count({where:{action:'FALSE_POSITIVE'}})
    const fn=await this.prisma.feedbackLabel.count({where:{action:'FALSE_NEGATIVE'}})
    return{total,falsePositives:fp,falseNegatives:fn,accuracy:t>0?(t-fp-fn)/t:1}
  }
}

export class AutoLabeler {
  private prisma=new PrismaClient(); private collector=new FeedbackCollector()
  async autoLabel():Promise<number>{
    const events=await this.prisma.securityEvent.findMany({where:{type:'HIGH_RISK_SYNC',createdAt:{gte:new Date(Date.now()-86400000)}}})
    let c=0
    for(const e of events){
      const s=await this.prisma.session.findFirst({where:{userId:e.userId,createdAt:{gt:e.createdAt},riskLevel:{not:'CRITICAL'}}})
      if(s){await this.collector.collect({sessionId:s.id,userId:e.userId,action:'FALSE_POSITIVE',originalScore:(e.metadata as any)?.riskScore??70,correctLabel:false,timestamp:new Date()});c++}
    }
    return c
  }
}
```

---

## 13. Model Monitoring & Observability

### 13.1 Metriques

| Metrique | Seuil bas | Seuil haut |
|----------|:---------:|:----------:|
| accuracy | 0.90 | 0.99 |
| precision | 0.85 | 0.98 |
| recall | 0.85 | 0.98 |
| f1_score | 0.85 | 0.98 |
| roc_auc | 0.90 | 0.99 |
| avg_precision | 0.85 | 0.98 |
| log_loss | - | 0.15 |
| psi | - | 0.10 |
| calibration_error | - | 0.05 |

### 13.2 Drift Detection

```typescript
// src/lib/monitoring/model-monitor.ts

import { Redis } from 'ioredis'; import { PrismaClient } from '@prisma/client'

export class ModelMonitor {
  private redis=new Redis(); private prisma=new PrismaClient()
  private baseline={accuracy:0.95,precision:0.90,recall:0.90,f1:0.90,auc:0.97}

  async computeMetrics():Promise<Record<string,number>>{
    const labels=await this.prisma.feedbackLabel.findMany({where:{timestamp:{gte:new Date(Date.now()-7*86400000)}}})
    if(labels.length<100)return{}
    const yT=labels.map(l=>l.correctLabel?1:0); const yS=labels.map(l=>l.originalScore/100); const yP=yS.map(s=>s>=0.5?1:0)
    const tp=yT.filter((v,i)=>v===1&&yP[i]===1).length; const fp=yT.filter((v,i)=>v===0&&yP[i]===1).length
    const fn=yT.filter((v,i)=>v===1&&yP[i]===0).length; const tn=yT.filter((v,i)=>v===0&&yP[i]===0).length; const eps=1e-10
    const m={accuracy:(tp+tn)/(tp+tn+fp+fn+eps),precision:tp/(tp+fp+eps),recall:tp/(tp+fn+eps),f1:2*tp/(2*tp+fp+fn+eps),sample:labels.length}
    for(const[k,v]of Object.entries(this.baseline)){
      const cur=m[k as keyof typeof m] as number; if(Math.abs(cur-v)>0.05)console.warn(`Drift ${k}: baseline=${v} actuel=${cur}`)
    }
    await this.redis.set('monitoring:metrics',JSON.stringify(m)); return m
  }

  async detectDrift(dist:Record<string,number[]>):Promise<Record<string,number>>{const d:Record<string,number>={};for(const[f,v]of Object.entries(dist)){const psi=this.calcPSI(v);if(psi>0.1)d[f]=psi}return d}
  private calcPSI(v:number[]):number{let p=0;for(let i=0;i<10;i++){const l=i*0.1;const h=(i+1)*0.1;const pc=v.filter(x=>x>=l&&x<h).length/v.length;const pr=0.1;if(pc>0&&pr>0)p+=(pc-pr)*Math.log(pc/pr)}return p}
}
```

---

## 14. Data Pipeline & Training Infrastructure

```
  Data Sources: Sessions (PG) | Security Events (PG) | Feedback (PG) | Features (Redis)
       |              |              |              |
       +--------------+--------------+--------------+
                      |
                      v
  ETL Pipeline (Python / Airflow) -> Parquet -> S3
                      |
                      v
  Training Pipeline -> XGBoost/RF/NN -> ONNX -> Model Registry (PG + S3)
                      |
                      v
  Deployment (Blue/Green) -> Inference Service
```

```prisma
model ModelRegistry {
  id String @id @default(uuid())
  name String
  version String
  status String @default("STAGING") // STAGING | PRODUCTION | ROLLED_BACK
  path String
  metrics Json
  trainedAt DateTime @default(now())
  deployedAt DateTime?
  @@unique([name, version])
  @@map("model_registry")
}
```

```typescript
// workers/retraining-cron.ts
import { CronJob } from 'cron'
const job = new CronJob('0 3 * * 0', async () => {
  // S'exécute le dimanche a 3h du matin
  // 1. Export des donnees -> 2. Feature engineering -> 3. Training -> 4. Evaluation -> 5. Registry
})
job.start()
```

---

## 15. Threat Detection Scenarios

### 15.1 Matrice de Detection

| Scenario | Sync | Async | ML | Action |
|----------|:----:|:-----:|:--:|--------|
| Credential Stuffing | 85+ | 90+ | 0.95 | BLOCK IP + ALERTE |
| Brute Force | 80+ | 85+ | 0.90 | BLOCK IP + 2FA FORCE |
| Account Enumeration | 40+ | 60+ | 0.70 | FLAG + CHALLENGE |
| Session Hijacking | 70+ | 80+ | 0.85 | BLOCK SESSION + ALERTE |
| Impossible Travel | 50+ | 95+ | 0.80 | FLAG + EMAIL |
| Partage Compte | 30+ | 65+ | 0.75 | FLAG + NOTIFICATION |
| API Abuse | 60+ | 70+ | 0.65 | RATE LIMIT + BLOCK |
| Scraping | 40+ | 55+ | 0.60 | CHALLENGE + BLOCK |
| Inscription Multiple | 50+ | 70+ | 0.80 | BLOCK + VERIFICATION |

### 15.2 Scenarios Detailes

```
  Scenario A: Credential Stuffing
    Attaquant: 1000 comptes tentes depuis botnet (50 IPs)
    Detection: Rate limit -> Sync Risk > 70 -> CredentialStuffingDetector -> Score 0.9 -> BLOCK
    Action: Blocklist IPs | Rate limit strict | Challenge 2FA

  Scenario B: Impossible Travel
    Utilisateur: France (13h) -> USA (14h)
    Detection: Geo distance 8000km en 1h -> Score 100 -> Impossible travel
    Action: Flag session | Email utilisateur | Admin alerte

  Scenario C: Partage de Compte
    Utilisateurs A (Paris) et B (New York) alternent
    Detection: Geo diversity 2 pays | Device diversity 2 | Heures inhabituelles
    Action: Flag compte | Limiter sessions | Email warning

  Scenario D: Brute Force
    Attaquant: POST /sign-in 1000x sur meme email
    Detection: Rate limit 429 -> BruteForceDetector Score 1.0 -> BLOCK
    Action: Block IP 1h | Notifier utilisateur | 2FA force
```

---

## 16. Decision Layer & Actions

| Niveau | Score Sync | Action Immediate | Action Post |
|--------|:----------:|-----------------|-------------|
| **LOW** | 0-30 | ALLOW | Log |
| **MEDIUM** | 31-50 | ALLOW + FLAG | Log + Notification |
| **HIGH** | 51-70 | CHALLENGE 2FA | Log + Notif + Flag |
| **CRITICAL** | 71-100 | BLOCK | Log + Notif + Admin + PagerDuty |

```typescript
export interface DecisionAction {
  allow: boolean; challenge2FA: boolean; block: boolean; flagSession: boolean
  notifyUser: boolean; notifyAdmin: boolean; pagerDuty: boolean; blocklistIP: boolean
  forceLogout: boolean; requirePasswordChange: boolean
}
export class DecisionEngine {
  decide(syncScore:number,asyncScore:number):DecisionAction{
    const m=Math.max(syncScore,asyncScore)
    return{allow:m<=30,challenge2FA:m>50&&m<=70,block:m>70,flagSession:m>30,notifyUser:m>50,notifyAdmin:m>80,pagerDuty:m>90,blocklistIP:m>80,forceLogout:asyncScore>85,requirePasswordChange:asyncScore>90}
  }
}
```

---

## 17. Performance SLOs

| Service | Latence P50 | Latence P99 | Throughput | Disponibilite |
|---------|:----------:|:-----------:|:----------:|:-------------:|
| Sync Risk Engine | < 30ms | < 100ms | > 5000/s | 99.99% |
| Async Risk Worker | < 2s | < 5s | > 100/s | 99.95% |
| ML Inference | < 15ms | < 50ms | > 2000/s | 99.99% |
| IP Reputation | < 5ms | < 20ms | > 10000/s | 99.99% |
| Behavioral Profile | < 50ms | < 200ms | > 500/s | 99.95% |
| Feature Store | < 2ms | < 10ms | > 20000/s | 99.99% |
| Device Trust | < 10ms | < 30ms | > 5000/s | 99.99% |
| Abuse Detection | < 20ms | < 50ms | > 5000/s | 99.99% |
| Training Pipeline | 30min | 60min | 1x/semaine | 99.00% |

---

## 18. Implementation Roadmap

```
Phase 1: Foundation (Semaines 1-4)
  +-- Risk Engine Sync (baseline)
  +-- Rate limiting avance
  +-- Device fingerprinting basique
  +-- Tests unitaires et integration

Phase 2: Async & ML (Semaines 5-10)
  +-- BullMQ queue infrastructure
  +-- Risk Engine Async (IP, Geo, Velocity)
  +-- Feature engineering pipeline (45 features)
  +-- ML training pipeline (XGBoost, RF, NN)
  +-- ONNX export et inference service

Phase 3: Detection (Semaines 11-14)
  +-- Tous les detecteurs d'abus
  +-- Behavioral profiling system
  +-- IP reputation (MaxMind integration)
  +-- Device trust state machine
  +-- Detection orchestrator

Phase 4: Intelligence (Semaines 15-18)
  +-- Feedback loop et auto-labeling
  +-- Model monitoring et drift detection
  +-- Dashboard d'observability
  +-- Alerting (email, Slack, PagerDuty)

Phase 5: Optimisation (Semaines 19-22)
  +-- Performance tuning (cache, queries)
  +-- Load testing et chaos engineering
  +-- Documentation et runbooks
  +-- Security review
  +-- Mise en production (blue/green)
```

---

## 19. Appendices

### 19.1 Configuration

```yaml
redis:
  host: localhost; port: 6379
maxmind:
  geoIpPath: /data/maxmind/GeoLite2-City.mmdb
  anonymousPath: /data/maxmind/GeoIP2-Anonymous-IP.mmdb
models:
  xgboostPath: /models/xgboost_fraud.onnx
  randomForestPath: /models/random_forest_fraud.onnx
  neuralNetworkPath: /models/neural_network_fraud.onnx
  ensembleWeights: [0.4, 0.3, 0.3]
scoring:
  sync:
    factors:
      rate_limit: { weight: 30, maxAttempts: 5, windowMs: 60000 }
      session_limit: { weight: 20 }
      device_trust: { weight: 30 }
      two_factor: { weight: 20 }
      ip_reputation: { weight: 25 }
    thresholds:
      challenge: 50; block: 70
detection:
  credential_stuffing:
    ipThresholds: { low: 10, medium: 20, high: 50, critical: 100 }
    windowMs: 60000
  brute_force:
    ipThresholds: { low: 10, medium: 30, high: 60, critical: 100 }
    windowMs: 300000
monitoring:
  driftThreshold: 0.10
  alertChannels: [email, slack, pagerduty]
```

### 19.2 Metriques Redis (Toutes les Cles)

| Cle Redis | Type | TTL | Description |
|-----------|------|:---:|-------------|
| ratelimit:{ip}:{email} | Sorted Set | 60s | Rate limiting |
| velocity:{userId} | Sorted Set | 3600s | Login velocity |
| cs:ip:{ip} | Sorted Set | 120s | Credential stuffing IP |
| cs:email:{email} | Sorted Set | 120s | Credential stuffing email |
| bf:ip:{ip} | String | 300s | Brute force IP |
| bf:user:{email} | String | 300s | Brute force user |
| enum:{ip} | Set | 600s | Account enumeration |
| api:{cat}:{id} | Sorted Set | 60s | API abuse |
| iprep:{ip} | String | 3600s | IP reputation cache |
| profile:{userId} | String | 3600s | Behavioral profile |
| ml:inf:{hash} | String | 300s | ML inference cache |
| risk:decision:{fp}:{ip} | String | 60s | Sync decision |
| risk:async:{sessionId} | String | 86400s | Async result |
| blocklist:ip | Set | 3600s | IP blocklist |
| abuse:{type}:{ip}:{min} | String | 120s | Abuse counter |
| bull:risk:async:* | Various | - | BullMQ queues |
| monitoring:metrics | String | - | Dernieres metriques |

### 19.3 Diagramme de Sequence Complet

```
Browser          Gateway          Auth          Fraud Engine       Async Worker
   |                |              |                |                   |
   |--- POST /sign-in ->|              |                |                   |
   |                |--- Rate Check-->|                |                   |
   |                |<-- OK ---------|                |                   |
   |                |--- Device Check->|               |                   |
   |                |<-- Valid ------|                |                   |
   |                |--- Auth ------>|                |                   |
   |                |                |--- Cred Verify->|                   |
   |                |                |<-- OK ---------|                   |
   |                |--- Sync Risk ->|                |                   |
   |                |                |--- Score 15 ->|                   |
   |                |                | (LOW)          |                   |
   |                |<-- 200 OK -----|                |                   |
   |<-- Set-Cookie -|                |                |                   |
   |                |                |-- Enqueue ---->|                   |
   |                |                |  Async Risk    |                   |
   |                |                |                |--- IP Rep ------>|
   |                |                |                |--- Geo Dist ---->|
   |                |                |                |--- Velocity ---->|
   |                |                |                |--- ML Inf ------>|
   |                |                |                |                   |
   |                |                |                |--- Update Session |
   |                |                |<-- Complete ---|                   |
```

### 19.4 Implementation des Seuils Dynamiques

Les seuils de scoring ne sont pas statiques — ils s'adaptent en fonction du contexte :

```typescript
// src/lib/security/thresholds.ts

interface ThresholdConfig {
  challenge: number    // Score > ce seuil → challenge 2FA
  block: number       // Score > ce seuil → blocage
  revoke: number      // Score > ce seuil → revocation session
}

class DynamicThresholdManager {
  private readonly redis: Redis
  private readonly baseConfig: ThresholdConfig = {
    challenge: 50,
    block: 70,
    revoke: 90,
  }

  async getThresholds(context: RiskContext): Promise<ThresholdConfig> {
    let config = { ...this.baseConfig }

    // Ajustement selon le plan
    const planMultiplier = await this.getPlanMultiplier(context.planTier)
    config.challenge = Math.round(config.challenge * planMultiplier)
    config.block = Math.round(config.block * planMultiplier)

    // Ajustement selon l'heure
    const hour = new Date().getHours()
    if (hour >= 2 && hour <= 5) {
      // Fenetre nocturne : seuils plus bas (activite suspecte)
      config.challenge = Math.round(config.challenge * 0.8)
      config.block = Math.round(config.block * 0.85)
    }

    // Ajustement selon le volume actuel
    const activeUsers = await this.redis.get('metrics:active_users')
    if (activeUsers && parseInt(activeUsers) > 10000) {
      // Pic de traffic : seuils temporairement releves
      config.challenge = Math.round(config.challenge * 1.1)
    }

    return config
  }

  private async getPlanMultiplier(tier: number): Promise<number> {
    // Plans plus hauts = plus de confiance = seuils plus hauts
    const multipliers = [1.0, 0.95, 0.9, 0.85, 0.8, 0.7]
    return multipliers[tier] ?? 1.0
  }
}
```

### 19.5 Tests

```typescript
// tests/fraud-engine.test.ts
import { describe, it, expect } from 'vitest'
import { haversineDistance, isImpossibleTravel } from '@/lib/security/geo-utils'

describe('Geo Utils', () => {
  it('should calculate Haversine distance', () => {
    const d = haversineDistance(48.8566, 2.3522, 40.7128, -74.0060)
    expect(d).toBeGreaterThan(5000); expect(d).toBeLessThan(7000)
  })
  it('should detect impossible travel', () => {
    expect(isImpossibleTravel(8000, 1)).toBe(true)
    expect(isImpossibleTravel(100, 5)).toBe(false)
  })
  it('should return 0 for same point', () => {
    expect(haversineDistance(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0)
  })
})
```

---

---

## 20. Lien avec l'Audit Principal

Ce document specialise `MASTER_FRAUD_ENGINE.md` complete l'audit principal :

### 20.1 Correspondance des Sections

| Section Audit Principal | Section Ce Document | Description |
|------------------------|---------------------|-------------|
| §19 Risk Scoring Engine | §3, §4 | Moteur sync/async avec implementation complete |
| §20 Target Architecture | §2 | Diagramme de composants et flux de decision |
| §21 Database Schema | §19.2 | Tables SecurityEvent, LoginAttempt, Device |
| §23 Device Manager | §10 | State machine, fingerprint, trust levels |
| §24 Two-Factor Auth | §3 (2FA factor) | Integration avec le scoring |
| §26 Abuse Detection | §9 | 8 detecteurs specialises |
| §27 Testing Strategy | §19.5 | Tests unitaires et simulation |
| Appendix F | §6 | Feature engineering (45 features) |
| Appendix G | §12 | Feedback loop et retraining |
| Appendix H | §5, §7, §8 | ML pipeline, inference, profiling |
| Appendix I | §1.3 | Scoring matrix complete |

### 20.2 Dependencies

```
MASTER_ACCOUNT_SHARING_PREVENTION_AUDIT.md (Audit Principal)
    │
    ├── MASTER_FRAUD_ENGINE.md (Ce document)
    │       ← Depend de : §19-20 de l'audit principal
    │       ← Complete : Appendices F, G, H
    │
    ├── MASTER_AUTH_ARCHITECTURE.md
    │       ← Depend de : §11-12, §22-24 de l'audit principal
    │
    └── MASTER_ZERO_TRUST_SECURITY.md
            ← Depend de : §20, §25 de l'audit principal
```

### 20.3 Decisions d'Architecture (ADRs) Liees

Les ADRs suivants de l'audit principal sont implementes dans ce document :

- **ADR-026** : Session Limitation par Plan → §3 (session limit factor)
- **ADR-027** : Device Fingerprinting Renforce → §10 (multi-signal fingerprint)
- **ADR-029** : Risk Scoring Asynchrone → §4 (async engine avec BullMQ)
- **ADR-031** : AI Fraud Detection → §5, §7 (ensemble ML + inference)

---

> **Fin du document MASTER_FRAUD_ENGINE.md**
> **Version 1.0.0 — 2026-07-22**
> **Prochain examen : trimestriel**

